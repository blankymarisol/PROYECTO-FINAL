"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  constants.js — EulerCode
 *  Archivo de configuración global del compilador.
 *
 *  PROPÓSITO:
 *  Centralizar todas las constantes que los demás archivos necesitan:
 *  tipos de tokens, categorías, mensajes de error, palabras reservadas
 *  y las expresiones regulares del analizador léxico.
 *
 *  CARGADO PRIMERO en index.html porque todos los otros archivos JS
 *  dependen de las variables aquí definidas.
 * ═══════════════════════════════════════════════════════════════════
 */


/* ───────────────────────────────────────────────────────────────────
   TYPE — Objeto con los tipos de tokens que EulerCode puede reconocer.

   Cada propiedad es una clave corta (ej: "KW") que mapea al nombre
   legible que se muestra en la UI (ej: "Palabra reservada").

   USO: TYPE.KW  →  "Palabra reservada"
        TYPE.ID  →  "Identificador"
   ─────────────────────────────────────────────────────────────────── */
const TYPE = {
  KW:     "Palabra reservada",   // keywords: num, dec, si, repetir, etc.
  ID:     "Identificador",       // nombres de variables y funciones
  NUM:    "Número entero",       // ej: 42, 100, 0
  DEC:    "Número decimal",      // ej: 3.14, 2.5
  STR:    "Cadena",              // texto entre comillas: "hola"
  ARITH:  "Operador aritmético", // +  -  *  /  **  %%
  ASSIGN: "Operador de asignación", // solo: <-
  REL:    "Operador relacional", // ==  !=  <  >  <=  >=
  LOGIC:  "Operador lógico",     // &&  ||  !
  DELIM:  "Delimitador",         // ( ) , ; { }
  ERR:    "Error",               // cualquier token que no pertenece al lenguaje
};


/* ───────────────────────────────────────────────────────────────────
   CAT — Categoría "amigable" de cada tipo de token.

   Se muestra en la columna "Categoría" de la Tabla de Símbolos.
   Usa las claves de TYPE como índices dinámicos (computed properties).

   EJEMPLO: CAT["Palabra reservada"]  →  "Reservada"
            CAT["Identificador"]      →  "Identificador"
   ─────────────────────────────────────────────────────────────────── */
const CAT = {
  [TYPE.KW]:     "Reservada",
  [TYPE.ID]:     "Identificador",
  [TYPE.NUM]:    "Constante entera",
  [TYPE.DEC]:    "Constante decimal",
  [TYPE.STR]:    "Cadena",
  [TYPE.ARITH]:  "Operador",
  [TYPE.ASSIGN]: "Operador",
  [TYPE.REL]:    "Operador relacional",
  [TYPE.LOGIC]:  "Operador lógico",
  [TYPE.DELIM]:  "Delimitador",
  [TYPE.ERR]:    "Error",
};


/* ───────────────────────────────────────────────────────────────────
   ERR_TYPES — Nombres de los tipos de error léxico.

   Cada constante representa una categoría de error diferente.
   Se usan como claves en ERR_COLOR (para colores) y como texto
   visible en la Tabla de Errores.
   ─────────────────────────────────────────────────────────────────── */
const ERR_TYPES = {
  ID_TOO_LONG:   "Identificador muy largo",  // más de 15 caracteres
  NUM_OUT_RANGE: "Número fuera de rango",    // > 99999 o decimal > 99999.99
  INVALID_TOKEN: "Token inválido",           // ej: 3abc (empieza con dígito)
  UNKNOWN_CHAR:  "Carácter desconocido",     // ej: @ # $ no pertenecen a EulerCode
  UNCLOSED_STR:  "Cadena sin cerrar",        // ej: "hola sin cerrar comilla
  INVALID_DEC:   "Decimal mal formado",      // reservado para futuros usos
};


/* ───────────────────────────────────────────────────────────────────
   ERR_COLOR — Color CSS para cada tipo de error en la Tabla de Errores.

   Permite diferenciar visualmente los errores por su naturaleza.
   Los valores referencian variables CSS definidas en styles.css.

   USO en render.js:  style="color:${ERR_COLOR[err.errType]}"
   ─────────────────────────────────────────────────────────────────── */
const ERR_COLOR = {
  [ERR_TYPES.ID_TOO_LONG]:   "var(--violet)",  // violeta: error de nombre largo
  [ERR_TYPES.NUM_OUT_RANGE]: "var(--amber)",   // ámbar: número fuera de rango
  [ERR_TYPES.INVALID_TOKEN]: "var(--fuchsia)", // fucsia: token mal formado
  [ERR_TYPES.UNKNOWN_CHAR]:  "var(--coral)",   // coral: carácter extraño
  [ERR_TYPES.UNCLOSED_STR]:  "var(--lime)",    // lima: cadena sin cerrar
  [ERR_TYPES.INVALID_DEC]:   "var(--cyan)",    // cyan: decimal mal formado
};


/* ───────────────────────────────────────────────────────────────────
   KEYWORDS — Conjunto (Set) de las 20 palabras reservadas de EulerCode.

   Se usa un Set (en lugar de Array) porque Set.has() es O(1),
   es decir, la búsqueda es instantánea sin importar cuántas palabras haya.

   EulerCode es CASE-SENSITIVE: "Num" o "NUM" NO son palabras reservadas,
   solo "num" en minúsculas es válida.

   Mezcla español-inglés con términos matemáticos según el diseño del lenguaje.
   ─────────────────────────────────────────────────────────────────── */
const KEYWORDS = new Set([

  // ── Tipos de datos ──────────────────────────────────────
  "num",      // declarar variable entera    →  num x <- 5;
  "dec",      // declarar variable decimal   →  dec pi <- 3.14;
  "binario",  // declarar variable booleana  →  binario activo <- cierto;

  // ── Valores booleanos ───────────────────────────────────
  "cierto",   // verdadero / true   →  binario b <- cierto;
  "falso",    // falso / false      →  binario b <- falso;

  // ── Definición y retorno de funciones ───────────────────
  "definir",  // declarar una función  →  definir suma(num a, num b) inicio
  "return",   // retornar un valor     →  return a + b;

  // ── Estructuras condicionales ───────────────────────────
  "si",       // condicional if     →  si (x > 0) inicio
  "alternativa", // alternativa del si  →  alternativa inicio

  // ── Ciclos / Bucles ─────────────────────────────────────
  "repetir",  // ciclo while  →  repetir (x < 10) inicio
  "contar",   // ciclo for    →  contar (i <- 0; i < n; i <- i + 1) inicio
  "romper",   // break        →  romper;
  "skip",     // continue     →  skip;

  // ── Entrada / Salida ────────────────────────────────────
  "show",     // imprimir en consola  →  show(resultado);

  // ── Operaciones matemáticas especiales ──────────────────
  "raiz",     // raíz cuadrada  →  raiz(25)    equivale a √25
  "elevar",   // potencia       →  elevar(2,8) equivale a 2^8
  "modulo",   // módulo/resto   →  modulo(10,3) equivale a 10 % 3

  // ── Delimitadores de bloque ─────────────────────────────
  "inicio",   // abre un bloque  →  equivale a {  en C/Java
  "fin",      // cierra un bloque →  equivale a }  en C/Java

  // ── Valor nulo ──────────────────────────────────────────
  "nulo",     // null / void  →  return nulo;
]);


/* ───────────────────────────────────────────────────────────────────
   REGEX_RULES — Array de reglas léxicas (el "motor" del Lexer).

   Cada regla tiene:
     regex → expresión regular que describe el patrón a reconocer
     type  → etiqueta interna que el Lexer usa para clasificar el match

   ⚠ EL ORDEN ES CRÍTICO:
     El Lexer prueba cada regla de arriba hacia abajo y usa la PRIMERA
     que coincida. Por eso los patrones más específicos van antes que
     los más generales.

   Ejemplo de problema si el orden fuera incorrecto:
     Si la regla de "<" va antes que "<-", el Lexer nunca detectaría
     el operador de asignación porque "<" ya consumiría ese carácter.
   ─────────────────────────────────────────────────────────────────── */
const REGEX_RULES = [

  // ── 1. Comentarios (se descartan, no generan token) ─────
  // Comentario de una línea: comienza con // y termina al saltar de línea
  { regex: /^\/\/[^\n]*/,      type: "SKIP" },
  // Comentario de bloque: entre /* y */  ([\s\S] captura saltos de línea también)
  { regex: /^\/\*[\s\S]*?\*\//, type: "SKIP" },

  // ── 2. Espacios en blanco (también se descartan) ─────────
  // Cualquier combinación de espacio, tab, retorno de carro o salto de línea
  { regex: /^[ \t\r\n]+/,      type: "SKIP" },

  // ── 3. Cadenas de texto ───────────────────────────────────
  // Cadena válida con comillas dobles: "hola mundo"
  // El grupo de captura ([^"\n]*) extrae el contenido sin las comillas
  { regex: /^"([^"\n]*)"/,     type: "STR" },
  // Cadena válida con comillas simples: 'hola mundo'
  { regex: /^'([^'\n]*)'/,     type: "STR" },
  // Cadena sin cerrar (comilla de apertura sin cierre): "texto sin cerrar
  // Esto es un ERROR léxico — se detecta aquí antes de caer en ERR_CHAR
  { regex: /^"[^"\n]*/,        type: "ERR_UNSTR" },

  // ── 4. Operador de asignación ─────────────────────────────
  // DEBE ir antes de la regla de "<" para que "<-" sea reconocido completo
  { regex: /^<-/,              type: "ASSIGN" },

  // ── 5. Operadores aritméticos de dos caracteres ───────────
  // Potencia: **  (antes de la regla de * para no confundirlo con multiplicación)
  { regex: /^\*\*/,            type: "ARITH" },
  // Módulo visual: %%  (antes de cualquier regla de %)
  { regex: /^%%/,              type: "ARITH" },

  // ── 6. Operadores lógicos ────────────────────────────────
  // &&  (y lógico)  |  ||  (o lógico)  |  !  (negación)
  { regex: /^(&&|\|\||!)/,     type: "LOGIC" },

  // ── 7. Operadores relacionales de dos caracteres ──────────
  // ==  !=  <=  >=  deben ir ANTES de < y > (que son de un solo carácter)
  { regex: /^(==|!=|<=|>=)/,   type: "REL" },
  // Relacionales simples: <  >
  { regex: /^[<>]/,            type: "REL" },

  // ── 8. Operadores aritméticos simples ────────────────────
  // +  -  *  /  (el ** ya fue capturado antes así que * aquí es solo *)
  { regex: /^[+\-*\/]/,        type: "ARITH" },

  // ── 9. Delimitadores ─────────────────────────────────────
  // Paréntesis, llaves, coma, punto y coma
  { regex: /^[(){},;]/,        type: "DELIM" },

  // ── 10. Token inválido: dígito seguido de letras ─────────
  // Ej: 3abc  12variable  →  esto es un error léxico
  // Va ANTES de DEC_RAW y NUM_RAW para capturarlo como error específico
  { regex: /^[0-9]+[a-zA-Z_][a-zA-Z0-9_]*/, type: "ERR_TOKEN" },

  // ── 11. Número decimal ───────────────────────────────────
  // Uno o más dígitos, un punto, uno o más dígitos  →  3.14,  0.5,  100.0
  // Va ANTES de NUM_RAW porque si fuera al revés, "3" en "3.14" se consumiría primero
  { regex: /^[0-9]+\.[0-9]+/,  type: "DEC_RAW" },

  // ── 12. Número entero ────────────────────────────────────
  // Uno o más dígitos consecutivos  →  0, 42, 9999
  { regex: /^[0-9]+/,          type: "NUM_RAW" },

  // ── 13. Palabra (keyword o identificador) ────────────────
  // Empieza con letra o guion bajo, seguido de letras, dígitos o guion bajo
  // El Lexer luego verifica si está en KEYWORDS para diferenciarlo
  { regex: /^[a-zA-Z_][a-zA-Z0-9_]*/, type: "WORD" },

  // ── 14. Carácter desconocido (último recurso = error) ────
  // El punto (.) captura cualquier carácter que no haya sido reconocido arriba
  // Si llegamos aquí, ese carácter no pertenece al lenguaje EulerCode
  { regex: /^./,               type: "ERR_CHAR" },
];