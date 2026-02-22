// Seed default users for testing
// Run this once after Firebase is configured

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase';
import { User, UserRole } from '../types';

const defaultUsers = [
  {
    email: 'PMO01UTT@gmail.com',
    password: 'UTTPMO0937@6^',
    name: 'PMO Manager',
    role: 'PMO' as UserRole,
    siteProject: 'Head Office'
  },
  {
    email: 'PresalesSales001UTT@gmail.com',
    password: 'Sales@presales345289',
    name: 'Sales Representative',
    role: 'Sales/Pre-Sales' as UserRole,
    siteProject: 'Sales Department'
  },
  {
    email: 'Purchasing001UTT@gmail.com',
    password: 'UTTPRCHSING^@UTT0',
    name: 'Purchasing Officer',
    role: 'Purchasing' as UserRole,
    siteProject: 'Procurement Office'
  },
  {
    email: 'adminUTTconfirm@gmail.com',
    password: 'AdminUTT846@536217^',
    name: 'System Administrator',
    role: 'Admin' as UserRole,
    siteProject: 'System Administration'
  },
  {
    email: 'BODDirekturKeuangan002@gmail.com',
    password: 'UTT02#^@653%Finance',
    name: 'Finance Director',
    role: 'BOD Director Finance' as UserRole,
    siteProject: 'Board of Directors'
  },
  {
    email: 'BODSDM%^738@gmail.com',
    password: 'UTT03@&#%SDM32910',
    name: 'HR Director',
    role: 'BOD Director Procurement' as UserRole,
    siteProject: 'Board of Directors'
  },
  {
    email: 'BODdirutUTT001@gmail.com',
    password: 'UTT01@^637291732CEO',
    name: 'Chief Executive Officer',
    role: 'BOD Director' as UserRole,
    siteProject: 'Board of Directors'
  }
];

/**
 * Seed default users to Firebase
 * WARNING: This will create users with default password!
 * Change passwords after first login!
 */
export async function seedDefaultUsers() {
  console.log('🌱 Starting to seed default users...');
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const userData of defaultUsers) {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const user: User = {
        id: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        siteProject: userData.siteProject,
        isApproved: true, // Pre-approved for seed users
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), user);

      results.push({ email: userData.email, success: true });
      console.log(`✅ Created user: ${userData.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        results.push({ 
          email: userData.email, 
          success: false, 
          error: 'Email already exists' 
        });
        console.log(`⚠️  User already exists: ${userData.email}`);
      } else {
        results.push({ 
          email: userData.email, 
          success: false, 
          error: error.message 
        });
        console.error(`❌ Failed to create user: ${userData.email}`, error);
      }
    }
  }

  console.log('\n📊 Seed Results:');
  console.table(results);
  
  console.log('\n⚠️  IMPORTANT: Use the correct password for each user!');
  
  return results;
}

/**
 * Create a single user manually
 */
export async function createSingleUser(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  siteProject: string,
  isApproved: boolean = true
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const user: User = {
      id: firebaseUser.uid,
      name,
      email,
      role,
      siteProject,
      isApproved,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), user);

    console.log(`✅ Successfully created user: ${email}`);
    return { success: true, user };
  } catch (error: any) {
    console.error(`❌ Failed to create user: ${email}`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync existing Firebase Auth user to Firestore
 * This helps when user exists in Authentication but not in Firestore
 */
export async function syncAuthUserToFirestore(
  uid: string,
  email: string,
  name: string,
  role: UserRole,
  isApproved: boolean = true
) {
  try {
    // Check if user already exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      console.log(`⚠️  User already exists in Firestore: ${email}`);
      return { success: true, message: 'User already exists', user: userDoc.data() };
    }

    // Create user document in Firestore
    const user: User = {
      id: uid,
      name,
      email,
      role,
      isApproved,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', uid), user);

    console.log(`✅ Synced user to Firestore: ${email}`);
    return { success: true, message: 'User synced successfully', user };
  } catch (error: any) {
    console.error(`❌ Failed to sync user: ${email}`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user exists in Firestore, if not create it
 * Used for manual admin account that was created via Firebase Console
 */
export async function ensureUserInFirestore(
  uid: string,
  email: string,
  defaultName: string = 'Admin User',
  defaultRole: UserRole = 'Admin'
) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return { success: true, exists: true, user: userDoc.data() };
    }

    // Create missing user document
    const user: User = {
      id: uid,
      name: defaultName,
      email,
      role: defaultRole,
      isApproved: true,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', uid), user);

    console.log(`✅ Created missing Firestore user: ${email}`);
    return { success: true, exists: false, user };
  } catch (error: any) {
    console.error(`❌ Failed to ensure user in Firestore: ${email}`, error);
    return { success: false, error: error.message };
  }
}