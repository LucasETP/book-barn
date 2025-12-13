import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActivityFeed } from '../services/activity';
import { getUserProfile } from '../services/users';
import { getBookDetails } from '../services/books';

const ActivityCard = ({ activity }) => {
  const [user, setUser] = useState(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getUserProfile(activity.userId);
        setUser(userData);
        
        if (activity.bookId) {
          const bookData = await getBookDetails(activity.bookId);
          setBook(bookData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading activity data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [activity]);

  if (loading) {
    return <div className="card animate-pulse h-32"></div>;
  }

  if (!user) return null;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'shelf':
        const statusText = {
          'want-to-read': 'wants to read',
          'currently-reading': 'is reading',
          'read': 'finished reading',
        };
        return `${user.displayName} ${statusText[activity.status] || 'added'}`;
      case 'review':
        const stars = '⭐'.repeat(activity.rating);
        return `${user.displayName} rated ${stars}`;
      case 'reply':
        return `${user.displayName} replied`;
      default:
        return `${user.displayName} did something`;
    }
  };

  return (
    <div className="card mb-4">
      <div className="flex gap-4">
        {book && (
          <Link to={`/book/${book.googleBooksId}`}>
            <img
              src={book.thumbnail || '/placeholder-book.png'}
              alt={book.title}
              className="w-16 h-24 object-cover rounded"
            />
          </Link>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link to={`/profile/${user.id}`}>
              <img
                src={user.photoURL || '/default-avatar.png'}
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
              />
            </Link>
            <div>
              <Link to={`/profile/${user.id}`} className="font-semibold hover:text-barn-brown">
                {user.displayName}
              </Link>
              <span className="text-gray-500 text-sm ml-2">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
          </div>
          
          <p className="text-gray-700">
            {getActivityText()}{' '}
            {book && (
              <Link to={`/book/${book.googleBooksId}`} className="font-semibold text-barn-brown hover:underline">
                {book.title}
              </Link>
            )}
          </p>
          
          {activity.type === 'review' && activity.reviewText && (
            <p className="mt-2 text-gray-600 italic">"{activity.reviewText.substring(0, 100)}..."</p>
          )}
          
          {activity.type === 'reply' && activity.replyText && (
            <p className="mt-2 text-gray-600">"{activity.replyText.substring(0, 100)}..."</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await getActivityFeed(20);
        setActivities(data);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadActivities();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card animate-pulse h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-barn-brown mb-6">Activity Feed</h1>
      
      {activities.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No activity yet. Be the first to add a book!</p>
          <Link to="/search" className="btn-primary mt-4 inline-block">
            Search for Books
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;

