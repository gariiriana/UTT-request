// Firebase Firestore functions for BOQ Management
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { BOQItem, BOQUsage, RequestType } from '../types';

/**
 * Create a new BOQ item
 */
export async function createBOQItem(
  userId: string,
  userName: string,
  data: {
    siteProject: string;
    itemName: string;
    specification: string;
    category: RequestType;
    totalQuantity: number;
  }
): Promise<{ boqId: string | null; error: string | null }> {
  try {
    const boqData: Omit<BOQItem, 'id'> = {
      ...data,
      remainingQuantity: data.totalQuantity,
      usedQuantity: 0,
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'boq'), boqData);

    return { boqId: docRef.id, error: null };
  } catch (error) {
    console.error('Error creating BOQ item:', error);
    return { boqId: null, error: 'Failed to create BOQ item' };
  }
}

/**
 * Update BOQ item (only if not used yet)
 */
export async function updateBOQItem(
  boqId: string,
  data: {
    itemName?: string;
    specification?: string;
    category?: RequestType;
    totalQuantity?: number;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const boqRef = doc(db, 'boq', boqId);
    const boqSnap = await getDoc(boqRef);

    if (!boqSnap.exists()) {
      return { success: false, error: 'BOQ item not found' };
    }

    const boqData = boqSnap.data() as BOQItem;

    // If quantity is being changed, recalculate remaining
    let updateData: any = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (data.totalQuantity !== undefined) {
      const usedQuantity = boqData.usedQuantity || 0;
      updateData.remainingQuantity = data.totalQuantity - usedQuantity;

      if (updateData.remainingQuantity < 0) {
        return { success: false, error: 'Total quantity cannot be less than used quantity' };
      }
    }

    await updateDoc(boqRef, updateData);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating BOQ item:', error);
    return { success: false, error: 'Failed to update BOQ item' };
  }
}

/**
 * Delete/Deactivate BOQ item (only if not used)
 */
export async function deactivateBOQItem(
  boqId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const boqRef = doc(db, 'boq', boqId);
    const boqSnap = await getDoc(boqRef);

    if (!boqSnap.exists()) {
      return { success: false, error: 'BOQ item not found' };
    }

    const boqData = boqSnap.data() as BOQItem;

    if (boqData.usedQuantity > 0) {
      return { success: false, error: 'Cannot delete BOQ item that has been used' };
    }

    await updateDoc(boqRef, {
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deactivating BOQ item:', error);
    return { success: false, error: 'Failed to deactivate BOQ item' };
  }
}

/**
 * Get all BOQ items for a site/project
 */
export async function getBOQItemsBySite(siteProject: string): Promise<BOQItem[]> {
  try {
    const q = query(
      collection(db, 'boq'),
      where('siteProject', '==', siteProject),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BOQItem));
  } catch (error) {
    console.error('Error getting BOQ items:', error);
    return [];
  }
}

/**
 * Get all BOQ items (for admin/presales)
 */
export async function getAllBOQItems(): Promise<BOQItem[]> {
  try {
    const q = query(
      collection(db, 'boq'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BOQItem));
  } catch (error) {
    console.error('Error getting all BOQ items:', error);
    return [];
  }
}

/**
 * Subscribe to BOQ items (real-time)
 */
export function subscribeToBOQItems(
  siteProject: string,
  onUpdate: (items: BOQItem[]) => void
): () => void {
  const q = query(
    collection(db, 'boq'),
    where('siteProject', '==', siteProject),
    where('isActive', '==', true)
    // Removed orderBy to avoid composite index requirement
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BOQItem));

    // Sort in memory instead (no index needed)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    onUpdate(items);
  });
}

/**
 * Subscribe to all BOQ items (real-time)
 */
export function subscribeToAllBOQItems(
  onUpdate: (items: BOQItem[]) => void
): () => void {
  const q = query(
    collection(db, 'boq'),
    where('isActive', '==', true)
    // Removed orderBy to avoid composite index requirement
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BOQItem));

    // Sort in memory instead (no index needed)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    onUpdate(items);
  });
}

/**
 * Create BOQ usage record (when request is created)
 * IMPORTANT: This also reserves the quantity immediately
 */
export async function createBOQUsage(
  boqItemId: string,
  requestId: string,
  userId: string,
  userName: string,
  data: {
    siteProject: string;
    itemName: string;
    quantityUsed: number;
  }
): Promise<{ usageId: string | null; error: string | null }> {
  console.log('🔵🔵🔵 [createBOQUsage] START', {
    boqItemId,
    requestId,
    quantityUsed: data.quantityUsed,
    userName
  });

  try {
    // Use transaction to atomically reserve BOQ quantity
    const result = await runTransaction(db, async (transaction) => {
      console.log('🔵 [Transaction] START');

      // 1. Get BOQ item and check availability
      const boqRef = doc(db, 'boq', boqItemId);
      const boqSnap = await transaction.get(boqRef);

      console.log('🔵 [Transaction] BOQ Snap exists:', boqSnap.exists());

      if (!boqSnap.exists()) {
        throw new Error('BOQ item not found');
      }

      const boqData = boqSnap.data() as BOQItem;
      const newRemainingQuantity = boqData.remainingQuantity - data.quantityUsed;
      const newUsedQuantity = boqData.usedQuantity + data.quantityUsed;

      console.log('🔵 [Transaction] BOQ Data:', {
        itemName: boqData.itemName,
        totalQuantity: boqData.totalQuantity,
        currentUsed: boqData.usedQuantity,
        currentRemaining: boqData.remainingQuantity,
        requestedQty: data.quantityUsed,
        newUsed: newUsedQuantity,
        newRemaining: newRemainingQuantity
      });

      if (newRemainingQuantity < 0) {
        const errorMsg = `Insufficient BOQ quantity. Available: ${boqData.remainingQuantity}, Requested: ${data.quantityUsed}`;
        console.error('❌ [Transaction] ERROR:', errorMsg);
        throw new Error(errorMsg);
      }

      // 2. Update BOQ item (reserve quantity)
      console.log('🔵 [Transaction] Updating BOQ item...');
      transaction.update(boqRef, {
        remainingQuantity: newRemainingQuantity,
        usedQuantity: newUsedQuantity,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ [Transaction] BOQ item updated in transaction');

      // 3. Create usage record
      const usageData: Omit<BOQUsage, 'id'> = {
        boqItemId,
        requestId,
        ...data,
        usedBy: userId,
        usedByName: userName,
        status: 'Reserved',
        createdAt: new Date().toISOString()
      };

      const usageRef = doc(collection(db, 'boq_usage'));
      transaction.set(usageRef, usageData);
      console.log('✅ [Transaction] Usage record created in transaction');

      console.log('🔵 [Transaction] END - Committing...');
      return { usageId: usageRef.id, error: null };
    });

    console.log('✅✅✅ [createBOQUsage] SUCCESS', result);
    return result;
  } catch (error: any) {
    console.error('❌❌❌ [createBOQUsage] ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return { usageId: null, error: error.message || 'Failed to create BOQ usage record' };
  }
}

/**
 * Deduct BOQ quantity when request is completed (ATOMIC)
 * NOTE: Quantity is already reserved when request was created,
 * so this only updates the usage status to 'Completed'
 */
export async function deductBOQQuantity(
  boqItemId: string,
  requestId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Update usage record status only
    // Quantity was already deducted when request was created
    const usageQuery = query(
      collection(db, 'boq_usage'),
      where('requestId', '==', requestId),
      where('boqItemId', '==', boqItemId)
    );

    const usageSnapshot = await getDocs(usageQuery);

    if (usageSnapshot.empty) {
      // ✅ FIX: Just log warning instead of returning error
      // This handles requests created before BOQ usage system was implemented
      console.warn('⚠️ BOQ usage record not found for request:', requestId, 'BOQ item:', boqItemId);
      console.warn('⚠️ This is expected for requests created before BOQ usage tracking was implemented');
      return { success: true, error: null }; // ✅ Return success to not block workflow
    }

    const batch = writeBatch(db);

    usageSnapshot.forEach((usageDoc) => {
      batch.update(usageDoc.ref, {
        status: 'Completed',
        completedAt: new Date().toISOString()
      });
    });

    await batch.commit();

    console.log('✅ BOQ usage status updated to Completed');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating BOQ usage status:', error);
    return { success: false, error: error.message || 'Failed to update BOQ usage status' };
  }
}

/**
 * Cancel BOQ usage (when request is rejected)
 * This will return the reserved quantity back to BOQ
 */
export async function cancelBOQUsage(
  requestId: string,
  boqItemId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Get usage record to know how much quantity to return
      // The original `boqItemId` is no longer a direct parameter, so we need to query based on `requestId`
      // and then extract `boqItemId` from the usage record.
      const usageQuery = query(
        collection(db, 'boq_usage'),
        where('requestId', '==', requestId),
        where('boqItemId', '==', boqItemId)
      );

      const usageSnapshot = await getDocs(usageQuery);

      if (usageSnapshot.empty) {
        // ✅ FIX: Handle old requests without BOQ usage records
        console.warn('⚠️ BOQ usage record not found for request:', requestId, 'BOQ item:', boqItemId);
        console.warn('⚠️ This is expected for requests created before BOQ usage tracking was implemented');
        return { success: true, error: null }; // ✅ Return success to not block workflow
      }

      const usageDoc = usageSnapshot.docs[0];
      const usageData = usageDoc.data() as BOQUsage;

      // 2. Get BOQ item and return the quantity
      const boqRef = doc(db, 'boq', boqItemId);
      const boqSnap = await transaction.get(boqRef);

      if (!boqSnap.exists()) {
        throw new Error('BOQ item not found');
      }

      const boqData = boqSnap.data() as BOQItem;
      const quantityToReturn = usageData.quantityUsed;

      // 3. Return quantity to BOQ
      transaction.update(boqRef, {
        remainingQuantity: boqData.remainingQuantity + quantityToReturn,
        usedQuantity: boqData.usedQuantity - quantityToReturn,
        updatedAt: new Date().toISOString()
      });

      // 4. Mark usage as cancelled
      transaction.update(usageDoc.ref, {
        status: 'Cancelled',
        completedAt: new Date().toISOString()
      });

      console.log('✅ BOQ usage cancelled, quantity returned to inventory');
      return { success: true, error: null };
    });

    return result;
  } catch (error: any) {
    console.error('Error cancelling BOQ usage:', error);
    return { success: false, error: error.message || 'Failed to cancel BOQ usage' };
  }
}

/**
 * Add returned items back to BOQ inventory
 * Used when Project Manager returns items in good condition
 */
export async function addBackToBOQ(
  boqItemId: string,
  quantityToAdd: number,
  _requestId: string,
  _notes: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Get BOQ item
      const boqRef = doc(db, 'boq', boqItemId);
      const boqSnap = await transaction.get(boqRef);

      if (!boqSnap.exists()) {
        throw new Error('BOQ item not found');
      }

      const boqData = boqSnap.data() as BOQItem;

      // 2. Add quantity back to BOQ
      transaction.update(boqRef, {
        remainingQuantity: boqData.remainingQuantity + quantityToAdd,
        usedQuantity: Math.max(0, boqData.usedQuantity - quantityToAdd), // Prevent negative
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Added ${quantityToAdd} units back to BOQ ${boqItemId}`);
      console.log(`   New remaining: ${boqData.remainingQuantity + quantityToAdd}`);
      console.log(`   New used: ${Math.max(0, boqData.usedQuantity - quantityToAdd)}`);

      return { success: true, error: null };
    });

    return result;
  } catch (error: any) {
    console.error('Error adding back to BOQ:', error);
    return { success: false, error: error.message || 'Failed to add items back to inventory' };
  }
}

/**
 * Get BOQ usage history for an item
 */
export async function getBOQUsageHistory(boqItemId: string): Promise<BOQUsage[]> {
  try {
    const q = query(
      collection(db, 'boq_usage'),
      where('boqItemId', '==', boqItemId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BOQUsage));
  } catch (error) {
    console.error('Error getting BOQ usage history:', error);
    return [];
  }
}

/**
 * Get single BOQ item
 */
export async function getBOQItem(boqId: string): Promise<BOQItem | null> {
  try {
    const boqRef = doc(db, 'boq', boqId);
    const boqSnap = await getDoc(boqRef);

    if (!boqSnap.exists()) {
      return null;
    }

    return {
      id: boqSnap.id,
      ...boqSnap.data()
    } as BOQItem;
  } catch (error) {
    console.error('Error getting BOQ item:', error);
    return null;
  }
}