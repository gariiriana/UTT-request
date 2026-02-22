// Fix user roles that were created with wrong role detection
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../types';

/**
 * Detect correct role from email address
 */
export function detectRoleFromEmail(email: string): UserRole {
  const emailLower = email.toLowerCase();
  
  // Check for PMO
  if (emailLower.includes('pmo')) {
    return 'PMO';
  }
  
  // Check for Sales/Pre-Sales
  if (emailLower.includes('sales') || emailLower.includes('presales')) {
    return 'Sales/Pre-Sales';
  }
  
  // Check for Purchasing
  if (emailLower.includes('purchasing')) {
    return 'Purchasing';
  }
  
  // Check for BOD Finance (multiple patterns)
  if (emailLower.includes('bodfinance') || 
      emailLower.includes('bodkeuangan') || 
      emailLower.includes('boddirekturkeuangan') ||
      emailLower.includes('bod-finance') ||
      emailLower.includes('bod.finance')) {
    return 'BOD Finance';
  }
  
  // Check for BOD Procurement (HR/SDM)
  if (emailLower.includes('bodprocurement') || 
      emailLower.includes('bodsdm') ||
      emailLower.includes('bod-procurement') ||
      emailLower.includes('bod.procurement')) {
    return 'BOD Procurement';
  }
  
  // Check for BOD Director (CEO)
  if (emailLower.includes('boddirector') || 
      emailLower.includes('boddirut') || 
      emailLower.includes('ceo') ||
      emailLower.includes('bod-director') ||
      emailLower.includes('bod.director')) {
    return 'BOD Director';
  }
  
  // Default: Project Manager
  return 'Project Manager';
}

/**
 * Fix user role if it was created with wrong role
 * This automatically corrects roles based on email
 */
export async function fixUserRole(userId: string): Promise<{
  fixed: boolean;
  oldRole?: UserRole;
  newRole?: UserRole;
  error?: string;
}> {
  try {
    console.log('🔧 Checking user role for:', userId);
    
    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.error('❌ User document not found');
      return { fixed: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const currentRole = userData.role as UserRole;
    const email = userData.email as string;
    
    console.log('📧 Email:', email);
    console.log('🏷️ Current role:', currentRole);
    
    // Detect correct role from email
    const correctRole = detectRoleFromEmail(email);
    console.log('✅ Correct role should be:', correctRole);
    
    // Check if role needs fixing
    if (currentRole === correctRole) {
      console.log('✅ Role is already correct! No fix needed.');
      return { fixed: false };
    }
    
    // Update role
    console.log('🔧 Fixing role:', currentRole, '→', correctRole);
    await updateDoc(doc(db, 'users', userId), {
      role: correctRole,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Role fixed successfully!');
    
    return {
      fixed: true,
      oldRole: currentRole,
      newRole: correctRole
    };
  } catch (error: any) {
    console.error('❌ Error fixing user role:', error);
    return { fixed: false, error: error.message };
  }
}