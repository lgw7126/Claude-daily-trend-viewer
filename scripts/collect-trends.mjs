#!/usr/bin/env node
/**
 * 데일리 트렌드 수집기
 * Apify 액터로 5개 플랫폼(유튜브·틱톡·인스타그램·스레드·트위터)의 트렌드를 수집해
 * public/data/ 아래에 날짜별 JSON 파일로 저장합니다 (DB 불필요, GitHub 저장소에 커밋).
 *
 * 필수 환경변수:
 *   APIFY_TOKEN                  Apify API 토큰
 *
 * 선택 환경변수:
 *   TREND_KEYWORDS               쉼표 구분 검색 키워드 (기본값 아래 참고)
 *   MAX_ITEMS_PER_PLATFORM       플랫폼당 최대 수집 개수 (기본 30)
 *   PLATFORMS                    수집할 플랫폼만 지정 (예: youtube,tiktok)
 *   {YOUTUBE|TIKTOK|INSTAGRAM|THREADS|TWITTER}_ACTOR   액터 ID 교체
 *   {YOUTUBE|TIKTOK|INSTAGRAM|THREADS|TWITTER}_INPUT   액터 입력 JSON 전체 교체
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const APIFY_TOKEN = process.env.APIFY_TOKEN;

const KEYWORDS = (
  process.env.TREND_KEYWORDS ||
  "케이팝,챌린지,브이로그,예능,신곡,호텔,여행,맛집,입시,재테크"
)
  .split(",").map((s) => s.trim()).filter(Boolean);
const MAX_ITEMS = Number(process.env.MAX_ITEMS_PER_PLATFORM || 30);
const RUN_TIMEOUT_MS = 12 * 60 * 1000;
const DATA_DIR = fileURLToPath(new URL("../public/data", import.meta.url));

if (!APIFY_TOKEN) {
  console.error("APIFY_TOKEN 환경변수가 필요합니다.");
  process.exit(1);
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};
const iso = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** 플랫폼별 Apify 액터 설정. 액터 스키마가 바뀌면 *_ACTOR / *_INPUT 으로 교체하세요. */
const PLATFORMS = [
  {
    name: "youtube",
    actor: process.env.YOUTUBE_ACTOR || "streamers~youtube-scraper",
    input: () => ({
      searchQueries: KEYWORDS,
      maxResults: Math.ceil(MAX_ITEMS / KEYWORDS.length),
      maxResultsShorts: 0,
      maxResultStreams: 0,
    }),
    normalize: (it) => ({
      item_id: it.id || it.videoId || it.url,
      title: it.title,
      url: it.url,
      thumbnail_url: it.thumbnailUrl || it.thumbnail,
      author: it.channelName || it.channelTitle,
      view_count: num(it.viewCount ?? it.views),
      like_count: num(it.likes ?? it.likeCount),
      comment_count: num(it.commentsCount ?? it.commentCount),
      posted_at: iso(it.date || it.uploadDate),
      keyword: it.searchQuery || it.fromSearch || null,
    }),
  },
  {
    name: "tiktok",
    actor: process.env.TIKTOK_ACTOR || "clockworks~tiktok-scraper",
    input: () => ({
      hashtags: KEYWORDS,
      resultsPerPage: Math.ceil(MAX_ITEMS / KEYWORDS.length),
    }),
    normalize: (it) => ({
      item_id: it.id,
      title: it.text || it.desc,
      url: it.webVideoUrl,
      thumbnail_url: it.videoMeta?.coverUrl || it.covers?.default,
      author: it.authorMeta?.nickName || it.authorMeta?.name,
      view_count: num(it.playCount),
      like_count: num(it.diggCount),
      comment_count: num(it.commentCount),
      posted_at: iso(it.createTimeISO || (it.createTime && it.createTime * 1000)),
      keyword: it.hashtags?.[0]?.name || null,
    }),
  },
  {
    name: "instagram",
    actor: process.env.INSTAGRAM_ACTOR || "apify~instagram-hashtag-scraper",
    input: () => ({
      hashtags: KEYWORDS,
      resultsLimit: Math.ceil(MAX_ITEMS / KEYWORDS.length),
    }),
    normalize: (it) => ({
      item_id: it.id || it.shortCode,
      title: it.caption,
      url: it.url,
      thumbnail_url: it.displayUrl,
      author: it.ownerUsername,
      view_count: num(it.videoViewCount ?? it.videoPlayCount),
      like_count: num(it.likesCount),
      comment_count: num(it.commentsCount),
      posted_at: iso(it.timestamp),
      keyword: it.queryTag || it.hashtags?.[0] || null,
    }),
  },
  {
    name: "threads",
    actor: process.env.THREADS_ACTOR || "automation-lab~threads-scraper",
    input: () => ({
      mode: "search",
      searchQueries: KEYWORDS,
      maxPosts: Math.ceil(MAX_ITEMS / KEYWORDS.length),
      includeProfile: false,
    }),
    normalize: (it) => ({
      item_id: it.id || it.pk || it.code || it.url,
      title: it.text || it.caption?.text,
      url: it.url || (it.code ? `https://www.threads.net/t/${it.code}` : null),
      thumbnail_url: it.image_versions2?.candidates?.[0]?.url || it.thumbnail,
      author: it.user?.username || it.username,
      view_count: num(it.view_count),
      like_count: num(it.like_count ?? it.likes),
      comment_count: num(it.reply_count ?? it.text_post_app_info?.direct_reply_count),
      posted_at: iso(it.taken_at ? it.taken_at * 1000 : it.publishedAt),
      keyword: null,
    }),
  },
  {
    name: "twitter",
    actor: process.env.TWITTER_ACTOR || "apidojo~tweet-scraper",
    input: () => ({ searchTerms: KEYWORDS, maxItems: MAX_ITEMS, sort: "Latest", tweetLanguage: "" }),
    normalize: (it) => ({
      item_id: it.id,
      title: it.text || it.fullText,
      url: it.url || it.twitterUrl,
      thumbnail_url:
        it.extendedEntities?.media?.[0]?.media_url_https ||
        it.media?.[0]?.media_url_https ||
        it.author?.profilePicture,
      author: it.author?.userName || it.author?.name,
      view_count: num(it.viewCount),
      like_count: num(it.likeCount),
      comment_count: num(it.replyCount),
      posted_at: iso(it.createdAt),
      keyword: null,
    }),
  },
];

async function apify(path, options) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.apify.com/v2${path}${sep}token=${APIFY_TOKEN}`, options);
  if (!res.ok) throw new Error(`Apify ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function runActor(platform) {
  const inputOverride = process.env[`${platform.name.toUpperCase()}_INPUT`];
  const input = inputOverride ? JSON.parse(inputOverride) : platform.input();

  const { data: run } = await apify(`/acts/${platform.actor}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  console.log(`[${platform.name}] 액터 실행 시작: ${run.id}`);

  const deadline = Date.now() + RUN_TIMEOUT_MS;
  let status = run.status;
  while (["READY", "RUNNING"].includes(status)) {
    if (Date.now() > deadline) throw new Error("실행 시간 초과");
    await new Promise((r) => setTimeout(r, 10_000));
    status = (await apify(`/actor-runs/${run.id}`)).data.status;
  }
  if (status !== "SUCCEEDED") throw new Error(`실행 실패: ${status}`);

  const items = await apify(`/actor-runs/${run.id}/dataset/items?clean=true&limit=${MAX_ITEMS * 2}`);
  return Array.isArray(items) ? items : items.data ?? [];
}

function loadDayFile(date) {
  const path = `${DATA_DIR}/trends-${date}.json`;
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return [];
  }
}

function saveDayFile(date, rows) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(`${DATA_DIR}/trends-${date}.json`, JSON.stringify(rows, null, 2));
}

function updateDatesIndex(date) {
  const path = `${DATA_DIR}/dates.json`;
  let dates = [];
  if (existsSync(path)) {
    try {
      dates = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      dates = [];
    }
  }
  if (!dates.includes(date)) dates.push(date);
  dates.sort().reverse();
  writeFileSync(path, JSON.stringify(dates, null, 2));
}

const only = (process.env.PLATFORMS || "").split(",").map((s) => s.trim()).filter(Boolean);
const targets = only.length ? PLATFORMS.filter((p) => only.includes(p.name)) : PLATFORMS;
const today = new Date().toISOString().slice(0, 10);

const existing = loadDayFile(today);
const byKey = new Map(existing.map((r) => [`${r.platform}:${r.item_id}`, r]));
let nextId = existing.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
let collected = 0;

for (const platform of targets) {
  try {
    const items = await runActor(platform);
    const rows = items
      .map((it) => ({ platform: platform.name, collected_date: today, ...platform.normalize(it) }))
      .filter((r) => r.item_id && r.title)
      .slice(0, MAX_ITEMS)
      .map((r) => ({ ...r, item_id: String(r.item_id), title: String(r.title).slice(0, 500) }));

    for (const row of rows) {
      const key = `${row.platform}:${row.item_id}`;
      const existingRow = byKey.get(key);
      byKey.set(key, { id: existingRow?.id ?? nextId++, collected_at: new Date().toISOString(), ...row });
    }
    console.log(`[${platform.name}] ${rows.length}건 수집 완료`);
    collected += rows.length;
  } catch (err) {
    console.error(`[${platform.name}] 수집 실패 — 건너뜀:`, err.message);
  }
}

const merged = [...byKey.values()];
saveDayFile(today, merged);
updateDatesIndex(today);

console.log(`총 ${merged.length}건 저장 (${today}, 이번 실행에서 ${collected}건 반영)`);
if (collected === 0) process.exit(1);
