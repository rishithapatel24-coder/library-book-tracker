-- Library Book Tracker schema
-- Run in Supabase Dashboard -> SQL Editor -> New query.
create extension if not exists pgcrypto;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title varchar(180) not null check (length(trim(title)) > 0),
  author varchar(120) not null check (length(trim(author)) > 0),
  isbn varchar(20) unique,
  category varchar(80),
  published_year integer check (published_year is null or published_year between 1000 and 2100),
  status varchar(20) not null default 'available' check (status in ('available', 'borrowed')),
  borrower_name varchar(120),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint borrowing_fields_consistent check (
    (status = 'available' and borrower_name is null and due_date is null)
    or (status = 'borrowed' and borrower_name is not null and due_date is not null)
  )
);

create index if not exists books_status_idx on public.books(status);
create index if not exists books_title_idx on public.books using gin (to_tsvector('simple', title));
create index if not exists books_author_idx on public.books(author);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_updated_at on public.books;
create trigger books_updated_at before update on public.books
for each row execute function public.set_updated_at();

-- RLS is enabled. The app accesses this table only through the Node server's
-- service-role key, which bypasses RLS; never expose that key to the browser.
-- Do not grant anonymous browser access to this table.
alter table public.books enable row level security;

-- Optional starter rows: uncomment to add demo records once.
-- insert into public.books (title, author, isbn, category, published_year) values
-- ('Atomic Habits', 'James Clear', '9780735211292', 'Self-help', 2018),
-- ('The Alchemist', 'Paulo Coelho', '9780061122415', 'Fiction', 1988),
-- ('Clean Code', 'Robert C. Martin', '9780132350884', 'Programming', 2008);
