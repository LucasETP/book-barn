import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  increment 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const createReview = async (userId, bookId, rating, reviewText, isPrivate) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const reviewRef = doc(reviewsRef);
    
    const reviewData = {
      reviewId: reviewRef.id,
      userId,
      bookId,
      rating,
      reviewText: reviewText || '',
      isPrivate: isPrivate || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: 0,
    };
    
    await setDoc(reviewRef, reviewData);
    
    // Update user stats
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        'stats.reviewsWritten': increment(1),
      });
    }
    
    return reviewRef.id;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getBookReviews = async (bookId, currentUserId, isTeacher) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('bookId', '==', bookId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews = [];
    
    for (const docSnap of querySnapshot.docs) {
      const reviewData = docSnap.data();
      
      // Filter private reviews
      if (reviewData.isPrivate) {
        if (reviewData.userId === currentUserId || isTeacher) {
          reviews.push({
            id: docSnap.id,
            ...reviewData,
          });
        }
      } else {
        reviews.push({
          id: docSnap.id,
          ...reviewData,
        });
      }
    }
    
    return reviews;
  } catch (error) {
    console.error('Error getting book reviews:', error);
    throw error;
  }
};

export const getUserReviews = async (userId) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user reviews:', error);
    throw error;
  }
};

export const updateReview = async (reviewId, userId, rating, reviewText, isPrivate) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists() || reviewSnap.data().userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    await updateDoc(reviewRef, {
      rating,
      reviewText: reviewText || '',
      isPrivate: isPrivate || false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId, userId) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists() || reviewSnap.data().userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    await deleteDoc(reviewRef);
    
    // Update user stats
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'stats.reviewsWritten': increment(-1),
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const addReviewReply = async (reviewId, userId, replyText) => {
  try {
    const repliesRef = collection(db, 'review_replies');
    const replyRef = doc(repliesRef);
    
    const replyData = {
      replyId: replyRef.id,
      reviewId,
      userId,
      replyText,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(replyRef, replyData);
    return replyRef.id;
  } catch (error) {
    console.error('Error adding review reply:', error);
    throw error;
  }
};

export const getReviewReplies = async (reviewId) => {
  try {
    const repliesRef = collection(db, 'review_replies');
    const q = query(
      repliesRef,
      where('reviewId', '==', reviewId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting review replies:', error);
    throw error;
  }
};

export const getAverageRating = async (bookId) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('bookId', '==', bookId),
      where('isPrivate', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return 0;
    }
    
    let totalRating = 0;
    let count = 0;
    
    querySnapshot.forEach(doc => {
      totalRating += doc.data().rating;
      count++;
    });
    
    return count > 0 ? (totalRating / count).toFixed(1) : 0;
  } catch (error) {
    console.error('Error getting average rating:', error);
    return 0;
  }
};

