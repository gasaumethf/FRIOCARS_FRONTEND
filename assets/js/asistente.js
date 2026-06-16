// ══════════════════════════════════════════════════════════
//  FRÍO CARS — Asistente IA tipo Siri
//  Archivo: assets/js/asistente.js
// ══════════════════════════════════════════════════════════
(function () {
  if (document.getElementById('fc-siri-root')) return;

  const API_BASE = 'https://friocars-backend.onrender.com/api';
  const CLAUDE_API = 'https://friocars-backend.onrender.com/api/asistente/chat';
  let historial = [];
  let stockProductos = [];
  let expandido = false;
  let animando = true;
  let pensando = false;
  let arrastrandoOrb = false;
  let orbOffX = 0, orbOffY = 0, orbPosX = null, orbPosY = null;

  // ── ESTILOS ───────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

    #fc-siri-root {
      position: fixed;
      bottom: 2.2rem;
      right: 5.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0;
      pointer-events: none;
    }

    /* ── PANEL CHAT ─────────────────────────────────── */
    #fc-siri-panel {
      width: 340px;
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(29,78,216,.15);
      border-radius: 22px 22px 6px 22px;
      box-shadow:
        0 20px 60px rgba(29,78,216,.18),
        0 4px 20px rgba(0,0,0,.10);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      pointer-events: all;
      transform-origin: bottom right;
      transform: scale(0) translateY(20px);
      opacity: 0;
      transition: transform .35s cubic-bezier(.34,1.56,.64,1), opacity .25s ease;
      margin-bottom: .7rem;
      max-height: 520px;
    }
    #fc-siri-panel.abierto {
      transform: scale(1) translateY(0);
      opacity: 1;
    }

    /* Header del panel */
    #fc-siri-panel-header {
      background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%);
      padding: .85rem 1rem .7rem;
      display: flex;
      align-items: center;
      gap: .6rem;
      flex-shrink: 0;
    }
    .fc-panel-avatar {
      width: 34px; height: 34px;
      background: rgba(255,255,255,.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
    }
    #fc-siri-panel-header h4 {
      flex: 1; font-size: .84rem; font-weight: 800;
      color: #fff; margin: 0; font-family: 'Plus Jakarta Sans', sans-serif;
    }
    #fc-siri-panel-header p {
      font-size: .62rem; color: rgba(255,255,255,.75);
      margin: 0; font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .fc-hbtn {
      background: rgba(255,255,255,.15); border: none; border-radius: 7px;
      width: 26px; height: 26px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; transition: background .15s;
    }
    .fc-hbtn:hover { background: rgba(255,255,255,.28); }
    .fc-hbtn svg { width: 13px; height: 13px; stroke: #fff; fill: none; }

    /* Chips */
    #fc-siri-chips {
      display: flex; gap: .3rem; flex-wrap: wrap;
      padding: .55rem .85rem .35rem;
      border-bottom: 1px solid #f1f5f9;
      flex-shrink: 0;
    }
    .fc-chip {
      background: #eff6ff; color: #1d4ed8;
      border: 1px solid #bfdbfe; border-radius: 20px;
      padding: 3px 9px; font-size: .67rem; font-weight: 700;
      cursor: pointer; transition: all .15s; white-space: nowrap;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .fc-chip:hover { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }

    /* Mensajes */
    #fc-siri-msgs {
      flex: 1; overflow-y: auto; padding: .75rem .85rem;
      display: flex; flex-direction: column; gap: .55rem;
      min-height: 0;
    }
    #fc-siri-msgs::-webkit-scrollbar { width: 3px; }
    #fc-siri-msgs::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 3px; }
    .fc-msg { display: flex; gap: .45rem; animation: fcIn .22s ease; }
    .fc-msg.user { flex-direction: row-reverse; }
    @keyframes fcIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
    .fc-bubble {
      max-width: 85%; padding: .5rem .8rem;
      border-radius: 14px; font-size: .79rem;
      line-height: 1.55; font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .fc-msg.bot  .fc-bubble { background: #eff6ff; border: 1px solid #bfdbfe; border-bottom-left-radius: 4px; color: #0f172a; }
    .fc-msg.user .fc-bubble { background: #1d4ed8; color: #fff; border-bottom-right-radius: 4px; }
    .fc-bicon {
      width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem; flex-shrink: 0; margin-top: 2px;
    }
    .fc-msg.bot  .fc-bicon { background: #dbeafe; }
    .fc-msg.user .fc-bicon { background: rgba(29,78,216,.15); }
    .fc-typing { display: flex; gap: 4px; padding: .35rem .5rem; align-items: center; }
    .fc-typing span {
      width: 6px; height: 6px; background: #93c5fd; border-radius: 50%;
      animation: fcDot 1.2s infinite;
    }
    .fc-typing span:nth-child(2) { animation-delay: .2s; }
    .fc-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes fcDot { 0%,80%,100%{ transform:scale(.75);opacity:.5; } 40%{ transform:scale(1.1);opacity:1; } }

    /* Input */
    #fc-siri-inputrow {
      display: flex; gap: .45rem; padding: .65rem .85rem;
      border-top: 1px solid #f1f5f9; flex-shrink: 0;
      background: #fff;
    }
    #fc-siri-input {
      flex: 1; background: #f8fafc; border: 1.5px solid #e2e8f0;
      border-radius: 10px; padding: .5rem .8rem;
      font-size: .8rem; font-family: 'Plus Jakarta Sans', sans-serif;
      color: #0f172a; outline: none; resize: none; max-height: 90px;
      transition: border-color .2s;
    }
    #fc-siri-input:focus { border-color: #1d4ed8; }
    #fc-siri-input::placeholder { color: #94a3b8; }
    #fc-siri-send {
      width: 36px; height: 36px; flex-shrink: 0; align-self: flex-end;
      background: #1d4ed8; border: none; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background .2s;
    }
    #fc-siri-send:hover { background: #1e40af; }
    #fc-siri-send:disabled { background: #cbd5e1; cursor: not-allowed; }
    #fc-siri-send svg { width: 15px; height: 15px; stroke: #fff; fill: none; }

    /* ── ORB FLOTANTE ───────────────────────────────── */
    #fc-siri-orb {
      width: 54px; height: 54px;
      border-radius: 50%;
      cursor: pointer;
      pointer-events: all;
      position: relative;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }

    /* Capas de ondas */
    .fc-orb-ring {
      position: absolute; inset: 0; border-radius: 50%;
      animation: fcPulse 2.4s ease-in-out infinite;
    }
    .fc-orb-ring:nth-child(1) { background: rgba(29,78,216,.18); animation-delay: 0s; }
    .fc-orb-ring:nth-child(2) { background: rgba(29,78,216,.12); animation-delay: .4s; }
    .fc-orb-ring:nth-child(3) { background: rgba(29,78,216,.07); animation-delay: .8s; }
    @keyframes fcPulse {
      0%   { transform: scale(1);   opacity: 1; }
      70%  { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    #fc-siri-orb.sin-anim .fc-orb-ring { animation: none; opacity: 0; }

    /* Núcleo del orb — gradiente animado estilo Siri */
    .fc-orb-core {
      position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        #1d4ed8, #38bdf8, #7c3aed, #0284c7, #1d4ed8
      );
      animation: fcSpin 3s linear infinite;
      box-shadow:
        0 0 18px rgba(29,78,216,.5),
        0 4px 20px rgba(29,78,216,.35);
    }
    #fc-siri-orb.sin-anim .fc-orb-core {
      animation: none;
      background: linear-gradient(135deg, #1d4ed8, #0284c7);
      box-shadow: 0 4px 16px rgba(29,78,216,.3);
    }
    #fc-siri-orb.pensando .fc-orb-core {
      animation: fcSpinFast 1s linear infinite;
      background: conic-gradient(
        from 0deg,
        #7c3aed, #1d4ed8, #38bdf8, #16a34a, #7c3aed
      );
      box-shadow: 0 0 24px rgba(124,58,237,.6);
    }
    @keyframes fcSpin     { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
    @keyframes fcSpinFast { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } animation-duration: .6s; }

    /* Capa blanca interior que hace el efecto glossy */
    .fc-orb-inner {
      position: absolute;
      inset: 5px; border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, rgba(255,255,255,.35) 0%, transparent 65%);
      z-index: 2;
    }

    /* Ícono central */
    .fc-orb-icon {
      position: relative; z-index: 3;
      color: #fff; font-size: 1.3rem;
      filter: drop-shadow(0 1px 4px rgba(0,0,0,.3));
      pointer-events: none;
    }

    /* Tooltip al hacer hover */
    #fc-siri-orb::after {
      content: 'Asistente IA';
      position: absolute; bottom: calc(100% + 8px); right: 0;
      background: rgba(15,23,42,.85); color: #fff;
      font-size: .68rem; font-weight: 600; white-space: nowrap;
      padding: 4px 10px; border-radius: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      pointer-events: none;
      opacity: 0; transition: opacity .2s;
    }
    #fc-siri-orb:hover::after { opacity: 1; }

    /* Botón quitar animación (aparece al expandir) */
    #fc-anim-toggle {
      position: absolute; top: -8px; left: -8px;
      width: 20px; height: 20px; border-radius: 50%;
      background: rgba(15,23,42,.75); border: none;
      color: #fff; font-size: .55rem; cursor: pointer;
      display: none; align-items: center; justify-content: center;
      z-index: 10; pointer-events: all;
      transition: background .15s;
      font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
    }
    #fc-anim-toggle:hover { background: #1d4ed8; }
    #fc-siri-orb:hover #fc-anim-toggle { display: flex; }

    /* Badge de notificación */
    #fc-orb-badge {
      position: absolute; top: -2px; right: -2px;
      width: 13px; height: 13px; border-radius: 50%;
      background: #ef4444; border: 2px solid #fff;
      display: none; z-index: 10;
    }
  `;
  document.head.appendChild(css);

  // ── HTML ──────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'fc-siri-root';
  root.innerHTML = `
    <div id="fc-siri-panel">
      <div id="fc-siri-panel-header">
        <div class="fc-panel-avatar">🤖</div>
        <div style="flex:1;min-width:0">
          <h4>Asistente Frío Cars</h4>
          <p id="fc-stock-lbl">Cargando inventario...</p>
        </div>
        <button class="fc-hbtn" id="fc-btn-cerrar" title="Cerrar">
          <svg viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div id="fc-siri-chips">
        <button class="fc-chip" data-q="¿Cuáles productos tienen stock bajo?">📦 Stock bajo</button>
        <button class="fc-chip" data-q="Dame los 5 productos más caros">💰 Más caros</button>
        <button class="fc-chip" data-q="¿Cuántos productos hay disponibles?">📊 Resumen</button>
        <button class="fc-chip" data-q="Cotiza un compresor de aire acondicionado para carro con IVA">🔧 Cotizar</button>
        <button class="fc-chip" data-q="¿Qué productos de refrigeración están disponibles?">❄️ Refrigeración</button>
        <button class="fc-chip" data-q="Compara precios del inventario con otras tiendas online en Colombia">🌐 Comparar</button>
      </div>

      <div id="fc-siri-msgs"></div>

      <div id="fc-siri-inputrow">
        <textarea id="fc-siri-input" rows="1" placeholder="Pregunta sobre stock, precios, cotizaciones..."></textarea>
        <button id="fc-siri-send">
          <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </div>
    </div>

    <div id="fc-siri-orb" title="">
      <div class="fc-orb-ring"></div>
      <div class="fc-orb-ring"></div>
      <div class="fc-orb-ring"></div>
      <div class="fc-orb-core"></div>
      <div class="fc-orb-inner"></div>
      <span class="fc-orb-icon">✦</span>
      <button id="fc-anim-toggle" title="Quitar animación">✦</button>
      <div id="fc-orb-badge"></div>
    </div>
  `;
  document.body.appendChild(root);

  // ── Refs ──────────────────────────────────────────────────
  const panel = document.getElementById('fc-siri-panel');
  const orb = document.getElementById('fc-siri-orb');
  const msgs = document.getElementById('fc-siri-msgs');
  const input = document.getElementById('fc-siri-input');
  const sendBtn = document.getElementById('fc-siri-send');
  const btnCerrar = document.getElementById('fc-btn-cerrar');
  const stockLbl = document.getElementById('fc-stock-lbl');
  const animBtn = document.getElementById('fc-anim-toggle');
  const badge = document.getElementById('fc-orb-badge');

  // ── Animación toggle ──────────────────────────────────────
  if (localStorage.getItem('fc_anim') === '0') {
    animando = false;
    orb.classList.add('sin-anim');
    animBtn.textContent = '▶';
  }
  animBtn.addEventListener('click', e => {
    e.stopPropagation();
    animando = !animando;
    orb.classList.toggle('sin-anim', !animando);
    animBtn.textContent = animando ? '✦' : '▶';
    localStorage.setItem('fc_anim', animando ? '1' : '0');
  });

  // ── Abrir / cerrar ────────────────────────────────────────
  orb.addEventListener('click', e => {
    if (arrastrandoOrb || e.target === animBtn) return;
    expandido = !expandido;
    panel.classList.toggle('abierto', expandido);
    badge.style.display = 'none';
    if (expandido) {
      msgs.scrollTop = msgs.scrollHeight;
      setTimeout(() => input.focus(), 300);
    }
  });
  btnCerrar.addEventListener('click', () => {
    expandido = false;
    panel.classList.remove('abierto');
  });

  // ── Stock ─────────────────────────────────────────────────
  async function cargarStock() {
    try {
      const r = await fetch(`${API_BASE}/productos`);
      stockProductos = r.ok ? await r.json() : [];
      stockLbl.textContent = `✓ ${stockProductos.length} productos en inventario`;
    } catch {
      stockLbl.textContent = '⚠ Sin conexión al inventario';
    }
  }

  // ── Mensajes ──────────────────────────────────────────────
  function addMsg(tipo, texto, typing = false) {
    const d = document.createElement('div');
    d.className = `fc-msg ${tipo}`;
    if (typing) {
      d.id = 'fc-typing';
      d.innerHTML = `<div class="fc-bicon">${tipo === 'bot' ? '🤖' : '👤'}</div>
        <div class="fc-bubble" style="padding:.4rem .65rem">
          <div class="fc-typing"><span></span><span></span><span></span></div>
        </div>`;
    } else {
      const html = texto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      d.innerHTML = `<div class="fc-bicon">${tipo === 'bot' ? '🤖' : '👤'}</div>
        <div class="fc-bubble">${html}</div>`;
    }
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  // ── Sistema prompt ────────────────────────────────────────
  function sysPrompt() {
    const inv = stockProductos.length
      ? stockProductos.map(p =>
        `• ${p.nombre} | $${Number(p.precio || 0).toLocaleString('es-CO')} | Stock: ${p.stock} uds | Cat: ${p.categoria || 'N/A'}`
      ).join('\n')
      : 'Inventario no disponible.';
    return `Eres el asistente inteligente de "Frío Cars", empresa automotriz colombiana especializada en refrigeración y aire acondicionado vehicular.

INVENTARIO ACTUAL:
${inv}

CAPACIDADES:
- Consultar stock y precios del inventario en tiempo real
- Generar cotizaciones con IVA 19% basadas en productos disponibles
- Alertar sobre stock bajo (menos de 5 unidades) o productos agotados
- Comparar precios con MercadoLibre Colombia, Linio, Amazon.com.co (usa estimados de mercado)
- Recomendar alternativas cuando hay agotamiento
- Calcular kits o combos de productos
- Dar info técnica sobre repuestos de refrigeración automotriz
- Hacer cotizaciones paralelas estimando precios en otros negocios online

REGLAS:
- Responde siempre en español colombiano, de forma concisa y útil
- Para cotizaciones incluye desglose: subtotal, IVA 19%, total
- Indica claramente cuando un producto no está en inventario
- Sé amigable pero profesional — no seas repetitivo ni fastidioso
- Usa emojis con moderación para mejorar la legibilidad`;
  }

  // ── Enviar a Claude ───────────────────────────────────────
  async function enviarClaude(txt) {
    historial.push({ role: 'user', content: txt });
    const typEl = addMsg('bot', '', true);
    sendBtn.disabled = true;
    orb.classList.add('pensando');

    try {
      const r = await fetch(CLAUDE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historial
        })
      });
      const data = await r.json();
      const resp = data.content?.[0]?.text || 'No pude procesar tu solicitud.';
      historial.push({ role: 'assistant', content: resp });
      if (historial.length > 20) historial = historial.slice(-20);
      typEl.remove();
      addMsg('bot', resp);
    } catch {
      typEl.remove();
      addMsg('bot', '⚠️ Error de conexión. Intenta nuevamente.');
    }

    sendBtn.disabled = false;
    orb.classList.remove('pensando');
    input.focus();
  }

  // ── Enviar ────────────────────────────────────────────────
  async function enviar() {
    const txt = input.value.trim();
    if (!txt || pensando) return;
    input.value = '';
    input.style.height = 'auto';
    addMsg('user', txt);
    await enviarClaude(txt);
  }

  sendBtn.addEventListener('click', enviar);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 90) + 'px';
  });

  document.querySelectorAll('.fc-chip').forEach(c =>
    c.addEventListener('click', () => { input.value = c.dataset.q; enviar(); })
  );

  // ── Arrastrar el orb ──────────────────────────────────────
  let dragStartX, dragStartY, hasMoved;

  orb.addEventListener('mousedown', e => {
    if (e.target === animBtn) return;
    arrastrandoOrb = false; hasMoved = false;
    dragStartX = e.clientX; dragStartY = e.clientY;
    const rect = root.getBoundingClientRect();
    orbOffX = e.clientX - rect.left;
    orbOffY = e.clientY - rect.top;

    function onMove(ev) {
      if (Math.abs(ev.clientX - dragStartX) > 5 || Math.abs(ev.clientY - dragStartY) > 5) {
        arrastrandoOrb = true; hasMoved = true;
      }
      if (!arrastrandoOrb) return;
      const maxX = window.innerWidth - root.offsetWidth;
      const maxY = window.innerHeight - root.offsetHeight;
      orbPosX = Math.max(0, Math.min(maxX, ev.clientX - orbOffX));
      orbPosY = Math.max(0, Math.min(maxY, ev.clientY - orbOffY));
      root.style.right = 'auto'; root.style.bottom = 'auto';
      root.style.left = orbPosX + 'px';
      root.style.top = orbPosY + 'px';
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (hasMoved) {
        localStorage.setItem(
          'fc_pos',
          JSON.stringify({
            xPercent: orbPosX / window.innerWidth,
            yPercent: orbPosY / window.innerHeight
          })
        );
        setTimeout(() => { arrastrandoOrb = false; }, 50);
      } else {
        arrastrandoOrb = false;
      }
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  // Restaurar posición
  const saved = JSON.parse(
    localStorage.getItem('fc_pos') || 'null'
  );

  if (saved?.xPercent !== undefined) {

    const x = saved.xPercent * window.innerWidth;
    const y = saved.yPercent * window.innerHeight;

    root.style.right = 'auto';
    root.style.bottom = 'auto';

    root.style.left = x + 'px';
    root.style.top = y + 'px';

    orbPosX = x;
    orbPosY = y;
  }
  if (!saved) {

    root.style.left = 'auto';
    root.style.top = 'auto';

    root.style.right = '5.5rem';
    root.style.bottom = '2.2rem';
  }

  // ── Notificación cuando está cerrado ─────────────────────
  function mostrarBadge() {
    if (!expandido) badge.style.display = 'block';
  }

  // ── Inicializar ───────────────────────────────────────────
  cargarStock().then(() => {
    addMsg('bot',
      '¡Hola! Soy el asistente de **Frío Cars** 🧊\n\n' +
      'Tengo acceso al inventario en tiempo real. Puedo cotizar, comparar precios con tiendas online y decirte qué hay disponible.\n\n' +
      '¿En qué te puedo ayudar?'
    );
    setTimeout(mostrarBadge, 3000);
  });

})();