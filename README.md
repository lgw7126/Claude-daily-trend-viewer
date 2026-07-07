# 📊 데일리 트렌드 뷰어

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/lgw7126/Claude-daily-trend-viewer)

버튼을 클릭하면 본인 Netlify 계정으로 이 저장소가 바로 배포되어 앱이 실행됩니다 (Supabase 연동 전에는 샘플 데이터로 동작).

유튜브 · 틱톡 · 인스타그램 · 스레드 · 트위터(X) 트렌드를 **매일 자동 수집**해서 한 페이지에서 보여주는 웹앱입니다.

```
Apify (5개 플랫폼 수집) → Supabase (데이터 누적) → 정적 웹앱 (Netlify 배포)
                ↑ GitHub Actions 가 매일 07:00 KST 에 실행
```

키를 아직 설정하지 않아도 **샘플 데이터 모드**로 바로 동작하므로, 배포 후 화면부터 확인할 수 있습니다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `public/` | 트렌드 뷰어 웹앱 (정적 HTML/CSS/JS, 빌드 불필요) |
| `scripts/collect-trends.mjs` | Apify 액터 실행 → 결과 정규화 → Supabase upsert |
| `scripts/build-config.mjs` | Netlify 빌드 시 환경변수로 `public/config.js` 생성 |
| `supabase/schema.sql` | `trends` 테이블 + RLS 정책 |
| `.github/workflows/daily-collect.yml` | 매일 07:00 KST 자동 수집 cron |

## 설정 순서

### 1. Supabase 데이터베이스 준비
1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. **SQL Editor** 에 `supabase/schema.sql` 내용을 붙여넣고 실행
3. **Settings → API** 에서 세 가지 값을 확보: `Project URL`, `anon` 키(읽기·공개용), `service_role` 키(쓰기·비공개)

### 2. 트렌드 데이터 수집 (Apify 5개 플랫폼)
1. [apify.com](https://apify.com) 가입 후 API 토큰 발급 (Settings → Integrations)
2. 기본 액터: `streamers/youtube-scraper`, `clockworks/tiktok-scraper`, `apify/instagram-hashtag-scraper`, `curious_coder/threads-scraper`, `apidojo/tweet-scraper`
   — 일부는 유료 렌탈이 필요할 수 있습니다. Apify 스토어에서 원하는 액터로 바꾸려면 `YOUTUBE_ACTOR` 같은 환경변수로 교체하고, 입력 스키마가 다르면 `YOUTUBE_INPUT` 에 JSON 을 직접 지정하세요.
3. 수동 실행 테스트:
   ```bash
   cp .env.example .env   # 값 채우기
   set -a; source .env; set +a
   npm run collect
   ```

### 3. 매일 자동 수집 (GitHub Actions)
저장소 **Settings → Secrets and variables → Actions** 에 등록:
- Secrets: `APIFY_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Variables(선택): `TREND_KEYWORDS`(쉼표 구분), `MAX_ITEMS_PER_PLATFORM`

매일 07:00 KST 에 자동 실행되며, **Actions 탭 → 매일 트렌드 수집 → Run workflow** 로 즉시 실행할 수도 있습니다.

### 4. Netlify 배포
1. Netlify 에서 **Add new site → Import from Git** 으로 이 저장소 연결 (`netlify.toml` 이 빌드 설정을 자동 지정)
2. **Site settings → Environment variables** 에 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 등록
   - 등록하지 않으면 샘플 데이터 모드로 배포됩니다. `service_role` 키는 **절대** 넣지 마세요.
3. 배포 URL 접속 → 데이터 표시 확인

## 로컬 미리보기

```bash
npm run dev   # http://localhost:3000
```

## 뷰어 기능
- 플랫폼 필터 칩 (전체 / 유튜브 / 틱톡 / 인스타 릴스 / 스레드 / 트위터)
- 키워드 검색 (제목·작성자·수집 키워드)
- 정렬: 조회수순 · 좋아요순 · 최신순
- 날짜 선택으로 과거 수집분 조회 (데이터는 Supabase 에 매일 누적)
