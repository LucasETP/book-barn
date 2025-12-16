import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '';
const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Cache configuration
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const searchCache = new Map(); // Map<query, { results, timestamp }>

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map(); // Map<query, AbortController>

// Clean up old cache entries periodically
const cleanupCache = () => {
  const now = Date.now();
  for (const [query, cacheEntry] of searchCache.entries()) {
    if (now - cacheEntry.timestamp > SEARCH_CACHE_TTL) {
      searchCache.delete(query);
    }
  }
};

// Run cleanup every minute
setInterval(cleanupCache, 60 * 1000);

export const searchBooks = async (searchQuery) => {
  // Normalize query for caching (trim and lowercase)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  
  if (!normalizedQuery) {
    return [];
  }
  
  // Check cache first
  const cached = searchCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return cached.results;
  }
  
  // Cancel any ongoing request for the same query
  const existingController = ongoingRequests.get(normalizedQuery);
  if (existingController) {
    existingController.abort();
  }
  
  // Create new abort controller for this request
  const abortController = new AbortController();
  ongoingRequests.set(normalizedQuery, abortController);
  
  try {
    const url = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(searchQuery)}&maxResults=20${GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : ''}`;
    const response = await fetch(url, {
      signal: abortController.signal
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Remove from ongoing requests
    ongoingRequests.delete(normalizedQuery);
    
    if (!data.items) {
      const emptyResults = [];
      // Cache empty results too (shorter TTL)
      searchCache.set(normalizedQuery, {
        results: emptyResults,
        timestamp: Date.now()
      });
      return emptyResults;
    }
    
    const results = data.items.map(item => ({
      googleBooksId: item.id,
      title: item.volumeInfo?.title || 'Unknown Title',
      authors: item.volumeInfo?.authors || ['Unknown Author'],
      description: item.volumeInfo?.description || '',
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail || '',
      pageCount: item.volumeInfo?.pageCount || 0,
      publishedDate: item.volumeInfo?.publishedDate || '',
      categories: item.volumeInfo?.categories || [],
    }));
    
    // Cache the results
    searchCache.set(normalizedQuery, {
      results,
      timestamp: Date.now()
    });
    
    return results;
  } catch (error) {
    // Remove from ongoing requests
    ongoingRequests.delete(normalizedQuery);
    
    // Don't throw if request was aborted (user started new search)
    if (error.name === 'AbortError') {
      return [];
    }
    
    console.error('Error searching books:', error);
    throw error;
  }
};

export const getBookDetails = async (googleBooksId) => {
  try {
    // First check if book exists in Firestore
    const bookRef = doc(db, 'books', googleBooksId);
    const bookSnap = await getDoc(bookRef);
    
    if (bookSnap.exists()) {
      return bookSnap.data();
    }
    
    // If not in Firestore, fetch from Google Books API
    const url = `${GOOGLE_BOOKS_BASE_URL}/${googleBooksId}${GOOGLE_BOOKS_API_KEY ? `?key=${GOOGLE_BOOKS_API_KEY}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.id) {
      throw new Error('Book not found');
    }
    
    const bookData = {
      googleBooksId: data.id,
      title: data.volumeInfo?.title || 'Unknown Title',
      authors: data.volumeInfo?.authors || ['Unknown Author'],
      description: data.volumeInfo?.description || '',
      thumbnail: data.volumeInfo?.imageLinks?.thumbnail || data.volumeInfo?.imageLinks?.smallThumbnail || '',
      pageCount: data.volumeInfo?.pageCount || 0,
      publishedDate: data.volumeInfo?.publishedDate || '',
      categories: data.volumeInfo?.categories || [],
      addedBy: null, // Will be set when first added to shelf
      addedAt: serverTimestamp(),
    };
    
    // Save to Firestore for future use
    await setDoc(bookRef, bookData);
    
    return bookData;
  } catch (error) {
    console.error('Error getting book details:', error);
    throw error;
  }
};

export const ensureBookInFirestore = async (bookData, userId) => {
  const bookRef = doc(db, 'books', bookData.googleBooksId);
  const bookSnap = await getDoc(bookRef);
  
  if (!bookSnap.exists()) {
    await setDoc(bookRef, {
      ...bookData,
      addedBy: userId,
      addedAt: serverTimestamp(),
    });
  }
  
  return bookRef;
};

