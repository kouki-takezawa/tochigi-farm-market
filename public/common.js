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
