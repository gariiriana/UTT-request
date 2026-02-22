// Firebase Firestore functions for Projects
import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Project } from '../types';

/**
 * Create a new project
 */
export async function createProject(
  data: {
    name: string;
    location: string;
    status: 'Active' | 'Completed' | 'On Hold';
  }
): Promise<{ projectId: string | null; error: string | null }> {
  try {
    const projectData: Omit<Project, 'id'> = {
      ...data
    };

    const docRef = await addDoc(collection(db, 'projects'), projectData);

    return { projectId: docRef.id, error: null };
  } catch (error) {
    console.error('Error creating project:', error);
    return { projectId: null, error: 'Failed to create project' };
  }
}

/**
 * Get all projects (one-time fetch, no auth required)
 * Use this for registration page before user is authenticated
 */
export async function getPublicProjects(): Promise<Project[]> {
  try {
    // For registration page, we'll use hardcoded projects
    // since Firestore requires authentication
    return [
      { id: 'jakarta-dc', name: 'Jakarta Data Center', location: 'Jakarta, Indonesia', status: 'Active' },
      { id: 'singapore-hub', name: 'Singapore Hub', location: 'Singapore', status: 'Active' },
      { id: 'bangkok-office', name: 'Bangkok Office', location: 'Bangkok, Thailand', status: 'Active' },
      { id: 'manila-branch', name: 'Manila Branch', location: 'Manila, Philippines', status: 'Active' }
    ];
  } catch (error) {
    console.error('Error getting public projects:', error);
    return [];
  }
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<Project[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'projects'), orderBy('name', 'asc'))
    );
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
}

/**
 * Get single project by ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const docSnap = await getDoc(doc(db, 'projects', projectId));
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Project;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  data: Partial<Omit<Project, 'id'>>
): Promise<{ success: boolean; error: string | null }> {
  try {
    await updateDoc(doc(db, 'projects', projectId), data);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating project:', error);
    return { success: false, error: 'Failed to update project' };
  }
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}

/**
 * Listen to real-time updates for all projects
 * NOTE: User must be authenticated to subscribe
 * Returns unsubscribe function
 */
export function subscribeToProjects(
  callback: (projects: Project[]) => void,
  onError?: (error: any) => void
): (() => void) {
  const q = query(collection(db, 'projects'), orderBy('name', 'asc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
    
    callback(projects);
  }, (error) => {
    // Silently handle permission errors (expected during logout or unauthenticated state)
    if (error.code === 'permission-denied') {
      // This is expected when user is not authenticated - don't spam console
      // Just return empty array
      callback([]);
      if (onError) onError(error);
    } else {
      // Log other unexpected errors
      console.error('Error subscribing to projects:', error);
      callback([]);
      if (onError) onError(error);
    }
  });

  return unsubscribe;
}

/**
 * Seed default projects (for initial setup)
 * NOTE: User must be authenticated as Admin to seed projects
 */
export async function seedDefaultProjects(): Promise<{ success: boolean; error: string | null }> {
  try {
    const defaultProjects = [
      { id: 'jakarta-dc', name: 'Jakarta Data Center', location: 'Jakarta, Indonesia', status: 'Active' as const },
      { id: 'singapore-hub', name: 'Singapore Hub', location: 'Singapore', status: 'Active' as const },
      { id: 'bangkok-office', name: 'Bangkok Office', location: 'Bangkok, Thailand', status: 'Active' as const },
      { id: 'manila-branch', name: 'Manila Branch', location: 'Manila, Philippines', status: 'Active' as const }
    ];

    // Try to check if projects already exist
    // This will fail with permission-denied if not authenticated
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      if (projectsSnapshot.size >= 4) {
        console.log('✅ Projects already seeded (found', projectsSnapshot.size, 'projects)');
        return { success: true, error: null };
      }
    } catch (readError) {
      // If we can't even read, we definitely can't write
      // Check if it's a permission error
      if (readError instanceof Error && readError.message.includes('permission-denied')) {
        console.error('❌ Cannot read projects - not authenticated as Admin');
        return { 
          success: false, 
          error: 'Admin login required. Please login as admin@uttdc.com first.' 
        };
      }
      // Other errors, continue to try creating
    }

    // Try to create projects
    for (const project of defaultProjects) {
      const { id, ...projectData } = project;
      await setDoc(doc(db, 'projects', id), projectData);
    }

    console.log('✅ Default projects seeded successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error seeding projects:', error);
    if (error instanceof Error && error.message.includes('permission-denied')) {
      return { 
        success: false, 
        error: 'Admin login required. Please login as admin@uttdc.com first.' 
      };
    }
    return { success: false, error: 'Failed to seed projects' };
  }
}