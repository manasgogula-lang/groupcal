import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    // On web, Supabase with detectSessionInUrl:true automatically parses
    // the URL hash/code and fires SIGNED_IN via onAuthStateChange.
    // We just wait for that and redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/(app)');
      }
    });

    // If already signed in (e.g. returning to this page), redirect immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/(app)');
    });

    // Fallback: if nothing happens in 6 seconds, go back to login
    const timeout = setTimeout(() => router.replace('/(auth)/login'), 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C63FF" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  text: { marginTop: 16, fontSize: 16, color: '#6B7280' },
});
