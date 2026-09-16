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

function initNav(activeHref) {
  const header = document.querySelector("header.app-header");

  const btn = document.createElement("button");
  btn.className = "hamburger-btn";
  btn.setAttribute("aria-label", "メニュー");
  btn.innerHTML = "☰";
  if (header) {
    header.appendChild(btn);
  } else {
    btn.classList.add("hamburger-btn-floating");
    document.body.appendChild(btn);
  }

  const links = [
    { href: "/", label: "農家一覧" },
    { href: "/listings.html", label: "出品一覧" },
    { href: "/events.html", label: "イベント一覧" },
    { href: "/jobs.html", label: "バイト・求人" },
    { href: "/map.html", label: "マップ" },
    { href: "/seller.html", label: isSellerLoggedIn() ? "出品者ページ" : "出品者ログイン" },
  ];

  const overlay = document.createElement("div");
  overlay.className = "nav-overlay";
  overlay.innerHTML = `
    <nav class="nav-drawer">
      <div class="nav-drawer-header">
        <span>メニュー</span>
        <button class="nav-close" aria-label="閉じる">✕</button>
      </div>
      <ul>
        ${links
          .map(
            (l) =>
              `<li><a href="${l.href}" class="${l.href === activeHref ? "active" : ""}">${escapeHtml(l.label)}</a></li>`
          )
          .join("")}
      </ul>
    </nav>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.classList.remove("open");
  btn.addEventListener("click", () => overlay.classList.add("open"));
  overlay.querySelector(".nav-close").addEventListener("click", close);
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
}

// アプリ的な下部タブバー(ポケットマルシェ等のプラットフォームUIを参考に、
// 「読み物サイト」ではなく「使うプラットフォーム」であることを常時示すための主要導線)。
// initNav() のハンバーガー(副次的な導線: 出品者ログイン等)とは役割を分けている。
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
