// Firebase User Management functions
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

/**
 * Get all pending users (isApproved: false)
 */
export async function getPendingUsers(): Promise<{ users: User[]; error: string | null }> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isApproved', '==', false));
    const querySnapshot = await getDocs(q);

    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ ...doc.data(), id: doc.id } as User);
    });

    return { users, error: null };
  } catch (error: any) {
    console.error('Error fetching pending users:', error);
    return { users: [], error: error.message };
  }
}

/**
 * Subscribe to pending users (real-time updates)
 */
export function subscribeToPendingUsers(
  callback: (users: User[]) => void
): () => void {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('isApproved', '==', false));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ ...doc.data(), id: doc.id } as User);
      });
      callback(users);
    },
    (_error) => {
      // Silently handle permission errors - return empty array
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Approve a pending user
 */
export async function approveUser(
  userId: string,
  approvedBy: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isApproved: true,
      approvedBy,
      approvedAt: new Date().toISOString()
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error approving user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a pending user (set isApproved to false and add rejection reason)
 */
export async function rejectUser(
  userId: string,
  rejectedBy: string,
  rejectionReason: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isApproved: false,
      isRejected: true,
      rejectedBy,
      rejectionReason,
      rejectedAt: new Date().toISOString()
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error rejecting user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all approved users
 */
export async function getAllUsers(): Promise<{ users: User[]; error: string | null }> {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);


    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ ...doc.data(), id: doc.id } as User);
    });

    return { users, error: null };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { users: [], error: error.message };
  }
}