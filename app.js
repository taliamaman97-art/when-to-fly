const MONTH_NAMES = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const MONTH_SHORT = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"];
const CURRENT_MONTH = new Date().getMonth() + 1;

const state = { search: "", month: null, continent: null };

const $ = (id) => document.getElementById(id);

function rating(dest, month) {
  if (dest.best.includes(month)) return "best";
  if (dest.good.includes(month)) return "good";
  if (dest.avoid.includes(month)) return "avoid";
  return "ok";
}

function renderChips() {
  const months = $("months");
  months.innerHTML = "";
  months.append(makeChip("כל השנה", state.month === null, () => setState({ month: null })));
  MONTH_NAMES.forEach((name, i) => {
    const m = i + 1;
    const chip = makeChip(name, state.month === m, () => setState({ month: m }));
    if (m === CURRENT_MONTH) {
      chip.classList.add("now");
      chip.title = "החודש הנוכחי";
    }
    months.append(chip);
  });

  const continents = $("continents");
  continents.innerHTML = "";
  continents.append(makeChip("הכול", state.continent === null, () => setState({ continent: null })));
  Object.entries(CONTINENTS).forEach(([key, label]) => {
    continents.append(makeChip(label, state.continent === key, () => setState({ continent: key })));
  });
}

function makeChip(label, active, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip" + (active ? " active" : "");
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function setState(patch) {
  Object.assign(state, patch);
  renderChips();
  renderGrid();
}

// מנרמל טקסט לחיפוש: מסיר סימני כיווניות, מאחד גרש עברי/אנגלי ומתעלם מרווחים כפולים
function normalize(text) {
  return text
    .replace(/[‎‏‪-‮]/g, "")
    .replace(/[׳`’]/g, "'")
    .replace(/[״“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function filtered() {
  const q = normalize(state.search);
  let list = DESTINATIONS.filter((d) => {
    // חיפוש לפי שם מוצא את המדינה תמיד, גם אם היא לא מתאימה לחודש או ליבשת שנבחרו
    if (q) return normalize(d.name).includes(q) || d.code === q;
    if (state.continent && d.continent !== state.continent) return false;
    if (state.month && !["best", "good"].includes(rating(d, state.month))) return false;
    return true;
  });

  const order = { best: 0, good: 1, ok: 2, avoid: 3 };
  list.sort((a, b) => {
    if (state.month) {
      const diff = order[rating(a, state.month)] - order[rating(b, state.month)];
      if (diff) return diff;
    }
    return a.name.localeCompare(b.name, "he");
  });
  return list;
}

function cardHTML(d) {
  const bar = MONTH_SHORT.map((label, i) => {
    const m = i + 1;
    const selected = state.month === m ? " selected" : "";
    return `<span class="m ${rating(d, m)}${selected}" title="${MONTH_NAMES[i]}">${label}</span>`;
  }).join("");

  let badge = "";
  if (state.month) {
    const labels = { best: "עונה מושלמת", good: "זמן טוב", ok: "סביר", avoid: "עדיף להימנע" };
    const r = rating(d, state.month);
    badge = `<span class="badge ${r}">${labels[r]} ב${MONTH_NAMES[state.month - 1]}</span>`;
  }

  return `
    <article class="card">
      <div class="card-head">
        <img src="https://flagcdn.com/w80/${d.code}.png" alt="דגל ${d.name}" loading="lazy">
        <div>
          <h2>${d.name}</h2>
          <span class="continent">${CONTINENTS[d.continent]}</span>
        </div>
        ${badge}
      </div>
      <p class="season">🗓️ ${d.season}</p>
      <div class="months-bar">${bar}</div>
      <p class="text">☀️ ${d.why}</p>
      ${d.avoidWhy ? `<p class="text avoid-text">⚠️ ${d.avoidWhy}</p>` : ""}
      ${d.tip ? `<p class="text tip-text">💡 ${d.tip}</p>` : ""}
    </article>`;
}

function renderGrid() {
  const list = filtered();
  $("grid").innerHTML = list.map(cardHTML).join("");
  $("empty").hidden = list.length > 0;

  let text = `מוצגים ${list.length} יעדים`;
  if (state.search.trim()) text = `${list.length} תוצאות חיפוש (בכל היבשות והחודשים)`;
  else if (state.month) text = `${list.length} יעדים מומלצים לטיסה ב${MONTH_NAMES[state.month - 1]}`;
  $("summary").textContent = text;
}

$("search").addEventListener("input", (e) => {
  state.search = e.target.value;
  renderGrid();
});

renderChips();
renderGrid();
