import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  query, 
  where, 
  getDocs,
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const addBookToShelf = async (userId, bookId, status) => {
  try {
    // Check if book already exists on user's shelf
    const shelvesRef = collection(db, 'shelves');
    const q = query(
      shelvesRef,
      where('userId', '==', userId),
      where('bookId', '==', bookId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing shelf entry
      const shelfDoc = querySnapshot.docs[0];
      const existingData = shelfDoc.data();
      const updateData = {
        status,
      };
      
      if (status === 'currently-reading' && !existingData.dateStarted) {
        updateData.dateStarted = serverTimestamp();
      }
      
      if (status === 'read' && !existingData.dateFinished) {
        updateData.dateFinished = serverTimestamp();
      }
      
      await updateDoc(shelfDoc.ref, updateData);
      return shelfDoc.id;
    } else {
      // Create new shelf entry
      const shelfData = {
        userId,
        bookId,
        status,
        dateAdded: serverTimestamp(),
        dateStarted: status === 'currently-reading' ? serverTimestamp() : null,
        dateFinished: status === 'read' ? serverTimestamp() : null,
      };
      
      const shelfRef = doc(collection(db, 'shelves'));
      await setDoc(shelfRef, shelfData);
      return shelfRef.id;
    }
  } catch (error) {
    console.error('Error adding book to shelf:', error);
    throw error;
  }
};

export const removeBookFromShelf = async (userId, bookId) => {
  try {
    const shelvesRef = collection(db, 'shelves');
    const q = query(
      shelvesRef,
      where('userId', '==', userId),
      where('bookId', '==', bookId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      await deleteDoc(querySnapshot.docs[0].ref);
    }
  } catch (error) {
    console.error('Error removing book from shelf:', error);
    throw error;
  }
};

export const getUserShelf = async (userId, status = null) => {
  try {
    const shelvesRef = collection(db, 'shelves');
    let q = query(shelvesRef, where('userId', '==', userId));
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user shelf:', error);
    throw error;
  }
};

export const getBookShelfStatus = async (userId, bookId) => {
  try {
    const shelvesRef = collection(db, 'shelves');
    const q = query(
      shelvesRef,
      where('userId', '==', userId),
      where('bookId', '==', bookId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return querySnapshot.docs[0].data().status;
  } catch (error) {
    console.error('Error getting book shelf status:', error);
    return null;
  }
};

