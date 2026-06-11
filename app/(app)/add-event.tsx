import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { router, useLocalSearchParams } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { useGroup } from '@/contexts/GroupContext';

function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDisplay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function dayCount(start: string, end: string) {
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.round(ms / 86400000) + 1;
}

function addMonths(yyyymmdd: string, delta: number): string {
  const [y, m] = yyyymmdd.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatMonth(yyyymmdd: string): string {
  const [y, m] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function AddEventScreen() {
  const session = useSession()!;
  const { currentGroup, events, addEvent, updateEvent } = useGroup();
  const { date: initialDate, eventId } = useLocalSearchParams<{ date?: string; eventId?: string }>();

  const editingEvent = eventId ? events.find((e) => e.id === eventId) : undefined;
  const isEditing = !!editingEvent;

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string | null>(
    editingEvent?.date ?? initialDate ?? null
  );
  const [endDate, setEndDate] = useState<string | null>(
    editingEvent?.end_date ?? null
  );
  const [title, setTitle] = useState(editingEvent?.title ?? '');
  const [startTime, setStartTime] = useState(
    editingEvent?.start_time ? editingEvent.start_time.slice(0, 5) : ''
  );
  const [notes, setNotes] = useState(editingEvent?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    (editingEvent?.date ?? initialDate ?? today).slice(0, 7) + '-01'
  );

  function handleDayPress(day: DateData) {
    const d = day.dateString;
    if (!startDate || (startDate && endDate)) {
      setStartDate(d);
      setEndDate(null);
    } else {
      if (d < startDate) {
        setStartDate(d);
        setEndDate(null);
      } else if (d === startDate) {
        setEndDate(null);
      } else {
        setEndDate(d);
      }
    }
  }

  const markedDates = useMemo(() => {
    const map: Record<string, any> = {};
    if (!startDate) return map;
    const end = endDate ?? startDate;
    const days = datesBetween(startDate, end);
    days.forEach((d, i) => {
      map[d] = {
        startingDay: i === 0,
        endingDay: i === days.length - 1,
        color: '#6C63FF',
        textColor: '#fff',
      };
    });
    return map;
  }, [startDate, endDate]);

  async function save() {
    if (!title.trim()) { Alert.alert('Add a title'); return; }
    if (!startDate) { Alert.alert('Select a date'); return; }
    if (!currentGroup) { Alert.alert('Error', 'No group selected.'); return; }

    const timeValid = /^\d{2}:\d{2}$/.test(startTime);
    const fields = {
      title: title.trim(),
      date: startDate,
      end_date: endDate && endDate !== startDate ? endDate : null,
      start_time: timeValid ? startTime + ':00' : null,
      end_time: null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    const error = isEditing
      ? await updateEvent(editingEvent!.id, fields)
      : await addEvent({
          group_id: currentGroup.id,
          created_by: session.user.id,
          ...fields,
        });
    setSaving(false);

    if (error) {
      Alert.alert('Could not save event', error);
    } else {
      router.back();
    }
  }

  const days = startDate && endDate ? dayCount(startDate, endDate) : 1;

  return (
    <>
      <Stack.Screen options={{ title: isEditing ? 'Edit Event' : 'Add Event' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What's happening?"
            placeholderTextColor="#9CA3AF"
            autoFocus={!isEditing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Select dates</Text>
          <Text style={styles.hint}>Tap a start date, then tap an end date</Text>
          <View style={styles.calendarWrapper}>
            <View style={styles.monthBar}>
              <TouchableOpacity style={styles.monthButton} onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
                <Text style={styles.monthButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{formatMonth(visibleMonth)}</Text>
              <TouchableOpacity style={styles.monthButton} onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
                <Text style={styles.monthButtonText}>›</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              key={visibleMonth}
              current={visibleMonth}
              onDayPress={handleDayPress}
              onMonthChange={(m) => setVisibleMonth(`${m.year}-${String(m.month).padStart(2, '0')}-01`)}
              markedDates={markedDates}
              markingType="period"
              hideArrows
              renderHeader={() => null}
              theme={{
                selectedDayBackgroundColor: '#6C63FF',
                todayTextColor: '#6C63FF',
                arrowColor: '#6C63FF',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
              }}
            />
          </View>

          {startDate && (
            <View style={styles.dateRange}>
              <Text style={styles.dateRangeText}>
                {formatDisplay(startDate)}
                {endDate && endDate !== startDate ? ` → ${formatDisplay(endDate)}  (${days} days)` : ''}
              </Text>
              <TouchableOpacity onPress={() => { setStartDate(null); setEndDate(null); }}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Start time (optional, HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="14:30"
            placeholderTextColor="#9CA3AF"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any details..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{isEditing ? 'Save changes' : 'Add event'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827' },
  multiline: { height: 90, textAlignVertical: 'top' },
  calendarWrapper: { borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  monthButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEF2FF' },
  monthButtonText: { color: '#6C63FF', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  dateRange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginTop: 10 },
  dateRangeText: { color: '#4338CA', fontWeight: '600', fontSize: 14, flex: 1 },
  clearText: { color: '#9CA3AF', fontSize: 13 },
  button: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
