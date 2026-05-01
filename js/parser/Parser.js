"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  parser/Parser.js — EulerCode
 *  Analizador Sintáctico por Descenso Recursivo
 *
 *  PROPÓSITO:
 *  Recibir el array de tokens del Lexer y verificar que estén
 *  en el orden correcto según la gramática BNF de EulerCode.
 *  Si son válidos, construye un Árbol de Derivación (parse tree).
 *
 *  TÉCNICA: Recursive Descent Parser
 *  Cada regla de la gramática BNF tiene su propio método:
 *    <programa>    → parsePrograma()
 *    <sentencia>   → parseSentencia()
 *    <declaracion> → parseDeclaracion()
 *    ... etc.
 *
 *  DEPENDE DE: constants.js (TYPE)
 *  USADO EN:   parser/treeRenderer.js
 * ═══════════════════════════════════════════════════════════════════
 */

class Parser {

  /* ─────────────────────────────────────────────────────────────────
     constructor(tokens)
     Inicializa el parser filtrando tokens de error (no aportan
     información sintáctica válida).

     PROPIEDADES:
       this.tokens → array de tokens válidos (sin errores léxicos)
       this.pos    → cursor: índice del token que estamos leyendo ahora
       this.errors → errores sintácticos encontrados durante el parseo
   ───────────────────────────────────────────────────────────────── */
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== TYPE.ERR);
    this.pos    = 0;
    this.errors = [];
  }

  /* ── Utilidades básicas del parser ─────────────────────────── */

  // Ver el token actual SIN consumirlo ("lookahead")
  peek()    { return this.tokens[this.pos] || null; }

  // Consumir el token actual y avanzar el cursor
  advance() { return this.tokens[this.pos++] || null; }

  // ¿Ya procesamos todos los tokens?
  isEnd()   { return this.pos >= this.tokens.length; }

  /*
   * node(label, children, value)
   * Crear un nodo del árbol de derivación.
   *   label    → nombre de la regla BNF (ej: "<declaracion>") o terminal (ej: "num")
   *   children → nodos hijos (subestructuras)
   *   value    → texto que se muestra en el SVG (null = usar label)
   */
  node(label, children = [], value = null) {
    return { label, children, value };
  }

  /*
   * expect(type, value)
   * Consumir el token actual si coincide con tipo y/o valor.
   * Si NO coincide, devuelve null sin avanzar ni reportar error.
   */
  expect(type, value = null) {
    const tok = this.peek();
    if (!tok) return null;
    const typeMatch  = !type  || tok.type  === type;
    const valueMatch = !value || tok.value === value;
    if (typeMatch && valueMatch) return this.advance();
    return null;
  }

  /*
   * expectOrError(type, value, errMsg)
   * Como expect(), pero si no coincide registra un error sintáctico
   * con el mensaje y la posición del token problemático.
   */
  expectOrError(type, value, errMsg) {
    const tok = this.expect(type, value);
    if (!tok) {
      const cur = this.peek();
      this.errors.push(
        `Línea ${cur ? cur.line : "?"}: ${errMsg}` +
        (cur ? ` — encontrado: "${cur.value}"` : " — fin de archivo")
      );
    }
    return tok;
  }

  /* ══════════════════════════════════════════════════════════════
     REGLAS DE LA GRAMÁTICA — Un método por regla BNF
  ══════════════════════════════════════════════════════════════ */

  /* ── <programa> : secuencia de sentencias ─────────────────── */
  parsePrograma() {
    const stmts = [];
    while (!this.isEnd()) {
      const stmt = this.parseSentencia();
      if (stmt) stmts.push(stmt);
      else      this.advance(); // evitar loop infinito
    }
    return this.node("<programa>", stmts);
  }

  /* ── <sentencia> : despachador según el token actual ─────── */
  parseSentencia() {
    const tok = this.peek();
    if (!tok) return null;
    const v = tok.value, t = tok.type;

    if (t === TYPE.KW) {
      if (["num","dec","binario"].includes(v)) return this.parseDeclaracion();
      if (v === "si")      return this.parseCondicional();
      if (v === "repetir") return this.parseCicloRepetir();
      if (v === "contar")  return this.parseCicloContar();
      if (v === "definir") return this.parseFuncionDef();
      if (v === "return")  return this.parseRetorno();
      if (v === "show")    return this.parseShow();
      if (v === "romper")  { this.advance(); this.expect(TYPE.DELIM,";"); return this.node("<romper>",[],  "romper"); }
      if (v === "skip")    { this.advance(); this.expect(TYPE.DELIM,";"); return this.node("<skip>",  [], "skip");   }
    }

    if (t === TYPE.ID) {
      // identificador seguido de "(" → llamada a función
      const next = this.tokens[this.pos + 1];
      if (next && next.value === "(") return this.parseLlamadaFuncion(true);
      return this.parseAsignacion();
    }

    return null;
  }

  /* ── <declaracion> : tipo id <- expr ; ────────────────────── */
  parseDeclaracion() {
    const ch = [];
    const tipo = this.advance();
    ch.push(this.node("<tipo>", [], tipo.value));

    const id = this.expect(TYPE.ID);
    if (id) ch.push(this.node("<identificador>", [], id.value));

    const op = this.expect(TYPE.ASSIGN, "<-");
    if (op) {
      ch.push(this.node("<-", [], "<-"));
      const expr = this.parseExpresion();
      if (expr) ch.push(expr);
    }

    this.expect(TYPE.DELIM, ";");
    ch.push(this.node(";", [], ";"));
    return this.node("<declaracion>", ch);
  }

  /* ── <asignacion> : id <- expr ; ──────────────────────────── */
  parseAsignacion() {
    const ch = [];
    const id = this.expect(TYPE.ID);
    if (!id) return null;
    ch.push(this.node("<identificador>", [], id.value));

    const op = this.expect(TYPE.ASSIGN, "<-");
    if (!op) {
      this.errors.push(`Línea ${id.line}: se esperaba '<-' después de '${id.value}'`);
      return this.node("<asignacion>", ch);
    }
    ch.push(this.node("<-", [], "<-"));

    const expr = this.parseExpresion();
    if (expr) ch.push(expr);

    this.expect(TYPE.DELIM, ";");
    ch.push(this.node(";", [], ";"));
    return this.node("<asignacion>", ch);
  }

  /* ── <asignacion> sin ";" — para el encabezado de "contar" ── */
  parseAsignacionCorta() {
    const ch = [];
    const id = this.expect(TYPE.ID);
    if (!id) return null;
    ch.push(this.node("<identificador>", [], id.value));
    const op = this.expect(TYPE.ASSIGN, "<-");
    if (op) {
      ch.push(this.node("<-", [], "<-"));
      const expr = this.parseExpresion();
      if (expr) ch.push(expr);
    }
    return this.node("<asignacion>", ch);
  }

  /* ── <condicional> : si ( cond ) inicio ... fin [else ...] ── */
  parseCondicional() {
    const ch = [];
    this.advance(); ch.push(this.node("si", [], "si"));

    this.expectOrError(TYPE.DELIM, "(", "se esperaba '(' después de 'si'");
    ch.push(this.node("(", [], "("));
    const cond = this.parseCondicion();
    if (cond) ch.push(cond);
    this.expectOrError(TYPE.DELIM, ")", "se esperaba ')' para cerrar la condición");
    ch.push(this.node(")", [], ")"));

    this.expectOrError(TYPE.KW, "inicio", "se esperaba 'inicio'");
    ch.push(this.node("inicio", [], "inicio"));
    const body = this.parseBloque();
    if (body) ch.push(body);
    this.expectOrError(TYPE.KW, "fin", "se esperaba 'fin'");
    ch.push(this.node("fin", [], "fin"));

    // else es opcional
    if (this.peek()?.value === "alternativa") {
      this.advance(); ch.push(this.node("alternativa", [], "alternativa"));
      this.expectOrError(TYPE.KW, "inicio", "se esperaba 'inicio' después de 'alternativa'");
      ch.push(this.node("inicio", [], "inicio"));
      const elseBody = this.parseBloque();
      if (elseBody) ch.push(elseBody);
      this.expectOrError(TYPE.KW, "fin", "se esperaba 'fin' para cerrar alternativa");
      ch.push(this.node("fin", [], "fin"));
    }
    return this.node("<condicional>", ch);
  }

  /* ── <ciclo_repetir> : repetir ( cond ) inicio ... fin ─────── */
  parseCicloRepetir() {
    const ch = [];
    this.advance(); ch.push(this.node("repetir", [], "repetir"));
    this.expectOrError(TYPE.DELIM, "(", "se esperaba '(' después de 'repetir'");
    ch.push(this.node("(", [], "("));
    const cond = this.parseCondicion();
    if (cond) ch.push(cond);
    this.expectOrError(TYPE.DELIM, ")", "se esperaba ')' para cerrar condición");
    ch.push(this.node(")", [], ")"));
    this.expectOrError(TYPE.KW, "inicio", "se esperaba 'inicio'");
    ch.push(this.node("inicio", [], "inicio"));
    const body = this.parseBloque();
    if (body) ch.push(body);
    this.expectOrError(TYPE.KW, "fin", "se esperaba 'fin'");
    ch.push(this.node("fin", [], "fin"));
    return this.node("<ciclo_repetir>", ch);
  }

  /* ── <ciclo_contar> : contar ( init ; cond ; paso ) inicio ... fin ── */
  parseCicloContar() {
    const ch = [];
    this.advance(); ch.push(this.node("contar", [], "contar"));
    this.expectOrError(TYPE.DELIM, "(", "se esperaba '(' después de 'contar'");
    ch.push(this.node("(", [], "("));

    const init = this.parseAsignacionCorta(); if (init) ch.push(init);
    this.expectOrError(TYPE.DELIM, ";", "se esperaba ';' en 'contar'");
    ch.push(this.node(";", [], ";"));

    const cond = this.parseCondicion(); if (cond) ch.push(cond);
    this.expectOrError(TYPE.DELIM, ";", "se esperaba ';' en 'contar'");
    ch.push(this.node(";", [], ";"));

    const step = this.parseAsignacionCorta(); if (step) ch.push(step);
    this.expectOrError(TYPE.DELIM, ")", "se esperaba ')' para cerrar 'contar'");
    ch.push(this.node(")", [], ")"));

    this.expectOrError(TYPE.KW, "inicio", "se esperaba 'inicio'");
    ch.push(this.node("inicio", [], "inicio"));
    const body = this.parseBloque(); if (body) ch.push(body);
    this.expectOrError(TYPE.KW, "fin", "se esperaba 'fin'");
    ch.push(this.node("fin", [], "fin"));
    return this.node("<ciclo_contar>", ch);
  }

  /* ── <funcion_def> : definir id ( params ) inicio ... fin ─── */
  parseFuncionDef() {
    const ch = [];
    this.advance(); ch.push(this.node("definir", [], "definir"));
    const id = this.expect(TYPE.ID);
    if (id) ch.push(this.node("<identificador>", [], id.value));
    this.expectOrError(TYPE.DELIM, "(", "se esperaba '('");
    ch.push(this.node("(", [], "("));
    const params = this.parseParametros(); if (params) ch.push(params);
    this.expectOrError(TYPE.DELIM, ")", "se esperaba ')'");
    ch.push(this.node(")", [], ")"));
    this.expectOrError(TYPE.KW, "inicio", "se esperaba 'inicio'");
    ch.push(this.node("inicio", [], "inicio"));
    const body = this.parseBloque(); if (body) ch.push(body);
    this.expectOrError(TYPE.KW, "fin", "se esperaba 'fin'");
    ch.push(this.node("fin", [], "fin"));
    return this.node("<funcion_def>", ch);
  }

  /* ── <parametros> : tipo id , tipo id , ... ────────────────── */
  parseParametros() {
    const ch = [];
    while (
      this.peek()?.type === TYPE.KW &&
      ["num","dec","binario"].includes(this.peek().value)
    ) {
      const tipo = this.advance();
      ch.push(this.node("<tipo>", [], tipo.value));
      const id = this.expect(TYPE.ID);
      if (id) ch.push(this.node("<identificador>", [], id.value));
      if (this.peek()?.value === ",") { this.advance(); ch.push(this.node(",",[],"," )); }
      else break;
    }
    return ch.length ? this.node("<parametros>", ch) : null;
  }

  /* ── <retorno> : return expr ; ─────────────────────────────── */
  parseRetorno() {
    const ch = [];
    this.advance(); ch.push(this.node("return", [], "return"));
    const expr = this.parseExpresion(); if (expr) ch.push(expr);
    this.expect(TYPE.DELIM, ";"); ch.push(this.node(";", [], ";"));
    return this.node("<retorno>", ch);
  }

  /* ── <llamada_show> : show ( expr ) ; ──────────────────────── */
  parseShow() {
    const ch = [];
    this.advance(); ch.push(this.node("show", [], "show"));
    this.expectOrError(TYPE.DELIM, "(", "se esperaba '(' después de 'show'");
    ch.push(this.node("(", [], "("));
    const expr = this.parseExpresion(); if (expr) ch.push(expr);
    this.expectOrError(TYPE.DELIM, ")", "se esperaba ')' para cerrar 'show'");
    ch.push(this.node(")", [], ")"));
    this.expect(TYPE.DELIM, ";"); ch.push(this.node(";", [], ";"));
    return this.node("<llamada_show>", ch);
  }

  /* ── <llamada_funcion> : id ( args ) ───────────────────────── */
  parseLlamadaFuncion(asSentencia = false) {
    const ch = [];
    const id = this.expect(TYPE.ID);
    if (!id) return null;
    ch.push(this.node("<identificador>", [], id.value));
    this.expect(TYPE.DELIM, "("); ch.push(this.node("(", [], "("));
    const args = this.parseArgumentos(); if (args) ch.push(args);
    this.expect(TYPE.DELIM, ")"); ch.push(this.node(")", [], ")"));
    if (asSentencia) { this.expect(TYPE.DELIM, ";"); ch.push(this.node(";", [], ";")); }
    return this.node("<llamada_funcion>", ch);
  }

  /* ── <argumentos> : expr , expr , ... ──────────────────────── */
  parseArgumentos() {
    if (this.peek()?.value === ")") return null;
    const ch = [];
    const first = this.parseExpresion(); if (first) ch.push(first);
    while (this.peek()?.value === ",") {
      this.advance(); ch.push(this.node(",", [], ","));
      const arg = this.parseExpresion(); if (arg) ch.push(arg);
    }
    return ch.length ? this.node("<argumentos>", ch) : null;
  }

  /* ── bloque interno: sentencias hasta "fin" o "alternativa" ── */
  parseBloque() {
    const stmts = [];
    while (!this.isEnd()) {
      const v = this.peek()?.value;
      if (v === "fin" || v === "alternativa") break;
      const stmt = this.parseSentencia();
      if (stmt) stmts.push(stmt);
      else      this.advance();
    }
    return stmts.length ? this.node("<bloque>", stmts) : null;
  }

  /* ══════════════════════════════════════════════════════════════
     EXPRESIONES — Jerarquía de precedencia de operadores
     parseExpresion → parseTermino → parseFactor
     (menor precedencia → mayor precedencia)
  ══════════════════════════════════════════════════════════════ */

  /* ── <expresion> : termino (+|- termino)* ───────────────────── */
  parseExpresion() {
    let left = this.parseTermino();
    if (!left) return null;
    while (this.peek()?.type === TYPE.ARITH && ["+","-"].includes(this.peek().value)) {
      const op = this.advance();
      const right = this.parseTermino();
      if (!right) break;
      left = this.node("<expresion>", [left, this.node("<op>", [], op.value), right]);
    }
    return left.label === "<expresion>" ? left : this.node("<expresion>", [left]);
  }

  /* ── <termino> : factor (*|/|**|%% factor)* ─────────────────── */
  parseTermino() {
    let left = this.parseFactor();
    if (!left) return null;
    while (this.peek()?.type === TYPE.ARITH && ["*","/","**","%%"].includes(this.peek().value)) {
      const op = this.advance();
      const right = this.parseFactor();
      if (!right) break;
      left = this.node("<termino>", [left, this.node("<op>", [], op.value), right]);
    }
    return left.label === "<termino>" ? left : this.node("<termino>", [left]);
  }

  /* ── <factor> : unidad atómica de una expresión ─────────────── */
  parseFactor() {
    const tok = this.peek();
    if (!tok) return null;

    // ( expresion )
    if (tok.value === "(" && tok.type === TYPE.DELIM) {
      this.advance();
      const expr = this.parseExpresion();
      this.expect(TYPE.DELIM, ")");
      return this.node("<factor>", [this.node("(",[],"("), expr || this.node("ε"), this.node(")",[],")")]);
    }

    // raiz( expr )
    if (tok.value === "raiz" && tok.type === TYPE.KW) {
      this.advance(); this.expect(TYPE.DELIM, "(");
      const expr = this.parseExpresion();
      this.expect(TYPE.DELIM, ")");
      return this.node("<factor>", [this.node("raiz",[],"raiz"), this.node("(",[],"("), expr||this.node("ε"), this.node(")",[],")")]);
    }

    // elevar( base , exp )
    if (tok.value === "elevar" && tok.type === TYPE.KW) {
      this.advance(); this.expect(TYPE.DELIM, "(");
      const base = this.parseExpresion(); this.expect(TYPE.DELIM, ",");
      const exp  = this.parseExpresion(); this.expect(TYPE.DELIM, ")");
      return this.node("<factor>", [this.node("elevar",[],"elevar"), this.node("(",[],"("), base||this.node("ε"), this.node(",",[]," ,"), exp||this.node("ε"), this.node(")",[],")")]);
    }

    // modulo( a , b )
    if (tok.value === "modulo" && tok.type === TYPE.KW) {
      this.advance(); this.expect(TYPE.DELIM, "(");
      const a = this.parseExpresion(); this.expect(TYPE.DELIM, ",");
      const b = this.parseExpresion(); this.expect(TYPE.DELIM, ")");
      return this.node("<factor>", [this.node("modulo",[],"modulo"), this.node("(",[],"("), a||this.node("ε"), this.node(",",[]," ,"), b||this.node("ε"), this.node(")",[],")")]);
    }

    // cierto / falso
    if ((tok.value === "cierto" || tok.value === "falso") && tok.type === TYPE.KW) {
      this.advance();
      return this.node("<factor>", [this.node("<bool>", [], tok.value)]);
    }

    // identificador o llamada a función
    if (tok.type === TYPE.ID) {
      const next = this.tokens[this.pos + 1];
      if (next?.value === "(") return this.node("<factor>", [this.parseLlamadaFuncion(false)]);
      this.advance();
      return this.node("<factor>", [this.node("<identificador>", [], tok.value)]);
    }

    if (tok.type === TYPE.DEC) { this.advance(); return this.node("<factor>", [this.node("<decimal>", [], tok.value)]); }
    if (tok.type === TYPE.NUM) { this.advance(); return this.node("<factor>", [this.node("<numero>",  [], tok.value)]); }
    if (tok.type === TYPE.STR) { this.advance(); return this.node("<factor>", [this.node("<cadena>",  [], `"${tok.value}"`)]); }

    return null;
  }

  /* ── <condicion> : expr op_rel expr [&& || cond] ────────────── */
  parseCondicion() {
    // Negación: ! condicion
    if (this.peek()?.type === TYPE.LOGIC && this.peek().value === "!") {
      this.advance();
      const cond = this.parseCondicion();
      return this.node("<condicion>", [this.node("!",[],"!"), cond||this.node("ε")]);
    }

    const left = this.parseExpresion();
    if (!left) return null;

    const rel = this.peek();
    if (rel?.type === TYPE.REL && ["==","!=","<",">","<=",">="].includes(rel.value)) {
      this.advance();
      const right = this.parseExpresion();
      const cond  = this.node("<condicion>", [left, this.node("<op_rel>", [], rel.value), right||this.node("ε")]);

      // && o ||
      const lop = this.peek();
      if (lop?.type === TYPE.LOGIC && ["&&","||"].includes(lop.value)) {
        this.advance();
        const right2 = this.parseCondicion();
        return this.node("<condicion>", [cond, this.node(lop.value, [], lop.value), right2||this.node("ε")]);
      }
      return cond;
    }
    return this.node("<condicion>", [left]);
  }

  /* ── Ejecutar el parseo completo ─────────────────────────── */
  run() {
    const tree = this.parsePrograma();
    return { tree, errors: this.errors };
  }
}