import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  email: string;
  name: string;
  profilePicture: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_EMAIL = "test@example.com";
const MOCK_PASSWORD = "password123";
const DEFAULT_USER: User = {
  email: MOCK_EMAIL,
  name: "Test User",
  profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      const storedUser = isClient ? localStorage.getItem("userProfile") : null;
      const userData = storedUser ? JSON.parse(storedUser) : DEFAULT_USER;
      setUser(userData);
      if (isClient) {
        localStorage.setItem("user", JSON.stringify(userData));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    if (isClient) {
      localStorage.removeItem("user");
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      if (isClient) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("userProfile", JSON.stringify(updatedUser));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
