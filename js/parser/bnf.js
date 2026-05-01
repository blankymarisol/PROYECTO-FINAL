"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  parser/bnf.js — EulerCode
 *  Gramática Formal del lenguaje en notación BNF
 *  (Backus-Naur Form)
 *
 *  PROPÓSITO:
 *  Separar la definición formal del lenguaje del código del parser.
 *  Este archivo es solo datos (texto); no contiene lógica.
 *
 *  USADO EN: app.js lo inyecta en el <pre id="bnfDisplay">
 * ═══════════════════════════════════════════════════════════════════
 */

const BNF_RULES = `╔══════════════════════════════════════════════════════╗
║          EulerCode — Gramática Formal (BNF)          ║
╚══════════════════════════════════════════════════════╝

<programa>       ::= <sentencia> | <programa> <sentencia>

<sentencia>      ::= <declaracion>
                   | <asignacion>
                   | <condicional>
                   | <ciclo_repetir>
                   | <ciclo_contar>
                   | <funcion_def>
                   | <retorno>
                   | <llamada_show>
                   | <romper>
                   | <skip>

<declaracion>    ::= <tipo> <identificador> ";"
                   | <tipo> <identificador> "<-" <expresion> ";"

<tipo>           ::= "num" | "dec" | "binario"

<asignacion>     ::= <identificador> "<-" <expresion> ";"

<condicional>    ::= "si" "(" <condicion> ")" "inicio" <programa> "fin"
                   | "si" "(" <condicion> ")" "inicio" <programa> "fin"
                     "alternativa" "inicio" <programa> "fin"

<ciclo_repetir>  ::= "repetir" "(" <condicion> ")" "inicio" <programa> "fin"

<ciclo_contar>   ::= "contar" "(" <asignacion_corta> ";" <condicion> ";"
                      <asignacion_corta> ")" "inicio" <programa> "fin"

<asignacion_corta> ::= <identificador> "<-" <expresion>

<funcion_def>    ::= "definir" <identificador> "(" <parametros> ")"
                      "inicio" <programa> "fin"

<parametros>     ::= ε | <param> | <parametros> "," <param>
<param>          ::= <tipo> <identificador>

<retorno>        ::= "return" <expresion> ";"

<llamada_show>   ::= "show" "(" <expresion> ")" ";"

<romper>         ::= "romper" ";"
<skip>           ::= "skip" ";"

<expresion>      ::= <expresion> "+" <termino>
                   | <expresion> "-" <termino>
                   | <termino>

<termino>        ::= <termino> "*" <factor>
                   | <termino> "/" <factor>
                   | <termino> "**" <factor>
                   | <termino> "%%" <factor>
                   | <factor>

<factor>         ::= "(" <expresion> ")"
                   | <identificador>
                   | <numero>
                   | <decimal>
                   | <cadena>
                   | "cierto" | "falso"
                   | "raiz"   "(" <expresion> ")"
                   | "elevar" "(" <expresion> "," <expresion> ")"
                   | "modulo" "(" <expresion> "," <expresion> ")"
                   | <llamada_funcion>

<llamada_funcion> ::= <identificador> "(" <argumentos> ")"
<argumentos>      ::= ε | <expresion> | <argumentos> "," <expresion>

<condicion>      ::= <expresion> <op_rel> <expresion>
                   | <condicion> "&&" <condicion>
                   | <condicion> "||" <condicion>
                   | "!" <condicion>
                   | <expresion>

<op_rel>         ::= "==" | "!=" | "<" | ">" | "<=" | ">="

<identificador>  ::= letra { letra | dígito | "_" }
                     /* máx. 15 caracteres, case-sensitive */

<numero>         ::= dígito { dígito }        /* rango: 0 – 99999 */
<decimal>        ::= dígito { dígito } "." dígito { dígito }
<cadena>         ::= '"' { carácter } '"' | "'" { carácter } "'"
<letra>          ::= a–z | A–Z | _
<dígito>         ::= 0–9`;