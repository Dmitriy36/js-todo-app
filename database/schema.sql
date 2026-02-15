create table todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  position integer not null default 0,
  text text not null,
  completed boolean not null default false,
  subtasks jsonb not null default '[]',
  created_at timestamp with time zone default now()
);

create index todos_user_id_idx on todos(user_id);
create index todos_position_idx on todos(user_id, position);

alter table todos enable row level security;

create policy "Users can read their own todos"
  on todos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own todos"
  on todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on todos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on todos for delete
  using (auth.uid() = user_id);