import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    return {
      id: userSnap.id,
      ...userSnap.data(),
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const getTeacherStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('isTeacher', '==', false));
    const usersSnapshot = await getDocs(usersQuery);
    
    const students = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Get all shelves to calculate trending books
    const shelvesRef = collection(db, 'shelves');
    const shelvesSnapshot = await getDocs(shelvesRef);
    
    const bookCounts = {};
    shelvesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'read' || data.status === 'currently-reading') {
        bookCounts[data.bookId] = (bookCounts[data.bookId] || 0) + 1;
      }
    });
    
    const trendingBooks = Object.entries(bookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([bookId, count]) => ({ bookId, count }));
    
    return {
      students,
      trendingBooks,
      totalStudents: students.length,
    };
  } catch (error) {
    console.error('Error getting teacher stats:', error);
    throw error;
  }
};

