-- (รันลง Supabase ให้แล้ว) วิชา 21910-2018 ตารางขึ้นต้น cm21910_
create table if not exists cm21910_students(id text primary key,name text not null,room text not null,password text not null default '789456123',violations int not null default 0,suspended_until timestamptz);
create table if not exists cm21910_submissions(id bigserial primary key,student_id text references cm21910_students(id) on delete cascade,unit int not null,kind text not null check(kind in('read','work','exam')),answers jsonb,score numeric,total int,late boolean not null default false,submitted_at timestamptz not null default now(),comment text,unique(student_id,unit,kind));
-- เปลี่ยนชื่อห้อง: update cm21910_students set room='ชื่อห้อง';
