-- Private objects: only the Edge Function service role can access this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('technician-files', 'technician-files', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.technician_files (
 id uuid primary key,
 owner_uid text not null,
 object_path text unique not null,
 file_name text not null,
 content_type text not null,
 download_token_hash text not null,
 reserved_bytes bigint not null default 10485760 check (reserved_bytes between 1 and 10485760),
 completed boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.technician_files enable row level security;
revoke all on public.technician_files from anon, authenticated;
grant all on public.technician_files to service_role;

-- Reserve the bucket's maximum file size before issuing a signed upload URL.
-- This prevents concurrent requests and understated client sizes bypassing quotas.
create or replace function public.reserve_technician_file(p_id uuid, p_uid text, p_path text, p_name text, p_type text, p_hash text)
returns void language plpgsql security definer set search_path = '' as $$
declare total_bytes bigint; user_bytes bigint;
begin
 perform pg_advisory_xact_lock(721982641);
 select coalesce(sum(reserved_bytes),0), coalesce(sum(reserved_bytes) filter(where owner_uid=p_uid),0)
 into total_bytes,user_bytes from public.technician_files;
 if total_bytes+10485760 > 943718400 or user_bytes+10485760 > 104857600 then
  raise exception 'Upload storage limit reached. Contact KBI support.';
 end if;
 insert into public.technician_files(id,owner_uid,object_path,file_name,content_type,download_token_hash)
 values(p_id,p_uid,p_path,p_name,p_type,p_hash);
end; $$;
revoke all on function public.reserve_technician_file(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.reserve_technician_file(uuid,text,text,text,text,text) to service_role;
