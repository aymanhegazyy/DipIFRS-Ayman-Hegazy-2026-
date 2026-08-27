/* DipIFRS CBE Scratchpad — local, offline-friendly and safe calculator */
(function () {
  'use strict';

  function evaluateArithmetic(expression) {
    const source = String(expression || '').replace(/,/g, '').trim();
    if (!source || !/^[0-9+\-*/().\s]+$/.test(source)) throw new Error('Invalid expression');

    let position = 0;
    function skipSpaces() {
      while (/\s/.test(source[position] || '')) position += 1;
    }
    function number() {
      skipSpaces();
      const start = position;
      while (/[0-9.]/.test(source[position] || '')) position += 1;
      const value = Number(source.slice(start, position));
      if (!Number.isFinite(value)) throw new Error('Invalid number');
      return value;
    }
    function factor() {
      skipSpaces();
      if (source[position] === '+') { position += 1; return factor(); }
      if (source[position] === '-') { position += 1; return -factor(); }
      if (source[position] === '(') {
        position += 1;
        const value = sum();
        skipSpaces();
        if (source[position] !== ')') throw new Error('Missing closing parenthesis');
        position += 1;
        return value;
      }
      return number();
    }
    function product() {
      let value = factor();
      while (true) {
        skipSpaces();
        const operator = source[position];
        if (operator !== '*' && operator !== '/') break;
        position += 1;
        const right = factor();
        if (operator === '/' && right === 0) throw new Error('Division by zero');
        value = operator === '*' ? value * right : value / right;
      }
      return value;
    }
    function sum() {
      let value = product();
      while (true) {
        skipSpaces();
        const operator = source[position];
        if (operator !== '+' && operator !== '-') break;
        position += 1;
        const right = product();
        value = operator === '+' ? value + right : value - right;
      }
      return value;
    }

    const result = sum();
    skipSpaces();
    if (position !== source.length || !Number.isFinite(result)) throw new Error('Invalid expression');
    return result;
  }

  function initCBEScratchpad() {
    if (document.getElementById('cbe-scratchpad') || !document.body) return;

    const html = `
      <style>
        #cbe-scratchpad-trigger{position:fixed;right:20px;bottom:20px;z-index:999;width:52px;height:52px;border:0;border-radius:50%;background:var(--rust,#9C4632);color:#fff;box-shadow:0 5px 16px rgba(0,0,0,.28);cursor:pointer;font-size:23px}
        #cbe-scratchpad{position:fixed;right:20px;bottom:20px;z-index:1000;width:min(390px,calc(100vw - 30px));height:min(520px,calc(100vh - 35px));display:none;flex-direction:column;overflow:hidden;background:var(--paper,#EFF2EC);color:var(--ink,#1E2A26);border:2px solid var(--teal,#2E6E68);border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.3)}
        #cbe-scratchpad.open{display:flex}
        .cbe-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--teal,#2E6E68);color:#fff;font-weight:700}
        .cbe-head button{border:0;background:transparent;color:#fff;cursor:pointer;font-size:22px;line-height:1}
        .cbe-body{display:flex;flex:1;min-height:0;flex-direction:column;gap:12px;padding:13px}
        #cbe-notes{flex:1;min-height:150px;width:100%;resize:none;padding:11px;border:1px solid var(--line,#CBD4C6);border-radius:8px;background:var(--card,#fff);color:var(--ink,#1E2A26);font:14px/1.55 var(--font-body,Arial,sans-serif);outline:none}
        #cbe-notes:focus,#cbe-calc:focus{border-color:var(--teal,#2E6E68);box-shadow:0 0 0 2px rgba(46,110,104,.14)}
        .cbe-calc{padding:11px;border:1px solid var(--line,#CBD4C6);border-radius:8px;background:var(--card,#fff)}
        .cbe-label{display:block;margin-bottom:7px;font:700 11px var(--font-mono,monospace);color:var(--teal,#2E6E68);text-transform:uppercase;letter-spacing:.04em}
        #cbe-calc{width:100%;padding:9px;border:1px solid var(--line,#CBD4C6);border-radius:6px;background:var(--paper,#EFF2EC);color:var(--ink,#1E2A26);font:14px var(--font-mono,monospace);outline:none}
        #cbe-result{min-height:22px;margin-top:8px;text-align:right;color:var(--rust,#9C4632);font:700 14px var(--font-mono,monospace)}
        .cbe-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-top:1px solid var(--line,#CBD4C6);font:10px var(--font-mono,monospace);color:var(--ink-soft,#4A5D56)}
        .cbe-clear{border:1px solid var(--line,#CBD4C6);border-radius:14px;padding:5px 9px;background:transparent;color:inherit;cursor:pointer;font:inherit}
        @media(max-width:520px){#cbe-scratchpad-trigger{right:15px;bottom:15px}#cbe-scratchpad{right:15px;bottom:15px;width:calc(100vw - 30px);height:min(560px,calc(100vh - 30px))}}
      </style>
      <button id="cbe-scratchpad-trigger" type="button" aria-label="Open CBE Scratchpad" title="Open CBE Scratchpad">📝</button>
      <section id="cbe-scratchpad" aria-label="CBE Scratchpad">
        <header class="cbe-head"><span>📝 CBE Scratchpad</span><button id="cbe-close" type="button" aria-label="Close">&times;</button></header>
        <div class="cbe-body">
          <textarea id="cbe-notes" placeholder="Write your answer structure, workings or exam notes here..."></textarea>
          <div class="cbe-calc">
            <label class="cbe-label" for="cbe-calc">Quick calculation</label>
            <input id="cbe-calc" type="text" inputmode="decimal" autocomplete="off" placeholder="Example: (5000 * 0.8) / 2">
            <div id="cbe-result" aria-live="polite">Result: —</div>
          </div>
        </div>
        <footer class="cbe-foot"><span>Saved on this device automatically</span><button class="cbe-clear" id="cbe-clear" type="button">Clear notes</button></footer>
      </section>`;

    document.body.insertAdjacentHTML('beforeend', html);
    const trigger = document.getElementById('cbe-scratchpad-trigger');
    const panel = document.getElementById('cbe-scratchpad');
    const close = document.getElementById('cbe-close');
    const notes = document.getElementById('cbe-notes');
    const calc = document.getElementById('cbe-calc');
    const result = document.getElementById('cbe-result');
    const clear = document.getElementById('cbe-clear');
    const notesKey = 'dipifrs-cbe-notes-v2';

    try { notes.value = localStorage.getItem(notesKey) || ''; } catch (error) { /* storage may be unavailable */ }
    notes.addEventListener('input', function () {
      try { localStorage.setItem(notesKey, notes.value); } catch (error) { /* ignore storage errors */ }
    });

    function openPanel() {
      panel.classList.add('open');
      trigger.style.display = 'none';
      notes.focus();
    }
    function closePanel() {
      panel.classList.remove('open');
      trigger.style.display = 'block';
    }
    trigger.addEventListener('click', openPanel);
    close.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
    clear.addEventListener('click', function () {
      if (!window.confirm('Clear all saved scratchpad notes?')) return;
      notes.value = '';
      try { localStorage.removeItem(notesKey); } catch (error) { /* ignore storage errors */ }
      notes.focus();
    });
    calc.addEventListener('input', function () {
      if (!calc.value.trim()) { result.textContent = 'Result: —'; return; }
      try {
        const value = evaluateArithmetic(calc.value);
        result.textContent = 'Result: ' + (Number.isInteger(value) ? value : value.toFixed(2));
      } catch (error) {
        result.textContent = 'Result: check expression';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCBEScratchpad);
  else initCBEScratchpad();
})();
