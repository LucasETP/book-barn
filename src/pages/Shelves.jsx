import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserShelf } from '../services/shelves';
import { getBookDetails } from '../services/books';

const BookCard = ({ shelfEntry, onBookClick }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const bookData = await getBookDetails(shelfEntry.bookId);
        setBook(bookData);
      } catch (error) {
        console.error('Error loading book:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadBook();
  }, [shelfEntry.bookId]);

  if (loading) {
    return (
      <div className="book-card animate-pulse">
        <div className="w-full h-64 bg-gray-200"></div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div
      className="book-card"
      onClick={() => onBookClick(book.googleBooksId)}
    >
      <img
        src={book.thumbnail || '/placeholder-book.png'}
        alt={book.title}
        className="w-full h-64 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-gray-600 text-sm">
          {book.authors?.join(', ') || 'Unknown Author'}
        </p>
      </div>
    </div>
  );
};

const Shelves = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('want-to-read');
  const [shelves, setShelves] = useState({
    'want-to-read': [],
    'currently-reading': [],
    'read': [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShelves = async () => {
      if (!currentUser) return;

      try {
        const [wantToRead, currentlyReading, read] = await Promise.all([
          getUserShelf(currentUser.uid, 'want-to-read'),
          getUserShelf(currentUser.uid, 'currently-reading'),
          getUserShelf(currentUser.uid, 'read'),
        ]);

        setShelves({
          'want-to-read': wantToRead,
          'currently-reading': currentlyReading,
          'read': read,
        });
      } catch (error) {
        console.error('Error loading shelves:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShelves();
  }, [currentUser]);

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const tabs = [
    { id: 'want-to-read', label: 'Want to Read', count: shelves['want-to-read'].length },
    { id: 'currently-reading', label: 'Currently Reading', count: shelves['currently-reading'].length },
    { id: 'read', label: 'Read', count: shelves['read'].length },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-barn-brown mb-6">My Bookshelves</h1>
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
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-barn-brown mb-6">My Bookshelves</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-300 mb-6">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-barn-brown text-barn-brown'
                  : 'border-transparent text-gray-600 hover:text-barn-brown'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Shelf Content */}
      {shelves[activeTab].length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            No books on this shelf yet.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="btn-primary"
          >
            Search for Books
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shelves[activeTab].map((shelfEntry) => (
            <BookCard
              key={shelfEntry.id}
              shelfEntry={shelfEntry}
              onBookClick={handleBookClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shelves;

