-- 데일리 트렌드 뷰어: Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

create table if not exists public.trends (
  id bigint generated always as identity primary key,
  platform text not null,            -- youtube | tiktok | instagram | threads | twitter
  item_id text not null,             -- 플랫폼별 고유 ID (중복 수집 방지용)
  title text,
  url text,
  thumbnail_url text,
  author text,
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  posted_at timestamptz,
  keyword text,                      -- 수집에 사용한 검색 키워드
  collected_date date not null default current_date,
  collected_at timestamptz not null default now(),
  unique (platform, item_id, collected_date)
);

create index if not exists trends_date_platform_idx
  on public.trends (collected_date desc, platform);

-- RLS: 누구나 읽기 가능, 쓰기는 service_role 키로만
alter table public.trends enable row level security;

drop policy if exists "public read" on public.trends;
create policy "public read"
  on public.trends for select
  using (true);
