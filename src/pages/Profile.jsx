import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/users';
import { getUserShelf } from '../services/shelves';
import { getUserReviews } from '../services/reviews';
import { getBookDetails } from '../services/books';
import ReviewList from '../components/ReviewList';

const BookCard = ({ bookId, onBookClick }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const bookData = await getBookDetails(bookId);
        setBook(bookData);
      } catch (error) {
        console.error('Error loading book:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className="book-card animate-pulse">
        <div className="w-full h-64 bg-gray-200"></div>
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

const Profile = () => {
  const { userId } = useParams();
  const { currentUser, userProfile: currentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [shelves, setShelves] = useState({
    'want-to-read': [],
    'currently-reading': [],
    'read': [],
  });
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('shelves');
  const [loading, setLoading] = useState(true);

  const profileUserId = userId || currentUser?.uid;
  const isOwnProfile = profileUserId === currentUser?.uid;

  useEffect(() => {
    const loadProfile = async () => {
      if (!profileUserId) return;

      try {
        const [profileData, wantToRead, currentlyReading, read, reviewsData] = await Promise.all([
          getUserProfile(profileUserId),
          getUserShelf(profileUserId, 'want-to-read'),
          getUserShelf(profileUserId, 'currently-reading'),
          getUserShelf(profileUserId, 'read'),
          getUserReviews(profileUserId),
        ]);

        setProfile(profileData);
        setShelves({
          'want-to-read': wantToRead,
          'currently-reading': currentlyReading,
          'read': read,
        });
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileUserId]);

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">User not found.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'shelves', label: 'Shelves' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div>
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={profile.photoURL || '/default-avatar.png'}
            alt={profile.displayName}
            className="w-24 h-24 rounded-full"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-barn-brown mb-2">
              {profile.displayName}
            </h1>
            {profile.isTeacher && (
              <span className="inline-block bg-barn-brown text-white px-3 py-1 rounded-full text-sm mb-4">
                Teacher
              </span>
            )}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-barn-brown">
                  {shelves['read'].length}
                </div>
                <div className="text-sm text-gray-600">Books Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-barn-brown">
                  {reviews.length}
                </div>
                <div className="text-sm text-gray-600">Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-barn-brown">
                  {shelves['currently-reading'].length}
                </div>
                <div className="text-sm text-gray-600">Reading Now</div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'shelves' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-barn-brown mb-4">
              Want to Read ({shelves['want-to-read'].length})
            </h2>
            {shelves['want-to-read'].length === 0 ? (
              <p className="text-gray-500">No books on this shelf.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shelves['want-to-read'].map((shelfEntry) => (
                  <BookCard
                    key={shelfEntry.id}
                    bookId={shelfEntry.bookId}
                    onBookClick={handleBookClick}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-barn-brown mb-4">
              Currently Reading ({shelves['currently-reading'].length})
            </h2>
            {shelves['currently-reading'].length === 0 ? (
              <p className="text-gray-500">No books on this shelf.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shelves['currently-reading'].map((shelfEntry) => (
                  <BookCard
                    key={shelfEntry.id}
                    bookId={shelfEntry.bookId}
                    onBookClick={handleBookClick}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-barn-brown mb-4">
              Read ({shelves['read'].length})
            </h2>
            {shelves['read'].length === 0 ? (
              <p className="text-gray-500">No books on this shelf.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shelves['read'].map((shelfEntry) => (
                  <BookCard
                    key={shelfEntry.id}
                    bookId={shelfEntry.bookId}
                    onBookClick={handleBookClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="card">
                  <ReviewList
                    reviews={[review]}
                    currentUserId={currentUser?.uid}
                    isTeacher={currentUserProfile?.isTeacher}
                    bookId={review.bookId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;

