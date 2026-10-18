// הדגמה מודרכת: עוברת על האתר שלב אחרי שלב, עם סמן מדומה שלוחץ ומקליד והסבר לכל שלב
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const firstCard = () => document.querySelector(".card");

  function setSearch(value) {
    $("search").value = value;
    state.search = value;
  }

  function resetSite() {
    setSearch("");
    setState({ month: null, continent: null });
  }

  const steps = [
    {
      title: "ברוכים הבאים ל\"מתי לטוס?\"",
      text: "האתר עוזר לבחור מתי הכי כדאי לטוס לכל אחד מ-87 יעדים בעולם. בהדגמה הקצרה הזאת נעבור יחד על כל האפשרויות.",
      target: () => document.querySelector(".hero"),
    },
    {
      title: "כרטיס של יעד",
      text: "לכל מדינה יש כרטיס: הדגל, העונה המומלצת, למה כדאי לטוס אז, מתי עדיף להימנע, וטיפ שימושי.",
      target: firstCard,
    },
    {
      title: "פס החודשים",
      text: "כל אחד מ-12 החודשים צבוע לפי כמה הוא מתאים: ירוק כהה – הכי מומלץ, ירוק בהיר – זמן טוב, אפור – סביר, אדום – עדיף להימנע.",
      target: () => document.querySelector(".months-bar"),
    },
    {
      title: "מתי אתם טסים?",
      text: "נניח שאנחנו טסים בדצמבר. לוחצים על החודש…",
      target: () => $("months"),
      run: (id) => clickChip("months", "דצמבר", id),
    },
    {
      title: "יעדים שמתאימים לדצמבר",
      text: "האתר מציג רק יעדים שמתאימים לחודש שבחרנו. היעדים שמסומנים \"עונה מושלמת\" מופיעים ראשונים.",
      target: firstCard,
      setup: () => setState({ month: 12 }),
    },
    {
      title: "סינון לפי יבשת",
      text: "רוצים להישאר באסיה? לוחצים על היבשת…",
      target: () => $("continents"),
      setup: () => setState({ month: 12 }),
      run: (id) => clickChip("continents", "אסיה", id),
    },
    {
      title: "אסיה בדצמבר",
      text: "עכשיו נשארו רק יעדים באסיה שמתאימים לדצמבר, למשל תאילנד, הודו וסרי לנקה.",
      target: firstCard,
      setup: () => setState({ month: 12, continent: "asia" }),
    },
    {
      title: "חיפוש לפי שם",
      text: "מחפשים מדינה מסוימת? מקלידים את השם. הפעם בחרנו יולי, ונחפש את יפן.",
      target: () => $("search"),
      setup: () => setState({ month: 7 }),
      run: (id) => typeSearch("יפן", id),
    },
    {
      title: "מה מצב יפן ביולי?",
      text: "החיפוש מוצא את המדינה גם כשהיא לא מתאימה לחודש שבחרנו, ומסמן מה המצב בו: ביולי ביפן יש עונת גשמים, ולכן עדיף להימנע. הזמן הכי טוב הוא באביב ובסתיו.",
      target: firstCard,
      setup: () => {
        setSearch("יפן");
        setState({ month: 7 });
      },
    },
    {
      title: "זהו, עכשיו תורכם!",
      text: "בחרו חודש, יבשת או מדינה, וגלו מתי ולאן הכי כדאי לטוס.",
      target: () => document.querySelector(".controls"),
    },
  ];

  let current = -1;
  let runId = 0;
  let running = false;
  let autoplay = true;
  let autoTimer = null;
  let rafId = null;
  let ui = null;

  // ── סמן מדומה ──
  async function moveCursorTo(el, id) {
    const r = el.getBoundingClientRect();
    ui.cursor.style.left = `${r.left + r.width / 2}px`;
    ui.cursor.style.top = `${r.top + r.height / 2}px`;
    ui.cursor.classList.add("visible");
    await sleep(800);
    return id === runId;
  }

  async function clickChip(containerId, label, id) {
    await sleep(600);
    const find = () => [...document.querySelectorAll(`#${containerId} .chip`)].find((b) => b.textContent === label);
    if (!(await moveCursorTo(find(), id))) return;
    ui.cursor.classList.add("click");
    await sleep(200);
    if (id !== runId) return;
    find().click();
    await sleep(300);
    ui.cursor.classList.remove("click");
  }

  async function typeSearch(text, id) {
    await sleep(600);
    const input = $("search");
    if (!(await moveCursorTo(input, id))) return;
    input.focus({ preventScroll: true });
    for (const ch of text) {
      await sleep(300);
      if (id !== runId) return;
      input.value += ch;
      input.dispatchEvent(new Event("input"));
    }
  }

  // ── הדגשת האזור הרלוונטי ──
  function trackSpotlight() {
    const el = current >= 0 ? steps[current].target() : null;
    if (el) {
      const r = el.getBoundingClientRect();
      Object.assign(ui.spot.style, {
        left: `${r.left - 8}px`,
        top: `${r.top - 8}px`,
        width: `${r.width + 16}px`,
        height: `${r.height + 16}px`,
      });
    }
    rafId = requestAnimationFrame(trackSpotlight);
  }

  async function scrollToTarget(el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    await sleep(600);
  }

  // ── ניהול השלבים ──
  function readingTime(step) {
    return 2500 + step.text.length * 45;
  }

  function schedule() {
    clearTimeout(autoTimer);
    if (autoplay && !running && current < steps.length - 1) {
      autoTimer = setTimeout(() => goTo(current + 1), readingTime(steps[current]));
    }
  }

  async function goTo(index) {
    if (index < 0 || index >= steps.length) return;
    clearTimeout(autoTimer);
    const id = ++runId;
    current = index;
    const step = steps[index];

    resetSite();
    if (step.setup) step.setup();
    ui.cursor.classList.remove("visible", "click");

    ui.count.textContent = `שלב ${index + 1} מתוך ${steps.length}`;
    ui.title.textContent = step.title;
    ui.text.textContent = step.text;
    ui.bar.style.width = `${((index + 1) / steps.length) * 100}%`;
    ui.prev.disabled = index === 0;
    ui.next.textContent = index === steps.length - 1 ? "סיום" : "הבא";

    running = true;
    await scrollToTarget(step.target());
    if (id === runId && step.run) await step.run(id);
    if (id !== runId) return;
    running = false;
    schedule();
  }

  function updatePlayButton() {
    ui.play.textContent = autoplay ? "⏸ עצירה" : "▶ הפעלה אוטומטית";
  }

  function start() {
    if (ui) return;
    document.body.classList.add("demo-active");
    document.body.insertAdjacentHTML("beforeend", `
      <div class="demo-spot"></div>
      <div class="demo-cursor" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 2l16 10-7 1.5L9.5 21z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </div>
      <div class="demo-panel" role="dialog" aria-live="polite" aria-label="הדגמה מודרכת">
        <div class="demo-top">
          <span class="demo-count"></span>
          <button type="button" class="demo-x" aria-label="סגירת ההדגמה">✕</button>
        </div>
        <h3 class="demo-title"></h3>
        <p class="demo-text"></p>
        <div class="demo-progress"><i></i></div>
        <div class="demo-actions">
          <button type="button" class="demo-prev">הקודם</button>
          <button type="button" class="demo-play"></button>
          <button type="button" class="demo-next">הבא</button>
        </div>
      </div>`);

    const q = (sel) => document.querySelector(sel);
    ui = {
      spot: q(".demo-spot"),
      cursor: q(".demo-cursor"),
      panel: q(".demo-panel"),
      count: q(".demo-count"),
      title: q(".demo-title"),
      text: q(".demo-text"),
      bar: q(".demo-progress i"),
      prev: q(".demo-prev"),
      next: q(".demo-next"),
      play: q(".demo-play"),
    };

    ui.prev.addEventListener("click", () => goTo(current - 1));
    ui.next.addEventListener("click", () => (current === steps.length - 1 ? stop() : goTo(current + 1)));
    ui.play.addEventListener("click", () => {
      autoplay = !autoplay;
      updatePlayButton();
      if (autoplay) schedule();
      else clearTimeout(autoTimer);
    });
    q(".demo-x").addEventListener("click", stop);
    document.addEventListener("keydown", onKey);

    autoplay = true;
    updatePlayButton();
    trackSpotlight();
    goTo(0);
  }

  function stop() {
    if (!ui) return;
    runId++;
    clearTimeout(autoTimer);
    cancelAnimationFrame(rafId);
    document.removeEventListener("keydown", onKey);
    [ui.spot, ui.cursor, ui.panel].forEach((el) => el.remove());
    ui = null;
    current = -1;
    running = false;
    document.body.classList.remove("demo-active");
    resetSite();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // באתר בעברית החץ שמאלה מתקדם והחץ ימינה חוזר אחורה
  function onKey(e) {
    if (e.key === "Escape") stop();
    if (e.target === $("search")) return;
    if (e.key === "ArrowLeft") goTo(current + 1);
    if (e.key === "ArrowRight") goTo(current - 1);
  }

  $("demo-btn").addEventListener("click", start);

  // קישור עם ?demo או #demo מפעיל את ההדגמה אוטומטית
  if (new URLSearchParams(location.search).has("demo") || location.hash === "#demo") {
    window.addEventListener("load", () => setTimeout(start, 400));
  }
})();
