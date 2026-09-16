// 全ページ共通のヘルパー関数

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

function formatDateShort(isoDate) {
  if (!isoDate) return "";
  const [, m, d] = isoDate.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

function formatDateLong(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  const weekday = "日月火水木金土"[new Date(isoDate).getDay()];
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日(${weekday})`;
}

function priceLabel(price) {
  if (price == null || price === "") return "価格応相談";
  return `${Number(price).toLocaleString()}円`;
}

function isSellerLoggedIn() {
  return localStorage.getItem("seller_logged_in") === "1";
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

// カード形のローディングプレースホルダー(「読み込み中...」の文字だけでなく、
// 実際のカードに近い形のスケルトンを薄いシマーで表示する)
function skeletonCards(n) {
  return Array.from({ length: n })
    .map(() => `<div class="skeleton-card"><div class="sk-photo"></div><div class="sk-line w60"></div><div class="sk-line w40"></div></div>`)
    .join("");
}

// アプリ的な下部タブバー(ポケットマルシェ等のプラットフォームUIを参考に、
// 「読み物サイト」ではなく「使うプラットフォーム」であることを常時示すための主要導線)。
// 全ページ共通のヘッダー(.site-nav、ロゴ+横並びナビ+出品者ログイン)と役割を分けている。
function initBottomNav(activeHref) {
  const items = [
    { href: "/", label: "ホーム" },
    { href: "/listings.html", label: "出品" },
    { href: "/map.html", label: "マップ" },
    { href: "/events.html", label: "イベント" },
    { href: "/jobs.html", label: "求人" },
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
