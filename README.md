# 🧮 EulerCode — Mini Compilador

> **Curso:** Compiladores · Universidad Mariano Gálvez de Guatemala · Campus Jutiapa 2026  
> **Catedrática:** Inga. M.A. Sheyla Esquivel  
> **Estudiante:** Blanky Lopez — 0905-23-5227

---

## 📌 Descripción General

**EulerCode** es un mini compilador construido desde cero como proyecto individual del curso de Compiladores. Implementa un lenguaje de programación propio inspirado en el matemático **Leonhard Euler**, diseñado para realizar cálculos matemáticos mediante una sintaxis que mezcla términos en español e inglés.

El compilador es una aplicación web desarrollada en **JavaScript puro** (sin dependencias externas) que ejecuta las tres fases clásicas de un compilador directamente en el navegador:

```
Código fuente → Análisis Léxico → Análisis Sintáctico → Análisis Semántico → Resultados
```

---

## ✨ Características del Compilador

| Módulo | Descripción |
|--------|-------------|
| 🔤 **Análisis Léxico** | Tokeniza el código fuente e identifica cada elemento del lenguaje |
| 🌳 **Análisis Sintáctico** | Verifica la gramática y construye el árbol de derivación en SVG |
| 🔍 **Análisis Semántico** | Detecta errores de lógica: variables no declaradas, división por cero, etc. |
| 📋 **Tabla de Símbolos** | Registra todos los tokens únicos con tipo, categoría y ocurrencias |
| ⚠️ **Tabla de Errores** | Muestra errores léxicos, sintácticos y semánticos con línea y columna |
| 📊 **Estadísticas** | Conteo visual de tokens por categoría |
| 📐 **BNF Formal** | Gramática formal del lenguaje en notación Backus-Naur |
| 🖼️ **Exportar PNG** | Descarga el árbol de derivación como imagen PNG en alta resolución |
| ℹ️ **Guía integrada** | Modal con documentación completa del lenguaje para el usuario |

---

## 🗣️ El Lenguaje EulerCode

### Características del lenguaje

- 🌐 **Mezcla español-inglés** con términos matemáticos
- 🔡 **Case-sensitive**: `num` ≠ `Num` ≠ `NUM`
- ➡️ **Asignación** con el operador `<-`
- 📝 **Comentarios** de una línea `//` y de bloque `/* */`
- 🔢 **Enteros:** rango 0 – 99,999
- 🔣 **Decimales:** rango 0.0 – 99,999.99
- 🏷️ **Identificadores:** máximo 15 caracteres, deben iniciar con letra

### 🔑 Palabras Reservadas (20)

| Palabra | Equivalente | Uso |
|---------|-------------|-----|
| `num` | int | Declarar número entero |
| `dec` | float | Declarar número decimal |
| `binario` | boolean | Declarar valor booleano |
| `cierto` | true | Valor verdadero |
| `falso` | false | Valor falso |
| `definir` | function | Definir una función |
| `return` | return | Retornar valor |
| `si` | if | Condicional |
| `alternativa` | else | Alternativa del condicional |
| `repetir` | while | Ciclo mientras |
| `contar` | for | Ciclo con contador |
| `romper` | break | Salir de un ciclo |
| `skip` | continue | Saltar iteración |
| `show` | print | Mostrar valor en pantalla |
| `raiz` | sqrt() | Raíz cuadrada |
| `elevar` | pow() | Potencia |
| `modulo` | % | Módulo o resto |
| `inicio` | { | Abrir bloque |
| `fin` | } | Cerrar bloque |
| `nulo` | null | Valor nulo o vacío |

### ⚙️ Operadores

```
Asignación:   <-
Aritméticos:  +  -  *  /  **  %%
Relacionales: ==  <  >  <=  >=
Lógicos:      &&  ||  !
```

---

## 💻 Ejemplos de Código

### Declaración de variables
```
num edad <- 25;
dec precio <- 99.99;
binario activo <- cierto;
```

### Condicional si / alternativa
```
num x <- 10;
si (x > 5) inicio
    show(x);
alternativa inicio
    show(0);
fin
```

### Ciclo contar (for)
```
contar (i <- 1; i <= 5; i <- i + 1) inicio
    show(i);
fin
```

### Ciclo repetir (while)
```
num i <- 0;
repetir (i <= 10) inicio
    show(i);
    i <- i + 1;
fin
```

### Definición de funciones
```
definir areaCirculo(dec radio) inicio
    dec pi <- 3.1416;
    dec area <- pi * radio * radio;
    return area;
fin

dec resultado <- areaCirculo(5.0);
show(resultado);
```

### Funciones matemáticas especiales
```
dec r <- raiz(25);          // raiz cuadrada → 5.0
num p <- elevar(2, 8);      // potencia      → 256
num m <- modulo(10, 3);     // modulo/resto  → 1
```

---

## 🗂️ Estructura del Proyecto

```
EulerCode/
│
├── 📄 index.html                    # Interfaz principal del compilador
│
├── 🎨 css/
│   └── styles.css                   # Design System: Dark Luxury
│
└── ⚙️ js/
    ├── constants.js                 # Tipos, keywords y reglas léxicas (regex)
    ├── lexer.js                     # Clase Lexer — Analizador léxico
    ├── app.js                       # Orquestador principal del pipeline
    │
    ├── 📁 parser/
    │   ├── bnf.js                   # Gramática formal BNF del lenguaje
    │   ├── Parser.js                # Analizador sintáctico (descenso recursivo)
    │   ├── SemanticAnalyzer.js      # Analizador semántico con stack de scopes
    │   └── treeRenderer.js          # Generación SVG y exportación PNG
    │
    └── 📁 render/
        ├── utils.js                 # Utilidades compartidas de UI
        ├── tokens.js                # Grid de tarjetas de tokens
        ├── errors.js                # Tablas de errores léxicos y semánticos
        └── symbols.js               # Tabla de símbolos y estadísticas
```

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura de la interfaz |
| **CSS3** | Design System oscuro con variables CSS, glassmorphism y animaciones |
| **JavaScript ES6+** | Lógica del compilador — sin frameworks ni dependencias externas |
| **Canvas API** | Exportación del árbol de derivación como imagen PNG |
| **SVG** | Renderizado del árbol de derivación en pantalla |
| **Google Fonts** | Tipografías: Outfit (display) + Fira Code (monoespaciado) |

---

## 🚀 Cómo Usar

### Opción 1 — Abrir directamente
1. Clonar o descargar el repositorio
2. Abrir `index.html` en cualquier navegador moderno
3. No requiere instalación ni servidor

### Opción 2 — Con servidor local (recomendado)
```bash
# Con VS Code + Live Server
# Click derecho en index.html → "Open with Live Server"

# Con Python
python -m http.server 5500

# Con Node.js
npx serve .
```

### Flujo de uso
1. ✍️ Escribe tu programa en EulerCode en el editor, o carga una de las **5 muestras válidas** o **5 muestras con errores**
2. ▶️ Presiona **Analizar** o usa `Ctrl + Enter`
3. 📋 Revisa los tokens detectados, las tablas de errores y la tabla de símbolos
4. 🌳 Si el código es correcto, se genera el **árbol de derivación** automáticamente
5. ⬇️ Descarga el árbol como **PNG** con el botón correspondiente
6. ℹ️ Consulta el botón **Info** para ver la guía completa del lenguaje

---

## 🔬 Arquitectura del Compilador

El compilador sigue el pipeline clásico de tres fases:

### Fase 1 — Análisis Léxico (`lexer.js`)
- Recorre el código fuente carácter a carácter
- Aplica expresiones regulares para identificar tokens
- Genera la **tabla de tokens**, la **tabla de símbolos** y la **tabla de errores léxicos**
- Detecta: tokens inválidos, identificadores muy largos, números fuera de rango, caracteres desconocidos

### Fase 2 — Análisis Sintáctico (`parser/Parser.js`)
- Implementa un **parser de descenso recursivo**
- Cada regla de la gramática BNF tiene su propio método en JavaScript
- Construye el **árbol de derivación** si el código es gramaticalmente correcto
- Detecta: falta de `inicio`/`fin`, paréntesis sin cerrar, estructuras incompletas

### Fase 3 — Análisis Semántico (`parser/SemanticAnalyzer.js`)
- Verifica el **significado lógico** del programa
- Implementa un **stack de scopes** para manejo correcto de bloques anidados
- Detecta: variables no declaradas, redeclaración en el mismo scope, división por cero, variables no utilizadas, `show()` sin argumentos

---

## 📋 Tipos de Errores Detectados

### Errores Léxicos
| Tipo | Ejemplo | Descripción |
|------|---------|-------------|
| Token inválido | `3variable` | Identificador que inicia con dígito |
| Carácter desconocido | `@`, `$`, `#` | Símbolo fuera del alfabeto de EulerCode |
| Identificador muy largo | `resultado_de_la_operacion` | Más de 15 caracteres |
| Número fuera de rango | `100000` | Entero mayor a 99,999 |
| Cadena sin cerrar | `"hola` | Comilla de apertura sin cierre |

### Errores Sintácticos
| Tipo | Ejemplo |
|------|---------|
| Falta `inicio` o `fin` | `si (x > 0) show(x);` |
| Falta punto y coma | `num x <- 5` |
| Paréntesis sin cerrar | `show(x` |

### Errores Semánticos
| Tipo | Ejemplo |
|------|---------|
| Variable no declarada | Usar `b` sin declarar `num b;` |
| Variable redeclarada | Dos `num x` en el mismo scope |
| División por cero | `num r <- x / 0;` |
| Variable no utilizada | Declarar pero nunca usar |
| `show()` vacío | `show();` sin argumentos |

---

## 📸 Funcionalidades Visuales

- 🌑 **Tema oscuro** con gradientes atmosféricos y patrón de puntos
- 🎨 **Código de colores** por tipo de token (violeta, cyan, esmeralda, ámbar, fucsia...)
- ✨ **Animaciones** de entrada en cascada para los tokens
- 📱 **Diseño responsive** adaptado a pantallas pequeñas
- 🌳 **Árbol SVG** con nodos coloreados por categoría gramatical
- 🖼️ **Exportación PNG HD** (resolución 2x) con fondo oscuro y marca de agua

---

## 📚 Documentación Técnica

### Gramática Formal (BNF — fragmento)

```bnf
<programa>    ::= <sentencia> | <programa> <sentencia>
<sentencia>   ::= <declaracion> | <asignacion> | <condicional>
                | <ciclo_repetir> | <ciclo_contar> | <funcion_def>
                | <retorno> | <llamada_show>
<declaracion> ::= <tipo> <identificador> "<-" <expresion> ";"
<tipo>        ::= "num" | "dec" | "binario"
<condicional> ::= "si" "(" <condicion> ")" "inicio" <programa> "fin"
                | "si" "(" <condicion> ")" "inicio" <programa> "fin"
                  "alternativa" "inicio" <programa> "fin"
<expresion>   ::= <expresion> "+" <termino> | <termino>
<termino>     ::= <termino> "*" <factor> | <factor>
<factor>      ::= <identificador> | <numero> | <decimal>
                | "raiz" "(" <expresion> ")"
                | "elevar" "(" <expresion> "," <expresion> ")"
```

---

## 👩‍💻 Autora

**Blanky Marisol López Marroquín**  
Carné: 0905-23-5227  
Séptimo Semestre, Sección "A"
Ingeniería en Sistemas de Información y Ciencias de la Computación  
Universidad Mariano Gálvez de Guatemala — Campus Jutiapa  
Compiladores 2026

---

*EulerCode — Inspirado en el matemático Leonhard Euler (1707-1783)*
