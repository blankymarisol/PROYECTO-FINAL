"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  render/utils.js — EulerCode
 *  Utilidades compartidas por todos los módulos de renderizado
 * ═══════════════════════════════════════════════════════════════════
 */

/* Atajo para document.getElementById — evita repetir el nombre largo */
const $ = id => document.getElementById(id);

/*
 * esc(str) — Escapar caracteres especiales de HTML
 * Evita que valores como "<-" rompan el HTML al inyectarlos con innerHTML.
 *   &  →  &amp;   <  →  &lt;   >  →  &gt;
 */
const esc = str =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/*
 * emptyState(icon, message)
 * HTML del estado vacío de un panel (icono + mensaje descriptivo).
 * Se muestra antes de que el usuario analice código.
 */
function emptyState(icon, message) {
  return `<div class="empty">
    <span class="empty-icon">${icon}</span>
    <span>${message}</span>
  </div>`;
}

/*
 * pillClass(type)
 * Clase CSS para la "pill" (etiqueta de tipo) de un token.
 * Cada tipo de token tiene su propio color definido en styles.css.
 */
function pillClass(type) {
  const map = {
    [TYPE.KW]:     "pill-kw",
    [TYPE.ID]:     "pill-id",
    [TYPE.NUM]:    "pill-num",
    [TYPE.DEC]:    "pill-dec",
    [TYPE.STR]:    "pill-str",
    [TYPE.ARITH]:  "pill-arith",
    [TYPE.ASSIGN]: "pill-assign",
    [TYPE.REL]:    "pill-rel",
    [TYPE.LOGIC]:  "pill-logic",
    [TYPE.DELIM]:  "pill-delim",
    [TYPE.ERR]:    "pill-err",
  };
  return map[type] ?? "pill-id"; // "pill-id" como clase por defecto
}

/*
 * tdClass(type)
 * Clase CSS para colorear celdas <td> en las tablas.
 * Decimales y enteros comparten color (td-num).
 */
function tdClass(type) {
  const map = {
    [TYPE.KW]:     "td-kw",
    [TYPE.ID]:     "td-id",
    [TYPE.NUM]:    "td-num",
    [TYPE.DEC]:    "td-num",   // mismo color que entero
    [TYPE.STR]:    "td-str",
    [TYPE.ARITH]:  "td-arith",
    [TYPE.ASSIGN]: "td-arith", // mismo grupo visual
    [TYPE.REL]:    "td-rel",
    [TYPE.LOGIC]:  "td-rel",
    [TYPE.DELIM]:  "td-rel",
    [TYPE.ERR]:    "td-err",
  };
  return map[type] ?? "";
}

/*
 * clearUI()
 * Restablecer todos los paneles a su estado vacío inicial.
 * Llamada por clearAll() en app.js.
 */
function clearUI() {
  $("codeInput").value = "";
  $("tokensGrid").innerHTML = emptyState("◎", "Esperando código fuente...");
  $("errWrap").innerHTML    = emptyState("⚠", "Los errores aparecerán aquí...");
  $("symWrap").innerHTML    = emptyState("⊡", "La tabla se generará al analizar...");
  $("statsWrap").innerHTML  = "";
  $("tokCount").textContent = "";
  $("errCount").textContent = "";
  $("symCount").textContent = "";
}