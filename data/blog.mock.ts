/* TODO(campus): data ficticia del blog, sólo para maquetar el listado y el
   detalle de cada post. Cuando exista el back, esto sale de un CMS o de un
   endpoint tipo GET /blog/posts. */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO
  readMinutes: number;
  author: string;
  content: string[]; // párrafos
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "5-habitos-para-aprender-a-programar-mas-rapido",
    title: "5 hábitos para aprender a programar más rápido",
    excerpt:
      "No es cuestión de talento, es cuestión de repetición deliberada. Estos son los hábitos que más repetimos en los estudiantes que avanzan más rápido en Campus.",
    category: "Aprendizaje",
    date: "2026-08-14",
    readMinutes: 6,
    author: "Bruno Salas",
    content: [
      "Cuando revisamos el progreso de los estudiantes que completan un curso en la mitad de tiempo que el promedio, casi nunca es por tener más experiencia previa. Es por cómo estudian, no por cuánto saben al empezar.",
      "1. Programan todos los días, aunque sea 20 minutos. La consistencia le gana a las maratones de fin de semana: el cerebro consolida mejor con repetición espaciada que con sesiones largas y esporádicas.",
      "2. Escriben el código antes de copiarlo. Ver una solución y escribirla de memoria después, sin mirar, obliga a entender la lógica en vez de memorizar sintaxis.",
      "3. Rompen cosas a propósito. Cambiar una línea al azar y ver qué explota es una de las formas más rápidas de entender qué hace cada parte de un programa.",
      "4. Le explican el concepto a alguien más (aunque sea a un pato de goma). Si no podés explicarlo simple, todavía no lo entendiste del todo.",
      "5. Usan al Tutor IA para preguntar 'por qué', no sólo 'cómo'. Pedir la solución sin entender el razonamiento genera una sensación falsa de progreso.",
    ],
  },
  {
    slug: "como-disenamos-el-tutor-ia-de-campus",
    title: "Cómo diseñamos el Tutor IA de Campus",
    excerpt:
      "Un chatbot genérico no alcanza. Contamos las decisiones detrás de un asistente que sabe en qué lección estás parado antes de que se lo digas.",
    category: "Producto",
    date: "2026-07-02",
    readMinutes: 8,
    author: "Iñaki Duarte",
    content: [
      "La primera versión del Tutor IA era, honestamente, un chat pegado arriba de un modelo de lenguaje genérico. Funcionaba, pero no entendía el contexto del estudiante: le podías preguntar sobre closures en JavaScript en medio de un curso de Python y te respondía sin pestañear.",
      "La segunda versión cambió el enfoque: en cada consulta, el tutor recibe automáticamente en qué curso, módulo y lección está el estudiante, junto con su nivel general. Eso le permite ajustar el vocabulario, el nivel de detalle y hasta el lenguaje del ejemplo de código al contexto exacto.",
      "También separamos los tres modos de interacción (Preguntar, Practicar, Explicar) porque notamos que mezclar 'quiero que me expliques' con 'quiero un ejercicio' en un mismo cuadro de texto generaba respuestas ambiguas. Modos separados, prompts separados, mejores respuestas.",
      "Lo que más nos costó fue lograr que el tutor no regale la solución cuando el estudiante está resolviendo un ejercicio. La línea entre 'ayudar' y 'resolver por él' es más fina de lo que parece.",
    ],
  },
  {
    slug: "por-que-elegimos-gamificacion-y-no-solo-certificados",
    title: "Por qué elegimos gamificación y no solo certificados",
    excerpt:
      "Los certificados motivan al final del camino. La racha y el XP motivan hoy, que es cuando de verdad se decide si alguien abandona o sigue.",
    category: "Producto",
    date: "2026-05-20",
    readMinutes: 5,
    author: "Renata Ibáñez",
    content: [
      "Un certificado es una recompensa a 40 horas de distancia. Para alguien que recién arranca, eso es casi tan motivador como una meta abstracta.",
      "Por eso Campus combina certificados con señales de progreso más inmediatas: XP por cada lección completada, rachas de días consecutivos, y logros desbloqueables por hitos chicos (primer ejercicio resuelto, primera semana sin faltar).",
      "No es solo psicología barata: la racha en particular resultó ser el predictor más fuerte de qué estudiantes iban a completar el curso. Alguien con 5 días de racha activa tiene muchas más chances de llegar al final que alguien sin ninguna señal de progreso visible.",
    ],
  },
];
