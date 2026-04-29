"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  render/tokens.js — EulerCode
 *  Renderizado del grid de tarjetas de tokens
 *
 *  PROPÓSITO:
 *  Generar y mostrar el panel "Tokens Detectados" con una tarjeta
 *  por cada token reconocido por el Lexer.
 * ═══════════════════════════════════════════════════════════════════
 */

/*
 * renderTokens(tokens)
 * Generar el grid de tarjetas animadas con todos los tokens.
 *
 * PARÁMETRO:
 *   tokens → array de objetos token producido por el Lexer
 */
function renderTokens(tokens) {
  const grid       = $("tokensGrid");
  const countBadge = $("tokCount");

  // Actualizar el badge de conteo
  countBadge.textContent = tokens.length ? `${tokens.length} tokens` : "";

  // Sin tokens → mostrar estado vacío
  if (!tokens.length) {
    grid.innerHTML = emptyState("◎", "Sin tokens detectados");
    return;
  }

  // Construir una tarjeta HTML por cada token
  const cards = tokens.map((token, index) => {

    // Delay de animación escalonado para efecto cascada
    const animDelay = Math.min(index * 8, 500);

    // Fila de error (solo si el token tiene un mensaje de error)
    const errorRow = token.extra
      ? `<div class="tok-err-msg">⚠ ${esc(token.extra)}</div>`
      : "";

    return `
      <div class="tok-card" style="animation-delay:${animDelay}ms">
        <span class="tok-index">${token.id}</span>
        <span class="tok-pill ${pillClass(token.type)}">${esc(token.type)}</span>
        <span class="tok-value" title="${esc(token.value)}">${esc(token.value)}</span>
        <span class="tok-line">L${token.line}:${token.col}</span>
        ${errorRow}
      </div>`;
  });

  // Inyectar todas las tarjetas de una sola vez (una operación de DOM)
  grid.innerHTML = cards.join("");
}