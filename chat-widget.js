// ============================================================
//  REAL-TIME CHAT WIDGET — Firebase Realtime Database
//  Drop this file next to your index.html and add this line
//  just before </body> in index.html:
//  <script src="chat-widget.js"></script>
//
//  SETUP STEPS (do this once):
//  1. Go to https://console.firebase.google.com
//  2. Click "Add project" → name it → disable Google Analytics → Create
//  3. In the left sidebar click "Realtime Database" → Create Database
//     → Start in TEST MODE → Enable
//  4. Click the gear icon ⚙ → Project Settings → scroll to
//     "Your apps" → click </> (Web) → register app → copy the
//     firebaseConfig object and paste it below replacing the
//     placeholder values
//  5. Done — save the file and deploy!
// ============================================================

(function () {

  const chatConfig = window.PORTFOLIO_CHAT_CONFIG || {};
  const firebaseConfig = chatConfig.firebaseConfig || {
    apiKey:            "AIzaSyAYMqHeWOtZBMzRRAvWY_ICgzD7cSz8E3w",
    authDomain:        "dev-oz-portfolio.firebaseapp.com",
    databaseURL:       "https://dev-oz-portfolio-default-rtdb.firebaseio.com",
    projectId:         "dev-oz-portfolio",
    storageBucket:     "dev-oz-portfolio.firebasestorage.app",
    messagingSenderId: "168610990589",
    appId:             "1:168610990589:web:57c9ca488178e7a806f194"
  };
  const OWNER_NAME = chatConfig.ownerName || "Your Name";

  // ── INJECT STYLES ──────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500&family=Orbitron:wght@700&display=swap');

    #cw-wrap * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Exo 2', sans-serif; }

    /* BUBBLE */
    #cw-bubble {
      position: fixed; bottom: 28px; right: 28px; z-index: 9000;
      width: 58px; height: 58px; border-radius: 50%;
      background: #07090f;
      border: 2px solid #00e5ff;
      box-shadow: 0 0 18px rgba(0,229,255,.55), 0 0 50px rgba(0,229,255,.18);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform .25s, box-shadow .25s;
      animation: bubblePulse 2.5s ease-in-out infinite;
    }
    #cw-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 0 26px rgba(0,229,255,.8), 0 0 60px rgba(0,229,255,.3);
    }
    @keyframes bubblePulse {
      0%,100% { box-shadow: 0 0 18px rgba(0,229,255,.55), 0 0 50px rgba(0,229,255,.18); }
      50%      { box-shadow: 0 0 28px rgba(0,229,255,.9), 0 0 70px rgba(0,229,255,.3); }
    }
    #cw-bubble svg { width: 26px; height: 26px; fill: #00e5ff; transition: opacity .2s; }
    #cw-bubble .cw-close-icon { display: none; }
    #cw-bubble.open .cw-chat-icon  { display: none; }
    #cw-bubble.open .cw-close-icon { display: block; }

    /* UNREAD BADGE */
    #cw-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ff2d55; color: #fff;
      font-family: 'Orbitron', monospace; font-size: .6rem; font-weight: 700;
      width: 20px; height: 20px; border-radius: 50%;
      display: none; align-items: center; justify-content: center;
      border: 2px solid #07090f;
      box-shadow: 0 0 8px rgba(255,45,85,.7);
    }
    #cw-badge.show { display: flex; }

    /* PANEL */
    #cw-panel {
      position: fixed; bottom: 100px; right: 28px; z-index: 8999;
      width: 340px; height: 480px;
      background: #0b0f18;
      border: 1px solid rgba(0,229,255,.2);
      box-shadow: 0 0 40px rgba(0,229,255,.12), 0 24px 60px rgba(0,0,0,.7);
      display: flex; flex-direction: column;
      transform: scale(.85) translateY(20px);
      opacity: 0; pointer-events: none;
      transition: transform .3s cubic-bezier(.34,1.56,.64,1), opacity .25s ease;
      overflow: hidden;
    }
    #cw-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }

    /* PANEL HEADER */
    #cw-header {
      background: #07090f;
      border-bottom: 1px solid rgba(0,229,255,.15);
      padding: .85rem 1rem;
      display: flex; align-items: center; gap: .7rem;
      flex-shrink: 0;
    }
    .cw-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg,#00e5ff,#ff2d55);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Orbitron', monospace; font-size: .7rem;
      font-weight: 700; color: #07090f; flex-shrink: 0;
    }
    .cw-header-info { flex: 1; }
    .cw-header-name {
      font-family: 'Orbitron', monospace; font-size: .72rem;
      font-weight: 700; color: #fff; letter-spacing: .05em;
    }
    .cw-status {
      display: flex; align-items: center; gap: .35rem;
      font-size: .65rem; color: #3d5266; margin-top: .15rem;
    }
    .cw-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #00ff88;
      box-shadow: 0 0 6px rgba(0,255,136,.8);
      animation: dotPulse 2s ease-in-out infinite;
    }
    @keyframes dotPulse {
      0%,100% { opacity: 1; } 50% { opacity: .4; }
    }

    /* SCANLINE overlay inside panel */
    #cw-panel::after {
      content: '';
      position: absolute; inset: 0; pointer-events: none; z-index: 10;
      background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.04) 2px,rgba(0,0,0,.04) 4px);
      opacity: .5;
    }

    /* MESSAGES AREA */
    #cw-messages {
      flex: 1; overflow-y: auto; padding: 1rem;
      display: flex; flex-direction: column; gap: .65rem;
      scroll-behavior: smooth;
    }
    #cw-messages::-webkit-scrollbar { width: 4px; }
    #cw-messages::-webkit-scrollbar-track { background: transparent; }
    #cw-messages::-webkit-scrollbar-thumb { background: rgba(0,229,255,.2); border-radius: 2px; }

    /* SYSTEM MESSAGE */
    .cw-system {
      text-align: center;
      font-size: .62rem; color: #3d5266; letter-spacing: .08em;
      font-family: 'Orbitron', monospace;
      padding: .3rem 0;
    }

    /* BUBBLE MESSAGES */
    .cw-msg {
      display: flex; flex-direction: column; max-width: 82%;
      animation: msgIn .25s ease both;
    }
    @keyframes msgIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .cw-msg.visitor { align-self: flex-end; align-items: flex-end; }
    .cw-msg.owner   { align-self: flex-start; align-items: flex-start; }

    .cw-bubble-msg {
      padding: .6rem .85rem;
      font-size: .82rem; line-height: 1.5; font-weight: 400;
      word-break: break-word;
    }
    .visitor .cw-bubble-msg {
      background: rgba(0,229,255,.12);
      border: 1px solid rgba(0,229,255,.25);
      color: #c9d8e8;
      border-radius: 12px 12px 2px 12px;
    }
    .owner .cw-bubble-msg {
      background: rgba(255,45,85,.1);
      border: 1px solid rgba(255,45,85,.25);
      color: #e8c0c8;
      border-radius: 12px 12px 12px 2px;
    }
    .cw-msg-meta {
      font-size: .58rem; color: #3d5266; margin-top: .2rem;
      font-family: 'Orbitron', monospace; letter-spacing: .05em;
    }

    /* INPUT AREA */
    #cw-input-area {
      border-top: 1px solid rgba(0,229,255,.12);
      padding: .75rem 1rem;
      display: flex; gap: .5rem; align-items: flex-end;
      background: #07090f; flex-shrink: 0;
    }
    #cw-name-area {
      border-bottom: 1px solid rgba(0,229,255,.12);
      padding: .6rem 1rem;
      background: #07090f; flex-shrink: 0;
    }
    #cw-name-input {
      width: 100%; background: rgba(0,229,255,.05);
      border: 1px solid rgba(0,229,255,.2); color: #b8cfe0;
      font-family: 'Exo 2', sans-serif; font-size: .78rem;
      padding: .45rem .7rem; outline: none;
      transition: border-color .2s;
    }
    #cw-name-input:focus { border-color: #00e5ff; }
    #cw-name-input::placeholder { color: #3d5266; }

    #cw-text {
      flex: 1; background: rgba(0,229,255,.05);
      border: 1px solid rgba(0,229,255,.2); color: #b8cfe0;
      font-family: 'Exo 2', sans-serif; font-size: .82rem;
      padding: .55rem .75rem; outline: none; resize: none;
      min-height: 38px; max-height: 90px;
      transition: border-color .2s; line-height: 1.4;
    }
    #cw-text:focus { border-color: #00e5ff; box-shadow: 0 0 0 2px rgba(0,229,255,.08); }
    #cw-text::placeholder { color: #3d5266; }

    #cw-send {
      width: 38px; height: 38px; flex-shrink: 0;
      background: #00e5ff; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .2s, transform .15s, box-shadow .2s;
    }
    #cw-send:hover {
      background: #00f0ff;
      box-shadow: 0 0 14px rgba(0,229,255,.6);
      transform: scale(1.05);
    }
    #cw-send svg { width: 16px; height: 16px; fill: #07090f; }
    #cw-send:disabled { opacity: .4; cursor: not-allowed; transform: none; }

    /* TYPING INDICATOR */
    #cw-typing {
      padding: .3rem 1rem .2rem;
      font-size: .62rem; color: #3d5266;
      font-family: 'Orbitron', monospace; letter-spacing: .06em;
      min-height: 22px; flex-shrink: 0;
    }
    .cw-typing-dots span {
      display: inline-block; width: 5px; height: 5px;
      border-radius: 50%; background: #00e5ff; margin: 0 1px;
      animation: dotBounce .9s ease-in-out infinite;
    }
    .cw-typing-dots span:nth-child(2) { animation-delay: .15s; }
    .cw-typing-dots span:nth-child(3) { animation-delay: .3s; }
    @keyframes dotBounce {
      0%,60%,100% { transform: translateY(0); opacity: .4; }
      30%          { transform: translateY(-5px); opacity: 1; }
    }

    @media (max-width: 420px) {
      #cw-panel { width: calc(100vw - 20px); right: 10px; bottom: 90px; }
      #cw-bubble { bottom: 18px; right: 18px; }
    }
  `;
  document.head.appendChild(style);

  // ── INJECT HTML ────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.id = 'cw-wrap';
  wrap.innerHTML = `
    <div id="cw-bubble">
      <svg class="cw-chat-icon" viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 10H6V10h12v2zm0-3H6V7h12v2z"/></svg>
      <svg class="cw-close-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      <div id="cw-badge"></div>
    </div>

    <div id="cw-panel">
      <div id="cw-header">
        <div class="cw-avatar">YN</div>
        <div class="cw-header-info">
          <div class="cw-header-name">${OWNER_NAME}</div>
          <div class="cw-status"><div class="cw-dot"></div> Online — usually replies fast</div>
        </div>
      </div>
      <div id="cw-messages">
        <div class="cw-system">// SESSION STARTED</div>
        <div class="cw-msg owner">
          <div class="cw-bubble-msg">Hey! 👋 I'm ${OWNER_NAME}. Got a question about my work or want to collaborate? Drop a message!</div>
          <div class="cw-msg-meta">AUTO • WELCOME</div>
        </div>
      </div>
      <div id="cw-typing"></div>
      <div id="cw-name-area">
        <input id="cw-name-input" type="text" placeholder="Your name (optional)" maxlength="30"/>
      </div>
      <div id="cw-input-area">
        <textarea id="cw-text" placeholder="Type a message..." rows="1"></textarea>
        <button id="cw-send" disabled>
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  // ── FIREBASE INIT ──────────────────────────────────────────
  // Load Firebase SDKs dynamically
  function loadScript(src, cb) {
    const s = document.createElement('script');
    s.src = src; s.onload = cb; document.head.appendChild(s);
  }

  loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', () => {
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js', () => {
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js', initChat);
    });
  });

  // ── SESSION ID ─────────────────────────────────────────────
  let sessionId = localStorage.getItem('cw_session');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('cw_session', sessionId);
  }

  // ── ELEMENTS ───────────────────────────────────────────────
  const bubble   = document.getElementById('cw-bubble');
  const panel    = document.getElementById('cw-panel');
  const messages = document.getElementById('cw-messages');
  const textEl   = document.getElementById('cw-text');
  const sendBtn  = document.getElementById('cw-send');
  const badge    = document.getElementById('cw-badge');
  const typingEl = document.getElementById('cw-typing');
  const nameEl   = document.getElementById('cw-name-input');

  let isOpen = false;
  let unread = 0;
  let db, sessionRef, typingTimeout;
  let lastMsgKey = null;

  // ── TOGGLE PANEL ───────────────────────────────────────────
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    bubble.classList.toggle('open', isOpen);
    if (isOpen) {
      unread = 0; badge.textContent = ''; badge.classList.remove('show');
      scrollBottom(); textEl.focus();
    }
  });

  // ── TEXT INPUT ─────────────────────────────────────────────
  textEl.addEventListener('input', () => {
    sendBtn.disabled = textEl.value.trim() === '';
    // auto-grow
    textEl.style.height = 'auto';
    textEl.style.height = Math.min(textEl.scrollHeight, 90) + 'px';
  });

  textEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  sendBtn.addEventListener('click', sendMessage);

  // ── SEND MESSAGE ───────────────────────────────────────────
  function sendMessage() {
    const text = textEl.value.trim();
    if (!text || !db) return;
    const visitorName = nameEl.value.trim() || 'Visitor';
    db.ref(`chats/${sessionId}/messages`).push({
      text, sender: 'visitor',
      name: visitorName,
      ts: Date.now()
    });
    db.ref(`chats/${sessionId}/meta`).set({
      visitorName, lastMsg: text,
      lastTs: Date.now(), sessionId,
      unreadOwner: true
    });
    textEl.value = ''; textEl.style.height = 'auto';
    sendBtn.disabled = true;
  }

  // ── SCROLL ─────────────────────────────────────────────────
  function scrollBottom() {
    setTimeout(() => { messages.scrollTop = messages.scrollHeight; }, 50);
  }

  // ── RENDER MESSAGE ─────────────────────────────────────────
  function renderMessage(data) {
    const isOwner = data.sender === 'owner';
    const div = document.createElement('div');
    div.className = `cw-msg ${isOwner ? 'owner' : 'visitor'}`;
    const time = new Date(data.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="cw-bubble-msg">${escHtml(data.text)}</div>
      <div class="cw-msg-meta">${escHtml(isOwner ? OWNER_NAME : (data.name || 'You'))} • ${time}</div>
    `;
    messages.appendChild(div);
    scrollBottom();
    if (isOwner && !isOpen) {
      unread++; badge.textContent = unread; badge.classList.add('show');
    }
  }

  // ── TYPING INDICATOR ───────────────────────────────────────
  function showTyping(name) {
    typingEl.innerHTML = `<span style="color:#3d5266;font-family:'Orbitron',monospace;font-size:.6rem;letter-spacing:.06em">${escHtml(name)} is typing <span class="cw-typing-dots"><span></span><span></span><span></span></span></span>`;
  }
  function clearTyping() { typingEl.innerHTML = ''; }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── FIREBASE INIT ──────────────────────────────────────────
  function initChat() {
    const missingConfig = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY';
    if (missingConfig) {
      console.warn('[ChatWidget] Missing Firebase config. Update chat-config.js before deploying.');
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.database();

    sessionRef = db.ref(`chats/${sessionId}/messages`);

    // Listen for new messages
    sessionRef.on('child_added', snap => {
      const data = snap.val();
      // skip if we've already rendered it (on load vs new)
      if (lastMsgKey === null) { lastMsgKey = snap.key; return; }
      renderMessage(data);
      lastMsgKey = snap.key;
    });

    // Load existing messages once
    sessionRef.once('value', snap => {
      const msgs = snap.val();
      if (msgs) {
        Object.entries(msgs).forEach(([key, data]) => {
          renderMessage(data);
          lastMsgKey = key;
        });
      }
      scrollBottom();
    });

    // Listen for owner typing
    db.ref(`chats/${sessionId}/ownerTyping`).on('value', snap => {
      if (snap.val()) showTyping(OWNER_NAME);
      else clearTyping();
    });
  }

})();
