import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/contexts/SessionContext';

export default function SetupNameScreen() {
  const session = useSession()!;
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('Please enter your name'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    router.back();
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>This is how your name appears on events for everyone in your groups.</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          autoFocus
          onSubmitEditing={handleContinue}
          returnKeyType="done"
        />

        <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  inner: { flex: 1, justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 18, color: '#111827', marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
