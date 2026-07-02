'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { INACTIVITY_TIMEOUT_MS } from '@/lib/auth';
import { UserProfile } from '@/types';
import { subscribeUserProfile } from '@/lib/db';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const unsubscribe = subscribeUserProfile(user.uid, setProfile);
    return () => unsubscribe();
  }, [user]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        void logout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

    events.forEach((eventName) => window.addEventListener(eventName, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [logout, user]);

  return useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: Boolean(user),
      logout,
    }),
    [loading, logout, profile, user],
  );
}
