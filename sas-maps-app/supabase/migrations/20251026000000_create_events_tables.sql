// Create profiles table for user search
create table public.profiles (
  id uuid references auth.users(id) primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

// Set up RLS policies for profiles
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

// Create a trigger to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

// Create events table
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  date timestamp with time zone not null,
  location text not null,
  description text,
  host_id uuid references auth.users(id) not null,
  max_participants integer not null,
  current_participants integer default 1 not null,
  invite_link text unique not null,
  link_expiry timestamp with time zone not null
);

// Set up RLS policies for events
alter table public.events enable row level security;

create policy "Users can read all events"
  on public.events for select
  using (true);

create policy "Users can create their own events"
  on public.events for insert
  with check (auth.uid() = host_id);

create policy "Hosts can update their own events"
  on public.events for update
  using (auth.uid() = host_id);

create policy "Hosts can delete their own events"
  on public.events for delete
  using (auth.uid() = host_id);

// Create event invites table
create table public.event_invites (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references public.events(id) on delete cascade not null,
  email text not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending' not null,
  unique(event_id, email)
);

// Set up RLS policies for invites
alter table public.event_invites enable row level security;

create policy "Users can read invites for their events"
  on public.event_invites for select
  using (
    exists (
      select 1 from public.events
      where events.id = event_invites.event_id
      and events.host_id = auth.uid()
    )
  );

create policy "Users can create invites for their events"
  on public.event_invites for insert
  with check (
    exists (
      select 1 from public.events
      where events.id = event_invites.event_id
      and events.host_id = auth.uid()
    )
  );

create policy "Users can update invites for their events"
  on public.event_invites for update
  using (
    exists (
      select 1 from public.events
      where events.id = event_invites.event_id
      and events.host_id = auth.uid()
    )
  );

// Create function to check event capacity
create or replace function check_event_capacity()
returns trigger as $$
begin
  if exists (
    select 1 from public.events
    where id = new.event_id
    and current_participants >= max_participants
    and new.status = 'accepted'
  ) then
    raise exception 'Event has reached maximum capacity';
  end if;
  
  if new.status = 'accepted' then
    update public.events
    set current_participants = current_participants + 1
    where id = new.event_id;
  end if;
  
  return new;
end;
$$ language plpgsql;

// Create trigger for checking capacity
create trigger check_capacity
before insert or update on public.event_invites
for each row
execute function check_event_capacity();