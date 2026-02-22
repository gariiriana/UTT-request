// Firebase Firestore functions for Material Requests
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { MaterialRequest, RequestStatus } from '../types';
import { createBOQUsage, deductBOQQuantity } from './firebaseBOQ';

/**
 * Create a new material request (with optional BOQ)
 */
export async function createRequest(
  userId: string,
  userName: string,
  data: {
    siteProject: string;
    itemName: string;
    quantity: number;
    description: string;
    requestType: 'Procurement' | 'Borrowing';
    boqItemId?: string; // Optional BOQ reference
    attachments?: any[]; // ✅ Add attachments parameter
  }
): Promise<{ requestId: string | null; error: string | null }> {
  try {
    // ✅ Sanitize attachments to prevent Firebase nested entity error
    const sanitizedAttachments = data.attachments?.map(att => ({
      id: att.id || '',
      fileName: att.fileName || '',
      fileType: att.fileType || '',
      fileSize: att.fileSize || 0,
      fileBase64: att.fileBase64 || '',
      uploadedBy: att.uploadedBy || userId,
      uploadedByName: att.uploadedByName || userName,
      uploadedAt: att.uploadedAt || new Date().toISOString()
    })) || [];

    const requestData: any = {
      siteProject: data.siteProject,
      itemName: data.itemName,
      quantity: data.quantity,
      description: data.description,
      requestType: data.requestType,
      requestedBy: userName,
      requestedById: userId,
      status: 'Pending - PMO Review' as RequestStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Only add attachments if they exist
    if (sanitizedAttachments.length > 0) {
      requestData.attachments = sanitizedAttachments;
    }

    // Only add boqItemId if it exists
    if (data.boqItemId) {
      requestData.boqItemId = data.boqItemId;
    }

    const docRef = await addDoc(collection(db, 'requests'), requestData);

    // Create BOQ usage record if BOQ item is referenced (this will reserve quantity)
    if (data.boqItemId) {
      console.log('🔵 Creating BOQ usage for item:', data.boqItemId, 'quantity:', data.quantity);
      const { usageId, error: boqError } = await createBOQUsage(
        data.boqItemId,
        docRef.id,
        userId,
        userName,
        {
          siteProject: data.siteProject,
          itemName: data.itemName,
          quantityUsed: data.quantity
        }
      );

      if (boqError) {
        console.error('❌ Failed to reserve BOQ quantity:', boqError);
        // Delete the request since BOQ reservation failed
        await deleteDoc(doc(db, 'requests', docRef.id));
        return { requestId: null, error: boqError };
      }

      console.log('✅ BOQ usage created successfully:', usageId);
    }

    return { requestId: docRef.id, error: null };
  } catch (error: any) {
    console.error('Error creating request:', error);
    return { requestId: null, error: error.message || 'Failed to create request' };
  }
}

/**
 * Get all requests
 */
export async function getAllRequests(): Promise<MaterialRequest[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'requests'), orderBy('createdAt', 'desc'))
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MaterialRequest));
  } catch (error) {
    console.error('Error getting requests:', error);
    return [];
  }
}

/**
 * Get requests by user ID
 */
export async function getRequestsByUser(userId: string): Promise<MaterialRequest[]> {
  try {
    const q = query(
      collection(db, 'requests'),
      where('requestedById', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MaterialRequest));
  } catch (error) {
    console.error('Error getting user requests:', error);
    return [];
  }
}

/**
 * Get requests by status
 */
export async function getRequestsByStatus(status: RequestStatus): Promise<MaterialRequest[]> {
  try {
    const q = query(
      collection(db, 'requests'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MaterialRequest));
  } catch (error) {
    console.error('Error getting requests by status:', error);
    return [];
  }
}

/**
 * Get single request by ID
 */
export async function getRequestById(requestId: string): Promise<MaterialRequest | null> {
  try {
    const docSnap = await getDoc(doc(db, 'requests', requestId));

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as MaterialRequest;
    }

    return null;
  } catch (error) {
    console.error('Error getting request:', error);
    return null;
  }
}

/**
 * Update request status and approval info
 */
export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  approvalData?: {
    approvedBy?: string;
    rejectedBy?: string;
    rejectionReason?: string;
    pmoApprovedBy?: string;
    pmoApprovedAt?: string;
    salesApprovedBy?: string;
    salesApprovedAt?: string;
    bodApprovedBy?: string;
    bodApprovedAt?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
      ...approvalData
    };

    await updateDoc(doc(db, 'requests', requestId), updateData);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating request status:', error);
    return { success: false, error: 'Failed to update request' };
  }
}

/**
 * Add pricing to request (Purchasing role)
 */
export async function addPricingToRequest(
  requestId: string,
  unitPrice: number,
  totalPrice: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    await updateDoc(doc(db, 'requests', requestId), {
      unitPrice,
      totalPrice,
      status: 'Pending - BOD Final Approval',
      updatedAt: new Date().toISOString()
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error adding pricing:', error);
    return { success: false, error: 'Failed to add pricing' };
  }
}

/**
 * Add purchasing recommendation to request (Purchasing role - FEATURE 2)
 * ✅ UPDATED: Now supports MULTIPLE recommendations using arrayUnion
 */
export async function addPurchasingRecommendation(
  requestId: string,
  userId: string,
  userName: string,
  recommendation: {
    itemType: string; // ✅ ADD: Item Type
    estimatedArrival: string;
    unitPrice: number;
    totalPrice: number;
    paymentTerms: string;
    notes?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get current request to retrieve existing recommendations
    const requestDoc = await getDoc(doc(db, 'requests', requestId));

    if (!requestDoc.exists()) {
      return { success: false, error: 'Request not found' };
    }

    const currentData = requestDoc.data();
    const existingRecommendations = currentData.purchasingRecommendations || [];

    // Create new recommendation with unique ID
    const newRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemType: recommendation.itemType,
      estimatedArrival: recommendation.estimatedArrival,
      unitPrice: recommendation.unitPrice,
      totalPrice: recommendation.totalPrice,
      paymentTerms: recommendation.paymentTerms,
      notes: recommendation.notes || '',
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString()
    };

    // Append to existing array
    const updatedRecommendations = [...existingRecommendations, newRecommendation];

    // Update document with new recommendations array
    await updateDoc(doc(db, 'requests', requestId), {
      purchasingRecommendations: updatedRecommendations,
      updatedAt: new Date().toISOString()
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error adding recommendation:', error);
    return { success: false, error: 'Failed to add recommendation' };
  }
}

/**
 * Complete delivery without photo (Purchasing role)
 */
export async function uploadDeliveryProof(
  requestId: string,
  deliveryNotes: string,
  deliveredBy: string,
  deliveryPhotoBase64?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updateData: any = {
      deliveryNotes,
      deliveredBy,
      deliveredAt: new Date().toISOString(),
      status: 'Delivered - Awaiting PM Confirmation',
      updatedAt: new Date().toISOString()
    };

    // Add delivery photo if provided
    if (deliveryPhotoBase64) {
      updateData.deliveryProof = deliveryPhotoBase64;
    }

    await updateDoc(doc(db, 'requests', requestId), updateData);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error completing delivery:', error);
    return { success: false, error: 'Failed to complete delivery' };
  }
}

/**
 * Confirm delivery receipt (Project Manager role)
 * This triggers BOQ deduction when status becomes "Completed - Delivered"
 */
export async function confirmDeliveryReceipt(
  requestId: string,
  confirmedBy: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get the request to check for BOQ reference
    const requestDoc = await getDoc(doc(db, 'requests', requestId));

    if (!requestDoc.exists()) {
      return { success: false, error: 'Request not found' };
    }

    const requestData = requestDoc.data() as MaterialRequest;

    // Update request status to Completed
    await updateDoc(doc(db, 'requests', requestId), {
      status: 'Completed - Delivered',
      confirmedBy,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Deduct BOQ quantity if this request is linked to a BOQ item
    if (requestData.boqItemId) {
      console.log('🔄 Marking BOQ usage as completed for request:', requestId);
      const { success, error } = await deductBOQQuantity(
        requestData.boqItemId,
        requestId
      );

      if (!success && error) {
        console.error('⚠️ BOQ usage update failed:', error);
        // Note: We don't fail the entire confirmation, just log the error
        // The request is still marked as completed
      } else {
        console.log('✅ BOQ usage marked as completed');
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return { success: false, error: 'Failed to confirm delivery' };
  }
}

/**
 * Upload purchase proof as base64 (Purchasing role)
 */
export async function uploadPurchaseProof(
  requestId: string,
  purchaseProofBase64: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Check base64 size (Firestore document max ~1MB)
    const estimatedSize = purchaseProofBase64.length * 0.75; // Rough estimate in bytes
    if (estimatedSize > 500000) { // 500KB limit for safety
      return { success: false, error: 'Foto terlalu besar. Maksimal 500KB setelah kompresi.' };
    }

    await updateDoc(doc(db, 'requests', requestId), {
      purchaseProofBase64,
      purchaseProofUploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error uploading purchase proof:', error);
    return { success: false, error: 'Failed to upload purchase proof' };
  }
}

/**
 * Delete request (soft delete or hard delete)
 */
export async function deleteRequest(requestId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await deleteDoc(doc(db, 'requests', requestId));
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting request:', error);
    return { success: false, error: 'Failed to delete request' };
  }
}

/**
 * Listen to real-time updates for all requests
 */
export function subscribeToRequests(callback: (requests: MaterialRequest[]) => void) {
  const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (querySnapshot) => {
      console.log('📥 Firestore snapshot received:', querySnapshot.docs.length, 'requests');
      console.log('📡 Snapshot metadata - fromCache:', querySnapshot.metadata.fromCache, 'hasPendingWrites:', querySnapshot.metadata.hasPendingWrites);

      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MaterialRequest));

      callback(requests);
    },
    (error) => {
      console.error('❌ Error subscribing to requests:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // ✅ Handle offline mode gracefully
      if (error.code === 'unavailable') {
        console.warn('⚠️ Firestore is offline or unreachable. Will retry when connection is restored.');
      } else if (error.code === 'permission-denied') {
        console.error('🚫 Permission denied. Check Firestore security rules.');
      }
    }
  );
}

/**
 * Listen to real-time updates for user's requests
 */
export function subscribeToUserRequests(userId: string, callback: (requests: MaterialRequest[]) => void) {
  console.log('🔍 Subscribing to user requests for userId:', userId);

  // Simplified query without orderBy to avoid needing composite index
  const q = query(
    collection(db, 'requests'),
    where('requestedById', '==', userId)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      console.log('📥 Query snapshot received, docs count:', querySnapshot.docs.length);
      console.log('📡 Snapshot metadata - fromCache:', querySnapshot.metadata.fromCache, 'hasPendingWrites:', querySnapshot.metadata.hasPendingWrites);

      const requests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Document:', doc.id, 'requestedById:', data.requestedById, 'status:', data.status);
        return {
          id: doc.id,
          ...data
        } as MaterialRequest;
      });

      // Sort by createdAt descending on client side
      requests.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      console.log('✅ Total requests for user (sorted client-side):', requests.length);
      callback(requests);
    },
    (error) => {
      console.error('❌ Error subscribing to user requests:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // ✅ Handle offline mode gracefully
      if (error.code === 'unavailable') {
        console.warn('⚠️ Firestore is offline or unreachable. Will retry when connection is restored.');
      } else if (error.code === 'permission-denied') {
        console.error('🚫 Permission denied. Check Firestore security rules.');
      }
    }
  );
}

/**
 * Request item return to central (Project Manager)
 */
export async function requestItemReturn(
  requestId: string,
  userId: string,
  userName: string,
  returnData: {
    returnedQuantity: number;
    itemCondition: 'Good' | 'Minor Damage' | 'Damaged';
    returnReason?: string;
    returnDate: string;
    returnProofPhotos?: string[]; // ✅ Add photos from PM
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return { success: false, error: 'Request not found' };
    }

    const request = requestSnap.data() as MaterialRequest;

    // Create new return record
    const returnRecord = {
      id: `return_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: requestId,
      itemName: request.itemName,
      returnedQuantity: returnData.returnedQuantity,
      itemCondition: returnData.itemCondition,
      returnReason: returnData.returnReason || '',
      returnDate: returnData.returnDate,
      siteProject: request.siteProject,
      requestedBy: userId,
      requestedByName: userName,
      requestedAt: new Date().toISOString(),
      returnStatus: 'Pending' as const,
      addedBackToBOQ: false,
      boqItemId: request.boqItemId,
      returnProofPhotos: returnData.returnProofPhotos || [] // ✅ Save PM photos
    };

    // Add return record to the request
    const existingReturns = request.returnRecords || [];
    await updateDoc(requestRef, {
      returnRecords: [...existingReturns, returnRecord],
      status: 'Return Requested',
      updatedAt: new Date().toISOString()
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error requesting item return:', error);
    return { success: false, error: 'Failed to submit return request' };
  }
}

/**
 * Accept item return (Purchasing)
 */
export async function acceptItemReturn(
  requestId: string,
  returnRecordId: string,
  handledBy: string,
  handledByName: string,
  notes: string // ✅ Remove proofPhotos parameter - not needed for accept
): Promise<{ success: boolean; error: string | null }> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return { success: false, error: 'Request not found' };
    }

    const request = requestSnap.data() as MaterialRequest;
    const returnRecords = request.returnRecords || [];

    // Find and update the specific return record
    const updatedReturnRecords = returnRecords.map(record => {
      if (record.id === returnRecordId) {
        return {
          ...record,
          returnStatus: 'Accepted' as const,
          handledBy,
          handledByName,
          handledAt: new Date().toISOString(),
          purchasingNotes: notes,
          addedBackToBOQ: record.itemCondition === 'Good' // Only add back if in good condition
        };
      }
      return record;
    });

    // Update the request
    await updateDoc(requestRef, {
      returnRecords: updatedReturnRecords,
      status: 'Returned to Central',
      updatedAt: new Date().toISOString()
    });

    // If item is in good condition and has BOQ reference, add back to inventory
    const acceptedReturn = updatedReturnRecords.find(r => r.id === returnRecordId);
    if (acceptedReturn && acceptedReturn.itemCondition === 'Good' && acceptedReturn.boqItemId) {
      // Import addBackToBOQ function
      const { addBackToBOQ } = await import('./firebaseBOQ');
      await addBackToBOQ(
        acceptedReturn.boqItemId,
        acceptedReturn.returnedQuantity,
        requestId,
        `Return from ${request.siteProject}`
      );
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error accepting return:', error);
    return { success: false, error: 'Failed to accept return' };
  }
}

/**
 * Reject item return (Purchasing)
 */
export async function rejectItemReturn(
  requestId: string,
  returnRecordId: string,
  handledBy: string,
  handledByName: string,
  notes: string,
  rejectionPhotos?: string[] // ✅ Add rejection photos parameter
): Promise<{ success: boolean; error: string | null }> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return { success: false, error: 'Request not found' };
    }

    const request = requestSnap.data() as MaterialRequest;
    const returnRecords = request.returnRecords || [];

    // Find and update the specific return record
    const updatedReturnRecords = returnRecords.map(record => {
      if (record.id === returnRecordId) {
        return {
          ...record,
          returnStatus: 'Rejected' as const,
          handledBy,
          handledByName,
          handledAt: new Date().toISOString(),
          purchasingNotes: notes,
          rejectionPhotos: rejectionPhotos || [] // ✅ Save rejection photos
        };
      }
      return record;
    });

    await updateDoc(requestRef, {
      returnRecords: updatedReturnRecords,
      status: 'Return Rejected',
      updatedAt: new Date().toISOString()
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error rejecting return:', error);
    return { success: false, error: 'Failed to reject return' };
  }
}