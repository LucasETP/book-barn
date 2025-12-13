import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBookDetails, ensureBookInFirestore } from '../services/books';
import { addBookToShelf, getBookShelfStatus, removeBookFromShelf } from '../services/shelves';
import { getBookReviews, createReview, getAverageRating } from '../services/reviews';
import { getUserProfile } from '../services/users';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';

const BookDetail = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [book, setBook] = useState(null);
  const [shelfStatus, setShelfStatus] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const bookData = await getBookDetails(bookId);
        setBook(bookData);
        
        // Ensure book is in Firestore
        if (currentUser) {
          await ensureBookInFirestore(bookData, currentUser.uid);
        }
        
        // Get shelf status
        if (currentUser) {
          const status = await getBookShelfStatus(currentUser.uid, bookId);
          setShelfStatus(status);
        }
        
        // Get reviews
        const reviewsData = await getBookReviews(bookId, currentUser?.uid, userProfile?.isTeacher);
        setReviews(reviewsData);
        
        // Get average rating
        const avg = await getAverageRating(bookId);
        setAverageRating(avg);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading book:', error);
        setLoading(false);
      }
    };
    
    loadBook();
  }, [bookId, currentUser, userProfile]);

  const handleShelfChange = async (newStatus) => {
    if (!currentUser) return;
    
    try {
      if (newStatus === 'remove') {
        await removeBookFromShelf(currentUser.uid, bookId);
        setShelfStatus(null);
      } else {
        await addBookToShelf(currentUser.uid, bookId, newStatus);
        setShelfStatus(newStatus);
        
        // If marking as read, show review form option
        if (newStatus === 'read') {
          // Check if user already has a review
          const hasReview = reviews.some(r => r.userId === currentUser.uid);
          if (!hasReview) {
            setShowReviewForm(true);
          }
        }
      }
    } catch (error) {
      console.error('Error updating shelf:', error);
      alert('Failed to update shelf. Please try again.');
    }
  };

  const handleReviewSubmit = async (rating, reviewText, isPrivate) => {
    try {
      await createReview(currentUser.uid, bookId, rating, reviewText, isPrivate);
      setShowReviewForm(false);
      
      // Reload reviews
      const reviewsData = await getBookReviews(bookId, currentUser.uid, userProfile?.isTeacher);
      setReviews(reviewsData);
      
      // Update average rating
      const avg = await getAverageRating(bookId);
      setAverageRating(avg);
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Failed to create review. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex gap-6">
          <div className="w-48 h-72 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">Book not found.</p>
        <button onClick={() => navigate('/search')} className="btn-primary mt-4">
          Search for Books
        </button>
      </div>
    );
  }

  const canWriteReview = shelfStatus === 'read' && !reviews.some(r => r.userId === currentUser?.uid);

  return (
    <div>
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={book.thumbnail || '/placeholder-book.png'}
            alt={book.title}
            className="w-full md:w-48 h-auto object-cover rounded"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-barn-brown mb-2">{book.title}</h1>
            <p className="text-xl text-gray-700 mb-4">
              by {book.authors?.join(', ') || 'Unknown Author'}
            </p>
            
            {averageRating > 0 && (
              <div className="mb-4">
                <span className="text-2xl font-semibold">{averageRating}</span>
                <span className="text-gray-500 ml-2">
                  ({reviews.filter(r => !r.isPrivate || r.userId === currentUser?.uid).length} reviews)
                </span>
              </div>
            )}
            
            <div className="space-y-2 mb-6 text-gray-600">
              {book.pageCount > 0 && <p><strong>Pages:</strong> {book.pageCount}</p>}
              {book.publishedDate && <p><strong>Published:</strong> {book.publishedDate}</p>}
              {book.categories?.length > 0 && (
                <p><strong>Categories:</strong> {book.categories.join(', ')}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Add to Shelf:</label>
              <select
                value={shelfStatus || ''}
                onChange={(e) => handleShelfChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-barn-brown"
              >
                <option value="">Select shelf...</option>
                <option value="want-to-read">Want to Read</option>
                <option value="currently-reading">Currently Reading</option>
                <option value="read">Read</option>
                {shelfStatus && <option value="remove">Remove from Shelf</option>}
              </select>
            </div>
            
            {canWriteReview && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary"
              >
                Write a Review
              </button>
            )}
          </div>
        </div>
        
        {book.description && (
          <div className="mt-6 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">{book.description}</p>
          </div>
        )}
      </div>

      {showReviewForm && (
        <div className="card mb-6">
          <ReviewForm
            onSubmit={handleReviewSubmit}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold text-barn-brown mb-4">
          Reviews ({reviews.filter(r => !r.isPrivate || r.userId === currentUser?.uid).length})
        </h2>
        
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review this book!</p>
        ) : (
          <ReviewList
            reviews={reviews}
            currentUserId={currentUser?.uid}
            isTeacher={userProfile?.isTeacher}
            bookId={bookId}
          />
        )}
      </div>
    </div>
  );
};

export default BookDetail;

