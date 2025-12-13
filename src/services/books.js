import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '';
const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export const searchBooks = async (searchQuery) => {
  try {
    const url = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(searchQuery)}&maxResults=20${GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.items) {
      return [];
    }
    
    return data.items.map(item => ({
      googleBooksId: item.id,
      title: item.volumeInfo?.title || 'Unknown Title',
      authors: item.volumeInfo?.authors || ['Unknown Author'],
      description: item.volumeInfo?.description || '',
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail || '',
      pageCount: item.volumeInfo?.pageCount || 0,
      publishedDate: item.volumeInfo?.publishedDate || '',
      categories: item.volumeInfo?.categories || [],
    }));
  } catch (error) {
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

