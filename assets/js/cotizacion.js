// ══════════════════════════════════════════════════════
//  FRÍO CARS — cotizacion.js
// ══════════════════════════════════════════════════════

const API_BACKEND = "https://friocars-backend.onrender.com/api";

let tipoCotizacion = "AUTOMATICA";
let imagenesBase64 = [];
let ultimaCotizacion = null; // datos de la última generada


// ══════════════════════════════════════════════════════
//  TIPO
// ══════════════════════════════════════════════════════
function seleccionarTipo(tipo) {
  tipoCotizacion = tipo;
  document.getElementById("cardAutomatica").classList.toggle("activo", tipo === "AUTOMATICA");
  document.getElementById("cardManual").classList.toggle("activo", tipo === "MANUAL");
}


// ══════════════════════════════════════════════════════
//  IMÁGENES
// ══════════════════════════════════════════════════════
function previsualizarImagenes(input) {
  const grid = document.getElementById("previewGrid");
  const archivos = Array.from(input.files).slice(0, 5);
  imagenesBase64 = [];
  grid.innerHTML = "";

  archivos.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Full = e.target.result;
      const base64Data = base64Full.split(",")[1];
      imagenesBase64.push({ data: base64Data, mediaType: file.type, nombre: file.name });

      const wrap = document.createElement("div");
      wrap.className = "img-preview-item";
      wrap.id = `img-prev-${i}`;
      wrap.innerHTML = `
                <img src="${base64Full}" alt="Imagen ${i + 1}">
                <button onclick="eliminarImagen(${i})" title="Eliminar">✕</button>
            `;
      grid.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });
}

function eliminarImagen(index) {
  imagenesBase64.splice(index, 1);
  document.getElementById(`img-prev-${index}`)?.remove();
}


// ══════════════════════════════════════════════════════
//  GENERAR DIAGNÓSTICO IA
// ══════════════════════════════════════════════════════
async function generarDiagnostico() {

  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const vehiculo = document.getElementById("vehiculo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!nombre) { mostrarToast("Ingresa el nombre del cliente", "warn"); return; }
  if (!vehiculo) { mostrarToast("Ingresa el vehículo", "warn"); return; }
  if (!descripcion) { mostrarToast("Describe el problema", "warn"); return; }

  const btn = document.getElementById("btnGenerar");
  btn.disabled = true;
  btn.textContent = "⏳ Analizando con IA...";

  const resultadoEl = document.getElementById("resultadoIA");
  const contenidoEl = document.getElementById("contenidoIA");
  const tagsEl = document.getElementById("ia-tags");
  const costoBox = document.getElementById("costoBox");
  const clienteLabel = document.getElementById("ia-cliente-label");
  const accionesEl = document.getElementById("ia-acciones");

  resultadoEl.classList.add("visible");
  contenidoEl.innerHTML = `<span style="color:var(--muted);font-size:.85rem">  La IA está analizando la información y las imágenes...</span>`;
  tagsEl.innerHTML = "";
  costoBox.style.display = "none";
  if (accionesEl) accionesEl.style.display = "none";
  clienteLabel.textContent = `Cliente: ${nombre} · ${vehiculo}${telefono ? " · " + telefono : ""}`;

  // Construir mensaje con imágenes
  const contenidoMensaje = [];
  imagenesBase64.forEach((img, i) => {
    contenidoMensaje.push({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.data }
    });
    contenidoMensaje.push({ type: "text", text: `Imagen ${i + 1}: ${img.nombre}` });
  });

  contenidoMensaje.push({
    type: "text",
    text: `Cliente: ${nombre}\nTeléfono: ${telefono || "No indicado"}\nVehículo: ${vehiculo}\n\nProblema descrito:\n"${descripcion}"\n\n${imagenesBase64.length > 0 ? `Se adjuntaron ${imagenesBase64.length} imagen(es) del vehículo.` : "No se adjuntaron imágenes."}\n\nGenera el diagnóstico completo.`
  });

  try {
    const response = await fetch(
      `${API_BACKEND}/cotizaciones/diagnostico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: `Eres el asistente de diagnóstico automotriz de Frío Cars, especializado en sistemas de aire acondicionado vehicular colombiano.

Analiza síntomas, descripción e imágenes del vehículo y genera un diagnóstico profesional.

ESTRUCTURA OBLIGATORIA DE RESPUESTA:
 DIAGNÓSTICO
[Explica qué le puede estar pasando al vehículo]

 SERVICIOS NECESARIOS
[Lista los servicios recomendados]

 REPUESTOS PROBABLES
[Partes que pueden necesitarse]

 COSTO ESTIMADO: $XXX.000 - $XXX.000 COP
[Rango de precio en pesos colombianos]

 URGENCIA: [Baja / Media / Alta]
[Justificación breve]

REGLAS:
- Responde siempre en español colombiano
- Sé directo y práctico
- Si hay imágenes, analízalas visualmente y menciona lo que ves
- El costo SIEMPRE debe incluir el patrón: $XXX.XXX - $XXX.XXX COP`,
        messages: [{ role: "user", content: contenidoMensaje }]
      })
    });

    const data = await response.json();
    const texto = data.content?.[0]?.text || "No se pudo obtener respuesta de la IA.";

    await renderStreamText(contenidoEl, texto);

    // Extraer costo
    const costoMatch = texto.match(/\$[\d.,]+\s*-\s*\$[\d.,]+\s*COP/i)
      || texto.match(/\$[\d.]+(?:\.\d{3})*(?:\s*COP)?/i);
    let costoTexto = costoMatch ? costoMatch[0] : "A consultar";
    let costoNum = 0;
    if (costoMatch) {
      const nums = costoMatch[0].replace(/[^0-9]/g, "");
      costoNum = parseInt(nums) || 0;
    }

    document.getElementById("costoValor").textContent = costoTexto;
    costoBox.style.display = "flex";

    // Tags
    const tags = extraerTags(texto);
    tagsEl.innerHTML = tags.map(t => `<span class="ia-tag">${t}</span>`).join("");

    // Guardar datos para acciones
    ultimaCotizacion = {
      nombre_cliente: nombre,
      telefono,
      vehiculo_texto: vehiculo,
      descripcion,
      diagnostico_ia: texto,
      costo_estimado: costoNum,
      tipo: "AUTOMATICA",
      imagen_count: imagenesBase64.length,
      costoTexto
    };

    // Mostrar acciones
    if (accionesEl) accionesEl.style.display = "flex";

    // Guardar automáticamente en BD
    await guardarCotizacionBD(ultimaCotizacion);
    mostrarToast("Diagnóstico generado y guardado ✓", "ok");

  } catch (err) {
    console.error("Error IA:", err);
    contenidoEl.innerHTML = `<span style="color:#dc2626">⚠️ Error al conectar con la IA. Intenta de nuevo.</span>`;
    mostrarToast("Error al generar diagnóstico", "error");
  }

  btn.disabled = false;
  btn.textContent = " Generar Diagnóstico IA";
}


// ══════════════════════════════════════════════════════
//  RENDER CON EFECTO ESCRITURA
// ══════════════════════════════════════════════════════
async function renderStreamText(el, texto) {
  el.innerHTML = "";
  const cursor = document.createElement("span");
  cursor.className = "cursor-blink";
  el.appendChild(cursor);

  const chars = texto.split("");
  let acumulado = "";
  for (let i = 0; i < chars.length; i++) {
    acumulado += chars[i];
    el.childNodes[0].textContent = acumulado;
    const delay = i < 20 ? 12 : i < 100 ? 5 : 2;
    if (i % 4 === 0) await sleep(delay);
  }
  cursor.remove();
  // Formato final con saltos de línea
  el.innerHTML = texto
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }


// ══════════════════════════════════════════════════════
//  TAGS
// ══════════════════════════════════════════════════════
function extraerTags(texto) {
  const mapa = {
    "compresor": "🔩 Compresor",
    "gas": "💨 Gas refrigerante",
    "fuga": "🔍 Fuga detectada",
    "filtro": "🧹 Filtro",
    "ventilador": "🌀 Ventilador",
    "eléctric": "⚡ Eléctrico",
    "termostato": "🌡️ Termostato",
    "condensador": "❄️ Condensador",
    "evaporador": "💧 Evaporador",
    "correa": "⚙️ Correa",
    "urgencia alta": "🔴 Alta urgencia",
    "urgencia media": "🟡 Media urgencia",
    "urgencia baja": "🟢 Baja urgencia",
  };
  const tags = [];
  const bajo = texto.toLowerCase();
  for (const [clave, etiqueta] of Object.entries(mapa)) {
    if (bajo.includes(clave)) tags.push(etiqueta);
  }
  return tags.slice(0, 6);
}


// ══════════════════════════════════════════════════════
//  GUARDAR EN BD
// ══════════════════════════════════════════════════════
async function guardarCotizacionBD(datos) {
  try {
    const res = await fetch(`${API_BACKEND}/cotizaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      const saved = await res.json();
      if (ultimaCotizacion) ultimaCotizacion.id = saved.id_cotizacion;
    }
  } catch (e) {
    console.warn("No se pudo guardar en BD:", e.message);
  }
}


// ══════════════════════════════════════════════════════
//  IMPRIMIR COTIZACIÓN
// ══════════════════════════════════════════════════════
function imprimirCotizacion() {
  if (!ultimaCotizacion) { mostrarToast("Primero genera un diagnóstico", "warn"); return; }
  const { nombre_cliente, telefono, vehiculo_texto, descripcion, diagnostico_ia, costoTexto, imagen_count } = ultimaCotizacion;
  const fecha = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

  const ventana = window.open("", "_blank");
  ventana.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Cotización — Frío Cars</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:#0f172a;padding:2.5rem;font-size:14px}
  .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:1.2rem;margin-bottom:1.5rem}
  .brand{font-size:1.6rem;font-weight:800;color:#1d4ed8}
  .brand span{color:#0f172a}
  .brand-sub{font-size:.75rem;color:#64748b;font-weight:500}
  .badge{background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;border-radius:12px;padding:.4rem 1rem;font-size:.78rem;font-weight:700}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;background:#f8fafc;border-radius:12px;padding:1.2rem;margin-bottom:1.5rem;border:1px solid #e2e8f0}
  .info-item label{font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:.2rem}
  .info-item span{font-size:.9rem;font-weight:600;color:#0f172a}
  .section-title{font-size:.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.7rem;display:flex;align-items:center;gap:.4rem}
  .diagnostico{background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:1.2rem;margin-bottom:1.2rem;line-height:1.8;white-space:pre-wrap;font-size:.88rem}
  .costo-box{background:#f0fdf4;border:2px solid #bbf7d0;border-radius:14px;padding:1.2rem 1.6rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
  .costo-label{font-size:.72rem;font-weight:700;color:#16a34a}
  .costo-val{font-size:1.8rem;font-weight:800;color:#16a34a}
  .footer{border-top:1px solid #e2e8f0;padding-top:1rem;margin-top:1rem;text-align:center;color:#94a3b8;font-size:.72rem}
  .validez{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:.6rem 1rem;font-size:.78rem;color:#92400e;font-weight:600;margin-bottom:1.2rem}
  @media print{body{padding:1.5rem}.no-print{display:none}}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">Frío <span>Cars</span></div>
    <div class="brand-sub">Sistema Automotriz · Diagnóstico IA</div>
  </div>
  <div>
    <div class="badge">🤖 Cotización Inteligente</div>
    <div style="font-size:.72rem;color:#64748b;text-align:right;margin-top:.3rem">${fecha}</div>
  </div>
</div>

<div class="info-grid">
  <div class="info-item"><label>Cliente</label><span>${nombre_cliente}</span></div>
  <div class="info-item"><label>Teléfono</label><span>${telefono || "No indicado"}</span></div>
  <div class="info-item" style="grid-column:1/-1"><label>Vehículo</label><span>${vehiculo_texto}</span></div>
  <div class="info-item" style="grid-column:1/-1"><label>Problema reportado</label><span>${descripcion}</span></div>
  ${imagen_count > 0 ? `<div class="info-item"><label>Imágenes analizadas</label><span>${imagen_count} imagen(es)</span></div>` : ""}
</div>

<p class="section-title">📋 Diagnóstico generado por IA</p>
<div class="diagnostico">${diagnostico_ia.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>

<div class="costo-box">
  <div><div class="costo-label">Costo estimado del servicio</div><div class="costo-val">${costoTexto}</div></div>
  <div style="text-align:right;font-size:.7rem;color:#64748b">*Precio referencial<br>sujeto a revisión técnica</div>
</div>

<div class="validez">⏱️ Validez de esta cotización: 72 horas desde la fecha de emisión</div>

<div class="footer">
  <p style="font-weight:700;color:#1d4ed8;margin-bottom:.3rem">Frío Cars — Sistema Automotriz</p>
  <p>Diagnóstico generado automáticamente por Inteligencia Artificial · ${fecha}</p>
</div>

<div class="no-print" style="text-align:center;margin-top:2rem;display:flex;gap:1rem;justify-content:center">
  <button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;border-radius:12px;padding:.8rem 2rem;font-size:.9rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">🖨️ Imprimir / Guardar PDF</button>
  <button onclick="window.close()" style="background:#f1f5f9;color:#64748b;border:1.5px solid #e2e8f0;border-radius:12px;padding:.8rem 2rem;font-size:.9rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">✕ Cerrar</button>
</div>
</body>
</html>`);
  ventana.document.close();
  setTimeout(() => ventana.focus(), 300);
}


// ══════════════════════════════════════════════════════
//  DESCARGAR PDF
// ══════════════════════════════════════════════════════
function descargarPDF() {
  if (!ultimaCotizacion) { mostrarToast("Primero genera un diagnóstico", "warn"); return; }
  // Abrir ventana de impresión y el navegador permite guardar como PDF
  imprimirCotizacion();
  mostrarToast("En la ventana de impresión selecciona 'Guardar como PDF'", "ok");
}


// ══════════════════════════════════════════════════════
//  ENVIAR SOLICITUD (tipo MANUAL)
// ══════════════════════════════════════════════════════
async function enviarSolicitud() {
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const vehiculo = document.getElementById("vehiculo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!nombre || !vehiculo || !descripcion) {
    mostrarToast("Completa los campos requeridos", "warn");
    return;
  }

  const btn = document.getElementById("btnEnviar");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  await guardarCotizacionBD({
    nombre_cliente: nombre, telefono, vehiculo_texto: vehiculo,
    descripcion, diagnostico_ia: "", costo_estimado: 0,
    tipo: "MANUAL", imagen_count: imagenesBase64.length
  });

  mostrarToast("Solicitud enviada. Un técnico te contactará pronto ✓", "ok");
  btn.disabled = false;
  btn.textContent = " Enviar Solicitud";
}


// ══════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════
function mostrarToast(msg, tipo) {
  tipo = tipo || "ok";
  const c = {
    ok: { bg: "var(--green-lt)", border: "var(--green-border)", text: "var(--green)", icon: "✓" },
    warn: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", icon: "⚠" },
    error: { bg: "#fff1f2", border: "#fecdd3", text: "#e11d48", icon: "✕" }
  }[tipo] || {};
  document.getElementById("fc-toast")?.remove();
  const t = document.createElement("div");
  t.id = "fc-toast";
  t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;max-width:340px`;
  t.innerHTML = `<span>${c.icon}</span>${msg}`;
  if (!document.getElementById("toast-style")) {
    const s = document.createElement("style");
    s.id = "toast-style";
    s.textContent = `@keyframes slideToast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}