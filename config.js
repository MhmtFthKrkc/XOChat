// config.js
//
// Python sunucunu (chat-backend) ücretsiz bir yere (ör. Render.com) deploy
// ettikten sonra sana verdiği adresi buraya yaz. BAŞKA HİÇBİR YERİ
// DEĞİŞTİRMENE GEREK YOK.
//
// Örnek:
 const BACKEND_HOST = "xoch.onrender.com";

const BACKEND_HOST = "127.0.0.1:8000"; // <-- deploy ettikten sonra burayı değiştir
const BACKEND_IS_SECURE = true; // Render/Railway gibi yerlerde true yap (https/wss)

const CONFIG = {
  apiBase: (BACKEND_IS_SECURE ? "https://" : "http://") + BACKEND_HOST,
  wsBase: (BACKEND_IS_SECURE ? "wss://" : "ws://") + BACKEND_HOST,
};
