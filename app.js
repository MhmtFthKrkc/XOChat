// app.js
//
// Bu dosya CONFIG.apiBase ve CONFIG.wsBase üzerinden senin Python
// sunucunla (chat-backend) konuşuyor. Backend'i deploy edip config.js'i
// güncellemeden bu uygulama çalışmaz.

const $ = (sel) => document.querySelector(sel);

const authScreen = $("#authScreen");
const chatScreen = $("#chatScreen");
const authError = $("#authError");
const authHint = $("#authHint");

let state = {
  token: localStorage.getItem("chat_token") || null,
  username: localStorage.getItem("chat_username") || null,
  room: localStorage.getItem("chat_room") || "genel",
  ws: null,
  reconnectTimer: null,
};

// ---------- Sekme geçişleri (giriş / kayıt) ----------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    $("#loginForm").classList.toggle("hidden", !isLogin);
    $("#registerForm").classList.toggle("hidden", isLogin);
    hideError();
  });
});

function showError(msg) {
  authError.textContent = msg;
  authError.classList.remove("hidden");
}
function hideError() {
  authError.classList.add("hidden");
}

// ---------- Kayıt ----------
$("#registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  const username = $("#registerUsername").value.trim();
  const password = $("#registerPassword").value;
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  try {
    const res = await fetch(CONFIG.apiBase + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Kayıt başarısız");
    loginSuccess(data.username, data.token);
  } catch (err) {
    showError(friendlyError(err));
  } finally {
    btn.disabled = false;
  }
});

// ---------- Giriş ----------
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  const username = $("#loginUsername").value.trim();
  const password = $("#loginPassword").value;
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  try {
    const res = await fetch(CONFIG.apiBase + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Giriş başarısız");
    loginSuccess(data.username, data.token);
  } catch (err) {
    showError(friendlyError(err));
  } finally {
    btn.disabled = false;
  }
});

function friendlyError(err) {
  if (err instanceof TypeError) {
    return "Sunucuya ulaşılamadı. config.js dosyasındaki adresi kontrol et.";
  }
  return err.message;
}

function loginSuccess(username, token) {
  state.username = username;
  state.token = token;
  localStorage.setItem("chat_token", token);
  localStorage.setItem("chat_username", username);
  enterChat();
}

// ---------- Çıkış ----------
$("#logoutBtn").addEventListener("click", async () => {
  if (state.ws) state.ws.close();
  try {
    await fetch(CONFIG.apiBase + "/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: state.token }),
    });
  } catch (e) { /* sorun değil, yine de çıkış yapıyoruz */ }
  localStorage.removeItem("chat_token");
  localStorage.removeItem("chat_username");
  state.token = null;
  state.username = null;
  chatScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
});

// ---------- Oda değiştirme ----------
$("#roomBtn").addEventListener("click", () => {
  const newRoom = prompt("Hangi odaya girmek istersin?", state.room);
  if (newRoom && newRoom.trim()) {
    state.room = newRoom.trim();
    localStorage.setItem("chat_room", state.room);
    connectRoom();
  }
});

// ---------- Sohbet ekranına geçiş ----------
function enterChat() {
  authScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  connectRoom();
}

function setStatus(text) {
  $("#status").textContent = text;
}

// ---------- Geçmiş mesajları yükle ----------
async function loadHistory(room) {
  try {
    const res = await fetch(CONFIG.apiBase + "/messages/" + encodeURIComponent(room));
    const list = await res.json();
    renderAll(list.map((m) => ({ type: "message", ...m })));
  } catch (e) {
    setStatus("geçmiş yüklenemedi");
  }
}

// ---------- WebSocket bağlantısı ----------
function connectRoom() {
  if (state.ws) {
    state.ws.onclose = null; // eski bağlantının otomatik yeniden bağlanmasını engelle
    state.ws.close();
  }
  clearTimeout(state.reconnectTimer);

  $("#roomLabel").textContent = state.room;
  $("#thread").innerHTML = "";
  setStatus("bağlanıyor…");

  loadHistory(state.room);

  const url = CONFIG.wsBase + "/ws/" + encodeURIComponent(state.room) + "?token=" + encodeURIComponent(state.token);
  const ws = new WebSocket(url);
  state.ws = ws;

  ws.onopen = () => setStatus("");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "system" && typeof data.online === "number") {
      $("#onlineLabel").textContent = data.online + " çevrimiçi";
    }
    appendMessage(data);
  };
  ws.onclose = (event) => {
    if (event.code === 4401) {
      setStatus("oturum geçersiz, tekrar giriş yap");
      return;
    }
    setStatus("bağlantı koptu, yeniden deneniyor…");
    state.reconnectTimer = setTimeout(connectRoom, 2000);
  };
  ws.onerror = () => setStatus("bağlantı hatası");
}

// ---------- Mesaj gönderme ----------
$("#sendBtn").addEventListener("click", sendMessage);
$("#msgInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const input = $("#msgInput");
  const text = input.value.trim();
  if (!text || !state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  state.ws.send(JSON.stringify({ text }));
  input.value = "";
}

// ---------- Mesajları ekrana çizme ----------
let lastSender = null;

function clearEmptyState() {
  const empty = document.querySelector(".empty");
  if (empty) empty.remove();
}

function appendMessage(m) {
  clearEmptyState();
  const thread = $("#thread");
  const row = document.createElement("div");

  if (m.type === "system") {
    row.className = "row system";
    row.innerHTML = `<div class="bubble"></div>`;
    row.querySelector(".bubble").textContent = m.text;
    lastSender = null;
  } else {
    const mine = m.username === state.username;
    row.className = "row " + (mine ? "mine" : "theirs");
    if (m.username !== lastSender) {
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = (mine ? "Sen" : m.username) + " · " + formatTime(m.ts);
      row.appendChild(meta);
    }
    lastSender = m.username;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = m.text;
    row.appendChild(bubble);
  }

  thread.appendChild(row);
  thread.scrollTop = thread.scrollHeight;
}

function renderAll(list) {
  $("#thread").innerHTML = "";
  lastSender = null;
  if (list.length === 0) {
    $("#thread").innerHTML = '<div class="empty">Henüz mesaj yok.<br>İlk mesajı sen yaz.</div>';
    return;
  }
  list.forEach(appendMessage);
}

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

// ---------- Başlangıçta zaten girişliyse direkt sohbete gir ----------
if (state.token && state.username) {
  enterChat();
}

// ---------- Uygulama olarak kurma (Android/Chrome) ----------
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  $("#installBanner").classList.remove("hidden");
});
$("#installBtn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $("#installBanner").classList.add("hidden");
});
$("#installDismiss").addEventListener("click", () => {
  $("#installBanner").classList.add("hidden");
});

// ---------- Service worker kaydı ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
