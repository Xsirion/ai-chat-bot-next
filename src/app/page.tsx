'use client';

import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Chat from './pages/Chat';

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <Chat />;
}