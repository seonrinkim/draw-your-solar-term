-- Van het Seizoen — drawings table
-- Run this once in the Supabase SQL editor for your project.

create table if not exists drawings (
  id uuid primary key default gen_random_uuid(),
  term_slug text not null,
  color text not null,
  svg_paths jsonb not null,
  canvas_width integer not null,
  canvas_height integer not null,
  nickname text not null check (char_length(nickname) <= 40),
  note text not null check (char_length(note) <= 280),
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists drawings_created_at_idx on drawings (created_at desc);
create index if not exists drawings_term_slug_idx on drawings (term_slug);

alter table drawings enable row level security;

-- Public wall: anyone can read submitted drawings.
create policy "drawings are publicly readable"
  on drawings for select
  using (true);

-- Public wall: anyone can submit a drawing (no auth in this app).
-- Consent must be explicitly true to insert.
create policy "anyone can submit a drawing with consent"
  on drawings for insert
  with check (consent = true);

-- No update/delete policies are defined, so submissions are immutable
-- from the client once posted.

-- Enable realtime so new submissions stream to every connected visitor.
alter publication supabase_realtime add table drawings;
