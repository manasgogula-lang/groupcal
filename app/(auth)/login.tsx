import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    if (!email.trim()) return;
    setLoading(true);

    const redirectTo = makeRedirectUri({ scheme: 'groupcal', path: 'auth-callback' });

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>GroupCal</Text>
        <Text style={styles.tagline}>Shared calendars for your group</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Your email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={sendMagicLink}
          />
          <TouchableOpacity style={styles.button} onPress={sendMagicLink} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send magic link</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>We'll email you a link — no password needed.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 36, fontWeight: '800', color: '#6C63FF', textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827', marginBottom: 16 },
  button: { backgroundColor: '#6C63FF', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
});
