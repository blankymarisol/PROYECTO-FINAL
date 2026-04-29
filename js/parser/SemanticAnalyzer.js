"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  parser/SemanticAnalyzer.js — EulerCode
 *  Analizador Semántico
 *
 *  PROPÓSITO:
 *  Verificar que el programa sea SIGNIFICATIVO, no solo sintácticamente
 *  correcto. Detecta errores que la gramática no puede capturar:
 *
 *    ✗ Variable declarada dos veces
 *    ✗ División por cero (literal)
 *    ✗ show() sin argumentos
 *    ⚠ Variable declarada pero nunca usada (advertencia)
 *
 *  NOTA: Trabaja directamente sobre el array de tokens (no sobre el AST).
 *  Un analizador semántico completo usaría el árbol y manejaría scopes.
 * ═══════════════════════════════════════════════════════════════════
 */

class SemanticAnalyzer {

  /* ─────────────────────────────────────────────────────────────────
     constructor(tokens)
     Recibe los tokens, filtra errores léxicos y ejecuta el análisis.
   ───────────────────────────────────────────────────────────────── */
  constructor(tokens) {
    this.tokens    = tokens.filter(t => t.type !== TYPE.ERR);
    this.errors    = [];  // errores que impiden la ejecución correcta
    this.warnings  = [];  // advertencias (el programa puede correr)
    this.varTable  = {};  // nombre → { tipo, line, usada }
    this.funcTable = {};  // nombre → { line }

    this._analyzeTokens();
  }

  /* ─────────────────────────────────────────────────────────────────
     _analyzeTokens()
     Recorre los tokens aplicando todas las verificaciones semánticas.
   ───────────────────────────────────────────────────────────────── */
  _analyzeTokens() {
    const toks = this.tokens;

    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];

      /* Verificación 1 — Declaración de variable: tipo + identificador
         Registrar en varTable; error si ya existe (redeclaración). */
      if (t.type === TYPE.KW && ["num","dec","bool"].includes(t.value)) {
        const next = toks[i + 1];
        if (next?.type === TYPE.ID) {
          if (this.varTable[next.value]) {
            this.errors.push(
              `Línea ${next.line}: Variable "${next.value}" ya fue declarada ` +
              `en línea ${this.varTable[next.value].line}`
            );
          } else {
            this.varTable[next.value] = { tipo: t.value, line: next.line, usada: false };
          }
        }
      }

      /* Verificación 2 — Definición de función: definir + identificador
         Error si la función ya fue definida antes. */
      if (t.value === "definir" && toks[i + 1]?.type === TYPE.ID) {
        const fname = toks[i + 1].value;
        if (this.funcTable[fname]) {
          this.errors.push(`Línea ${toks[i+1].line}: Función "${fname}" ya fue definida`);
        } else {
          this.funcTable[fname] = { line: toks[i + 1].line };
        }
      }

      /* Verificación 3 — Uso de variable: marcar como usada
         Solo si el identificador NO aparece justo después de un tipo
         (para no confundir la declaración con el uso). */
      if (t.type === TYPE.ID) {
        const prev       = toks[i - 1];
        const esDecl     = prev?.type === TYPE.KW &&
                           ["num","dec","bool","definir"].includes(prev.value);
        if (!esDecl && this.varTable[t.value] !== undefined) {
          this.varTable[t.value].usada = true;
        }
      }
    }

    /* Verificación 4 — Variables declaradas pero nunca usadas
       Se hace DESPUÉS del loop para tener todos los usos registrados. */
    for (const [name, info] of Object.entries(this.varTable)) {
      if (!info.usada) {
        this.warnings.push(
          `Advertencia — Línea ${info.line}: ` +
          `Variable "${name}" declarada pero nunca utilizada`
        );
      }
    }

    /* Verificación 5 — División por cero literal: / seguido de 0 */
    for (let i = 0; i < toks.length; i++) {
      if (
        toks[i].type === TYPE.ARITH && toks[i].value === "/" &&
        toks[i+1]?.type === TYPE.NUM  && toks[i+1]?.value === "0"
      ) {
        this.errors.push(`Línea ${toks[i].line}: División por cero detectada`);
      }
    }

    /* Verificación 6 — show() vacío: show seguido de ( ) */
    for (let i = 0; i < toks.length; i++) {
      if (
        toks[i].value   === "show" &&
        toks[i+1]?.value === "("   &&
        toks[i+2]?.value === ")"
      ) {
        this.errors.push(`Línea ${toks[i].line}: 'show' requiere al menos un argumento`);
      }
    }
  }

  /* Retornar todos los resultados del análisis */
  getResults() {
    return {
      errors:    this.errors,
      warnings:  this.warnings,
      varTable:  this.varTable,
      funcTable: this.funcTable,
    };
  }
}