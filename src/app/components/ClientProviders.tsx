'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from './ui/toaster';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
