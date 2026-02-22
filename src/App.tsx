import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { LoginPageDark } from './components/LoginPageDark';
import { RegisterPageDark } from './components/RegisterPageDark';
import { PMDashboard } from './components/pages/PMDashboard';
import { HistoryPage } from './components/pages/HistoryPage';
import { MainLayout } from './components/MainLayout';
import { WaitingApprovalPage } from './components/WaitingApprovalPage';
import { RequestDetailPage } from './components/pages/RequestDetailPage';
import { ApprovalsPage } from './components/pages/ApprovalsPage';
import { PricingPage } from './components/pages/PricingPage';
import { RecommendationsPage } from './components/pages/RecommendationsPage';
import { CompleteDeliveryPage } from './components/pages/CompleteDeliveryPage';
import { ConfirmDeliveryPage } from './components/pages/ConfirmDeliveryPage';
import { CreateRequest } from './components/pages/CreateRequest';
import { CreateRequestFromBOQ } from './components/pages/CreateRequestFromBOQ';
import { BOQManagement } from './components/pages/BOQManagement';
import { FinanceDashboard } from './components/pages/FinanceDashboard';
import { UploadPurchaseProofPage } from './components/pages/UploadPurchaseProofPage';
import { HandleReturnsPage } from './components/pages/HandleReturnsPage';
import type { User, MaterialRequest, RequestStatus, Project } from './types';
import {
  loginUser,
  registerUser,
  signOut,
  onAuthStateChange
} from './lib/firebaseAuth';
import {
  createRequest,
  updateRequestStatus,
  addPricingToRequest,
  addPurchasingRecommendation,
  uploadDeliveryProof,
  confirmDeliveryReceipt,
  uploadPurchaseProof,
  subscribeToRequests,
  subscribeToUserRequests,
  requestItemReturn,
  acceptItemReturn,
  rejectItemReturn
} from './lib/firebaseRequests';
import {
  subscribeToProjects,
  getPublicProjects
} from './lib/firebaseProjects';
import { getFriendlyDisplayName } from './lib/displayNameUtils';

type Page =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'create-request'
  | 'create-request-boq'
  | 'boq-management'
  | 'my-requests'
  | 'history'
  | 'approvals'
  | 'pricing'
  | 'recommendations'
  | 'purchase-proof'
  | 'upload-proof'
  | 'confirm-delivery'
  | 'request-detail'
  | 'waiting-approval'
  | 'handle-returns'
  | 'finance';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [error, setError] = useState<string>('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [previousRequests, setPreviousRequests] = useState<MaterialRequest[]>([]);
  const isInitialMount = useRef(true);
  const [, setIsOnline] = useState(navigator.onLine);

  // ✅ Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network status: ONLINE');
      setIsOnline(true);
      toast.success('Koneksi internet kembali normal', { duration: 3000 });
    };

    const handleOffline = () => {
      console.warn('⚠️ Network status: OFFLINE');
      setIsOnline(false);
      toast.warning('Koneksi internet terputus. Beberapa fitur mungkin tidak tersedia.', { duration: 5000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
      setAuthInitialized(true);

      // ✅ DO NOT auto-navigate - let explicit login/register handle navigation
      // This prevents auto-login after registration
      if (isInitialMount.current) {
        if (user) {
          // User is authenticated but we don't auto-navigate
          // Let the login flow handle navigation based on approval status
          console.log('🔐 User authenticated:', user.email, 'Approved:', user.isApproved);

          // ✅ CRITICAL: If user is not approved, force to waiting-approval page
          if (!user.isApproved) {
            console.log('⚠️ User not approved - redirect to waiting-approval');
            setCurrentPage('waiting-approval');
          }
          // ✅ If approved, stay on login page - let handleLogin navigate
        } else {
          // No user - show login page
          setCurrentPage('login');
        }
        isInitialMount.current = false;
      }
    });

    return () => unsubscribe();
  }, []); // Keep empty dependency array - only run once on mount

  // Subscribe to requests (real-time updates)
  useEffect(() => {
    if (!currentUser || !currentUser.isApproved) return;

    console.log('👤 Current user:', currentUser.email, 'ID:', currentUser.id, 'Role:', currentUser.role);

    let unsubscribe: (() => void) | undefined;

    if (currentUser.role === 'Project Manager') {
      // Project Manager sees only their requests
      console.log('🔑 Subscribing to PM requests for user ID:', currentUser.id);
      unsubscribe = subscribeToUserRequests(currentUser.id, (userRequests) => {
        console.log('✅ Received requests for PM:', userRequests.length);
        setRequests(userRequests);
      });
    } else {
      // Other roles see all requests
      console.log('🔑 Subscribing to all requests (non-PM role)');
      unsubscribe = subscribeToRequests((allRequests) => {
        console.log('✅ Received all requests:', allRequests.length);
        setRequests(allRequests);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Subscribe to projects (real-time updates)
  useEffect(() => {
    // Only subscribe to projects if user is authenticated AND approved
    if (!currentUser || !currentUser.isApproved || !authInitialized) {
      // Clear projects when user logs out or not approved
      setProjects([]);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;
    let subscribed = false;
    let hasErrored = false; // Track if subscription has failed

    // Small delay to ensure auth token is ready
    const timeoutId = setTimeout(() => {
      // Double check user still exists before subscribing
      if (isMounted && currentUser && currentUser.isApproved && !subscribed && !hasErrored) {
        try {
          console.log('📂 Subscribing to projects...');
          unsubscribe = subscribeToProjects((projectList) => {
            if (isMounted) {
              console.log('✅ Projects loaded:', projectList.length);
              setProjects(projectList);
            }
          }, (error) => {
            // Error callback
            console.error('❌ Projects subscription error:', error);
            hasErrored = true; // Prevent retry loop
            if (isMounted) {
              setProjects([]); // Set empty array on error
              // Only show error toast once
              if (!hasErrored) {
                toast.error('Failed to load projects. Using default projects.', { duration: 3000 });
              }
              // Use default/hardcoded projects as fallback
              setProjects([
                { id: 'jakarta-dc', name: 'Jakarta Data Center', location: 'Jakarta, Indonesia', status: 'Active' },
                { id: 'singapore-hub', name: 'Singapore Hub', location: 'Singapore', status: 'Active' },
                { id: 'bangkok-office', name: 'Bangkok Office', location: 'Bangkok, Thailand', status: 'Active' },
                { id: 'manila-branch', name: 'Manila Branch', location: 'Manila, Philippines', status: 'Active' }
              ]);
            }
          });
          subscribed = true;
        } catch (err) {
          console.error('❌ Failed to subscribe to projects:', err);
          hasErrored = true;
          setProjects([
            { id: 'jakarta-dc', name: 'Jakarta Data Center', location: 'Jakarta, Indonesia', status: 'Active' },
            { id: 'singapore-hub', name: 'Singapore Hub', location: 'Singapore', status: 'Active' },
            { id: 'bangkok-office', name: 'Bangkok Office', location: 'Bangkok, Thailand', status: 'Active' },
            { id: 'manila-branch', name: 'Manila Branch', location: 'Manila, Philippines', status: 'Active' }
          ]);
          toast.error('Using default projects.', { duration: 3000 });
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      subscribed = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [currentUser, authInitialized]);

  // Load public projects for registration page (no auth required)
  useEffect(() => {
    if (!currentUser && currentPage === 'register') {
      getPublicProjects().then(setProjects);
    }
  }, [currentUser, currentPage]);

  // Real-time notification system for requests changes
  useEffect(() => {
    if (!currentUser || !currentUser.isApproved || requests.length === 0) return;

    // Skip on first load
    if (previousRequests.length === 0) {
      setPreviousRequests(requests);
      return;
    }

    // Helper function to send notification
    const sendNotification = (title: string, body: string) => {
      // Toast notification (in-app notification only)
      toast.info(title, {
        description: body,
        duration: 5000,
      });
    };

    // Check for new requests (for non-PM roles)
    if (currentUser.role !== 'Project Manager') {
      const newRequests = requests.filter(
        req => !previousRequests.find(prev => prev.id === req.id)
      );

      newRequests.forEach(req => {
        // Filter requests relevant to user role
        let isRelevant = false;

        if (currentUser.role === 'PMO' && req.status === 'Pending - PMO Review') {
          isRelevant = true;
        } else if (currentUser.role === 'Sales/Pre-Sales' && req.status === 'Pending - Sales Verification') {
          isRelevant = true;
        } else if (currentUser.role === 'Purchasing' && (
          req.status === 'Pending - Purchasing Pricing' ||
          req.status === 'Approved - Purchasing Processing'
        )) {
          isRelevant = true;
        } else if (
          ['BOD Finance', 'BOD Procurement', 'BOD Director'].includes(currentUser.role) &&
          req.status === 'Pending - BOD Final Approval'
        ) {
          isRelevant = true;
        }

        if (isRelevant) {
          sendNotification(
            '📥 Request Baru Masuk',
            `${req.itemName} - ${req.quantity} unit dari ${req.requestedBy}`
          );
        }
      });
    }

    // Check for status changes (for PM and everyone)
    requests.forEach(req => {
      const prevReq = previousRequests.find(prev => prev.id === req.id);

      if (prevReq && prevReq.status !== req.status) {
        // Notification for Project Manager (their request status changed)
        if (currentUser.role === 'Project Manager' && req.requestedById === currentUser.id) {
          if (req.status === 'Rejected') {
            sendNotification(
              '❌ Request Ditolak',
              `Request Anda "${req.itemName}" telah ditolak${req.rejectedBy ? ` oleh ${req.rejectedBy}` : ''}. Alasan: ${req.rejectionReason || 'Tidak ada alasan'}`
            );
          } else if (req.status === 'Completed - Delivered') {
            sendNotification(
              '✅ Request Selesai',
              `Request Anda "${req.itemName}" telah selesai!`
            );
          } else if (req.status.includes('Approved')) {
            sendNotification(
              '✅ Request Disetujui',
              `Request Anda "${req.itemName}" disetujui${req.bodApprovedBy ? ` oleh BOD: ${req.bodApprovedBy}` : ''}. Status: ${req.status}`
            );
          } else if (req.status.includes('Pending')) {
            sendNotification(
              '🔄 Status Update',
              `Request "${req.itemName}" telah masuk ke tahap: ${req.status}`
            );
          } else if (req.status === 'Delivered - Awaiting PM Confirmation') {
            sendNotification(
              '📦 Konfirmasi Delivery',
              `Material "${req.itemName}" telah dikirim. Harap konfirmasi penerimaan!`
            );
          }
        }

        // Notification for BOD roles - when another BOD approves/rejects
        if (['BOD Finance', 'BOD Procurement', 'BOD Director'].includes(currentUser.role)) {
          // BOD Approval notification - notify other BODs
          if (prevReq.status === 'Pending - BOD Final Approval' &&
            req.status === 'Approved - Purchasing Processing' &&
            req.bodApprovedBy &&
            req.bodApprovedBy !== currentUser.name) {
            sendNotification(
              '✅ BOD Approval',
              `${req.bodApprovedBy} telah menyetujui request "${req.itemName}" - Rp ${req.totalPrice?.toLocaleString('id-ID')}`
            );
          }

          // BOD Rejection notification - notify other BODs
          if (prevReq.status === 'Pending - BOD Final Approval' &&
            req.status === 'Rejected' &&
            req.rejectedBy &&
            req.rejectedBy !== currentUser.name) {
            sendNotification(
              '❌ BOD Rejection',
              `${req.rejectedBy} telah menolak request "${req.itemName}". Alasan: ${req.rejectionReason || 'Tidak ada alasan'}`
            );
          }
        }

        // Notification for Purchasing when BOD approves
        if (currentUser.role === 'Purchasing' &&
          prevReq.status === 'Pending - BOD Final Approval' &&
          req.status === 'Approved - Purchasing Processing') {
          sendNotification(
            '✅ BOD Approved - Ready for Processing',
            `Request "${req.itemName}" telah disetujui BOD${req.bodApprovedBy ? ` oleh ${req.bodApprovedBy}` : ''}. Silakan proses pembelian.`
          );
        }

        // Notification for other roles when request enters their queue
        if (currentUser.role === 'PMO' && req.status === 'Pending - PMO Review' && prevReq.status !== req.status) {
          sendNotification(
            '📋 Request Menunggu Review PMO',
            `Request "${req.itemName}" dari ${req.requestedBy} menunggu approval Anda`
          );
        } else if (currentUser.role === 'Sales/Pre-Sales' && req.status === 'Pending - Sales Verification' && prevReq.status !== req.status) {
          sendNotification(
            '📋 Request Menunggu Verifikasi Sales',
            `Request "${req.itemName}" dari ${req.requestedBy} menunggu verifikasi Anda`
          );
        } else if (currentUser.role === 'Purchasing') {
          if (req.status === 'Pending - Purchasing Pricing' && prevReq.status !== req.status) {
            sendNotification(
              '💰 Request Menunggu Pricing',
              `Request "${req.itemName}" dari ${req.requestedBy} menunggu pricing Anda`
            );
          } else if (req.status === 'Approved - Purchasing Processing' && prevReq.status !== req.status) {
            sendNotification(
              '📦 Request Disetujui BOD',
              `Request "${req.itemName}" telah disetujui BOD, silakan proses pengiriman`
            );
          }
        }
      }
    });

    // Update previous requests
    setPreviousRequests(requests);
  }, [requests, currentUser, previousRequests]);

  // Handle Login with Firebase
  const handleLogin = async (email: string, password: string) => {
    setError('');
    setLoading(true);

    try {
      const { user, error } = await loginUser(email, password);

      if (error) {
        setError(error);
        toast.error(error, { duration: 5000 });
      } else if (user) {
        // ✅ Login successful - check if user is approved
        if (user.isApproved) {
          toast.success('Login successful!', { duration: 5000 });
          setCurrentPage('dashboard'); // ✅ Redirect to dashboard ONLY if approved
        } else {
          // This should never happen because loginUser() already blocks unapproved users
          toast.error('Akun Anda sedang menunggu persetujuan admin.');
          setCurrentPage('waiting-approval');
        }
      }
    } catch (err) {
      const errorMsg = 'Login failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // Handle Register with Firebase (Project Manager only)
  const handleRegister = async (
    name: string,
    email: string,
    password: string,
    siteProject: string,
    phoneNumber: string
  ) => {
    setError('');
    setLoading(true);

    try {
      const { user, error } = await registerUser(email, password, name, siteProject, phoneNumber);

      if (error) {
        setError(error);
        toast.error(error);
      } else if (user) {
        // ✅ Registration successful - user is signed out automatically
        // ✅ Redirect to waiting-approval page
        toast.success('Akun berhasil dibuat! Menunggu persetujuan admin.', { duration: 5000 });
        setCurrentPage('waiting-approval'); // ✅ Manually set to waiting page
        // Pass the registered user data to show in waiting page
        setCurrentUser(user); // ✅ Set user (even though not logged in) to show data
      }
    } catch (err) {
      const errorMsg = 'Registration failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout with Firebase
  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      setRequests([]);
      setCurrentPage('login');
      toast.info('Logged out successfully');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  // Create Material Request
  const handleCreateRequest = async (data: {
    siteProject: string;
    itemName: string;
    quantity: number;
    description: string;
    requestType: 'Procurement' | 'Borrowing';
    boqItemId?: string; // ✅ Add BOQ Item ID parameter
    attachments?: any[]; // ✅ Add attachments parameter
  }) => {
    if (!currentUser) return;

    setLoading(true);

    console.log('📝 [handleCreateRequest] Received data:', data);

    // ✅ Update attachments with current user info
    const updatedAttachments = data.attachments?.map(att => ({
      ...att,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name
    }));

    try {
      const { requestId, error } = await createRequest(
        currentUser.id,
        currentUser.name,
        {
          ...data,
          attachments: updatedAttachments // ✅ Pass updated attachments
        }
      );

      if (error) {
        toast.error(error);
      } else if (requestId) {
        toast.success('Request created successfully!');
        setCurrentPage('history');
      }
    } catch (err) {
      toast.error('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  // Approve Request
  const handleApprove = async (requestId: string, remark?: string) => { // ✅ Add remark parameter
    if (!currentUser) return;

    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    let newStatus: RequestStatus = request.status;
    const approvalData: any = {};

    // Determine new status based on current role and request status
    if (currentUser.role === 'PMO' && request.status === 'Pending - PMO Review') {
      newStatus = 'Pending - Sales Verification';
      approvalData.pmoApprovedBy = currentUser.name;
      approvalData.pmoApprovedAt = new Date().toISOString();
      if (remark) approvalData.pmoRemark = remark; // ✅ Save PMO remark
    } else if (currentUser.role === 'Sales/Pre-Sales' && request.status === 'Pending - Sales Verification') {
      // For Borrowing, skip pricing and go directly to BOD approval
      // For Procurement, go to Purchasing for pricing
      if (request.requestType === 'Borrowing') {
        newStatus = 'Pending - BOD Final Approval';
      } else {
        newStatus = 'Pending - Purchasing Pricing';
      }
      approvalData.salesApprovedBy = currentUser.name;
      approvalData.salesApprovedAt = new Date().toISOString();
      if (remark) approvalData.salesRemark = remark; // ✅ Save Sales remark
    } else if (
      currentUser.role === 'Purchasing' &&
      request.status === 'Pending - Purchasing Pricing'
    ) {
      // ✅ FIX: Add Purchasing approval logic
      newStatus = 'Pending - BOD Final Approval';
      approvalData.purchasingApprovedBy = currentUser.name;
      approvalData.purchasingApprovedAt = new Date().toISOString();
      if (remark) approvalData.purchasingRemark = remark; // ✅ Save Purchasing remark
    } else {
      toast.warning('No approval action available for this request');
      return;
    }

    setLoading(true);

    try {
      const { success, error } = await updateRequestStatus(requestId, newStatus, approvalData);

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Request approved!');
      }
    } catch (err) {
      toast.error('Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: BOD Approve with Recommendation Selection
  const handleBODApprove = async (requestId: string, recommendationId?: string, remark?: string) => {
    if (!currentUser) return;

    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    if (!['BOD Finance', 'BOD Procurement', 'BOD Director'].includes(currentUser.role)) {
      toast.warning('You do not have permission to perform BOD approval');
      return;
    }

    if (request.status !== 'Pending - BOD Final Approval') {
      toast.warning('This request is not pending BOD approval');
      return;
    }

    setLoading(true);

    try {
      const approvalData: any = {
        bodApprovedBy: currentUser.name,
        bodApprovedAt: new Date().toISOString(),
      };

      if (remark) approvalData.bodRemark = remark;

      // ✅ Update recommendations array to mark selected one
      if (recommendationId && request.purchasingRecommendations) {
        const updatedRecommendations = request.purchasingRecommendations.map(rec => ({
          ...rec,
          selectedByBod: rec.id === recommendationId
        }));
        approvalData.purchasingRecommendations = updatedRecommendations;
        approvalData.approvedRecommendationId = recommendationId;

        // ✅ Update unitPrice and totalPrice from selected recommendation
        const selectedRec = updatedRecommendations.find(rec => rec.selectedByBod);
        if (selectedRec) {
          approvalData.unitPrice = selectedRec.unitPrice;
          approvalData.totalPrice = selectedRec.totalPrice;
        }
      }

      const { success, error } = await updateRequestStatus(
        requestId,
        'Approved - Purchasing Processing',
        approvalData
      );

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Request approved by BOD!');
      }
    } catch (err) {
      toast.error('Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  // Reject Request
  const handleReject = async (requestId: string, reason: string) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      // Get the request to check if it has BOQ item
      const request = requests.find(r => r.id === requestId);

      // If request is from BOQ, cancel the BOQ usage first
      if (request?.boqItemId) {
        const { cancelBOQUsage } = await import('./lib/firebaseBOQ');
        const { error: cancelError } = await cancelBOQUsage(
          requestId,
          request.boqItemId
        );

        if (cancelError) {
          console.error('Failed to cancel BOQ usage:', cancelError);
          // Continue with rejection even if BOQ cancel fails
        }
      }

      const rejectionData: any = {
        rejectedBy: currentUser.name,
        rejectionReason: reason
      };

      const { success, error } = await updateRequestStatus(
        requestId,
        'Rejected',
        rejectionData
      );

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.error('Request rejected');
      }
    } catch (err) {
      toast.error('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  // Add Pricing (Purchasing role)
  const handleAddPricing = async (requestId: string, unitPrice: number, totalPrice: number) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      const { success, error } = await addPricingToRequest(requestId, unitPrice, totalPrice);

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Pricing added successfully!');
      }
    } catch (err) {
      toast.error('Failed to add pricing');
    } finally {
      setLoading(false);
    }
  };

  // Add Purchasing Recommendation (Purchasing role - FEATURE 2)
  const handleAddRecommendation = async (requestId: string, recommendation: any) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      const { success, error } = await addPurchasingRecommendation(
        requestId,
        currentUser.id,
        currentUser.name,
        recommendation
      );

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Recommendation added successfully!');
      }
    } catch (err) {
      toast.error('Failed to add recommendation');
    } finally {
      setLoading(false);
    }
  };

  // Complete Delivery (Purchasing role)
  const handleCompleteDelivery = async (requestId: string, notes: string, deliveryPhotoBase64?: string) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      const { success, error } = await uploadDeliveryProof(
        requestId,
        notes,
        currentUser.name,
        deliveryPhotoBase64
      );

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Delivery completed! Awaiting PM confirmation.');
      }
    } catch (err) {
      toast.error('Failed to complete delivery');
    } finally {
      setLoading(false);
    }
  };

  // Upload Purchase Proof (Purchasing role)
  const handleUploadPurchaseProof = async (requestId: string, base64Image: string) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      const { success, error } = await uploadPurchaseProof(requestId, base64Image);

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Foto bukti pembelian berhasil di-upload!');
      }
    } catch (err) {
      toast.error('Failed to upload purchase proof');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Delivery Receipt (Project Manager role)
  const handleConfirmDelivery = async (requestId: string) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      const { success, error } = await confirmDeliveryReceipt(
        requestId,
        currentUser.name
      );

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Delivery receipt confirmed!');
      }
    } catch (err) {
      toast.error('Failed to confirm delivery receipt');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Request Item Return (Project Manager)
  const handleRequestReturn = async (
    requestId: string,
    returnData: {
      returnedQuantity: number;
      itemCondition: 'Good' | 'Minor Damage' | 'Damaged';
      returnReason?: string;
      returnDate: string;
      returnProofPhotos?: string[]; // ✅ Add photos
    }
  ) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      const { success, error } = await requestItemReturn(
        requestId,
        currentUser.id,
        currentUser.name,
        returnData
      );

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Return request submitted successfully!');
      }
    } catch (err) {
      toast.error('Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Accept Item Return (Purchasing)
  const handleAcceptReturn = async (
    requestId: string,
    returnRecordId: string,
    notes: string
  ) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      const { success, error } = await acceptItemReturn(
        requestId,
        returnRecordId,
        currentUser.id,
        currentUser.name,
        notes
      );

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success('Return accepted! Item added back to inventory.');
      }
    } catch (err) {
      toast.error('Failed to accept return');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Reject Item Return (Purchasing)
  const handleRejectReturn = async (
    requestId: string,
    returnRecordId: string,
    notes: string,
    rejectionPhotos?: string[]
  ) => {
    if (!currentUser) return;

    setLoading(true);

    try {
      const { success, error } = await rejectItemReturn(
        requestId,
        returnRecordId,
        currentUser.id,
        currentUser.name,
        notes,
        rejectionPhotos
      );

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.warning('Return request rejected');
      }
    } catch (err) {
      toast.error('Failed to reject return');
    } finally {
      setLoading(false);
    }
  };

  // Navigate between pages
  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  // View Request Details
  const handleViewDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
    setCurrentPage('request-detail');
  };

  // Show loading while checking auth
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render login/register pages
  if (!currentUser) {
    if (currentPage === 'register') {
      return (
        <>
          <RegisterPageDark
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentPage('login')}
            projects={projects}
            error={error}
          />
          <Toaster position="bottom-right" richColors />
        </>
      );
    }

    return (
      <>
        <LoginPageDark
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentPage('register')}
          error={error}
        />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  // ✅ CRITICAL: Check approval status BEFORE rendering any pages
  // If user is not approved, ALWAYS show waiting-approval page
  if (currentUser && !currentUser.isApproved) {
    return (
      <>
        <WaitingApprovalPage user={currentUser} onLogout={handleLogout} />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  // Render waiting approval page (legacy - kept for explicit navigation)
  if (currentPage === 'waiting-approval') {
    return (
      <>
        <WaitingApprovalPage user={currentUser} onLogout={handleLogout} />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  // Render main application pages
  const renderPage = () => {
    const userRequests = currentUser.role === 'Project Manager'
      ? requests.filter(r => r.requestedById === currentUser.id)
      : requests;

    switch (currentPage) {
      case 'dashboard':
        // Render appropriate dashboard based on role
        // All users including BOD see PMDashboard on main dashboard
        return <PMDashboard requests={userRequests} userName={getFriendlyDisplayName(currentUser.name, currentUser.role)} userRole={currentUser.role} onViewDetails={handleViewDetails} />;

      case 'create-request':
        return (
          <CreateRequest
            userSiteProject={currentUser.siteProject || ''}
            onSubmit={handleCreateRequest}
            projects={projects}
          />
        );

      case 'create-request-boq':
        return (
          <CreateRequestFromBOQ
            userSiteProject={currentUser.siteProject || ''}
            onSubmit={handleCreateRequest}
          />
        );

      case 'boq-management':
        return (
          <BOQManagement
            userId={currentUser.id}
            userName={currentUser.name}
          />
        );

      case 'my-requests':
      case 'history':
        return (
          <HistoryPage
            requests={userRequests}
            onViewDetails={handleViewDetails}
            showAllRequests={currentPage === 'history'}
            userRole={currentUser?.role}
          />
        );

      case 'approvals':
        return (
          <ApprovalsPage
            requests={requests}
            userRole={currentUser.role}
            onApprove={handleApprove}
            onBODApprove={handleBODApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        );

      case 'finance':
        // Finance Dashboard for BOD roles
        return <FinanceDashboard requests={requests} />;

      case 'pricing':
        return <PricingPage requests={requests} onAddPricing={handleAddPricing} />;

      case 'recommendations':
        return <RecommendationsPage requests={requests} onAddRecommendation={handleAddRecommendation} onApprove={handleApprove} onReject={handleReject} onViewDetails={handleViewDetails} />;

      case 'purchase-proof':
        return <UploadPurchaseProofPage requests={requests} onUploadProof={handleUploadPurchaseProof} onCompleteDelivery={handleCompleteDelivery} />;

      case 'upload-proof':
        return <CompleteDeliveryPage requests={requests} onCompleteDelivery={handleCompleteDelivery} />;

      case 'confirm-delivery':
        return <ConfirmDeliveryPage requests={requests} onConfirmDelivery={handleConfirmDelivery} />;

      case 'request-detail':
        const request = requests.find(r => r.id === selectedRequestId);
        if (!request) {
          setCurrentPage('dashboard');
          return null;
        }
        return <RequestDetailPage request={request} onBack={() => setCurrentPage('history')} userRole={currentUser.role} onRequestReturn={handleRequestReturn} />;

      case 'handle-returns':
        return <HandleReturnsPage requests={requests} onAcceptReturn={handleAcceptReturn} onRejectReturn={handleRejectReturn} onViewDetails={handleViewDetails} />;

      default:
        return <PMDashboard requests={userRequests} userName={currentUser.name} onViewDetails={handleViewDetails} />;
    }
  };

  return (
    <>
      <MainLayout
        user={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {renderPage()}
      </MainLayout>
      <Toaster position="bottom-right" richColors />
    </>
  );
}