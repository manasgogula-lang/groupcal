import { useState, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { router } from 'expo-router';
import { useGroup } from '@/contexts/GroupContext';
import { DayEventsList } from '@/components/DayEventsList';

type MarkedDates = Record<string, any>;

function todayString() {
  return new Date().toISOString().split('T')[0];
}

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

export default function CalendarScreen() {
  const { events, currentGroup, loading } = useGroup();
  const [selectedDate, setSelectedDate] = useState(todayString());

  const markedDates = useMemo<MarkedDates>(() => {
    const map: MarkedDates = {};

    for (const ev of events) {
      const start = ev.date;
      const end = ev.end_date ?? ev.date;
      const color = ev.member_color ?? '#6C63FF';
      const days = datesBetween(start, end);

      days.forEach((d, i) => {
        if (!map[d]) map[d] = { periods: [] };
        map[d].periods = map[d].periods ?? [];
        map[d].periods.push({
          startingDay: i === 0,
          endingDay: i === days.length - 1,
          color,
        });
      });
    }

    if (!map[selectedDate]) map[selectedDate] = {};
    map[selectedDate].selected = true;
    map[selectedDate].selectedColor = '#6C63FF';

    return map;
  }, [events, selectedDate]);

  const dayEvents = useMemo(
    () => events.filter((ev) => {
      const end = ev.end_date ?? ev.date;
      return selectedDate >= ev.date && selectedDate <= end;
    }),
    [events, selectedDate]
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#6C63FF" size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Groups</Text>
        </TouchableOpacity>
        <Text style={styles.groupName}>{currentGroup?.name ?? ''}</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType="multi-period"
        renderArrow={(direction) => (
          <Text style={{ color: '#6C63FF', fontSize: 22, fontWeight: '600', paddingHorizontal: 8 }}>
            {direction === 'left' ? '‹' : '›'}
          </Text>
        )}
        theme={{
          selectedDayBackgroundColor: '#6C63FF',
          todayTextColor: '#6C63FF',
          arrowColor: '#6C63FF',
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
        }}
      />

      <View style={styles.eventsContainer}>
        <DayEventsList date={selectedDate} events={dayEvents} />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/(app)/add-event', params: { date: selectedDate } })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backButton: { minWidth: 70 },
  backText: { fontSize: 16, color: '#6C63FF', fontWeight: '600' },
  groupName: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  settingsIcon: { fontSize: 22, minWidth: 70, textAlign: 'right' },
  eventsContainer: { flex: 1 },
  fab: { position: 'absolute', right: 24, bottom: 36, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', shadowColor: '#6C63FF', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
