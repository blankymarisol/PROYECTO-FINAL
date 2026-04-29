"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  render/errors.js — EulerCode
 *  Renderizado de las tablas de errores
 *
 *  CONTIENE:
 *    renderErrorTable()   → Tabla de errores LÉXICOS (del Lexer)
 *    renderSyntaxErrors() → Tabla de errores SINTÁCTICOS y SEMÁNTICOS
 * ═══════════════════════════════════════════════════════════════════
 */

/*
 * renderErrorTable(errTable, wrapperId, countId)
 * Generar la tabla de ERRORES LÉXICOS detectados por el Lexer.
 *
 * COLUMNAS: # | Lexema | Tipo de error | Descripción | Posición
 */
function renderErrorTable(errTable, wrapperId = "errWrap", countId = "errCount") {
  const wrap       = $(wrapperId);
  const countBadge = $(countId);

  countBadge.textContent = errTable.length ? `${errTable.length} errores` : "";

  // Sin errores → mostrar mensaje de éxito en verde
  if (!errTable.length) {
    wrap.innerHTML = `<div class="err-ok"><span>✓</span> Sin errores léxicos detectados</div>`;
    return;
  }

  // Construir una fila por cada error
  const rows = errTable.map(err => `
    <tr>
      <td>${err.id}</td>
      <td class="td-err" style="font-weight:500">${esc(err.lexema)}</td>
      <td>
        <span class="err-type-badge"
              style="color:${ERR_COLOR[err.errType] ?? "var(--coral)"}">
          ${esc(err.errType)}
        </span>
      </td>
      <td style="color:var(--tx-soft);font-size:.75rem">${esc(err.detail)}</td>
      <td style="color:var(--tx-muted)">Línea ${err.line}, Col ${err.col}</td>
    </tr>`);

  wrap.innerHTML = `
    <div class="sym-wrap">
      <table class="sym-table">
        <thead>
          <tr>
            <th>#</th><th>Lexema</th><th>Tipo de error</th>
            <th>Descripción</th><th>Posición</th>
          </tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;
}


/*
 * renderSyntaxErrors(parseErrors, semResults)
 * Generar la tabla de ERRORES SINTÁCTICOS y SEMÁNTICOS combinados.
 *
 * Combina dos fuentes:
 *   parseErrors → array de strings del Parser (falta ;, falta fin, etc.)
 *   semResults  → { errors[], warnings[] } del SemanticAnalyzer
 *
 * Los ERRORES se muestran en rojo (coral).
 * Las ADVERTENCIAS se muestran en ámbar/amarillo.
 */
function renderSyntaxErrors(parseErrors, semResults) {
  const wrap       = $("semWrap");
  const countBadge = $("semCount");
  if (!wrap) return;

  // Combinar errores de ambas fuentes en un solo array
  const allErrors   = [...(parseErrors || []), ...(semResults.errors || [])];
  const allWarnings = semResults.warnings || [];
  const total       = allErrors.length + allWarnings.length;

  countBadge.textContent = total ? `${total} avisos` : "";

  // Sin problemas → mensaje de éxito verde
  if (!allErrors.length && !allWarnings.length) {
    wrap.innerHTML = `<div class="err-ok"><span>✓</span> Sin errores sintácticos ni semánticos detectados</div>`;
    return;
  }

  // Filas de errores (color coral/rojo)
  const errRows = allErrors.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="err-type-badge" style="color:var(--coral)">Error</span></td>
      <td style="color:var(--tx-soft);font-size:.77rem">${esc(e)}</td>
    </tr>`);

  // Filas de advertencias (color ámbar); índice continúa desde el fin de errores
  const warnRows = allWarnings.map((w, i) => `
    <tr>
      <td>${allErrors.length + i + 1}</td>
      <td><span class="err-type-badge" style="color:var(--amber)">Advertencia</span></td>
      <td style="color:var(--tx-soft);font-size:.77rem">${esc(w)}</td>
    </tr>`);

  wrap.innerHTML = `
    <div class="sym-wrap">
      <table class="sym-table">
        <thead>
          <tr><th>#</th><th>Tipo</th><th>Descripción</th></tr>
        </thead>
        <tbody>${[...errRows, ...warnRows].join("")}</tbody>
      </table>
    </div>`;
}