// Firebase Authentication functions
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole } from '../types';
import { detectRoleFromEmail, fixUserRole } from './fixUserRoles';

/**
 * Register a new user (Project Manager only)
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  siteProject: string,
  phoneNumber: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    console.log('📝 Attempting registration for:', email);
    
    // Check if auth is initialized
    if (!auth) {
      console.error('❌ Firebase Auth not initialized');
      return { user: null, error: 'Firebase belum siap. Refresh halaman dan coba lagi.' };
    }
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Firebase auth user created:', firebaseUser.uid);

    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
      name,
      email,
      role: 'Project Manager' as UserRole,
      siteProject,
      phoneNumber,
      isApproved: false, // ✅ Pending admin approval
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ User document created in Firestore');
      console.log('📊 User data:', userData);
    } catch (firestoreError) {
      console.error('❌ Firestore document creation failed:', firestoreError);
      
      // ⚠️ CLEANUP: Delete the Firebase Auth user since Firestore failed
      console.log('🗑️ Cleaning up: Deleting Firebase Auth user...');
      await firebaseUser.delete();
      console.log('✅ Cleanup complete');
      
      return { 
        user: null, 
        error: 'Pendaftaran gagal saat menyimpan data. Silakan coba lagi.' 
      };
    }

    // ✅ IMPORTANT: Sign out user immediately after registration
    // User must wait for approval before they can login
    await firebaseSignOut(auth);
    console.log('✅ User signed out - waiting for admin approval');

    return { user: userData, error: null };
  } catch (error: any) {
    console.error('❌ Registration error:', error.code || 'Unknown error');
    
    let errorMessage = 'Pendaftaran gagal. Silakan coba lagi.';
    
    if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau login. Jika Anda yakin email belum terdaftar, hubungi admin untuk bantuan.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Format email tidak valid.';
    }
    
    return { user: null, error: errorMessage };
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    console.log('🔑 Attempting login for:', email);
    
    // Check if auth is initialized
    if (!auth) {
      console.error('❌ Firebase Auth not initialized');
      return { user: null, error: 'Firebase belum siap. Refresh halaman dan coba lagi.' };
    }
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Firebase auth successful:', firebaseUser.uid);

    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.log('🔄 Auto-Sync: User exists in Authentication but not in Firestore');
      console.log('✅ Creating Firestore document automatically...');
      
      // Auto-create user document in Firestore
      // Detect role from email
      let defaultRole: UserRole = 'Project Manager'; // Default
      
      if (email.toLowerCase().includes('pmo')) {
        defaultRole = 'PMO';
      } else if (email.toLowerCase().includes('sales') || email.toLowerCase().includes('presales')) {
        defaultRole = 'Sales/Pre-Sales';
      } else if (email.toLowerCase().includes('purchasing')) {
        defaultRole = 'Purchasing';
      } else if (email.toLowerCase().includes('boddirektur') || email.toLowerCase().includes('bodkeuangan')) {
        defaultRole = 'BOD Finance';
      } else if (email.toLowerCase().includes('bodsdm')) {
        defaultRole = 'BOD Procurement';
      } else if (email.toLowerCase().includes('boddirut') || email.toLowerCase().includes('ceo')) {
        defaultRole = 'BOD Director';
      }
      
      const newUserData: User = {
        id: firebaseUser.uid,
        name: email.split('@')[0], // Use email prefix as default name
        email: firebaseUser.email!,
        role: defaultRole,
        isApproved: true, // Auto-approve for existing auth users
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
      console.log('✅ Auto-Sync Complete! User created with role:', defaultRole);
      console.log('📊 User data:', newUserData);
      
      return { user: newUserData, error: null };
    }

    const userData = { ...userDoc.data(), id: userDoc.id } as User;
    console.log('✅ User data loaded:', userData.email, 'Role:', userData.role, 'Approved:', userData.isApproved);
    
    // ✅ CHECK APPROVAL STATUS - BLOCK LOGIN IF NOT APPROVED
    if (!userData.isApproved) {
      console.log('⚠️ Login blocked: User not approved');
      // Sign out the user immediately
      await firebaseSignOut(auth);
      return { 
        user: null, 
        error: 'Akun Anda sedang menunggu persetujuan admin. Silakan coba lagi nanti.' 
      };
    }
    
    // Auto-fix role if it's wrong (based on email)
    const correctRole = detectRoleFromEmail(userData.email);
    if (userData.role !== correctRole) {
      console.log('🔧 Role Mismatch Detected!');
      console.log('   Current role:', userData.role);
      console.log('   Correct role should be:', correctRole);
      console.log('   Auto-fixing role...');
      
      const fixResult = await fixUserRole(firebaseUser.uid);
      if (fixResult.fixed) {
        console.log('✅ Role fixed:', fixResult.oldRole, '→', fixResult.newRole);
        // Return updated user data with correct role
        userData.role = correctRole;
      }
    }

    return { user: userData, error: null };
  } catch (error: any) {
    console.error('❌ Login error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    let errorMessage = 'Login gagal. Silakan coba lagi.';
    
    if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = '❌ Email atau Password Salah\n\n' +
                     '💡 Tips:\n' +
                     '• Periksa ejaan email dengan teliti\n' +
                     '• Password bersifat case-sensitive (huruf besar/kecil berbeda)\n' +
                     '• Pastikan Caps Lock tidak aktif\n' +
                     '• Gunakan "Forgot Password" jika lupa password\n' +
                     '• Project Manager: Klik "Forgot Password" untuk reset\n' +
                     '• Staff (PMO/Sales/BOD): Hubungi admin di 0857-2337-5324';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Format email tidak valid. Gunakan format: nama@example.com';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '⚠️ Terlalu banyak percobaan login gagal.\n\nAkun diblokir sementara untuk keamanan.\nCoba lagi dalam 15-30 menit.\n\nAtau reset password untuk akses langsung.';
    }
    
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log('✅ User signed out');
  } catch (error) {
    console.error('❌ Sign out error:', error);
    throw error;
  }
}

/**
 * Get current user from Firestore
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return null;
    }

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    return { ...userDoc.data(), id: userDoc.id } as User;
  } catch (error) {
    console.error('❌ Get current user error:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = { ...userDoc.data(), id: userDoc.id } as User;
          
          // Auto-fix role if it's wrong (based on email)
          const correctRole = detectRoleFromEmail(userData.email);
          if (userData.role !== correctRole) {
            console.log('🔧 Auto-fixing role in onAuthStateChange...');
            const fixResult = await fixUserRole(firebaseUser.uid);
            if (fixResult.fixed) {
              console.log('✅ Role fixed:', fixResult.oldRole, '→', fixResult.newRole);
              userData.role = correctRole;
            }
          }
          
          callback(userData);
        } else {
          // Auto-create missing Firestore user
          console.log('🔄 Auto-Sync (onAuthStateChange): User in Auth, creating in Firestore...');
          
          // Detect role from email
          let defaultRole: UserRole = 'Project Manager'; // Default
          const email = firebaseUser.email?.toLowerCase() || '';
          
          if (email.includes('pmo')) {
            defaultRole = 'PMO';
          } else if (email.includes('sales') || email.includes('presales')) {
            defaultRole = 'Sales/Pre-Sales';
          } else if (email.includes('purchasing')) {
            defaultRole = 'Purchasing';
          } else if (email.includes('boddirektur') || email.includes('bodkeuangan')) {
            defaultRole = 'BOD Finance';
          } else if (email.includes('bodsdm')) {
            defaultRole = 'BOD Procurement';
          } else if (email.includes('boddirut') || email.includes('ceo')) {
            defaultRole = 'BOD Director';
          }
          
          const newUserData: User = {
            id: firebaseUser.uid,
            name: firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email!,
            role: defaultRole,
            isApproved: true,
            createdAt: new Date().toISOString()
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
          console.log('✅ Auto-Sync Complete! User created with role:', defaultRole);
          
          callback(newUserData);
        }
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log('🔑 Attempting to reset password for:', email);
    
    // Check if auth is initialized
    if (!auth) {
      console.error('❌ Firebase Auth not initialized');
      return { success: false, error: 'Firebase belum siap. Refresh halaman dan coba lagi.' };
    }
    
    console.log('📧 Sending password reset email...');
    console.log('   Email:', email);
    
    // Send password reset email (Firebase will use default settings)
    await sendPasswordResetEmail(auth, email);
    
    console.log('✅ Password reset email sent successfully!');
    console.log('📬 Please check:');
    console.log('   1. Inbox');
    console.log('   2. Spam/Junk folder');
    console.log('   3. May take 1-5 minutes to arrive');
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    let errorMessage = 'Gagal mengirim email reset password. Silakan coba lagi.';
    
    if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'Email tidak terdaftar sebagai Project Manager.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Format email tidak valid.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Terlalu banyak permintaan. Tunggu beberapa menit dan coba lagi.';
    }
    
    return { success: false, error: errorMessage };
  }
}