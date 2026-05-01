"use strict";

/*
 * =================================================================
 *  app.js - EulerCode
 *  Punto de entrada principal
 *
 *  PIPELINE:
 *    1. Lexer            -> tokeniza el codigo fuente
 *    2. Render lexico    -> tokens, errores lexicos, tabla simbolos
 *    3. Parser + Arbol   -> arbol sintactico SVG (solo si no hay errores)
 *    4. SemanticAnalyzer -> verifica variables, division por cero
 *    5. Render semantico -> errores sintacticos y semanticos
 *    6. updateErrorStat  -> actualiza contador total de errores
 * =================================================================
 */


/* ── 5 programas CORRECTOS en EulerCode ─────────────────────── */
const SAMPLES_VALID = [

`// Muestra 1 - Area de un circulo
// Demuestra: definir, dec, return, operadores aritmeticos, show
definir areaCirculo(dec radio) inicio
    dec pi <- 3.1416;
    dec area <- pi * radio * radio;
    return area;
fin
dec r <- 5.0;
dec resultado <- areaCirculo(r);
show(resultado);`,

`// Muestra 2 - Factorial con ciclo contar
// Demuestra: num, contar, acumulador, operadores
num n <- 6;
num fact <- 1;
contar (i <- 1; i <= n; i <- i + 1) inicio
    fact <- fact * i;
fin
show(fact);`,

`// Muestra 3 - Area y perimetro de un rectangulo
// Demuestra: num, dec, operadores aritmeticos, show
num largo <- 8;
num ancho <- 5;
num perimetro <- 2 * largo + 2 * ancho;
dec area <- largo * ancho;
show(perimetro);
show(area);`,

`// Muestra 4 - Potencias de 2 con ciclo repetir
// Demuestra: repetir, elevar(), condicion, incremento
num base <- 2;
num exponente <- 1;
num limite <- 10;
repetir (exponente <= limite) inicio
    num potencia <- elevar(base, exponente);
    show(potencia);
    exponente <- exponente + 1;
fin`,

`// Muestra 5 - Serie de Fibonacci
// Demuestra: num, contar, asignacion, operadores aritmeticos
num terminos <- 10;
num a <- 0;
num b <- 1;
num siguiente <- 0;
show(a);
show(b);
contar (i <- 2; i <= terminos; i <- i + 1) inicio
    siguiente <- a + b;
    show(siguiente);
    a <- b;
    b <- siguiente;
fin`,

];


/* ── 5 programas CON ERRORES intencionales ───────────────────── */
const SAMPLES_ERROR = [

`// Error 1 - Lexico: token invalido y caracter desconocido
num 3variable <- 10;
dec precio <- 99.99;
num total <- precio @ 3variable;
show(total);`,

`// Error 2 - Lexico: identificador demasiado largo
num resultado_de_la_operacion_matematica <- 100;
show(resultado_de_la_operacion_matematica);`,

`// Error 3 - Sintactico: falta inicio y fin
si (x > 0)
    show(x)
`,

`// Error 4 - Semantico: variable b usada sin declarar
num a <- 5;
num c <- a + b;
show(c);`,

`// Error 5 - Semantico: division por cero y variable no usada
num x <- 100;
num z <- x / 0;
num sinUso <- 42;
show(z);`,

];


/* =================================================================
   _blockTree(message) - Muestra mensaje de bloqueo en el arbol
   cuando el codigo tiene errores y no se puede generar el arbol.
================================================================= */
function _blockTree(message) {
  const treeWrap = document.getElementById("parseTreeWrap");
  if (!treeWrap) return;
  treeWrap.innerHTML = `
    <div style="
      display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:1rem; padding:3rem 1rem;
      font-family:'Outfit',sans-serif;
    ">
      <div style="font-size:2.5rem; opacity:.7;">X</div>
      <div style="
        font-size:.95rem; font-weight:700;
        color:var(--coral,#fb7185);
        letter-spacing:.04em;
      ">Arbol no disponible</div>
      <div style="
        font-size:.78rem; color:var(--tx-muted,#4a5578);
        text-align:center; max-width:340px; line-height:1.6;
        font-family:'Fira Code',monospace;
      ">${message}</div>
    </div>`;
}


/* =================================================================
   analyze() - Funcion principal del compilador
   Ejecuta el pipeline completo cuando el usuario presiona Analizar.
================================================================= */
function analyze() {
  const code = document.getElementById("codeInput").value;
  if (!code.trim()) return;

  /* 1. ANALISIS LEXICO */
  const lexResult = new Lexer(code).run();
  renderTokens(lexResult.tokens);
  renderErrorTable(lexResult.errTable, "errWrap", "errCount");
  renderSymbols(lexResult.symbols, lexResult.tokens, lexResult.errors);

  /* 2. GRAMATICA BNF */
  const bnfEl = document.getElementById("bnfDisplay");
  if (bnfEl) bnfEl.textContent = BNF_RULES;

  /* 3. BLOQUEAR ARBOL si hay errores lexicos */
  if (lexResult.errors.length > 0) {
    _blockTree(
      "Se encontraron " + lexResult.errors.length + " error(es) lexico(s).\n" +
      "Corrigelos antes de generar el arbol."
    );
    const parseInfo = document.getElementById("parseInfo");
    if (parseInfo) parseInfo.textContent = "";
    const semResults = new SemanticAnalyzer(lexResult.tokens).getResults();
    renderSyntaxErrors([], semResults);
    updateErrorStat(lexResult.errors.length + semResults.errors.length);
    return;
  }

  /* 4. ANALISIS SINTACTICO + ARBOL SVG */
  const parseErrors = renderParseTree(lexResult.tokens, "parseTreeWrap");
  const validToks   = lexResult.tokens.filter(function(t) { return t.type !== TYPE.ERR; });
  const parseInfo   = document.getElementById("parseInfo");

  /* 5. ANALISIS SEMANTICO */
  const semResults = new SemanticAnalyzer(lexResult.tokens).getResults();

  /* 6. BLOQUEAR ARBOL si hay errores sintacticos o semanticos */
  const hasSyntaxErrors   = (parseErrors || []).length > 0;
  const hasSemanticErrors = (semResults.errors || []).length > 0;

  if (hasSyntaxErrors || hasSemanticErrors) {
    const total = (parseErrors || []).length + (semResults.errors || []).length;
    _blockTree(
      "Se encontraron " + total + " error(es) en el analisis.\n" +
      "Corrigelos para poder visualizar el arbol de derivacion."
    );
    if (parseInfo) parseInfo.textContent = "";
  } else {
    if (parseInfo) parseInfo.textContent = "(" + validToks.length + " tokens validos)";
  }

  /* 7. MOSTRAR ERRORES SINTACTICOS + SEMANTICOS */
  renderSyntaxErrors(parseErrors, semResults);

  /* 8. ACTUALIZAR CONTADOR TOTAL DE ERRORES */
  const totalErrors = lexResult.errors.length
    + (parseErrors || []).length
    + (semResults.errors || []).length;
  updateErrorStat(totalErrors);
}


/* =================================================================
   clearAll() - Limpiar toda la UI al estado inicial
================================================================= */
function clearAll() {
  clearUI();

  const bnfEl = document.getElementById("bnfDisplay");
  if (bnfEl) bnfEl.textContent = "";

  const treeWrap = document.getElementById("parseTreeWrap");
  if (treeWrap) treeWrap.innerHTML =
    "<div class='empty'><span class='empty-icon'>&#8857;</span><span>El arbol se generara al analizar...</span></div>";

  const parseInfo = document.getElementById("parseInfo");
  if (parseInfo) parseInfo.textContent = "";

  const semWrap = document.getElementById("semWrap");
  if (semWrap) semWrap.innerHTML =
    "<div class='empty'><span class='empty-icon'>&#9672;</span><span>El analisis semantico aparecera aqui...</span></div>";

  const semCount = document.getElementById("semCount");
  if (semCount) semCount.textContent = "";
}


/* =================================================================
   openInfo() / closeInfo() - Modal de guia del lenguaje EulerCode
================================================================= */
function openInfo() {
  const modal = document.getElementById("infoModal");
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

function closeInfo() {
  const modal = document.getElementById("infoModal");
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}


/* =================================================================
   loadSample / loadErrorSample - Cargar muestras en el editor
================================================================= */
function loadSample(n)      { document.getElementById("codeInput").value = SAMPLES_VALID[n-1] || ""; }
function loadErrorSample(n) { document.getElementById("codeInput").value = SAMPLES_ERROR[n-1] || ""; }


/* Exponer funciones al ambito global */
window.analyze            = analyze;
window.clearAll           = clearAll;
window.loadSample         = loadSample;
window.loadErrorSample    = loadErrorSample;
window.downloadTreeAsPNG  = downloadTreeAsPNG;
window.openInfo           = openInfo;
window.closeInfo          = closeInfo;


/* Atajo de teclado: Ctrl+Enter analiza | Escape cierra el modal */
document.addEventListener("keydown", function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze();
  if (e.key === "Escape") closeInfo();
});