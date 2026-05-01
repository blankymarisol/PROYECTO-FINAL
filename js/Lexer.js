"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  lexer.js — EulerCode
 *  Analizador Léxico (también llamado "tokenizador" o "scanner")
 *
 *  PROPÓSITO:
 *  Leer el código fuente escrito por el usuario carácter a carácter
 *  y convertirlo en una lista de TOKENS — las unidades mínimas
 *  con significado del lenguaje (palabras, números, operadores, etc.)
 *
 *  ANALOGÍA:
 *  Si el código fuente fuera una oración en español:
 *    "El perro corre rápido"
 *  El léxico la descompondría en palabras individuales:
 *    ["El", "perro", "corre", "rápido"]
 *  Cada palabra tiene un tipo: artículo, sustantivo, verbo, adverbio.
 *  El Lexer hace lo mismo con el código.
 *
 *  SALIDAS que produce:
 *    tokens   → lista de todos los tokens reconocidos
 *    symbols  → tabla de símbolos (tokens únicos con ocurrencias)
 *    errors   → lista de mensajes de error en texto
 *    errTable → tabla de errores estructurada para la UI
 *
 *  DEPENDE DE: constants.js (TYPE, CAT, ERR_TYPES, KEYWORDS, REGEX_RULES)
 * ═══════════════════════════════════════════════════════════════════
 */

class Lexer {

  /* ─────────────────────────────────────────────────────────────────
     constructor(sourceCode)
     Inicializa el estado interno del Lexer antes de comenzar el análisis.

     PARÁMETRO:
       sourceCode → string con todo el código fuente ingresado por el usuario

     PROPIEDADES:
       this.src    → copia del código fuente original
       this.pos    → posición actual en el string (cuántos caracteres leímos ya)
       this.line   → número de línea actual (empieza en 1)
       this.col    → número de columna actual (empieza en 1)
       this.toks   → array donde se acumulan los tokens encontrados
       this.sym    → objeto que actúa como tabla de símbolos (clave: tipo|valor)
       this.errs   → array de mensajes de error en formato texto
       this.errTbl → array de errores estructurados para la tabla de la UI
       this._tid   → contador de ID para tokens (se incrementa con cada token)
       this._sid   → contador de ID para símbolos
       this._eid   → contador de ID para errores
   ───────────────────────────────────────────────────────────────── */
  constructor(sourceCode) {
    // Normalizar símbolos matemáticos Unicode que algunos editores insertan
    // automáticamente al guardar. Se reemplazan por sus equivalentes ASCII
    // ANTES de cualquier análisis, así el lexer trabaja solo con ASCII puro.
    this.src    = sourceCode
      .replace(/≠/g, "!=")   // ≠ → !=  (distinto de)
      .replace(/≤/g, "<=")   // ≤ → <=  (menor o igual)
      .replace(/≥/g, ">=")   // ≥ → >=  (mayor o igual)
      .replace(/←/g, "<-")   // ← → <-  (asignación, flecha Unicode)
      .replace(/→/g, "->")   // → → ->  (flecha derecha, por si acaso)
      .replace(/×/g, "*")    // × → *   (multiplicación Unicode)
      .replace(/÷/g, "/");   // ÷ → /   (división Unicode)
    this.pos    = 0;           // cursor: posición actual en el string
    this.line   = 1;           // contador de línea (salta con cada \n)
    this.col    = 1;           // contador de columna (se reinicia al saltar línea)
    this.toks   = [];          // lista de tokens reconocidos
    this.sym    = {};          // tabla de símbolos (objeto clave-valor)
    this.errs   = [];          // errores en texto plano
    this.errTbl = [];          // errores estructurados para la UI
    this._tid   = 0;           // ID incremental de tokens
    this._sid   = 0;           // ID incremental de símbolos
    this._eid   = 0;           // ID incremental de errores
  }


  /* ─────────────────────────────────────────────────────────────────
     emit(typeKey, value, errType, errDetail)
     Crea un token y lo registra en las listas internas.

     Es el método central del Lexer: todo token reconocido pasa por aquí.

     PARÁMETROS:
       typeKey   → clave del objeto TYPE (ej: "KW", "ID", "NUM")
       value     → el texto exacto reconocido (el lexema)
       errType   → (opcional) si hay error, el tipo del error de ERR_TYPES
       errDetail → (opcional) mensaje descriptivo del error para mostrar al usuario

     PROCESO:
       1. Incrementa el contador y crea el objeto token
       2. Si hay error, lo agrega también a las tablas de errores
       3. Llama a _registerSymbol para actualizar la tabla de símbolos
       4. Devuelve el token creado
   ───────────────────────────────────────────────────────────────── */
  emit(typeKey, value, errType = null, errDetail = "") {
    this._tid++;  // cada token tiene un ID único secuencial

    // Construir el objeto token con toda su información
    const token = {
      id:    this._tid,        // número de token en el stream (ej: 1, 2, 3...)
      type:  TYPE[typeKey],    // tipo legible (ej: "Palabra reservada")
      value,                   // lexema exacto tal como aparece en el código
      line:  this.line,        // en qué línea fue encontrado
      col:   this.col,         // en qué columna comenzó
      extra: errDetail,        // mensaje de error (vacío si no hay error)
    };

    // Agregar el token a la lista principal de tokens
    this.toks.push(token);

    // Si este token es un ERROR, registrarlo también en las tablas de errores
    if (errType) {
      this._eid++;
      // Versión estructurada para la tabla de errores de la UI
      this.errTbl.push({
        id:      this._eid,   // ID del error
        lexema:  value,       // el texto que causó el error
        errType,              // categoría del error (de ERR_TYPES)
        detail:  errDetail,   // descripción detallada
        line:    this.line,   // línea donde ocurrió
        col:     this.col,    // columna donde ocurrió
      });
      // Versión en texto plano (para uso interno)
      this.errs.push(`Línea ${this.line}, Col ${this.col}: ${errDetail}`);
    }

    // Registrar en la tabla de símbolos (o incrementar ocurrencias si ya existe)
    this._registerSymbol(token, typeKey);

    return token;  // devolver el token por si algún código externo lo necesita
  }


  /* ─────────────────────────────────────────────────────────────────
     _registerSymbol(token, typeKey)
     Mantiene la Tabla de Símbolos actualizada.

     La tabla de símbolos guarda cada token ÚNICO que aparece en el código.
     Si un token ya existe (mismo tipo + mismo valor), solo incrementa
     su contador de ocurrencias en lugar de crear una entrada duplicada.

     LÓGICA DE CLAVE ÚNICA:
       La clave se forma como "tipo|valor", por ejemplo:
         "Identificador|x"          → variable x
         "Palabra reservada|num"    → keyword num
         "Número entero|42"         → número 42
       Esto permite que "num" como keyword y "num" como identificador
       (si fuera posible) tuvieran entradas separadas.
   ───────────────────────────────────────────────────────────────── */
  _registerSymbol(token, typeKey) {
    // Crear clave única combinando tipo y valor para evitar duplicados
    const key = `${token.type}|${token.value}`;

    if (!this.sym[key]) {
      // Primera vez que vemos este token: crear entrada nueva en la tabla
      this._sid++;
      this.sym[key] = {
        id:       this._sid,                           // ID de la entrada
        name:     token.value,                         // lexema del símbolo
        type:     token.type,                          // tipo de token
        category: CAT[TYPE[typeKey]] ?? TYPE[typeKey], // categoría amigable
        line:     token.line,                          // primera línea de aparición
        col:      token.col,                           // primera columna de aparición
        occ:      1,                                   // ocurrencias: primera vez = 1
      };
    } else {
      // Ya existe en la tabla: solo incrementar el contador de ocurrencias
      this.sym[key].occ++;
    }
  }


  /* ─────────────────────────────────────────────────────────────────
     advance(text)
     Mueve el cursor hacia adelante después de consumir un fragmento del código.

     También actualiza los contadores de línea y columna correctamente,
     incluso cuando el texto consumido contiene saltos de línea (\n).

     PARÁMETRO:
       text → el fragmento de código que acaba de ser reconocido (el match)

     LÓGICA:
       - Si el texto tiene más de una parte al dividir por \n,
         significa que contiene saltos de línea
         → incrementar línea, reiniciar columna
       - Si no hay saltos de línea, solo avanzar en la misma columna
   ───────────────────────────────────────────────────────────────── */
  advance(text) {
    // Dividir el texto por saltos de línea para saber si hay cambios de línea
    const lines = text.split("\n");

    if (lines.length > 1) {
      // El texto consumido cruzó al menos una línea nueva
      this.line += lines.length - 1;            // sumar cuántas líneas saltamos
      this.col   = lines[lines.length - 1].length + 1; // columna = longitud del último fragmento + 1
    } else {
      // Sin salto de línea: solo avanzar la columna
      this.col += text.length;
    }

    // Siempre avanzar el cursor de posición en el string
    this.pos += text.length;
  }


  /* ─────────────────────────────────────────────────────────────────
     _processMatch(ruleType, raw, matchGroups)
     Procesa cada fragmento reconocido por las expresiones regulares.

     Decide qué tipo de token crear (o qué error reportar) según
     el tipo de regla que coincidió.

     PARÁMETROS:
       ruleType    → string con el tipo de la regla (ej: "WORD", "NUM_RAW")
       raw         → el texto completo que coincidió con la regex
       matchGroups → array con los grupos de captura de la regex (si los hay)

     FUNCIONAMIENTO:
       Un switch evalúa el tipo de regla y ejecuta la lógica correspondiente.
       Algunos casos requieren validaciones adicionales (ej: rango de números,
       longitud de identificadores).
   ───────────────────────────────────────────────────────────────── */
  _processMatch(ruleType, raw, matchGroups) {
    switch (ruleType) {

      // ── SKIP: espacios y comentarios ──────────────────────────
      // No generan ningún token, simplemente se ignoran
      case "SKIP":
        break; // no hacer nada, el advance() en run() se encarga de avanzar


      // ── STR: cadena de texto válida ───────────────────────────
      // matchGroups[1] tiene el contenido sin las comillas (gracias al grupo ())
      // Si por algún motivo no hay grupo, usamos raw.slice(1,-1) como respaldo
      case "STR":
        this.emit("STR", matchGroups[1] ?? raw.slice(1, -1));
        break;


      // ── ERR_UNSTR: cadena sin cerrar ──────────────────────────
      // Ejemplo: "hola  (sin la comilla de cierre)
      // Es un error léxico porque el token nunca termina correctamente
      case "ERR_UNSTR":
        this.emit("ERR", raw, ERR_TYPES.UNCLOSED_STR,
          `Cadena sin cerrar: ${raw}`);
        break;


      // ── ASSIGN: operador de asignación <- ────────────────────
      case "ASSIGN":
        this.emit("ASSIGN", raw);
        break;


      // ── REL: operadores relacionales ─────────────────────────
      // == != < > <= >=
      case "REL":
        this.emit("REL", raw);
        break;


      // ── ARITH: operadores aritméticos ────────────────────────
      // + - * / ** %%
      case "ARITH":
        this.emit("ARITH", raw);
        break;


      // ── LOGIC: operadores lógicos ─────────────────────────────
      // && || !
      case "LOGIC":
        this.emit("LOGIC", raw);
        break;


      // ── DELIM: delimitadores ──────────────────────────────────
      // ( ) { } , ;
      case "DELIM":
        this.emit("DELIM", raw);
        break;


      // ── ERR_TOKEN: token inválido (dígito + letras) ───────────
      // Ejemplo: 3abc, 10variable, 2x
      // En EulerCode (y en la mayoría de lenguajes), los identificadores
      // NO pueden comenzar con un dígito
      case "ERR_TOKEN":
        this.emit("ERR", raw, ERR_TYPES.INVALID_TOKEN,
          `Token inválido "${raw}": inicia con dígito y contiene letras`);
        break;


      // ── DEC_RAW: número decimal detectado por regex ───────────
      // Aquí aplicamos la validación de rango ANTES de emitir el token
      // Rango permitido: 0.0 hasta 99999.99
      case "DEC_RAW": {
        const val = parseFloat(raw); // convertir el string a número flotante

        if (val >= 0 && val <= 99999.99) {
          // Dentro del rango: token válido
          this.emit("DEC", raw);
        } else {
          // Fuera del rango: reportar como error léxico
          this.emit("ERR", raw, ERR_TYPES.NUM_OUT_RANGE,
            `Decimal "${raw}" fuera del rango permitido (0 – 99999.99)`);
        }
        break;
      }


      // ── NUM_RAW: número entero detectado por regex ────────────
      // Validación de rango: 0 hasta 99999
      case "NUM_RAW": {
        const value = parseInt(raw, 10); // convertir a entero (base 10)

        if (value >= 0 && value <= 99999) {
          // Dentro del rango: token válido
          this.emit("NUM", raw);
        } else {
          // Fuera del rango: error léxico
          this.emit("ERR", raw, ERR_TYPES.NUM_OUT_RANGE,
            `Número ${raw} fuera del rango permitido (0 – 99999)`);
        }
        break;
      }


      // ── WORD: palabra que puede ser keyword o identificador ───
      // El patrón regex solo sabe que "parece una palabra".
      // Aquí decidimos si es una palabra reservada o un identificador.
      case "WORD":
        if (KEYWORDS.has(raw)) {
          // Está en el Set de keywords → es una Palabra Reservada
          // Nota: EulerCode es case-sensitive, así que "Num" no sería keyword
          this.emit("KW", raw);

        } else if (raw.length > 15) {
          // La regla de EulerCode dice: identificadores máximo 15 caracteres
          this.emit("ERR", raw, ERR_TYPES.ID_TOO_LONG,
            `"${raw}" tiene ${raw.length} caracteres (máximo permitido: 15)`);

        } else {
          // Es una palabra válida que no es keyword → Identificador (variable/función)
          this.emit("ID", raw);
        }
        break;


      // ── ERR_CHAR: carácter completamente desconocido ─────────
      // Llegamos aquí solo si NINGUNA regla anterior coincidió.
      // Significa que el carácter no pertenece al alfabeto de EulerCode.
      // Ejemplo: @ # $ % (% suelto, no %%)
      case "ERR_CHAR":
        this.emit("ERR", raw, ERR_TYPES.UNKNOWN_CHAR,
          `Carácter desconocido '${raw}' no pertenece al alfabeto de EulerCode`);
        break;
    }
  }


  /* ─────────────────────────────────────────────────────────────────
     run()
     Método principal: ejecuta el análisis léxico completo.

     PROCESO (bucle principal):
       Mientras queden caracteres por analizar:
         1. Tomar el fragmento de código que aún no hemos procesado
         2. Probar cada regla regex en orden (de REGEX_RULES)
         3. Cuando una regex coincide:
            a. Extraer el texto coincidente (raw)
            b. Procesarlo con _processMatch() → crea el token
            c. Avanzar el cursor con advance() → mueve pos, line, col
            d. Pasar al siguiente ciclo (break sale del for, no del while)
         Si ninguna regex coincide (no debería pasar porque ERR_CHAR captura todo)
         el bucle avanzaría de todas formas para evitar un loop infinito.

     RETORNA un objeto con los 4 resultados del análisis léxico.
   ───────────────────────────────────────────────────────────────── */
  run() {
    // Continuar mientras haya código fuente por procesar
    while (this.pos < this.src.length) {

      // Obtener el fragmento de código desde la posición actual hasta el final
      const remaining = this.src.slice(this.pos);

      // Probar cada regla léxica en orden de prioridad
      for (const rule of REGEX_RULES) {
        const match = remaining.match(rule.regex); // intentar coincidir la regex

        if (!match) continue; // esta regla no coincide → probar la siguiente

        // ¡Coincidencia encontrada!
        const raw = match[0]; // match[0] siempre es el texto completo que coincidió

        // Procesar el fragmento: crear token o registrar error
        this._processMatch(rule.type, raw, match);

        // Avanzar el cursor (mover pos, line, col)
        this.advance(raw);

        // Salir del for: solo aplicar la PRIMERA regla que coincida
        break;
      }
    }

    // Devolver todos los resultados del análisis léxico
    return {
      tokens:   this.toks,              // array de todos los tokens
      symbols:  Object.values(this.sym), // tabla de símbolos como array
      errors:   this.errs,              // errores en texto plano
      errTable: this.errTbl,            // errores estructurados para la UI
    };
  }
}