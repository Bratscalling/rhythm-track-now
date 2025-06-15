
import { useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('rhythmtrack_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('rhythmtrack_user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (email: string, name: string) => {
    // Use email as the consistent user identifier
    const userId = btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '');
    
    // Check if user already exists
    const existingUsersKey = 'rhythmtrack_all_users';
    const existingUsers = JSON.parse(localStorage.getItem(existingUsersKey) || '{}');
    
    let user: User;
    
    if (existingUsers[email.toLowerCase()]) {
      // User exists, load their data
      user = existingUsers[email.toLowerCase()];
      // Update name in case it changed
      user.name = name;
      user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&size=128`;
    } else {
      // New user, create account
      user = {
        id: userId,
        email: email.toLowerCase(),
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&size=128`
      };
    }

    // Save user to the all users registry
    existingUsers[email.toLowerCase()] = user;
    localStorage.setItem(existingUsersKey, JSON.stringify(existingUsers));

    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });

    localStorage.setItem('rhythmtrack_user', JSON.stringify(user));
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    localStorage.removeItem('rhythmtrack_user');
  };

  return {
    ...authState,
    login,
    logout,
  };
};
