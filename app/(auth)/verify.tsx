import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resending, setResending] = useState(false);

  async function resend() {
    if (!email) return;
    setResending(true);
    const redirectTo = makeRedirectUri({ scheme: 'groupcal', path: 'auth-callback' });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setResending(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Sent!', 'Check your inbox again.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📬</Text>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.body}>
        We sent a magic link to{'\n'}
        <Text style={styles.email}>{email}</Text>
      </Text>
      <Text style={styles.instruction}>
        Tap the link in the email to sign in. You can close this screen.
      </Text>

      <TouchableOpacity style={styles.resend} onPress={resend} disabled={resending}>
        {resending ? <ActivityIndicator color="#6C63FF" /> : <Text style={styles.resendText}>Resend link</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>Use a different email</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 12 },
  body: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  email: { fontWeight: '700', color: '#374151' },
  instruction: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 40 },
  resend: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 16 },
  resendText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
  back: { color: '#9CA3AF', fontSize: 14 },
});
