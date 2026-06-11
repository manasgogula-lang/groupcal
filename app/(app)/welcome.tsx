import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '@/contexts/SessionContext';
import { useGroup } from '@/contexts/GroupContext';

export default function WelcomeScreen() {
  const session = useSession()!;
  const { createGroup, joinGroup } = useGroup();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('pending_invite_code').then((saved) => {
      if (saved) {
        setCode(saved);
        setTab('join');
        AsyncStorage.removeItem('pending_invite_code');
      }
    });
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    const group = await createGroup(name.trim(), session.user.id);
    setLoading(false);
    if (group) router.back();
    else Alert.alert('Error', 'Could not create group.');
  }

  async function handleJoin() {
    if (!code.trim()) return;
    setLoading(true);
    const group = await joinGroup(code.trim().toLowerCase(), session.user.id);
    setLoading(false);
    if (group) router.back();
    else Alert.alert('Not found', "That invite code doesn't match any group.");
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'create' && styles.tabActive]} onPress={() => setTab('create')}>
            <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>Create group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'join' && styles.tabActive]} onPress={() => setTab('join')}>
            <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>Join group</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {tab === 'create' ? (
            <>
              <Text style={styles.label}>Group name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Weekend Squad"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={handleCreate}
              />
              <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Invite code</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="8-letter code"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                onSubmitEditing={handleJoin}
              />
              <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Join</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  tabs: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827', marginBottom: 16 },
  button: { backgroundColor: '#6C63FF', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
