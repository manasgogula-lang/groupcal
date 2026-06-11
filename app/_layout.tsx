import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { SessionContext } from '@/contexts/SessionContext';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION with the restored session from storage,
    // which is more reliable than getSession() on web where AsyncStorage reads are async.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleDeepLink = useCallback(async (url: string) => {
    if (url.includes('auth-callback')) {
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      const token_hash = parsed.queryParams?.token_hash as string | undefined;
      const type = parsed.queryParams?.type as string | undefined;

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else if (token_hash && type) {
        await supabase.auth.verifyOtp({ token_hash, type: type as any });
      }
    }

    if (url.includes('join')) {
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      if (code) {
        await AsyncStorage.setItem('pending_invite_code', code);
      }
    }
  }, []);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    return () => sub.remove();
  }, [handleDeepLink]);

  if (session === undefined) return null;

  return (
    <SessionContext.Provider value={session}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </SessionContext.Provider>
  );
}
