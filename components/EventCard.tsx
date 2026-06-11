import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CalendarEvent } from '@/lib/types';
import { useSession } from '@/contexts/SessionContext';
import { useGroup } from '@/contexts/GroupContext';
import { confirm } from '@/lib/confirm';

interface Props {
  event: CalendarEvent;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function EventCard({ event }: Props) {
  const session = useSession();
  const { deleteEvent, toggleAttendance } = useGroup();
  const isOwner = session?.user.id === event.created_by;
  const isMultiDay = event.end_date && event.end_date !== event.date;
  const isAttending = event.attendees?.some((a) => a.user_id === session?.user.id) ?? false;

  function confirmDelete() {
    confirm('Delete event', `Remove "${event.title}"?`, () => deleteEvent(event.id), 'Delete');
  }

  function openEdit() {
    router.push({ pathname: '/(app)/add-event', params: { eventId: event.id } });
  }

  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: event.member_color ?? '#6C63FF' }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.actions}>
            {isOwner && (
              <>
                <TouchableOpacity onPress={openEdit} style={styles.actionBtn}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDelete} style={styles.actionBtn}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <Text style={styles.meta}>
          {event.member_name ?? 'Someone'}
          {isMultiDay
            ? ` · ${formatDate(event.date)} – ${formatDate(event.end_date!)}`
            : event.start_time
            ? ` · ${event.start_time.slice(0, 5)}`
            : ''}
        </Text>

        {event.notes ? <Text style={styles.notes}>{event.notes}</Text> : null}

        {(event.attendees?.length ?? 0) > 0 && (
          <View style={styles.attendeesRow}>
            {event.attendees!.map((a) => (
              <View key={a.user_id} style={styles.attendeeChip}>
                <View style={[styles.dot, { backgroundColor: a.color ?? '#9CA3AF' }]} />
                <Text style={styles.attendeeName}>{a.display_name}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.goingBtn, isAttending && styles.goingBtnActive]}
          onPress={() => toggleAttendance(event.id)}
        >
          <Text style={[styles.goingText, isAttending && styles.goingTextActive]}>
            {isAttending ? '✓ Going' : "I'm going"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  bar: { width: 4 },
  body: { flex: 1, padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  actions: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  actionBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  editText: { color: '#6C63FF', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#D1D5DB', fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  notes: { fontSize: 13, color: '#9CA3AF', marginTop: 2, marginBottom: 4 },
  attendeesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 4 },
  attendeeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  attendeeName: { fontSize: 12, color: '#374151', fontWeight: '500' },
  goingBtn: { marginTop: 10, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  goingBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#6C63FF' },
  goingText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  goingTextActive: { color: '#6C63FF' },
});
