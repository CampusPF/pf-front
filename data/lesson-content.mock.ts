import type { LessonContent } from "@/types/course.types";

/* Contenido de muestra. Sólo unas pocas lecciones lo tienen cargado a propósito:
   el player muestra el estado "contenido en preparación" para el resto, así se
   ve cómo queda ese caso sin tener que romper la data. */
export const LESSON_CONTENT: Record<string, LessonContent> = {
  l1: {
    videoId: "dQw4w9WgXcQ",
    markdown: `## Un lenguaje que nació en 10 días

JavaScript se escribió en 1995 en poco más de una semana, para darle
interactividad a las páginas de Netscape. Treinta años después es el único
lenguaje que corre **de forma nativa** en todos los navegadores del mundo.

Eso es lo que explica su dominio: no ganó por ser el mejor diseñado, ganó
porque es el único que el navegador entiende sin instalar nada.

### ¿Dónde corre JavaScript hoy?

- En el **navegador**, para todo lo que ves y tocás en una página.
- En el **servidor**, con Node.js, Deno o Bun.
- En **apps móviles**, con React Native.
- Hasta en el **escritorio**, con Electron (VS Code está hecho así).

### Tu primera línea

Abrí la consola del navegador con \`F12\` y escribí:

\`\`\`js
console.log("Hola, Campus!");
\`\`\`

La consola es tu mejor amiga mientras aprendés: ejecuta cualquier expresión al
instante y te devuelve el resultado.

### Un lenguaje interpretado y dinámico

No compilás nada antes de correr el código. El motor del navegador (V8 en
Chrome, SpiderMonkey en Firefox) lee tu archivo y lo ejecuta al toque:

\`\`\`js
const lenguaje = "JavaScript";
const anio = 1995;

// Los tipos se infieren solos, no los declarás
console.log(typeof lenguaje); // "string"
console.log(typeof anio);     // "number"
\`\`\`

> Esa flexibilidad es su mayor virtud y su mayor trampa. En el módulo 1 vamos a
> ver exactamente dónde te puede morder.

### Lo que viene

En la próxima lección configurás tu entorno: Node, un editor y las extensiones
que te van a ahorrar horas.`,
  },
  l11: {
    videoId: null,
    markdown: `## Arrow functions en profundidad

Las arrow functions no son "azúcar sintáctica para escribir menos". Cambian dos
cosas importantes: **cómo se resuelve \`this\`** y **qué se puede omitir**.

### Sintaxis: de larga a mínima

Estas tres funciones hacen exactamente lo mismo:

\`\`\`js
// Función tradicional
function doble(n) {
  return n * 2;
}

// Arrow con cuerpo de bloque
const doble2 = (n) => {
  return n * 2;
};

// Arrow con retorno implícito
const doble3 = (n) => n * 2;
\`\`\`

Cuando el cuerpo es una sola expresión podés borrar las llaves y el \`return\`.
Eso es lo que las hace tan cómodas dentro de \`map\`, \`filter\` y \`reduce\`:

\`\`\`js
const numeros = [1, 2, 3, 4];

const pares = numeros.filter((n) => n % 2 === 0);
const total = numeros.reduce((acc, n) => acc + n, 0);

console.log(pares); // [2, 4]
console.log(total); // 10
\`\`\`

### Cuidado al devolver un objeto

Si querés devolver un objeto literal con retorno implícito, envolvelo en
paréntesis. Sin ellos, JavaScript lee las llaves como un bloque de código:

\`\`\`js
const malo = (nombre) => { nombre: nombre };   // devuelve undefined
const bueno = (nombre) => ({ nombre: nombre }); // devuelve { nombre: "..." }
\`\`\`

### \`this\` léxico: el cambio de fondo

Una arrow function **no crea su propio \`this\`**: hereda el del scope donde fue
escrita. Ese es el motivo real por el que existen.

\`\`\`js
const contador = {
  cuenta: 0,
  arrancar() {
    // Con arrow, \`this\` sigue siendo \`contador\`
    setInterval(() => {
      this.cuenta += 1;
      console.log(this.cuenta);
    }, 1000);
  },
};

contador.arrancar();
\`\`\`

Con una \`function\` tradicional adentro del \`setInterval\`, \`this\` habría
sido el objeto global y \`this.cuenta\` sería \`undefined\`.

### Cuándo NO usarlas

- Como **métodos de un objeto** que necesitan \`this\` propio.
- Como **constructores**: \`new\` sobre una arrow tira error.
- Cuando necesitás el objeto \`arguments\` (las arrow no lo tienen).

> Regla práctica: arrow para callbacks y funciones cortas, \`function\` para
> métodos que dependen del objeto que las contiene.`,
  },
};
