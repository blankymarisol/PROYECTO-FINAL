"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  app.js — EulerCode
 *  Punto de entrada principal 
 *
 *  PROPÓSITO:
 *  Coordinar todas las fases del compilador cuando el usuario
 *  presiona "Analizar". 
 *
 *  PIPELINE:
 *    1. Lexer (lexer.js)
 *       → tokeniza el código fuente
 *    2. Render léxico (render/tokens.js, render/errors.js, render/symbols.js)
 *       → muestra tokens, errores léxicos, tabla de símbolos
 *    3. Parser (parser/Parser.js vía parser/treeRenderer.js)
 *       → construye el árbol sintáctico y lo dibuja como SVG
 *    4. SemanticAnalyzer (parser/SemanticAnalyzer.js)
 *       → verifica variables, división por cero, etc.
 *    5. Render semántico (render/errors.js)
 *       → muestra errores sintácticos y semánticos combinados
 * ═══════════════════════════════════════════════════════════════════
 */


/* ── 5 programas CORRECTOS en EulerCode ─────────────────────── */
const SAMPLES_VALID = [

  `// Muestra 1 — Área de un círculo
// Demuestra: definir, dec, return, operadores aritméticos, show
definir areaCirculo(dec radio) inicio
    dec pi <- 3.1416;
    dec area <- pi * radio * radio;
    return area;
fin
dec r <- 5.0;
dec resultado <- areaCirculo(r);
show(resultado);`,

  `// Muestra 2 — Factorial con ciclo contar (for)
// Demuestra: num, contar, acumulador
num n <- 6;
num fact <- 1;
contar (i <- 1; i <= n; i <- i + 1) inicio
    fact <- fact * i;
fin
show(fact);`,

  `// Muestra 3 — Raíz cuadrada con condicional si/else
// Demuestra: si, else, raiz(), operadores relacionales
num x <- 25;
num y <- 16;
si (x > y) inicio
    dec res <- raiz(x);
    show(res);
else inicio
    dec res <- raiz(y);
    show(res);
fin`,

  `// Muestra 4 — Potencias de 2 con ciclo repetir (while)
// Demuestra: repetir, elevar(), condición, incremento
num base <- 2;
num exponente <- 1;
num limite <- 10;
repetir (exponente <= limite) inicio
    num potencia <- elevar(base, exponente);
    show(potencia);
    exponente <- exponente + 1;
fin`,

  `// Muestra 5 — MCD con el Algoritmo de Euler (Euclides)
// Demuestra: función recursiva, repetir, modulo()
definir mcd(num a, num b) inicio
    repetir (b != 0) inicio
        num temp <- b;
        b <- modulo(a, b);
        a <- temp;
    fin
    return a;
fin
num x <- 48;
num y <- 18;
num resultado <- mcd(x, y);
show(resultado);`,
];


/* ── 5 programas CON ERRORES intencionales ───────────────────── */
const SAMPLES_ERROR = [

  `// Error 1 — Léxico: token inválido + carácter desconocido
// "3variable" empieza con dígito → token inválido
// "@" no pertenece al alfabeto de EulerCode
num 3variable <- 10;
dec precio <- 99.99;
num total <- precio @ 3variable;
show(total);`,

  `// Error 2 — Léxico: identificador demasiado largo (>15 chars)
num resultado_de_la_operacion_matematica <- 100;
show(resultado_de_la_operacion_matematica);`,

  `// Error 3 — Sintáctico: falta 'inicio' y 'fin', falta ';'
si (x > 0)
    show(x)
`,

  `// Error 4 — Semántico: variable "b" usada sin declarar
num a <- 5;
num c <- a + b;
show(c);`,

  `// Error 5 — Semántico: división por cero + variable no usada
num x <- 100;
num z <- x / 0;
num sinUso <- 42;
show(z);`,
];


/* ═══════════════════════════════════════════════════════════════
   analyze() — Función principal del compilador
   Ejecuta el pipeline completo cuando el usuario presiona Analizar.
═══════════════════════════════════════════════════════════════ */
function analyze() {
  const code = document.getElementById("codeInput").value;
  if (!code.trim()) return; // nada que analizar

  /* 1. ANÁLISIS LÉXICO */
  const lexResult = new Lexer(code).run();
  renderTokens(lexResult.tokens);
  renderErrorTable(lexResult.errTable, "errWrap", "errCount");
  renderSymbols(lexResult.symbols, lexResult.tokens, lexResult.errors);

  /* 2. GRAMÁTICA BNF — inyectar el texto en el <pre> */
  const bnfEl = document.getElementById("bnfDisplay");
  if (bnfEl) bnfEl.textContent = BNF_RULES;

  /* 3. ANÁLISIS SINTÁCTICO + ÁRBOL SVG
     renderParseTree también descarga el PNG automáticamente si hay árbol */
  const parseErrors = renderParseTree(lexResult.tokens, "parseTreeWrap");
  const validToks   = lexResult.tokens.filter(t => t.type !== TYPE.ERR);
  const parseInfo   = document.getElementById("parseInfo");
  if (parseInfo) parseInfo.textContent = `(${validToks.length} tokens válidos)`;

  /* 4. ANÁLISIS SEMÁNTICO */
  const semResults = new SemanticAnalyzer(lexResult.tokens).getResults();

  /* 5. MOSTRAR ERRORES SINTÁCTICOS + SEMÁNTICOS JUNTOS */
  renderSyntaxErrors(parseErrors, semResults);
}


/* ═══════════════════════════════════════════════════════════════
   clearAll() — Limpiar toda al estado inicial
═══════════════════════════════════════════════════════════════ */
function clearAll() {
  clearUI(); // limpiar paneles comunes (definido en render/utils.js)

  const bnfEl = document.getElementById("bnfDisplay");
  if (bnfEl) bnfEl.textContent = "";

  const treeWrap = document.getElementById("parseTreeWrap");
  if (treeWrap) treeWrap.innerHTML =
    `<div class="empty"><span class="empty-icon">⊙</span><span>El árbol se generará al analizar...</span></div>`;

  const parseInfo = document.getElementById("parseInfo");
  if (parseInfo) parseInfo.textContent = "";

  const semWrap = document.getElementById("semWrap");
  if (semWrap) semWrap.innerHTML =
    `<div class="empty"><span class="empty-icon">◈</span><span>El análisis semántico aparecerá aquí...</span></div>`;

  const semCount = document.getElementById("semCount");
  if (semCount) semCount.textContent = "";
}


/* ═══════════════════════════════════════════════════════════════
   loadSample / loadErrorSample — Cargar muestras en el editor
═══════════════════════════════════════════════════════════════ */
function loadSample(n)      { document.getElementById("codeInput").value = SAMPLES_VALID[n-1] ?? ""; }
function loadErrorSample(n) { document.getElementById("codeInput").value = SAMPLES_ERROR[n-1] ?? ""; }


/*
 * Exponer funciones al ámbito global (window) para que los
 * onclick del HTML puedan llamarlas con "use strict" activo.
 */
window.analyze            = analyze;
window.clearAll           = clearAll;
window.loadSample         = loadSample;
window.loadErrorSample    = loadErrorSample;
window.downloadTreeAsPNG  = downloadTreeAsPNG; // función definida en treeRenderer.js


/* Atajo de teclado: Ctrl+Enter (Windows) o Cmd+Enter (Mac) */
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze();
});