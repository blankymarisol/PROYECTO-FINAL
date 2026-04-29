"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  render/symbols.js — EulerCode
 *  Renderizado de la Tabla de Símbolos y las Estadísticas
 *
 *  CONTIENE:
 *    renderSymbols()         → coordina tabla de símbolos + estadísticas
 *    _renderSymbolsTable()   → genera las filas de la tabla de símbolos
 *    _renderStats()          → genera las tarjetas de métricas
 *
 *  COLUMNAS de la tabla de símbolos:
 *    # | Lexema | Tipo de token | Categoría | 1ª línea | Ocurrencias
 * ═══════════════════════════════════════════════════════════════════
 */

/*
 * renderSymbols(symbols, tokens, errors)
 * Función coordinadora: llama a las dos funciones privadas.
 *
 * PARÁMETROS:
 *   symbols → array de símbolos únicos de la tabla del Lexer
 *   tokens  → array completo de tokens (para calcular estadísticas)
 *   errors  → array de errores en texto (para el conteo en stats)
 */
function renderSymbols(symbols, tokens, errors) {
  const wrap       = $("symWrap");
  const countBadge = $("symCount");
  const statsWrap  = $("statsWrap");

  countBadge.textContent = symbols.length ? `${symbols.length} entradas` : "";

  // Sin símbolos → estado vacío y estadísticas limpias
  if (!symbols.length) {
    wrap.innerHTML      = `<div class="empty"><span class="empty-icon">⊡</span><span>La tabla se generará al analizar...</span></div>`;
    statsWrap.innerHTML = "";
    return;
  }

  _renderStats(tokens, errors, statsWrap);   // tarjetas de métricas
  _renderSymbolsTable(symbols, wrap);        // tabla de símbolos
}


/*
 * _renderStats(tokens, errors, container)   [función privada]
 * Generar las tarjetas de métricas con conteos por categoría.
 *
 * Usa una función interna count(type) para filtrar y contar
 * tokens de un tipo específico de forma concisa.
 */
function _renderStats(tokens, errors, container) {
  // Contar cuántos tokens hay de cada tipo
  const count = type => tokens.filter(t => t.type === type).length;

  const stats = [
    { val: tokens.length,                                                           lbl: "Total",      cls: "stat-total", color: "var(--gold)"    },
    { val: count(TYPE.KW),                                                          lbl: "Reservadas", cls: "stat-kw",    color: "var(--t-kw)"    },
    { val: count(TYPE.ID),                                                          lbl: "Identif.",   cls: "stat-id",    color: "var(--t-id)"    },
    { val: count(TYPE.NUM) + count(TYPE.DEC),                                       lbl: "Números",    cls: "stat-num",   color: "var(--t-num)"   },
    { val: count(TYPE.STR),                                                         lbl: "Cadenas",    cls: "stat-str",   color: "var(--t-str)"   },
    { val: count(TYPE.ARITH)+count(TYPE.ASSIGN)+count(TYPE.REL)+count(TYPE.LOGIC),  lbl: "Operadores", cls: "stat-ops",   color: "var(--t-arith)" },
    { val: errors.length,                                                           lbl: "Errores",    cls: "stat-err",   color: "var(--t-err)"   },
  ];

  const chips = stats.map(s => `
    <div class="stat-card ${s.cls}">
      <div class="stat-n" style="color:${s.color}">${s.val}</div>
      <div class="stat-lbl">${s.lbl}</div>
    </div>`);

  container.innerHTML = `<div class="stats-row">${chips.join("")}</div>`;
}


/*
 * _renderSymbolsTable(symbols, container)   [función privada]
 * Generar la tabla HTML de la Tabla de Símbolos.
 * Los símbolos se ordenan por ID (orden de primera aparición).
 */
function _renderSymbolsTable(symbols, container) {
  const rows = symbols
    .sort((a, b) => a.id - b.id) // mantener orden de aparición en el código
    .map(sym => `
      <tr>
        <td>${sym.id}</td>
        <td class="${tdClass(sym.type)}">${esc(sym.name)}</td>
        <td><span class="tok-pill ${pillClass(sym.type)}">${esc(sym.type)}</span></td>
        <td style="color:var(--tx-soft)">${esc(sym.category)}</td>
        <td style="color:var(--tx-soft)">${sym.line}</td>
        <td><span class="occ">${sym.occ}</span></td>
      </tr>`);

  container.innerHTML = `
    <div class="sym-wrap">
      <table class="sym-table">
        <thead>
          <tr>
            <th>#</th><th>Lexema</th><th>Tipo de token</th>
            <th>Categoría</th><th>1ª línea</th><th>Ocurrencias</th>
          </tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;
}