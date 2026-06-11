import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView, Alert, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useGroup } from '@/contexts/GroupContext';
import { useSession } from '@/contexts/SessionContext';


export default function SettingsScreen() {
  const { currentGroup, members, leaveGroup } = useGroup();
  const session = useSession();
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [session]);

  async function saveDisplayName() {
    if (!session || !displayName.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', session.user.id);
    setSavingName(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Saved', 'Your display name has been updated.');
  }

  async function shareInvite() {
    if (!currentGroup) return;
    await Share.share({
      message: `Join my group "${currentGroup.name}" on GroupCal!\n\nInvite code: ${currentGroup.invite_code}`,
      title: 'Join my GroupCal',
    });
  }

  async function confirmLeaveGroup() {
    if (!currentGroup) return;
    Alert.alert(
      'Leave group',
      `Leave "${currentGroup.name}"? You'll need a new invite code to rejoin.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await leaveGroup(currentGroup.id);
            router.replace('/(app)/groups');
          },
        },
      ]
    );
  }

  async function signOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>Your profile</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Display name</Text>
          <Text style={styles.hint}>This is how your name appears on events</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={saveDisplayName}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveDisplayName} disabled={savingName}>
              {savingName ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveButtonText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {currentGroup && (
          <>
            <Text style={styles.sectionTitle}>Group</Text>
            <View style={styles.card}>
              <Text style={styles.groupName}>{currentGroup.name}</Text>
              <Text style={styles.inviteLabel}>Invite code</Text>
              <Text style={styles.inviteCode}>{currentGroup.invite_code}</Text>
              <TouchableOpacity style={styles.shareButton} onPress={shareInvite}>
                <Text style={styles.shareButtonText}>Share invite link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveButton} onPress={confirmLeaveGroup}>
                <Text style={styles.leaveButtonText}>Leave group</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Members</Text>
            <View style={styles.card}>
              {members.map((m) => (
                <View key={m.user_id} style={styles.member}>
                  <View style={[styles.colorDot, { backgroundColor: m.color }]} />
                  <Text style={styles.memberName}>
                    {(m.profile as any)?.display_name ?? (m.profile as any)?.email ?? 'Unknown'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.joinAnother} onPress={() => router.push('/(app)/welcome')}>
          <Text style={styles.joinAnotherText}>+ Join or create another group</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 2 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  nameRow: { flexDirection: 'row', gap: 8 },
  nameInput: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
  saveButton: { backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  groupName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
  inviteLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 },
  inviteCode: { fontSize: 22, fontWeight: '800', color: '#6C63FF', letterSpacing: 3, marginVertical: 8 },
  shareButton: { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  leaveButton: { borderWidth: 1.5, borderColor: '#FCA5A5', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  leaveButtonText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  shareButtonText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
  member: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  memberName: { fontSize: 15, color: '#374151', flex: 1 },
  joinAnother: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  joinAnotherText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  signOut: { marginTop: 12, borderWidth: 1.5, borderColor: '#FCA5A5', borderRadius: 12, padding: 16, alignItems: 'center' },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
