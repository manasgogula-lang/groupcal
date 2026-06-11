import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CalendarEvent } from '@/lib/types';
import { EventCard } from './EventCard';

interface Props {
  date: string;
  events: CalendarEvent[];
}

export function DayEventsList({ date, events }: Props) {
  const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{formatted}</Text>
      {events.length === 0 ? (
        <Text style={styles.empty}>Nothing planned</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  empty: { color: '#9CA3AF', fontSize: 14, marginTop: 8 },
});
