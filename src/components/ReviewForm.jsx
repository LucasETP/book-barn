import { useState } from 'react';

const ReviewForm = ({ onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    onSubmit(rating, reviewText, isPrivate);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Rating *</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Review (optional)</label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts about this book..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-barn-brown min-h-32"
          rows={5}
        />
      </div>
      
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Make this review private (only visible to you and teachers)</span>
        </label>
      </div>
      
      <div className="flex gap-2">
        <button type="submit" className="btn-primary">
          Submit Review
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;

