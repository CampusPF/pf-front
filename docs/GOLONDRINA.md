# Golondrina en los asistentes de lección (prototipo)

Rama `feat/golondrina-asistentes`. Cada lección tiene, dentro del drawer del
tutor, una pestaña **Golondrina** al lado de **Tutor**: acciones de un clic que
el asistente le pasa a Golondrina (el motor de avisos de TecnoRosario).

| Acción | Qué muestra |
| --- | --- |
| Recordame repasar | Aviso para mañana 19:00 |
| Armá mi plan | 3 bloques de estudio en los próximos días |
| Mandame el resumen | Resumen de la lección al celular |
| Avisame si responden | Aviso cuando el docente conteste |

Cada acción muestra qué va a hacer Golondrina, cuándo, y una vista previa de la
notificación como le llegaría al alumno. Los canales (WhatsApp, Calendario,
Mail) se conectan con un clic.

**Es todo simulado en el navegador**: no hay endpoint en pf-back, no se conecta
a cuentas reales y no se manda nada. No toca el chat del tutor ni su límite
diario.

## Archivos

- `lib/golondrina.ts`: acciones, canales y `ejecutarAccion` (el único punto a
  reemplazar por llamadas reales cuando exista la integración).
- `components/golondrina/GolondrinaPanel.tsx`: la vista.
- `components/golondrina/GolondrinaLogo.tsx`: isotipo.
- `components/ai-tutor/AiTutorDrawer.tsx`: pestañas Tutor / Golondrina.
- `app/globals.css`: animación de entrada del aviso (respeta reduced-motion).

## Cómo verlo

`npm run dev`, abrir cualquier lección, **Preguntarle al tutor** → pestaña
**Golondrina**. Funciona igual aunque el back del tutor no responda.
