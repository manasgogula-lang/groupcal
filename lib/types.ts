export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  color: string;
  joined_at: string;
  profile?: Profile;
}

export interface EventAttendee {
  user_id: string;
  display_name: string;
  color?: string;
}

export interface CalendarEvent {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  member_color?: string;
  member_name?: string;
  attendees?: EventAttendee[];
}
