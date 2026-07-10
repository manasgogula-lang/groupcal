import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group, GroupMember, CalendarEvent, EventAttendee, Profile } from '@/lib/types';
import { getNextColor } from '@/lib/colors';
import type { Session } from '@supabase/supabase-js';

interface GroupContextValue {
  allGroups: Group[];
  currentGroup: Group | null;
  members: GroupMember[];
  events: CalendarEvent[];
  loading: boolean;
  selectGroup: (groupId: string) => Promise<void>;
  createGroup: (name: string, userId: string) => Promise<Group | null>;
  joinGroup: (inviteCode: string, userId: string) => Promise<Group | null>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'member_color' | 'member_name' | 'attendees'>) => Promise<string | null>;
  updateEvent: (id: string, fields: { title: string; date: string; end_date: string | null; start_time: string | null; end_time: string | null; notes: string | null }) => Promise<string | null>;
  deleteEvent: (id: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  renameGroup: (groupId: string, name: string) => Promise<string | null>;
  toggleAttendance: (eventId: string) => Promise<void>;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children, session }: { children: React.ReactNode; session: Session }) {
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllGroups();
  }, [session.user.id]);

  useEffect(() => {
    if (!currentGroup) return;
    const channel = supabase
      .channel(`events:${currentGroup.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `group_id=eq.${currentGroup.id}` }, () => {
        if (currentGroup) loadEvents(currentGroup.id, members);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentGroup?.id]);

  async function loadAllGroups() {
    setLoading(true);
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', session.user.id)
      .order('joined_at', { ascending: true });

    if (!memberRows?.length) { setLoading(false); return; }

    const groupIds = memberRows.map((m) => m.group_id);
    const { data: groupsData } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);

    const groups = groupsData ?? [];
    setAllGroups(groups);

    if (groups.length > 0) {
      const loadedMembers = await loadMembers(groups[0].id);
      await loadEvents(groups[0].id, loadedMembers);
      setCurrentGroup(groups[0]);
    }
    setLoading(false);
  }

  async function selectGroup(groupId: string) {
    const group = allGroups.find((g) => g.id === groupId) ?? null;
    if (!group) return;
    setCurrentGroup(group);
    const loadedMembers = await loadMembers(groupId);
    await loadEvents(groupId, loadedMembers);
  }

  async function loadMembers(groupId: string): Promise<GroupMember[]> {
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id, user_id, color, joined_at')
      .eq('group_id', groupId);

    if (!memberRows?.length) { setMembers([]); return []; }

    const userIds = memberRows.map((m) => m.user_id);
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', userIds);

    const enriched: GroupMember[] = memberRows.map((m) => ({
      ...m,
      profile: (profileRows ?? []).find((p) => p.id === m.user_id) as Profile | undefined,
    }));

    setMembers(enriched);
    return enriched;
  }

  async function loadEvents(groupId: string, currentMembers: GroupMember[]) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: true });

    const eventIds = (data ?? []).map((e) => e.id);
    let attendeeMap: Record<string, { user_id: string }[]> = {};
    if (eventIds.length > 0) {
      const { data: attendeeRows } = await supabase
        .from('event_attendees')
        .select('event_id, user_id')
        .in('event_id', eventIds);
      for (const row of (attendeeRows ?? [])) {
        if (!attendeeMap[row.event_id]) attendeeMap[row.event_id] = [];
        attendeeMap[row.event_id].push({ user_id: row.user_id });
      }
    }

    const enriched: CalendarEvent[] = (data ?? []).map((ev) => {
      const member = currentMembers.find((m) => m.user_id === ev.created_by);
      const profile = member?.profile as Profile | undefined;
      const attendees: EventAttendee[] = (attendeeMap[ev.id] ?? []).map((a) => {
        const m = currentMembers.find((m) => m.user_id === a.user_id);
        const p = m?.profile as Profile | undefined;
        return {
          user_id: a.user_id,
          display_name: p?.display_name ?? p?.email ?? 'Someone',
          color: m?.color,
        };
      });
      return {
        ...ev,
        end_date: ev.end_date ?? null,
        member_color: member?.color,
        member_name: profile?.display_name ?? profile?.email ?? 'Someone',
        attendees,
      };
    });

    setEvents(enriched);
  }

  async function createGroup(name: string, userId: string): Promise<Group | null> {
    const { data: newGroup, error } = await supabase
      .from('groups')
      .insert({ name, created_by: userId })
      .select()
      .single();

    if (error || !newGroup) {
      console.error('createGroup error:', error?.message);
      return null;
    }

    await supabase.from('group_members').insert({
      group_id: newGroup.id,
      user_id: userId,
      color: getNextColor([]),
    });

    setAllGroups((prev) => [...prev, newGroup]);
    setCurrentGroup(newGroup);
    const loadedMembers = await loadMembers(newGroup.id);
    await loadEvents(newGroup.id, loadedMembers);
    return newGroup;
  }

  async function joinGroup(inviteCode: string, userId: string): Promise<Group | null> {
    const { data: targetGroup, error } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (error || !targetGroup) return null;

    const { data: existingMembers } = await supabase
      .from('group_members')
      .select('color')
      .eq('group_id', targetGroup.id);

    const usedColors = (existingMembers ?? []).map((m) => m.color);

    await supabase.from('group_members').upsert({
      group_id: targetGroup.id,
      user_id: userId,
      color: getNextColor(usedColors),
    });

    setAllGroups((prev) => prev.find((g) => g.id === targetGroup.id) ? prev : [...prev, targetGroup]);
    setCurrentGroup(targetGroup);
    const loadedMembers = await loadMembers(targetGroup.id);
    await loadEvents(targetGroup.id, loadedMembers);
    return targetGroup;
  }

  async function addEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'member_color' | 'member_name' | 'attendees'>): Promise<string | null> {
    const { error } = await supabase.from('events').insert(event);
    if (error) return error.message;
    if (currentGroup) await loadEvents(currentGroup.id, members);
    return null;
  }

  async function updateEvent(
    id: string,
    fields: { title: string; date: string; end_date: string | null; start_time: string | null; end_time: string | null; notes: string | null }
  ): Promise<string | null> {
    const { error } = await supabase.from('events').update(fields).eq('id', id);
    if (error) return error.message;
    if (currentGroup) await loadEvents(currentGroup.id, members);
    return null;
  }

  async function deleteEvent(id: string) {
    await supabase.from('events').delete().eq('id', id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function leaveGroup(groupId: string): Promise<void> {
    await supabase.from('group_members').delete()
      .eq('group_id', groupId)
      .eq('user_id', session.user.id);
    const newGroups = allGroups.filter((g) => g.id !== groupId);
    setAllGroups(newGroups);
    if (currentGroup?.id === groupId) {
      if (newGroups.length > 0) {
        const loadedMembers = await loadMembers(newGroups[0].id);
        await loadEvents(newGroups[0].id, loadedMembers);
        setCurrentGroup(newGroups[0]);
      } else {
        setCurrentGroup(null);
        setMembers([]);
        setEvents([]);
      }
    }
  }

  async function renameGroup(groupId: string, name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return 'Name cannot be empty';
    const { error } = await supabase.from('groups').update({ name: trimmed }).eq('id', groupId);
    if (error) return error.message;
    setAllGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: trimmed } : g));
    setCurrentGroup((prev) => prev?.id === groupId ? { ...prev, name: trimmed } : prev);
    return null;
  }

  async function toggleAttendance(eventId: string): Promise<void> {
    const userId = session.user.id;
    const event = events.find((e) => e.id === eventId);
    const isAttending = event?.attendees?.some((a) => a.user_id === userId) ?? false;

    // Optimistic update
    setEvents((prev) => prev.map((e) => {
      if (e.id !== eventId) return e;
      const current = e.attendees ?? [];
      if (isAttending) {
        return { ...e, attendees: current.filter((a) => a.user_id !== userId) };
      }
      const member = members.find((m) => m.user_id === userId);
      const profile = member?.profile as Profile | undefined;
      const newAttendee: EventAttendee = {
        user_id: userId,
        display_name: profile?.display_name ?? profile?.email ?? 'You',
        color: member?.color,
      };
      return { ...e, attendees: [...current, newAttendee] };
    }));

    if (isAttending) {
      await supabase.from('event_attendees').delete()
        .eq('event_id', eventId).eq('user_id', userId);
    } else {
      await supabase.from('event_attendees').insert({ event_id: eventId, user_id: userId });
    }
  }

  return (
    <GroupContext.Provider value={{ allGroups, currentGroup, members, events, loading, selectGroup, createGroup, joinGroup, addEvent, updateEvent, deleteEvent, leaveGroup, renameGroup, toggleAttendance }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used inside GroupProvider');
  return ctx;
}
