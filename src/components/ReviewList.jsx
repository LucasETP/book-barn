import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile } from '../services/users';
import { getReviewReplies, addReviewReply } from '../services/reviews';
import { getBookDetails } from '../services/books';
import { useAuth } from '../contexts/AuthContext';

const ReplyForm = ({ reviewId, onReplyAdded }) => {
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      await addReviewReply(reviewId, currentUser.uid, replyText);
      setReplyText('');
      onReplyAdded();
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <input
        type="text"
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Write a reply..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-barn-brown text-sm"
      />
      <button
        type="submit"
        disabled={submitting || !replyText.trim()}
        className="mt-1 text-sm text-barn-brown hover:underline disabled:opacity-50"
      >
        {submitting ? 'Posting...' : 'Reply'}
      </button>
    </form>
  );
};

const ReviewItem = ({ review, currentUserId, bookId, book }) => {
  const [user, setUser] = useState(null);
  const [bookData, setBookData] = useState(book || null);
  const [replies, setReplies] = useState([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userPromise = getUserProfile(review.userId);
        const repliesPromise = getReviewReplies(review.id);
        const bookPromise = book
          ? Promise.resolve(book)
          : bookId
            ? getBookDetails(bookId).catch((err) => {
                console.error('Error loading book data:', err);
                return null;
              })
            : Promise.resolve(null);

        const [userData, repliesData, bookDetails] = await Promise.all([
          userPromise,
          repliesPromise,
          bookPromise,
        ]);

        setUser(userData);
        setReplies(repliesData);
        setBookData(bookDetails);
      } catch (error) {
        console.error('Error loading review data:', error);
        setLoading(false);
        return;
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [review.id, review.userId, bookId, book]);

  const handleReplyAdded = async () => {
    const repliesData = await getReviewReplies(review.id);
    setReplies(repliesData);
    setShowReplyForm(false);
  };

  if (loading) {
    return <div className="animate-pulse h-24 bg-gray-100 rounded mb-4"></div>;
  }

  if (!user) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-0">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${user.id}`}>
          <img
            src={user.photoURL || '/default-avatar.png'}
            alt={user.displayName}
            className="w-10 h-10 rounded-full"
          />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/profile/${user.id}`} className="font-semibold hover:text-barn-brown">
              {user.displayName}
            </Link>
            <span className="text-yellow-400">{'⭐'.repeat(review.rating)}</span>
            {review.isPrivate && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Private</span>
            )}
            <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
          </div>

          {bookData && (
            <Link
              to={`/book/${bookData.googleBooksId || bookId}`}
              className="flex items-center gap-3 mb-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <img
                src={bookData.thumbnail || '/placeholder-book.png'}
                alt={bookData.title}
                className="w-10 h-14 object-cover rounded shadow-sm"
              />
              <div>
                <p className="text-sm font-semibold text-barn-brown">{bookData.title}</p>
                <p className="text-xs text-gray-600">
                  {bookData.authors?.join(', ') || 'Unknown Author'}
                </p>
              </div>
            </Link>
          )}
          
          {review.reviewText && (
            <p className="text-gray-700 mb-2">{review.reviewText}</p>
          )}
          
          {currentUserId && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-sm text-barn-brown hover:underline"
            >
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
          )}
          
          {showReplyForm && (
            <ReplyForm reviewId={review.id} onReplyAdded={handleReplyAdded} />
          )}
          
          {replies.length > 0 && (
            <div className="mt-4 ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
              {replies.map((reply) => (
                <ReplyItem key={reply.id} reply={reply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReplyItem = ({ reply }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUserProfile(reply.userId);
        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading reply user:', error);
        setLoading(false);
      }
    };
    
    loadUser();
  }, [reply.userId]);

  if (loading) {
    return <div className="animate-pulse h-16 bg-gray-50 rounded"></div>;
  }

  if (!user) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start gap-2">
      <Link to={`/profile/${user.id}`}>
        <img
          src={user.photoURL || '/default-avatar.png'}
          alt={user.displayName}
          className="w-8 h-8 rounded-full"
        />
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Link to={`/profile/${user.id}`} className="font-semibold text-sm hover:text-barn-brown">
            {user.displayName}
          </Link>
          <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700">{reply.replyText}</p>
      </div>
    </div>
  );
};

const ReviewList = ({ reviews, currentUserId, isTeacher, bookId, bookLookup = {} }) => {
  // Filter out private reviews that user can't see
  const visibleReviews = reviews.filter(review => {
    if (!review.isPrivate) return true;
    if (review.userId === currentUserId) return true;
    if (isTeacher) return true;
    return false;
  });

  return (
    <div>
      {visibleReviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet. Be the first to review this book!</p>
      ) : (
        visibleReviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            isTeacher={isTeacher}
            bookId={bookId || review.bookId}
            book={bookLookup[review.bookId]}
          />
        ))
      )}
    </div>
  );
};

export default ReviewList;

