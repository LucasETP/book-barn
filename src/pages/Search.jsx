import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchBooks } from '../services/books';

const MIN_QUERY_LENGTH = 2; // Minimum characters before searching
const DEBOUNCE_DELAY = 500; // Wait 500ms after user stops typing

const BookCard = ({ book }) => {
  const navigate = useNavigate();

  return (
    <div
      className="book-card"
      onClick={() => navigate(`/book/${book.googleBooksId}`)}
    >
      <img
        src={book.thumbnail || '/placeholder-book.png'}
        alt={book.title}
        className="w-full h-64 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {book.authors?.join(', ') || 'Unknown Author'}
        </p>
        {book.pageCount > 0 && (
          <p className="text-gray-500 text-xs">{book.pageCount} pages</p>
        )}
      </div>
    </div>
  );
};

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceTimerRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedQuery = query.trim();
    
    // If query is too short, clear results and don't search
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    // Set loading state immediately for better UX
    setLoading(true);
    setSearched(true);

    // Debounce the actual API call
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const books = await searchBooks(trimmedQuery);
        setResults(books);
      } catch (error) {
        console.error('Search error:', error);
        // Only show error if it's not an abort error (user started new search)
        if (error.name !== 'AbortError') {
          alert('Failed to search books. Please try again.');
        }
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_DELAY);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSearch = async (e) => {
    e.preventDefault();
    // The useEffect will handle the search automatically
    // This just prevents form submission
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-barn-brown mb-6">Search Books</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search for books by title, author, or ISBN... (min ${MIN_QUERY_LENGTH} characters)`}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-barn-brown"
          />
          {query.trim().length >= MIN_QUERY_LENGTH && (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          )}
        </div>
        {query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH && (
          <p className="text-sm text-gray-500 mt-2">
            Please enter at least {MIN_QUERY_LENGTH} characters to search
          </p>
        )}
      </form>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="book-card animate-pulse">
              <div className="w-full h-64 bg-gray-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No books found. Try a different search term.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((book) => (
            <BookCard key={book.googleBooksId} book={book} />
          ))}
        </div>
      )}

      {!searched && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">Start searching for books to add to your shelves!</p>
        </div>
      )}
    </div>
  );
};

export default Search;

