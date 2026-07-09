# 📊 데일리 트렌드 뷰어

### 👉 [**여기 클릭하면 바로 실행됩니다**](https://capable-otter-9cbe27.netlify.app)

유튜브 · 틱톡 · 인스타그램 · 스레드 트렌드를 **매일 자동 수집**해서 한 페이지에서 보여주는 웹앱입니다.

```
Apify (4개 플랫폼 수집) → public/data/*.json (GitHub 저장소에 커밋) → 정적 웹앱 (Netlify 배포)
                ↑ GitHub Actions 가 매일 07:00 KST 에 실행
```

**별도 데이터베이스가 필요 없습니다.** 수집한 데이터를 저장소 안의 JSON 파일로 커밋하기 때문에 Supabase 같은 외부 DB 계정·무료 한도 걱정이 없습니다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `public/` | 트렌드 뷰어 웹앱 (정적 HTML/CSS/JS, 빌드 불필요) |
| `public/data/dates.json` | 수집된 날짜 목록 (자동 생성) |
| `public/data/trends-YYYY-MM-DD.json` | 날짜별 트렌드 데이터 (자동 생성) |
| `scripts/collect-trends.mjs` | Apify 액터 실행 → 결과 정규화 → `public/data/`에 JSON 저장 |
| `.github/workflows/daily-collect.yml` | 매일 07:00 KST 자동 수집 + 결과를 저장소에 커밋 |

## 설정 순서

### 1. 저장소에 Actions 쓰기 권한 부여 (최초 1회)
GitHub Actions가 매일 수집한 데이터를 저장소에 직접 커밋하므로, 쓰기 권한이 필요합니다.
1. 저장소 **Settings → Actions → General** 이동
2. **Workflow permissions** 에서 **"Read and write permissions"** 선택 후 저장

### 2. 트렌드 데이터 수집 (Apify 4개 플랫폼)
1. [apify.com](https://apify.com) 가입 후 API 토큰 발급 (Settings → Integrations)
2. 기본 액터: `streamers/youtube-scraper`, `clockworks/tiktok-scraper`, `apify/instagram-hashtag-scraper`, `automation-lab/threads-scraper`
   — 일부는 유료 렌탈이 필요할 수 있습니다. Apify 스토어에서 원하는 액터로 바꾸려면 `YOUTUBE_ACTOR` 같은 환경변수로 교체하고, 입력 스키마가 다르면 `YOUTUBE_INPUT` 에 JSON 을 직접 지정하세요.
3. 수동 실행 테스트:
   ```bash
   cp .env.example .env   # APIFY_TOKEN 값 채우기
   set -a; source .env; set +a
   npm run collect        # public/data/ 에 JSON 파일 생성됨
   ```

### 3. 매일 자동 수집 (GitHub Actions)
저장소 **Settings → Secrets and variables → Actions** 에 등록:
- Secrets: `APIFY_TOKEN`
- Variables(선택): `TREND_KEYWORDS`(쉼표 구분), `MAX_ITEMS_PER_PLATFORM`

매일 07:00 KST 에 자동 실행되어 `public/data/`에 결과를 커밋하며, **Actions 탭 → 매일 트렌드 수집 → Run workflow** 로 즉시 실행할 수도 있습니다.

### 4. Netlify 배포
1. Netlify 에서 **Add new site → Import from Git** 으로 이 저장소 연결 (`netlify.toml` 이 빌드 설정을 자동 지정, 별도 환경변수 불필요)
2. GitHub Actions가 데이터를 커밋할 때마다 Netlify가 자동으로 재배포합니다
3. 배포 URL 접속 → 데이터 표시 확인

## 로컬 미리보기

```bash
npm run dev   # http://localhost:3000
```

## 뷰어 기능
- 플랫폼 필터 칩 (전체 / 유튜브 / 틱톡 / 인스타 릴스 / 스레드)
- 키워드 검색 (제목·작성자·수집 키워드)
- 정렬: 조회수순 · 좋아요순 · 최신순
- 날짜 선택으로 과거 수집분 조회 (데이터는 저장소에 날짜별로 누적)
