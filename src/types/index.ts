export type UserRole =
  | 'Project Manager'
  | 'PMO'
  | 'Sales/Pre-Sales'
  | 'Purchasing'
  | 'BOD Finance'        // ✅ FIXED: Was "BOD Director Finance"
  | 'BOD Procurement'    // ✅ FIXED: Was "BOD Director Procurement"
  | 'BOD Director'
  | 'Admin';

export type RequestStatus =
  | 'Pending PM Approval'
  | 'Pending PMO Approval'
  | 'Pending Sales Verification'
  | 'Pricing Needed'
  | 'Pending - PMO Review'
  | 'Pending - Sales Verification'
  | 'Pending - Purchasing Pricing'
  | 'Pending - BOD Final Approval'
  | 'Approved - Purchasing Processing'
  | 'Delivered - Awaiting PM Confirmation'
  | 'Completed - Delivered'
  | 'Return Requested'
  | 'Returned to Central'
  | 'Return Rejected'
  | 'Rejected';

export type RequestType = 'Borrowing' | 'Procurement';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteProject?: string;
  phoneNumber?: string;
  isApproved?: boolean;
  createdAt: string;
}

// BOQ (Bill of Quantities) Interface
export interface BOQItem {
  id: string;
  siteProject: string;
  itemName: string;
  specification: string;
  category: RequestType; // Borrowing or Procurement
  totalQuantity: number; // Total quantity from contract
  remainingQuantity: number; // Available quantity (auto-calculated)
  usedQuantity: number; // Total used quantity
  createdBy: string; // User ID who created
  createdByName: string; // User name who created
  createdAt: string;
  updatedAt: string;
  isActive: boolean; // Can be deactivated if no longer needed
}

// BOQ Usage History
export interface BOQUsage {
  id: string;
  boqItemId: string;
  requestId: string;
  siteProject: string;
  itemName: string;
  quantityUsed: number;
  usedBy: string; // User ID
  usedByName: string; // User name
  status: 'Reserved' | 'Completed' | 'Cancelled'; // Tracks if deduction is applied
  createdAt: string;
  completedAt?: string;
}

export interface MaterialRequest {
  id: string;
  requestedById: string; // Changed from projectManagerId
  requestedBy: string; // Changed from projectManagerName
  siteProject: string;
  itemName: string;
  quantity: number;
  description: string;
  requestType: RequestType;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;

  // BOQ Reference (NEW)
  boqItemId?: string; // Link to BOQ item

  // File Uploads by PM (FEATURE 3)
  attachments?: RequestAttachment[]; // Files uploaded by PM when creating request

  // Approval tracking
  pmoApprovedBy?: string;
  pmoApprovedAt?: string;
  pmoRemark?: string; // FEATURE 1: Remark by PMO

  salesApprovedBy?: string;
  salesApprovedAt?: string;
  salesRemark?: string; // FEATURE 1: Remark by Sales/Pre-Sales

  // Purchasing Approval (NEW - for Purchasing stage)
  purchasingApprovedBy?: string;
  purchasingApprovedAt?: string;
  purchasingRemark?: string; // Remark by Purchasing

  // Pricing
  unitPrice?: number;
  totalPrice?: number;
  pricingAddedBy?: string;
  pricingAddedAt?: string;

  // Purchasing Recommendations (FEATURE 2) - ✅ CHANGED TO ARRAY FOR MULTIPLE RECOMMENDATIONS
  purchasingRecommendations?: PurchasingRecommendation[]; // Changed from singular to plural

  // BOD Approval
  bodApprovedBy?: string;
  bodApprovedAt?: string;
  bodRemark?: string; // FEATURE 1: Remark by BOD
  approvedRecommendationId?: string; // ✅ NEW: ID of the recommendation chosen by BOD from multiple options

  // Rejection
  pmoRejectedReason?: string;
  salesRejectedReason?: string;
  bodRejectedReason?: string;
  rejectedBy?: string;
  rejectionReason?: string; // FEATURE 1: Mandatory remark for rejection

  // Delivery
  deliveryProof?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  deliveryNotes?: string;

  // Purchase Proof (base64 encoded image)
  purchaseProofBase64?: string;
  purchaseProofUploadedAt?: string;

  // PM Confirmation
  confirmedBy?: string;
  confirmedAt?: string;

  // Return to Central (NEW FEATURE)
  returnRecords?: ReturnRecord[]; // Array to allow multiple returns/partial returns
}

// FEATURE 3: File Attachment Interface
export interface RequestAttachment {
  id: string;
  fileName: string;
  fileType: string; // 'pdf' | 'docx' | 'xlsx' | 'doc' | 'xls'
  fileSize: number; // in bytes
  fileBase64: string; // Base64 encoded file
  uploadedBy: string; // User ID
  uploadedByName: string;
  uploadedAt: string;
}

// FEATURE 2: Purchasing Recommendation Interface
export interface PurchasingRecommendation {
  id: string; // ✅ Add ID for each recommendation
  itemType: string; // ✅ ADD: Jenis barang (item type)
  estimatedArrival: string; // Waktu tiba (Date string)
  unitPrice: number; // Harga satuan
  totalPrice: number; // Total harga
  paymentTerms: string; // Jangka waktu pembayaran (e.g., "30% DP, 70% after delivery")
  notes?: string;
  createdBy: string; // Purchasing user ID
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  selectedByBod?: boolean;
}

// Return Record Interface (NEW FEATURE)
export interface ReturnRecord {
  id: string;
  requestId: string;
  itemName: string;
  returnedQuantity: number;
  itemCondition: 'Good' | 'Minor Damage' | 'Damaged';
  returnReason?: string;
  returnDate: string;
  siteProject: string;

  // Return request by PM
  requestedBy: string; // PM user ID
  requestedByName: string;
  requestedAt: string;

  // Return handling by Purchasing
  handledBy?: string; // Purchasing user ID
  handledByName?: string;
  handledAt?: string;
  returnStatus: 'Pending' | 'Accepted' | 'Rejected';
  returnProofPhotos?: string[]; // Base64 encoded images (from PM when requesting return)
  rejectionPhotos?: string[]; // ✅ Add: Base64 encoded images (from Purchasing when rejecting)
  purchasingNotes?: string;

  // Inventory impact
  addedBackToBOQ?: boolean; // True if good condition and added back to inventory
  boqItemId?: string; // Reference to BOQ item if applicable
}

export interface Project {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Completed' | 'On Hold';
}