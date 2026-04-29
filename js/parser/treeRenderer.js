"use strict";

/*
 * ═══════════════════════════════════════════════════════════════════
 *  parser/treeRenderer.js — EulerCode
 *  Generación y renderizado del Árbol de Derivación como SVG
 *
 *  PROPÓSITO:
 *  Tomar el árbol de nodos producido por Parser y convertirlo
 *  en un gráfico SVG interactivo que se inyecta en el DOM.
 * ═══════════════════════════════════════════════════════════════════
 */

/* Dimensiones de cada nodo en el SVG (píxeles) */
const NODE_W = 138; // ancho del rectángulo de cada nodo
const NODE_H = 36;  // alto del rectángulo de cada nodo
const GAP_X  = 12;  // espacio horizontal entre nodos hermanos
const GAP_Y  = 58;  // espacio vertical entre niveles del árbol


/* ─────────────────────────────────────────────────────────────────
   measureTree(node)
   PASO 1: Calcular el ancho total (_w) que ocupa cada subárbol.

   Recorre el árbol de ABAJO HACIA ARRIBA (post-order):
   primero mide los hijos, luego el padre suma sus anchos.

   Resultado: node._w = ancho total del subárbol en píxeles
   ───────────────────────────────────────────────────────────────── */
function measureTree(node) {
  if (!node.children || node.children.length === 0) {
    node._w = NODE_W; // nodo hoja: ocupa el ancho mínimo
    return;
  }
  node.children.forEach(measureTree); // medir hijos primero
  // Ancho del padre = suma de anchos de hijos + separaciones entre ellos
  node._w = Math.max(
    NODE_W,
    node.children.reduce((sum, child) => sum + child._w + GAP_X, -GAP_X)
  );
}


/* ─────────────────────────────────────────────────────────────────
   positionTree(node, x, y)
   PASO 2: Asignar coordenadas (x, y) a cada nodo.

   Recorre el árbol de ARRIBA HACIA ABAJO (pre-order):
   el padre calcula las posiciones de sus hijos.

   PARÁMETROS:
     x → coordenada X del CENTRO del nodo
     y → coordenada Y del TOPE del nodo
   ───────────────────────────────────────────────────────────────── */
function positionTree(node, x, y) {
  node._x = x;
  node._y = y;
  if (!node.children || node.children.length === 0) return;

  // Calcular el X de inicio: alinear los hijos centrados bajo el padre
  let cx = x - node._w / 2 + node.children[0]._w / 2;
  node.children.forEach(child => {
    positionTree(child, cx + child._w / 2, y + GAP_Y);
    cx += child._w + GAP_X; // avanzar al siguiente hermano
  });
}


/* ─────────────────────────────────────────────────────────────────
   _svgEsc(s)
   Escapar caracteres especiales para usarlos dentro de texto SVG.
   ───────────────────────────────────────────────────────────────── */
function _svgEsc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}


/* ─────────────────────────────────────────────────────────────────
   _getNodeColor(node)
   Devolver el esquema de colores de un nodo según su tipo.
   Los distintos colores facilitan la lectura visual del árbol.
   ───────────────────────────────────────────────────────────────── */
function _getNodeColor(node) {
  const isLeaf = !node.children || node.children.length === 0;
  const label  = node.label;

  if (label === "<programa>")
    return { fill:"#1a1f3a", stroke:"#c8a050", text:"#e8c878" }; // dorado: raíz
  if (["<declaracion>","<asignacion>","<funcion_def>"].includes(label))
    return { fill:"#1f1a3a", stroke:"#7c6ef5", text:"#b0a0ff" }; // violeta: estructuras
  if (["<condicional>","<ciclo_repetir>","<ciclo_contar>"].includes(label))
    return { fill:"#1a2f2a", stroke:"#34d399", text:"#7eedc7" }; // verde: control
  if (["<expresion>","<termino>","<factor>","<condicion>"].includes(label))
    return { fill:"#2a1f1a", stroke:"#fbbf24", text:"#fde68a" }; // ámbar: expresiones
  if (["<llamada_show>","<retorno>","<llamada_funcion>"].includes(label))
    return { fill:"#1a2535", stroke:"#22d3ee", text:"#7ee8f5" }; // cyan: llamadas
  if (isLeaf)
    return { fill:"#1a1a28", stroke:"#424670", text:"#8890b0" }; // gris: terminales
  return     { fill:"#1a2030", stroke:"#5060a0", text:"#7888c0" }; // azul: otros NT
}


/* ─────────────────────────────────────────────────────────────────
   treeToSVG(root)
   PASO 3: Convertir el árbol posicionado en código SVG.
   ───────────────────────────────────────────────────────────────── */
function treeToSVG(root) {
  const allNodes = [], allEdges = [];

  // Recolectar nodos y aristas recorriendo el árbol
  function collect(node) {
    allNodes.push(node);
    (node.children || []).forEach(child => {
      allEdges.push({ x1:node._x, y1:node._y+NODE_H, x2:child._x, y2:child._y });
      collect(child);
    });
  }
  collect(root);
  if (!allNodes.length) return "<p>Sin nodos</p>";

  // Calcular el viewBox mínimo que contiene todos los nodos
  const minX = Math.min(...allNodes.map(n=>n._x)) - NODE_W/2 - 20;
  const maxX = Math.max(...allNodes.map(n=>n._x)) + NODE_W/2 + 20;
  const maxY = Math.max(...allNodes.map(n=>n._y)) + NODE_H + 30;
  const W = maxX - minX, H = maxY;

  // Generar las líneas (aristas) entre padre e hijo
  const lines = allEdges.map(e =>
    `<line x1="${e.x1-minX}" y1="${e.y1}" x2="${e.x2-minX}" y2="${e.y2}"
           stroke="#2a3550" stroke-width="1.2" fill="none"/>`
  ).join("\n");

  // Generar los rectángulos + texto de cada nodo
  const isNT = n => n.label.startsWith("<");
  const rects = allNodes.map(n => {
    const c   = _getNodeColor(n);
    const nx  = n._x - minX - NODE_W/2;
    const lbl = _svgEsc(n.value !== null ? n.value : n.label);
    return `<g>
  <rect x="${nx}" y="${n._y}" width="${NODE_W}" height="${NODE_H}" rx="7"
        fill="${c.fill}" stroke="${c.stroke}" stroke-width="1"/>
  <text x="${nx+NODE_W/2}" y="${n._y+NODE_H/2}" text-anchor="middle"
        dominant-baseline="central" font-family="'Fira Code',monospace"
        font-size="10.5" fill="${c.text}"
        font-weight="${isNT(n)?"500":"400"}">${lbl}</text>
</g>`;
  }).join("\n");

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;background:transparent">
${lines}
${rects}
</svg>`;
}


/* ─────────────────────────────────────────────────────────────────
   renderParseTree(tokens, containerId)  — FUNCIÓN PÚBLICA
   Orquesta los 3 pasos y actualiza el DOM con el árbol SVG.
   ───────────────────────────────────────────────────────────────── */
function renderParseTree(tokens, containerId) {
  // 1. Parsear los tokens → obtener árbol y errores
  const { tree, errors } = new Parser(tokens).run();

  // 2. Medir y posicionar el árbol
  measureTree(tree);
  positionTree(tree, tree._w / 2, 20);

  const container = document.getElementById(containerId);
  if (!container) return errors;

  // Sin sentencias válidas → mostrar estado vacío
  if (!tree.children || tree.children.length === 0) {
    container.innerHTML = `<div class="empty">
      <span class="empty-icon">⊙</span>
      <span>No se detectaron sentencias válidas para el árbol.</span>
    </div>`;
    return errors;
  }

  // 3. Generar SVG e inyectarlo en el DOM
  container.innerHTML = `<div style="overflow-x:auto;padding:8px 0">${treeToSVG(tree)}</div>`;
  return errors;
}