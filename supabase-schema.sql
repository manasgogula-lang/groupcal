-- Drop everything and start clean
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_group_ids() CASCADE;
DROP FUNCTION IF EXISTS public.is_group_member(uuid) CASCADE;

-- Profiles
CREATE TABLE public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  updated_at timestamptz default now()
);

-- Groups
CREATE TABLE public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  invite_code text unique default lower(substr(md5(random()::text), 1, 8)),
  created_at timestamptz default now()
);

-- Group members
CREATE TABLE public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  color text not null,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Events
CREATE TABLE public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  title text not null,
  date date not null,
  end_date date,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is a member of a group
-- SECURITY DEFINER so it runs without RLS (no recursion risk)
CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$;

-- Profiles: users can read all profiles, manage their own
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Groups: any authenticated user can read and create
CREATE POLICY "groups_select" ON public.groups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "groups_insert" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups_update" ON public.groups
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Group members: open SELECT (avoids recursive policy), users manage their own rows
CREATE POLICY "gm_select" ON public.group_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gm_insert" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "gm_delete" ON public.group_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Events: group members can read/write, creators can delete
CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated USING (public.is_group_member(group_id));
CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated WITH CHECK (
    created_by = auth.uid() AND public.is_group_member(group_id)
  );
CREATE POLICY "events_delete" ON public.events
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Event attendees (people who mark themselves as "going")
CREATE TABLE IF NOT EXISTS public.event_attendees (
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (event_id, user_id)
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Only group members can see who is attending events in their groups
CREATE POLICY "ea_select" ON public.event_attendees
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND public.is_group_member(e.group_id)
    )
  );
CREATE POLICY "ea_insert" ON public.event_attendees
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ea_delete" ON public.event_attendees
  FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendees;

-- Allow event creators to update their own events
CREATE POLICY IF NOT EXISTS "events_update" ON public.events
  FOR UPDATE TO authenticated USING (created_by = auth.uid());
