import { 
  collection, 
  query, 
  getDocs,
  orderBy,
  limit,
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const getActivityFeed = async (limitCount = 20) => {
  try {
    // Get recent shelf additions
    const shelvesRef = collection(db, 'shelves');
    const shelvesQuery = query(
      shelvesRef,
      orderBy('dateAdded', 'desc'),
      limit(limitCount)
    );
    const shelvesSnapshot = await getDocs(shelvesQuery);
    
    // Get recent reviews
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(
      reviewsRef,
      where('isPrivate', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);

    // Not gonna track replies because that feels invasive lol
    
    // Combine and format activities
    const activities = [];
    
    shelvesSnapshot.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        type: 'shelf',
        userId: data.userId,
        bookId: data.bookId,
        status: data.status,
        timestamp: data.dateAdded,
        dateAdded: data.dateAdded,
      });
    });
    
    reviewsSnapshot.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        type: 'review',
        userId: data.userId,
        bookId: data.bookId,
        rating: data.rating,
        reviewText: data.reviewText,
        timestamp: data.createdAt,
        createdAt: data.createdAt,
      });
    });
    
    // Sort by timestamp (most recent first)
    activities.sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp?.toMillis?.() || 0;
      return bTime - aTime;
    });
    
    return activities.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting activity feed:', error);
    throw error;
  }
};

