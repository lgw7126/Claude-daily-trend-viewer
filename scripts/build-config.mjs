#!/usr/bin/env node
/**
 * Netlify 빌드 단계에서 public/config.js 를 생성합니다.
 * SUPABASE_URL / SUPABASE_ANON_KEY 가 없으면 샘플 데이터 모드로 배포됩니다.
 * (anon 키는 RLS로 보호되는 공개용 키라 클라이언트에 노출해도 됩니다.)
 */
import { writeFileSync } from "node:fs";

const config = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
};

writeFileSync(
  new URL("../public/config.js", import.meta.url),
  `window.TREND_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
);

console.log(
  config.supabaseUrl
    ? "config.js 생성 완료 (Supabase 연결 모드)"
    : "config.js 생성 완료 (샘플 데이터 모드 — SUPABASE_URL/SUPABASE_ANON_KEY 미설정)",
);
