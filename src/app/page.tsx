'use client';

import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Chat from './pages/Chat';
import { Loader2, MessageSquare } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl mb-6">
            <MessageSquare className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <h2 className="text-xl font-semibold">Loading</h2>
          </div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Chat />;
}