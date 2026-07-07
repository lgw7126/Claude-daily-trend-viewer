/* Supabase 미연결 시 보여주는 샘플 데이터 (데모용) */
(() => {
  const thumb = (c1, c2, emoji) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>` +
        `</linearGradient></defs>` +
        `<rect width="480" height="300" fill="url(#g)"/>` +
        `<text x="240" y="175" font-size="90" text-anchor="middle">${emoji}</text></svg>`,
    );

  const today = new Date().toISOString().slice(0, 10);
  const d = (daysAgo, h = 9) =>
    new Date(Date.now() - daysAgo * 864e5 - h * 36e5).toISOString();

  const raw = [
    ["youtube", "아이들 '기묘한 이야기' 공식 뮤직비디오", "CUBE 엔터", 21764321, 812000, d(2), "#5b2a86", "#1c1140", "🎵", "신곡"],
    ["youtube", "[호비] 인터내셔널 예고편 최초 공개", "HYBE LABELS", 6672110, 402000, d(1), "#16324f", "#0b1626", "🎬", "예고편"],
    ["youtube", "미안 예고편 분석 — 이 장면이 복선이었다", "Movie Think", 512890, 21000, d(1), "#7a1f1f", "#2a0d0d", "🍿", "예능"],
    ["youtube", "숨바꼭질 하다가 벌어진 일 (레전드 각)", "웃음참기", 1893002, 96000, d(3), "#1f6f43", "#0c2a19", "😂", "챌린지"],
    ["youtube", "LCK 결승 하이라이트 | T1 vs GEN", "LCK", 1428871, 55000, d(2), "#0d3b66", "#081f36", "🏆", "예능"],
    ["tiktok", "요즘 다 하는 그 챌린지 #댄스챌린지", "@dance.kr", 8912034, 1200000, d(0, 5), "#0f0f10", "#123c3a", "💃", "챌린지"],
    ["tiktok", "3초만에 아이스크림 만들기 (진짜 됨)", "@kitchen_hack", 4210583, 530000, d(1), "#123c3a", "#0f0f10", "🍦", "챌린지"],
    ["tiktok", "고양이가 문 여는 법을 배웠다", "@nabi_cat", 12034821, 2100000, d(2), "#2b2d42", "#0f0f10", "🐱", "브이로그"],
    ["instagram", "성수동 팝업 스토어 웨이팅 실화? 🥐", "@seoul.foodie", 934210, 88000, d(0, 8), "#7a2f6b", "#c2455a", "🥐", "브이로그"],
    ["instagram", "여름 제주 3박4일 릴스로 몰아보기", "@travel_low", 2210034, 310000, d(1), "#c2455a", "#e08c3a", "🏝️", "브이로그"],
    ["instagram", "GRWM 출근 준비 90초 컷", "@daily.ootd", 1520880, 190000, d(2), "#5b2a86", "#c2455a", "💄", "챌린지"],
    ["threads", "요즘 신입한테 '수고했어요'라고 하면 안 되는 이유", "@hr_talk", 402100, 31000, d(0, 6), "#26282e", "#101114", "💬", null],
    ["threads", "카페에서 노트북 4시간 하는 사람들 어떻게 생각함?", "@casual_kim", 288430, 19000, d(1), "#101114", "#26282e", "☕", null],
    ["threads", "퇴사하고 한 달, 솔직 후기 (장문)", "@jobfree", 512300, 45000, d(2), "#26282e", "#101114", "📝", null],
    ["twitter", "속보: 오늘 밤 유성우 최대 관측 — 시간대 정리", "@space_kr", 3120480, 210000, d(0, 4), "#123a6b", "#081f36", "🌠", null],
    ["twitter", "이번 주 개봉 영화 평점 총정리 스레드", "@movie_data", 1420930, 84000, d(1), "#0b3a5c", "#081f36", "🎞️", null],
    ["twitter", "지하철 에어컨 온도 논쟁, 결론 나왔다", "@daily_issue", 890210, 47000, d(2), "#12406b", "#081f36", "🚇", null],
    ["youtube", "[5화 예고] '인지가 살아있었다' 소름 엔딩", "드라마 공식", 1401220, 38000, d(0, 10), "#3a1f5c", "#140a24", "📺", "예능"],
  ];

  window.SAMPLE_TRENDS = raw.map(
    ([platform, title, author, view_count, like_count, posted_at, c1, c2, emoji, keyword], i) => ({
      id: i + 1,
      platform,
      item_id: `sample-${i + 1}`,
      title,
      author,
      url: "#",
      thumbnail_url: thumb(c1, c2, emoji),
      view_count,
      like_count,
      comment_count: Math.round(like_count / 40),
      posted_at,
      keyword,
      collected_date: today,
    }),
  );
})();
