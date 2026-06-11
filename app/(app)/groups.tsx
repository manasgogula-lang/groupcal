import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/contexts/SessionContext';
import { useGroup } from '@/contexts/GroupContext';

export default function GroupsScreen() {
  const session = useSession()!;
  const { allGroups, members, loading, selectGroup } = useGroup();

  useEffect(() => {
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!data?.display_name) router.push('/(app)/setup-name');
      });
  }, []);

  async function openGroup(groupId: string) {
    await selectGroup(groupId);
    router.push('/(app)');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>GroupCal</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(app)/welcome')}>
          <Text style={styles.addButtonText}>+ Group</Text>
        </TouchableOpacity>
      </View>

      {allGroups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptyBody}>Create a group or join one with an invite code.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(app)/welcome')}>
            <Text style={styles.emptyButtonText}>Get started</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionLabel}>Your groups</Text>
          {allGroups.map((group) => (
            <TouchableOpacity key={group.id} style={styles.groupCard} onPress={() => openGroup(group.id)}>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCode}>Code: {group.invite_code}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logo: { fontSize: 28, fontWeight: '800', color: '#6C63FF' },
  addButton: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  addButtonText: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
  list: { padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  groupCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  groupCode: { fontSize: 13, color: '#9CA3AF' },
  arrow: { fontSize: 24, color: '#D1D5DB', fontWeight: '300' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyBody: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emptyButton: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40 },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
