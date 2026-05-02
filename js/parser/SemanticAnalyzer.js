"use strict";

/*
 * parser/SemanticAnalyzer.js - EulerCode
 * Analizador Semantico
 *
 * Verifica que el programa tenga sentido logico:
 *   - Variable declarada dos veces en el mismo scope global
 *   - Funcion definida dos veces
 *   - Variable utilizada sin haber sido declarada
 *   - Variable declarada pero nunca utilizada (advertencia)
 *   - Division por cero literal
 *   - show() llamado sin argumentos
 *
 * Usa un stack de scopes para manejar bloques anidados correctamente.
 * DEPENDE DE: constants.js (TYPE)
 */

class SemanticAnalyzer {

  constructor(tokens) {
    this.tokens    = tokens.filter(function(t) { return t.type !== TYPE.ERR; });
    this.errors    = [];
    this.warnings  = [];
    this.varTable  = {};
    this.funcTable = {};
    this._analyzeTokens();
  }

  _analyzeTokens() {
    var toks = this.tokens;
    var scopeStack = [{}];
    var undeclaredReported = {};

    for (var i = 0; i < toks.length; i++) {
      var t    = toks[i];
      var prev = toks[i - 1] || null;
      var next = toks[i + 1] || null;

      /* Manejo de scopes */
      if (t.type === TYPE.KW && t.value === "inicio") {
        scopeStack.push({});
      }
      if (t.type === TYPE.KW && t.value === "fin" && scopeStack.length > 1) {
        scopeStack.pop();
      }

      /* Verificacion 1b - Variable implicita del ciclo contar
         En "contar ( i <- ..." la variable i no lleva tipo delante,
         se registra aqui para que no sea marcada como no declarada. */
      if (t.type === TYPE.KW && t.value === "contar") {
        var parenT  = toks[i + 1] || null;
        var idT     = toks[i + 2] || null;
        var assignT = toks[i + 3] || null;
        if (parenT && parenT.value === "(" &&
            idT    && idT.type === TYPE.ID  &&
            assignT && assignT.type === TYPE.ASSIGN) {
          if (!this.varTable[idT.value]) {
            this.varTable[idT.value] = { tipo: "num", line: idT.line, usada: true };
          }
          var cs = scopeStack[scopeStack.length - 1];
          cs[idT.value] = { tipo: "num", line: idT.line, usada: true };
        }
      }

      /* Verificacion 1 - Declaracion de variable: tipo + identificador
         Solo reportar redeclaracion si la variable ya existe en scope GLOBAL.
         EXCEPCION: si el tipo aparece dentro de los parentesis de "definir"
         (es un parametro), NO se registra como variable global ni se reporta
         redeclaracion - los parametros ya se registran en Verificacion 2. */
      if (t.type === TYPE.KW && (t.value === "num" || t.value === "dec" || t.value === "binario")) {
        var nxt = toks[i + 1] || null;
        if (nxt && nxt.type === TYPE.ID) {

          // Detectar si este tipo esta dentro de parentesis de una definicion de funcion
          // Buscar hacia atras si hay un "definir" sin "inicio" de por medio
          var esParametro = false;
          for (var bi = i - 1; bi >= 0; bi--) {
            if (toks[bi].value === "inicio") break; // ya estamos dentro del cuerpo
            if (toks[bi].value === "definir") { esParametro = true; break; }
          }

          if (!esParametro) {
            var isGlobal      = scopeStack.length === 1;
            var existsGlobal  = !!scopeStack[0][nxt.value];

            if (isGlobal && existsGlobal) {
              this.errors.push(
                "Linea " + nxt.line + ": Variable [" + nxt.value + "] ya fue declarada en linea " + scopeStack[0][nxt.value].line
              );
            } else {
              var scope = scopeStack[scopeStack.length - 1];
              scope[nxt.value] = { tipo: t.value, line: nxt.line, usada: false };
              if (!this.varTable[nxt.value]) {
                this.varTable[nxt.value] = { tipo: t.value, line: nxt.line, usada: false };
              }
            }
          }
        }
      }

      /* Verificacion 2 - Definicion de funcion */
      if (t.value === "definir" && t.type === TYPE.KW) {
        var nxt2 = toks[i + 1] || null;
        if (nxt2 && nxt2.type === TYPE.ID) {
          if (this.funcTable[nxt2.value]) {
            this.errors.push("Linea " + nxt2.line + ": Funcion [" + nxt2.value + "] ya fue definida");
          } else {
            this.funcTable[nxt2.value] = { line: nxt2.line };
          }
          /* Registrar parametros de la funcion para no marcarlos como no declarados */
          var j = i + 3;
          while (j < toks.length && toks[j] && toks[j].value !== ")") {
            var pt = toks[j];
            if (pt.type === TYPE.ID) {
              var prevT = toks[j - 1] || null;
              if (prevT && prevT.type === TYPE.KW &&
                  (prevT.value === "num" || prevT.value === "dec" || prevT.value === "binario")) {
                if (!this.varTable[pt.value]) {
                  this.varTable[pt.value] = { tipo: prevT.value, line: pt.line, usada: true };
                }
                var cs2 = scopeStack[scopeStack.length - 1];
                cs2[pt.value] = { tipo: prevT.value, line: pt.line, usada: true };
              }
            }
            j++;
          }
        }
      }

      /* Verificacion 3 - Uso de variable */
      if (t.type === TYPE.ID) {
        var esDecl = prev && prev.type === TYPE.KW &&
                     (prev.value === "num" || prev.value === "dec" ||
                      prev.value === "binario" || prev.value === "definir");
        var esFn   = next && next.value === "(";
        var esLadoIzq = next && (next.value === "<-" || next.type === TYPE.ASSIGN);

        if (!esDecl && !esFn) {
          if (this.varTable[t.value] !== undefined) {
            this.varTable[t.value].usada = true;
          } else if (!this.funcTable[t.value] && !esLadoIzq) {
            /* Solo reportar si viene despues de un operador (lado derecho de expresion) */
            var enExprDer = prev && (
              prev.type === TYPE.ARITH ||
              prev.type === TYPE.REL   ||
              prev.type === TYPE.LOGIC ||
              prev.value === "("       ||
              prev.value === ","
            );
            if (enExprDer && !undeclaredReported[t.value]) {
              undeclaredReported[t.value] = true;
              this.errors.push(
                "Linea " + t.line + ": Variable [" + t.value + "] utilizada sin haber sido declarada"
              );
            }
          }
        }
      }
    }

    /* Verificacion 4 - Variables declaradas pero nunca usadas */
    var keys = Object.keys(this.varTable);
    for (var k = 0; k < keys.length; k++) {
      var name = keys[k];
      var info = this.varTable[name];
      if (!info.usada) {
        this.warnings.push(
          "Advertencia - Linea " + info.line + ": Variable [" + name + "] declarada pero nunca utilizada"
        );
      }
    }

    /* Verificacion 5 - Division por cero literal */
    for (var m = 0; m < toks.length; m++) {
      if (toks[m].type === TYPE.ARITH && toks[m].value === "/" &&
          toks[m + 1] && toks[m + 1].type === TYPE.NUM && toks[m + 1].value === "0") {
        this.errors.push("Linea " + toks[m].line + ": Division por cero detectada");
      }
    }

    /* Verificacion 6 - show() sin argumentos */
    for (var n = 0; n < toks.length; n++) {
      if (toks[n].value === "show" &&
          toks[n + 1] && toks[n + 1].value === "(" &&
          toks[n + 2] && toks[n + 2].value === ")") {
        this.errors.push("Linea " + toks[n].line + ": show() requiere al menos un argumento");
      }
    }
  }

  getResults() {
    return {
      errors:    this.errors,
      warnings:  this.warnings,
      varTable:  this.varTable,
      funcTable: this.funcTable,
    };
  }
}