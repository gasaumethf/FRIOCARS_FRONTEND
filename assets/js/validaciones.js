// ══════════════════════════════════════════════════════
//  FRÍO CARS — validaciones.js
//  Restringe lo que se puede escribir en un campo:
//    <input data-solo="letras">   → letras (tildes, ñ) y espacios
//    <input data-solo="numeros">  → solo dígitos
//  Funciona también con campos creados dinámicamente (modales).
//  Al bloquear un carácter dispara el evento "solo:bloqueado".
// ══════════════════════════════════════════════════════
(function () {
  if (window.__fcValidaciones) return;
  window.__fcValidaciones = true;

  const REGLAS = {
    letras: { permitido: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]*$/, invalido: /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g },
    numeros: { permitido: /^[0-9]*$/, invalido: /[^0-9]/g },
  };

  function regla(el) {
    return el && el.dataset ? REGLAS[el.dataset.solo] : null;
  }

  function avisar(el) {
    el.dispatchEvent(new CustomEvent('solo:bloqueado', { bubbles: true }));
  }

  // Bloquea el carácter antes de que aparezca en el campo
  document.addEventListener('beforeinput', e => {
    const r = regla(e.target);
    if (!r || e.data == null) return;
    if (r.permitido.test(e.data)) return;

    // Inserta solo la parte válida (ej. al pegar "José 99" queda "José ")
    e.preventDefault();
    const el = e.target;
    const valido = e.data.replace(r.invalido, '');
    if (valido) {
      try {
        el.setRangeText(valido, el.selectionStart, el.selectionEnd, 'end');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } catch { /* campos sin selección: el respaldo de "input" limpia */ }
    }
    avisar(el);
  }, true);

  // Respaldo: limpia lo que llegue por pegar, autocompletar o navegadores sin beforeinput
  document.addEventListener('input', e => {
    const el = e.target;
    const r = regla(el);
    if (!r) return;
    let limpio = el.value.replace(r.invalido, '');
    if (el.dataset.solo === 'letras') limpio = limpio.replace(/ {2,}/g, ' ').replace(/^ /, '');
    if (limpio !== el.value) {
      el.value = limpio;
      avisar(el);
    }
  }, true);
})();
