// 全ページ共通のヘルパーとカード描画

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // レスポンスがJSONでない場合は無視
  }
  if (!res.ok) {
    const message = (body && body.error) || `エラーが発生しました (${res.status})`;
    throw new Error(message);
  }
  return body;
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

const WEEKDAYS = "日月火水木金土";

function formatDateShort(isoDate) {
  if (!isoDate) return "";
  const [, m, d] = isoDate.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

function formatDateLong(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  const weekday = WEEKDAYS[new Date(isoDate).getDay()];
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日(${weekday})`;
}

function priceLabel(price) {
  if (price == null || price === "") return "価格応相談";
  return `${Number(price).toLocaleString()}円`;
}

function priceHtml(price) {
  if (price == null || price === "") return `<span class="pcard-price is-ask">価格応相談</span>`;
  return `<p class="pcard-price">${Number(price).toLocaleString()}<span class="yen">円</span></p>`;
}

// 出品の新しさ。鮮度がこのサービスの価値なので、一覧では必ず「いつの出品か」を出す
function freshnessLabel(createdAt) {
  if (!createdAt) return "";
  const then = new Date(Number(createdAt) * 1000);
  if (isNaN(then.getTime())) return "";
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday - then) / 86400000);
  if (days <= 0) return "本日";
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  return `${then.getMonth() + 1}/${then.getDate()}`;
}

function isSellerLoggedIn() {
  return localStorage.getItem("seller_logged_in") === "1";
}

// 農家の連絡先URLは運営者が手入力する値なので、http(s)以外のスキーム
// (javascript: など)がリンクになってしまわないようにここで弾く
function safeUrl(url) {
  if (!url) return "";
  try {
    // 相対URLは連絡先として成立しないので、基準URLを渡さず絶対URLだけ通す
    const parsed = new URL(String(url));
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch (e) {
    return "";
  }
}

// 入力のたびに一覧を作り直すと件数が増えたときに重くなるので、少しだけ待つ
function debounce(fn, wait = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// 農家名からアバターの配色を決める(同じ名前は常に同じ色になるよう
// シンプルな文字コード和のハッシュを使う。見分けやすさのための演出で、
// セキュリティ用途のハッシュではない)
function avatarColorClass(name) {
  const s = String(name || "");
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return `c${(sum % 5) + 1}`;
}

function avatarHtml(name, extraClass = "") {
  const initial = escapeHtml(String(name || "?").trim().charAt(0));
  return `<span class="avatar ${avatarColorClass(name)} ${extraClass}" aria-hidden="true">${initial}</span>`;
}

/* ------------------------------------------------------------
   品目カテゴリと代替表示
   農家が写真を付けずに投稿しても一覧が崩れないよう、品目名から
   カテゴリを推定し、そのカテゴリの写真を大きく減光したタイルに
   カテゴリ名を載せて表示する。実物の写真と誤解されると直売では
   事故になるので、鮮明な写真をそのまま実物の代わりに出すことはしない。
   ------------------------------------------------------------ */

const CATEGORIES = [
  // 加工品を最初に判定する(「そば粉」「干し柿」「いちごジャム」を
  // 穀物や果物として拾ってしまわないようにするため)
  {
    key: "processed",
    label: "加工品",
    image: "/images/cat-processed.jpg",
    tile: "/images/tile-processed.jpg",
    words: ["ジャム", "味噌", "みそ", "醤油", "しょうゆ", "漬物", "つけもの", "ピクルス", "干し", "乾燥",
      "粉", "餅", "ドレッシング", "ジュース", "はちみつ", "蜂蜜", "加工", "甘酒", "麹", "こうじ",
      "パン", "菓子", "ケーキ", "燻製", "ソース", "茶", "酢"],
  },
  {
    key: "egg",
    label: "卵・肉・乳",
    image: "/images/cat-egg.jpg",
    tile: "/images/tile-egg.jpg",
    words: ["卵", "たまご", "タマゴ", "玉子", "牛乳", "チーズ", "ヨーグルト", "バター", "ハム",
      "ソーセージ", "ベーコン", "牛肉", "豚肉", "鶏肉", "精肉", "ジビエ", "鹿肉", "猪"],
  },
  {
    key: "flower",
    label: "花・苗",
    image: "/images/cat-flower.jpg",
    tile: "/images/tile-flower.jpg",
    words: ["切り花", "花束", "生花", "鉢", "苗", "シクラメン", "菊", "バラ", "ひまわり",
      "ラベンダー", "観葉", "アレンジ", "ドライフラワー"],
  },
  {
    key: "fruit",
    label: "果物",
    image: "/images/cat-fruit.jpg",
    tile: "/images/tile-fruit.jpg",
    words: ["いちご", "イチゴ", "苺", "とちおとめ", "スカイベリー", "とちあいか", "ぶどう", "ブドウ",
      "梨", "りんご", "リンゴ", "桃", "もも", "柿", "ブルーベリー", "メロン", "すいか", "スイカ",
      "みかん", "キウイ", "プラム", "さくらんぼ", "いちじく", "栗", "ゆず", "レモン"],
  },
  {
    key: "rice",
    label: "米・穀物",
    image: "/images/cat-rice.jpg",
    tile: "/images/tile-rice.jpg",
    words: ["米", "コシヒカリ", "あさひの夢", "なすひかり", "とちぎの星", "玄米", "白米", "そば",
      "蕎麦", "麦", "大豆", "小豆", "雑穀"],
  },
  {
    key: "vegetable",
    label: "野菜",
    image: "/images/cat-vegetable.jpg",
    tile: "/images/tile-vegetable.jpg",
    words: ["トマト", "なす", "ナス", "きゅうり", "キュウリ", "キャベツ", "白菜", "大根", "にんじん",
      "人参", "ねぎ", "ネギ", "ほうれん草", "小松菜", "レタス", "ピーマン", "かぼちゃ", "芋",
      "じゃがいも", "さつまいも", "玉ねぎ", "たまねぎ", "にんにく", "にら", "ニラ", "ブロッコリー",
      "オクラ", "枝豆", "とうもろこし", "ズッキーニ", "ごぼう", "れんこん", "しいたけ", "きのこ",
      "アスパラ", "かぶ", "生姜", "しょうが", "菜", "豆", "野菜"],
  },
];

const CATEGORY_FALLBACK = { key: "other", label: "その他", image: "/images/cat-other.jpg", tile: "/images/tile-other.jpg" };

function listingCategory(title) {
  const text = String(title || "");
  for (const cat of CATEGORIES) {
    if (cat.words.some((w) => text.includes(w))) return cat;
  }
  return CATEGORY_FALLBACK;
}

// 出品に使う画像を決める。農家が投稿した写真があればそれを、
// 無ければカテゴリタイル(減光した写真+カテゴリ名)を返す
function listingImage(listing) {
  if (listing.image_url) return { src: listing.image_url, isStock: false, label: "" };
  const cat = listingCategory(listing.title);
  return { src: cat.tile, isStock: true, label: cat.label };
}

/* ------------------------------------------------------------
   カード描画(トップ・一覧・農家ページで共用)
   ------------------------------------------------------------ */

function listingCard(listing, options = {}) {
  const img = listingImage(listing);
  const fresh = freshnessLabel(listing.created_at);
  const flags = [];
  if (listing.is_special) flags.push(`<span class="tag tag--special">わけあり・特価</span>`);
  if (fresh === "本日") flags.push(`<span class="tag tag--today">本日出品</span>`);

  const inner = `
    <div class="pcard-media${img.isStock ? " pcard-media--tile" : ""}">
      <img src="${escapeHtml(img.src)}" alt="${img.isStock ? "" : escapeHtml(listing.title)}" loading="lazy" decoding="async" />
      ${flags.length ? `<div class="pcard-flags">${flags.join("")}</div>` : ""}
      ${
        img.isStock
          ? `<span class="pcard-tile-label">${escapeHtml(img.label)}</span>
             <span class="pcard-stock">写真なし</span>`
          : ""
      }
    </div>
    <div class="pcard-body">
      <p class="pcard-title">${escapeHtml(listing.title)}</p>
      ${priceHtml(listing.price)}
      ${listing.comment ? `<p class="pcard-note">${escapeHtml(listing.comment)}</p>` : ""}
      ${
        options.hideFarmer
          ? fresh
            ? `<p class="pcard-fresh">${escapeHtml(fresh)}の出品</p>`
            : ""
          : `<div class="pcard-foot">
               ${avatarHtml(listing.farmer_name)}
               <span class="producer-name">${escapeHtml(listing.farmer_name)}</span>
               <span class="pcard-place">${escapeHtml(listing.farmer_municipality || "")}</span>
             </div>`
      }
    </div>`;

  if (options.hideFarmer) return `<div class="pcard">${inner}</div>`;
  return `<a class="pcard" href="/farmer.html?id=${encodeURIComponent(listing.farmer_id)}">${inner}</a>`;
}

function farmerCard(farmer, options = {}) {
  const tags = [];
  if (farmer.has_listing_today) tags.push(`<span class="tag tag--today">本日出品あり</span>`);
  if (farmer.next_event_date) {
    tags.push(`<span class="tag tag--event">${escapeHtml(formatDateShort(farmer.next_event_date))} イベント</span>`);
  }
  // カバー写真が無い農家に他人の畑の写真を当てるのは誤解のもとなので、
  // 頭文字のアバターで代用する
  const thumb = farmer.cover_image_url
    ? `<img class="fcard-thumb" src="${escapeHtml(farmer.cover_image_url)}" alt="" loading="lazy" decoding="async" />`
    : `<span class="fcard-thumb ${avatarColorClass(farmer.name)} fcard-thumb--initial" aria-hidden="true">${escapeHtml(
        String(farmer.name || "?").trim().charAt(0)
      )}</span>`;

  const place = [farmer.municipality, options.distanceText].filter(Boolean).join(" ・ ");

  return `
    <a class="fcard" href="/farmer.html?id=${encodeURIComponent(farmer.id)}">
      ${thumb}
      <div class="fcard-body">
        <p class="fcard-name">${escapeHtml(farmer.name)}</p>
        <p class="fcard-place">${escapeHtml(place)}</p>
        <p class="fcard-crops">${escapeHtml(farmer.crops)}</p>
        ${tags.length ? `<div class="fcard-tags">${tags.join("")}</div>` : ""}
      </div>
    </a>`;
}

function eventDateBox(isoDate) {
  const [, m, d] = String(isoDate).split("-");
  const weekday = WEEKDAYS[new Date(isoDate).getDay()] || "";
  return `
    <div class="ecard-date">
      <span class="m">${parseInt(m, 10)}月</span>
      <span class="d">${parseInt(d, 10)}</span>
      <span class="w">${weekday}</span>
    </div>`;
}

function eventCard(event, options = {}) {
  const meta = [
    event.event_time,
    event.location,
    event.fee ? `参加費 ${event.fee}` : "",
  ].filter(Boolean).join(" ・ ");

  const body = `
    ${eventDateBox(event.event_date)}
    <div class="ecard-body">
      <p class="ecard-title">${escapeHtml(event.title)}${
        event.kind === "labor" ? ` <span class="tag tag--labor">人手募集</span>` : ""
      }</p>
      <p class="ecard-meta">${escapeHtml(formatDateLong(event.event_date))}${meta ? " ・ " + escapeHtml(meta) : ""}</p>
      ${event.description ? `<p class="ecard-desc">${escapeHtml(event.description)}</p>` : ""}
      ${
        options.hideFarmer
          ? ""
          : `<p class="ecard-farmer">${escapeHtml(event.farmer_name)}(${escapeHtml(event.farmer_municipality)})</p>`
      }
    </div>`;

  if (options.hideFarmer) return `<div class="ecard">${body}</div>`;
  return `<a class="ecard" href="/farmer.html?id=${encodeURIComponent(event.farmer_id)}">${body}</a>`;
}

function jobCard(job, options = {}) {
  const meta = [
    job.work_date ? `${job.work_date}` : "",
    job.work_hours || "",
    job.capacity ? `募集 ${job.capacity}` : "",
  ].filter(Boolean).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");

  const body = `
    <p class="jcard-wage">${escapeHtml(job.wage)}</p>
    <p class="jcard-title">${escapeHtml(job.title)}</p>
    ${meta ? `<div class="jcard-meta">${meta}</div>` : ""}
    ${job.description ? `<p class="jcard-desc">${escapeHtml(job.description)}</p>` : ""}
    ${
      options.hideFarmer
        ? ""
        : `<p class="jcard-farmer">${escapeHtml(job.farmer_name)}(${escapeHtml(job.farmer_municipality)})</p>`
    }`;

  if (options.hideFarmer) return `<div class="jcard">${body}</div>`;
  return `<a class="jcard" href="/farmer.html?id=${encodeURIComponent(job.farmer_id)}">${body}</a>`;
}

// カード形のローディングプレースホルダー
function skeletonCards(n) {
  return Array.from({ length: n })
    .map(() => `<div class="skeleton-card"><div class="sk-photo"></div><div class="sk-line w60"></div><div class="sk-line w40"></div></div>`)
    .join("");
}

function emptyState(title, detail = "") {
  return `<div class="empty-state"><strong>${escapeHtml(title)}</strong>${detail ? escapeHtml(detail) : ""}</div>`;
}

/* ------------------------------------------------------------
   共通ナビゲーション
   ------------------------------------------------------------ */

// アプリ的な下部タブバー。スマホでの主要導線で、860px以上では
// ヘッダーのナビが同じ役割を担うのでCSS側で非表示にしている。
function initBottomNav(activeHref) {
  const items = [
    { href: "/", label: "ホーム" },
    { href: "/listings.html", label: "出品" },
    { href: "/farmers.html", label: "農家" },
    { href: "/map.html", label: "マップ" },
    { href: "/events.html", label: "イベント" },
  ];

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "主要メニュー");
  nav.innerHTML = items
    .map((it) => {
      const active = it.href === activeHref ? "active" : "";
      return `<a class="bottom-nav-item ${active}" href="${it.href}"><span class="bottom-nav-label">${escapeHtml(it.label)}</span></a>`;
    })
    .join("");
  document.body.appendChild(nav);
  document.body.classList.add("has-bottom-nav");
}

// フッターは全ページ共通。1箇所で直せるようJSから差し込む
function initSiteFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap">
      <div class="footer-cols">
        <div class="footer-col">
          <p class="footer-col-title">買いたい方へ</p>
          <a href="/listings.html">出品一覧</a>
          <a href="/farmers.html">農家一覧</a>
          <a href="/map.html">マップで探す</a>
        </div>
        <div class="footer-col">
          <p class="footer-col-title">参加したい方へ</p>
          <a href="/events.html">イベント一覧</a>
          <a href="/jobs.html">バイト・求人一覧</a>
        </div>
        <div class="footer-col">
          <p class="footer-col-title">農家の方へ</p>
          <a href="/seller.html">出品者ログイン</a>
          <a href="/#join">掲載のご案内(無料)</a>
        </div>
      </div>
      <p class="footer-note">
        出品・イベントの投稿・閲覧はすべて無料です。購入・お申し込みは各農家と直接やり取りしてください。
        当サイトでは決済・仲介・配送は行っておりません。
      </p>
      <p class="photo-credits">
        写真(イメージ):
        <a href="https://commons.wikimedia.org/wiki/File:Mount_Amagoi_and_Cabbage_fields.jpg" target="_blank" rel="noopener">Alpsdake</a>,
        <a href="https://commons.wikimedia.org/wiki/File:Rice_Terrace,_Sanazawanomori.jpg" target="_blank" rel="noopener">Minakami Town</a>,
        <a href="https://commons.wikimedia.org/wiki/File:Strawberry_greenhouse.jpg" target="_blank" rel="noopener">Joi Ito</a>,
        <a href="https://commons.wikimedia.org/wiki/File:Red_Rice_Paddy_field_in_Japan_003.jpg" target="_blank" rel="noopener">gtknj</a>,
        <a href="https://commons.wikimedia.org/wiki/File:Skyberry,_special_strawberry_created_in_Tochigi_prefecture.jpg" target="_blank" rel="noopener">Miyuki Meinaka</a>,
        <a href="https://commons.wikimedia.org/wiki/File:A_Tray_Of_Eggs.jpg" target="_blank" rel="noopener">safaritravelplus</a>,
        <a href="https://commons.wikimedia.org/wiki/File:Dried_persimmons_-_Flickr_-_coniferconifer.jpg" target="_blank" rel="noopener">coniferconifer</a>,
        <a href="https://commons.wikimedia.org/wiki/File:Colors_at_Tomita_Farm_(52297395808).jpg" target="_blank" rel="noopener">Big Ben in Japan</a>
        (Wikimedia Commons, CC0 / CC BY / CC BY-SA)
      </p>
      <p class="footer-copyright">© とれたて便</p>
    </div>`;
  document.body.appendChild(footer);
}

async function uploadImage(fileInput, farmerId, token) {
  const file = fileInput.files[0];
  if (!file) return null;
  const form = new FormData();
  form.append("file", file);
  form.append("farmer_id", farmerId);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "x-manage-token": token },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "画像のアップロードに失敗しました");
  return body.url;
}
