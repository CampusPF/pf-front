/* Notas del blog, escritas a mano y guardadas acá (no es un mock: antes había
   tres posts inventados firmados por personas que no existen).

   Son notas sobre decisiones reales del producto, así que todo lo que dicen se
   puede contrastar con el código: el tutor IA (services/ai-tutor/), el dictado
   por voz (hooks/useVoiceRecorder.ts + services/speech/) y los certificados
   (services/certificates/). Si cambia alguna de esas tres cosas, la nota
   correspondiente queda desactualizada y hay que tocarla.

   No hay autor por post: las firma el equipo (BLOG_AUTHOR). Si algún día esto
   sale de un CMS o de un `GET /blog/posts`, el tipo ya tiene la forma. */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO
  readMinutes: number;
  content: string[]; // párrafos
}

/** Las notas las firma el equipo, no una persona inventada. */
export const BLOG_AUTHOR = "Equipo Campus";

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "como-funciona-el-tutor-ia-de-campus",
    title: "Cómo funciona el Tutor IA de Campus",
    excerpt:
      "No es un chatbot pegado a un costado: hay una conversación por lección, el tutor sabe en cuál estás y no se abre donde no podrías ver el contenido.",
    category: "Producto",
    date: "2026-09-12",
    readMinutes: 5,
    content: [
      "La primera versión del tutor era lo que uno esperaría: un chat general, siempre disponible, al que le contabas de qué estabas hablando. Funcionaba, pero cada conversación empezaba de cero y la mitad del mensaje se iba en explicar el contexto. Terminamos tomando una decisión que suena más restrictiva de lo que es: el tutor no existe fuera de una lección.",
      "Hoy hay una conversación por lección. Cuando abrís el tutor desde el reproductor, el back ya sabe qué lección estás cursando, y el historial de esa conversación queda atado a ella. Si volvés tres días después a repasar, la charla sigue donde la dejaste, con el contexto intacto. No hay un chat general al que entrarle sin curso: el endpoint que crea la conversación exige una lección real.",
      "La segunda decisión fue de acceso, y es la que más discutimos. El tutor se abre únicamente donde podrías ver el contenido de la lección: la misma regla que decide si te mostramos el video y el texto decide si te habilitamos el tutor. La razón es simple: si no fuera así, el tutor sería una manera gratis de que te expliquen una lección paga. Un asistente que te resume el contenido que no compraste es, en los hechos, el contenido.",
      "Sobre el límite: en el plan Free hay un tope diario de mensajes, y lo cuenta el servidor, no el navegador. Lo decimos en la cabecera del tutor para que no te enteres cuando te quedaste sin, a mitad de una duda. Con Premium no hay tope; los docentes y el equipo de administración tampoco lo tienen, porque necesitan probar el material que publican.",
      "Lo que todavía no hace: la respuesta llega completa, de una, en vez de ir apareciendo mientras se genera. Para respuestas largas se nota la espera. Es lo próximo que queremos cambiar, y está pensado de forma que sólo toque la capa que habla con el back.",
    ],
  },
  {
    slug: "dictado-por-voz-por-que-no-usamos-la-api-del-navegador",
    title: "Dictado por voz: por qué no usamos la API del navegador",
    excerpt:
      "El navegador trae una API de reconocimiento de voz gratis. La descartamos por tres razones, y después tuvimos que resolver el problema que más rompe: el micrófono equivocado.",
    category: "Ingeniería",
    date: "2026-09-26",
    readMinutes: 7,
    content: [
      "Podés dictar tus mensajes, tanto en el tutor IA como en el chat con el docente. La forma obvia de implementarlo era la Web Speech API, que viene en el navegador y no cuesta nada. No la usamos por tres motivos: en Firefox directamente no existe, en Brave falla, y en Chrome funciona porque manda tu audio a los servidores de Google. Lo último fue el que definió: si el audio va a salir del navegador, preferimos saber a dónde va.",
      "Así que grabamos con MediaRecorder (webm/opus, o mp4 en Safari) y la transcripción la hace nuestro propio back con Whisper. El audio pasa por nuestro servidor y por ningún otro. Si la transcripción no está configurada, el micrófono no aparece en ningún lado en vez de aparecer y fallar al apretarlo.",
      "La primera versión mostraba el texto recién al soltar el botón. Grabar quince segundos mirando una barra que no dice nada se siente roto, así que ahora cada tres segundos mandamos lo grabado hasta ahí y lo mostramos como provisional; al cortar, la transcripción del audio completo —que Whisper puntúa mucho mejor— reemplaza a los parciales. Hay un detalle del formato que cuesta descubrir: en webm sólo el primer fragmento tiene los encabezados, así que cada parcial tiene que mandar todo desde el principio y no sólo lo último. Mandar sólo el último trozo devuelve silencio.",
      "El bug que más nos enseñó fue otro. Descartábamos la grabación si el volumen no superaba un umbral fijo y mostrábamos un cartel de 'no te escuchamos'. Con el micrófono de unos auriculares la voz entra bastante más baja que con el del teléfono, y se perdían dictados enteros que estaban perfectos. Ahora el umbral es relativo al ruido de fondo, que medimos en los primeros cuatrocientos milisegundos, y ante la duda mandamos igual: sólo descartamos el silencio absoluto, que es micrófono mudo o dispositivo equivocado.",
      "Y la causa número uno de 'no me escucha' no era el código: era que el navegador tomaba el micrófono predeterminado del sistema, que casi nunca es el de los auriculares que tenés puestos. Por eso hay un selector de micrófono y se recuerda cuál elegiste. Antes de grabar, además, el audio pasa por una ganancia automática y un compresor —con un micrófono normal no amplifica nada—, porque con señal muy baja Whisper no devuelve lo que dijiste: devuelve cualquier cosa, con toda confianza.",
      "Dos reglas que no pensamos cambiar: el dictado tiene un máximo de sesenta segundos, y el texto se suma al campo para que lo revises. Nunca se envía solo. Una transcripción es una sugerencia, no una decisión.",
    ],
  },
  {
    slug: "que-hay-detras-de-un-certificado-verificado",
    title: "Qué hay detrás de un certificado verificado",
    excerpt:
      "Un PDF lindo lo arma cualquiera. Lo que hace que un certificado valga algo es que un tercero pueda comprobarlo sin pedirte nada.",
    category: "Producto",
    date: "2026-10-01",
    readMinutes: 4,
    content: [
      "Cuando terminás un curso podés emitir tu certificado desde «Mis cursos». No alcanza con haber mirado los videos: hay que tener el cien por ciento de las lecciones completadas y los checkpoints aprobados. Mientras falte algo, el curso no figura como terminado y el certificado no se emite. Preferimos que el papel diga la verdad.",
      "El PDF lleva tu nombre, el curso, la fecha y la duración real del contenido en horas, calculada sobre las lecciones del curso y no escrita a mano. También lleva un código único y un QR.",
      "El QR es la parte importante. Apunta a una página pública de verificación: quien escanee el código ve el certificado sin necesidad de tener cuenta en Campus, ni de pedirte nada, ni de confiar en el PDF que le mandaste. Si el código no existe, lo dice. Esa página se resuelve del lado del servidor justamente porque la mayoría la va a abrir con el celular, apuntando a una hoja impresa.",
      "Dos cosas que no cambian con el plan: el certificado se emite al completar cualquier curso, también los gratuitos, y no hace falta Premium. Premium te da acceso al catálogo pago y al tutor sin tope diario; el certificado es tuyo por haber terminado el curso, no por haber pagado una suscripción.",
    ],
  },
];
