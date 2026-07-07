/* 데일리 트렌드 뷰어 프론트엔드
 * public/data/dates.json + public/data/trends-YYYY-MM-DD.json 정적 파일을 읽어옵니다
 * (GitHub Actions가 매일 수집해서 커밋). 아직 수집된 데이터가 없으면 샘플 데이터로 동작합니다. */
(() => {
  const PLATFORMS = [
    { key: "all", label: "전체" },
    { key: "youtube", label: "유튜브", color: "var(--yt)" },
    { key: "tiktok", label: "틱톡", color: "var(--tt)" },
    { key: "instagram", label: "인스타 릴스", color: "var(--ig)" },
    { key: "threads", label: "스레드", color: "var(--th)" },
    { key: "twitter", label: "트위터(X)", color: "var(--tw)" },
  ];
  const BADGE = { youtube: "유튜브", tiktok: "틱톡", instagram: "인스타", threads: "스레드", twitter: "X" };

  const $grid = document.getElementById("cardGrid");
  const $chips = document.getElementById("platformChips");
  const $search = document.getElementById("searchInput");
  const $sort = document.getElementById("sortSelect");
  const $date = document.getElementById("datePicker");
  const $status = document.getElementById("statusLine");
  const $empty = document.getElementById("emptyMsg");
  const $mode = document.getElementById("modeBadge");

  let items = [];
  let activePlatform = "all";

  const fmt = (n) => {
    if (n == null) return null;
    if (n >= 1e8) return `${(n / 1e8).toFixed(1).replace(/\.0$/, "")}억`;
    if (n >= 1e4) return `${(n / 1e4).toFixed(1).replace(/\.0$/, "")}만`;
    return n.toLocaleString("ko-KR");
  };
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return res.json();
  }

  async function availableDates() {
    return fetchJson("data/dates.json");
  }

  async function loadDate(date) {
    $status.textContent = "불러오는 중…";
    try {
      items = await fetchJson(`data/trends-${date}.json`);
      $mode.hidden = true;
    } catch (err) {
      console.error(err);
      items = window.SAMPLE_TRENDS || [];
      $mode.hidden = false;
      $mode.textContent = "샘플 데이터 (아직 수집된 데이터 없음)";
    }
    render();
  }

  function filtered() {
    const q = $search.value.trim().toLowerCase();
    let list = items.filter(
      (it) =>
        (activePlatform === "all" || it.platform === activePlatform) &&
        (!q ||
          (it.title || "").toLowerCase().includes(q) ||
          (it.author || "").toLowerCase().includes(q) ||
          (it.keyword || "").toLowerCase().includes(q)),
    );
    const by = $sort.value;
    if (by === "views") list.sort((a, b) => (b.view_count ?? -1) - (a.view_count ?? -1));
    else if (by === "likes") list.sort((a, b) => (b.like_count ?? -1) - (a.like_count ?? -1));
    else list.sort((a, b) => new Date(b.posted_at || 0) - new Date(a.posted_at || 0));
    return list;
  }

  function card(it) {
    const views = fmt(it.view_count);
    const likes = fmt(it.like_count);
    const posted = it.posted_at ? new Date(it.posted_at).toLocaleDateString("ko-KR") : "";
    const thumb = it.thumbnail_url
      ? `<img src="${esc(it.thumbnail_url)}" alt="" loading="lazy"
           onerror="this.style.display='none'" referrerpolicy="no-referrer" />`
      : "";
    return `<article class="card">
      <a class="thumb-link" href="${esc(it.url)}" target="_blank" rel="noopener">
        ${thumb}
        <span class="badge ${esc(it.platform)}">${BADGE[it.platform] || esc(it.platform)}</span>
      </a>
      <div class="card-body">
        <h2 class="card-title"><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title)}</a></h2>
        <div class="card-meta"><span class="author">${esc(it.author || "")}</span><span>${posted}</span></div>
        <div class="card-stats">
          ${views ? `<span>조회수 <strong>${views}</strong></span>` : ""}
          ${likes ? `<span>♥ <strong>${likes}</strong></span>` : ""}
        </div>
      </div>
    </article>`;
  }

  function render() {
    const list = filtered();
    $grid.innerHTML = list.map(card).join("");
    $empty.hidden = list.length > 0;
    const counts = PLATFORMS.slice(1)
      .map((p) => ({ p, n: items.filter((it) => it.platform === p.key).length }))
      .filter(({ n }) => n > 0)
      .map(({ p, n }) => `${p.label} ${n}`)
      .join(" · ");
    $status.textContent = list.length ? `${list.length}건 표시 중${counts ? ` (${counts})` : ""}` : "";
  }

  function renderChips() {
    $chips.innerHTML = PLATFORMS.map(
      (p) => `<button class="chip${p.key === activePlatform ? " active" : ""}" data-key="${p.key}" role="tab">
          ${p.color ? `<span class="dot" style="background:${p.color}"></span>` : ""}${p.label}
        </button>`,
    ).join("");
  }

  $chips.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activePlatform = btn.dataset.key;
    renderChips();
    render();
  });
  $search.addEventListener("input", render);
  $sort.addEventListener("change", render);
  $date.addEventListener("change", () => loadDate($date.value));

  (async () => {
    renderChips();
    let date = new Date().toISOString().slice(0, 10);
    try {
      const dates = await availableDates();
      if (dates?.length) date = dates[0];
    } catch (e) {
      console.error(e);
    }
    $date.value = date;
    await loadDate(date);
  })();
})();
