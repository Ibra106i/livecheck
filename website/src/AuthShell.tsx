import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectsProvider } from './context/ProjectsContext';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Layout route for everything that needs a Clerk session. It is lazy-loaded so
 * the marketing page never downloads Clerk, Supabase or the projects store.
 */
export default function AuthShell() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={dark}>
      <AuthProvider>
        <ProjectsProvider>
          <Outlet />
        </ProjectsProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}
