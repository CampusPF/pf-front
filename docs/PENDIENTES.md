# Pendientes — front y back

Estado al 04/10/2026. En el código, cada punto que sigue abierto está marcado
con `TODO(back)` o `TODO(campus)`: buscá esos textos para ver exactamente dónde
impacta. Los que no tienen marca en el código es porque son decisiones tomadas
(no se van a hacer) y están explicadas donde corresponde.

## Back (`pf-back`)

Ordenado por lo que más destraba al front.

| # | Qué | Por qué | Front cuando esté |
|---|---|---|---|
| 1 | ~~`GET /courses/:id` con `modules.lessons` y **público**~~ — resuelto el 04/10/2026: `CoursesService.findOneWithSyllabus` trae los módulos vivos con sus lecciones vivas, ordenados. No filtra por acceso porque no hace falta: `content`/`videoUrl` son `select: false` en la entidad Lesson. El temario completo ahora se ve sin sesión y `loadSyllabus` quedó como red de seguridad (no pega a la red) | — | — |
| 2 | ~~`GET /courses/slug/:slug`~~ — resuelto el 04/10/2026: `getCourseBySlug` es un solo `apiFetch` (404 → `null`). Antes bajaba el catálogo entero en cada visita al detalle, que es `force-dynamic` | — | — |
| 3 | ~~Permisos de **teacher** en cursos, módulos y lecciones~~ — resuelto el 14/09/2026: `@Roles(ADMIN, TEACHER)` + `assertCourseOwner` (`pf-back/src/common/utils/`) en cursos, portada, módulos, lecciones y sus adjuntos. Un TEACHER escribe sobre SU curso; sobre uno ajeno, 403 con mensaje ("Este curso no es tuyo: no podés editarlo.") | — | — |
| 4 | Filtros y paginación en `GET /courses` (`category`, `level`, `isFree`, `search`, `page`, `limit`) | Se filtra en el cliente con el listado completo | `CLIENT_SIDE_FILTERING = false` en `courses.service.ts` y borrar `courses.client-filter.ts` |
| 5 | Sacar `imageUrl` de `CreateCategoryDto` (el de `CreateCourseDto` se sacó el 04/10/2026) | Las imágenes se suben por archivo; el front ya no lo manda. En cursos, además, el PATCH pisaba `imageUrl` sin tocar `imagePublicId` y dejaba la anterior huérfana en Cloudinary | Nada |
| 6 | ~~Inscripción para suscriptores Premium~~ — resuelto: `POST /course-enrollments` acepta cursos pagos con suscripción activa y el front inscribe al entrar a una lección | — | — |
| 7 | `GET /course-enrollments/me` con total de lecciones por curso y próxima lección | El dashboard oculta "Lección X/Y" y el módulo/próxima lección de "Continuá" | `dashboard.view.ts` |
| 8 | Endpoint de logros; `GET /me/dashboard` único que reemplace los temporales `GET /me/streak` y `GET /me/studied-time` | Logros es mock; racha y horas ya son reales | `services/progress/progress-stats.service.ts` (único archivo a cambiar), `dashboard.view.ts` (`buildStats`) |
| 9 | ~~Métricas agregadas de admin~~ — resuelto el 30/09/2026: `GET /admin/stats?days=` (`pf-back/src/admin-stats/`) agrega en SQL totales, período vs anterior, inscripciones por día, ingresos por mes, top 5 y últimas inscripciones; admin ve la plataforma y docente sus cursos | — | — |
| 10 | Campos de catálogo: `subtitle`, `tags`, título/bio del instructor (rating y alumnos ya son reales: `ratingAverage`/`reviewsCount`/`studentsCount`) | Se ocultan para los cursos reales | `courses.adapter.ts` |
| 18 | `GET /courses` sin `?minRating=` ni `?sort=top-rated\|popular` | El filtro por valoración y el orden se hacen en el cliente (`sortCourses`, promedio bayesiano) | `courses.client-filter.ts` |
| 19 | ~~Moderación de comentarios de reseñas~~ — resuelto el 30/09/2026 sin Google Cloud: `pf-back/src/moderation/`, dos capas (lista local de groserías que corre siempre + Groq `openai/gpt-oss-safeguard-20b` con política propia). Lo ofensivo se rechaza con 422; la crítica negativa respetuosa se publica. Además, desde la misma fecha sólo reseña quien **terminó** el curso. Sigue sin haber forma de borrar una reseña ajena ya publicada (las previas a la moderación incluidas) | — | — |
| 11 | `GET /courses?instructorId=` | El teacher ve "sus" cursos filtrados en el cliente | `AdminCoursesList` |
| 12 | Reordenar módulos/lecciones en bloque | Hoy el orden se edita campo por campo | `SyllabusEditor` |
| 13 | ~~El seeder (`run-seed.ts`) no pasa `ssl`~~ — resuelto en `feature/seed-ssl-supabase` | Ya conecta a Supabase/Render | — |
| 14 | El seed carga `imageUrl` apuntando a `cdn.campuslite.com`, un dominio que **no existe** | Cada portada tira `ERR_NAME_NOT_RESOLVED` en la consola del navegador. El front ya cae al gradiente, pero el request falla igual | Conviene dejar `imageUrl` en `null` en el seed y subir las portadas desde el panel |
| 15 | ~~`GET /users` no acepta `?includeDeleted=true`~~ — resuelto el 04/10/2026: el controller expone el flag que el service ya tenía, y `UsersManager` sumó el switch "Ver dados de baja" y el botón "Restaurar" (`PATCH /users/:id/restore`, que ya existía). Una baja dejó de ser irreversible desde la app | — | — |
| 16 | No hay endpoint para **quitar** una imagen (dejar un curso o categoría sin portada) | Sólo se puede reemplazar por otra | Faltaría un `DELETE /courses/:id/image` |
| 17 | El avatar y las portadas quedan en Cloudinary cuando se da de baja al usuario o al curso | Archivos huérfanos que consumen cuota | — |
| 20 | Chat sin sala grupal por curso (sólo directo alumno↔docente) — resuelto el 27/09/2026 en el sentido de que el front ya no la pide: se agregó `GET /chat/contacts` (`ChatService.getContacts`) para listar con quién chatear, con último mensaje y no leídos | Si se quiere una sala grupal real haría falta modelarla en el back (hoy `messages` es 1 a 1) | Si existe algún día, `chat.service.ts` vuelve a poder ofrecer `kind: "group"` en modo real |
| 21 | `GET /chat/contacts` hace, por cada contacto, una consulta de último mensaje y otra de no leídos (N+1) | No escala con muchos contactos por usuario | Si se nota lento, agregar esas dos cuentas con una sola consulta agregada (`GROUP BY`) en `ChatService.getContacts` |

## Front (`pf-front`)

| Qué | Dónde |
|---|---|
| Pantalla "Logros" (hoy `comingSoon` en el sidebar; el ítem "Tutor IA" del sidebar apuntaba a una página aparte que nunca existió — el tutor real es el FAB/drawer global, ver fila de abajo) | `DashboardSidebar.tsx` |
| ~~Conectar el drawer del tutor IA a `/ai-tutor/conversations`~~ — resuelto el 26/09/2026: una conversación por lección (`services/ai-tutor/ai-tutor.service.ts`), límite diario del plan Free mostrado y respetado, y el tutor sólo se habilita con acceso real a la lección (`canView`, mismo criterio que el contenido) | — |
| ~~Conectar `/dashboard/chats` a pf-back~~ — resuelto el 27/09/2026: `chat.service.ts` habla con `GET /chat/contacts` + historial + el socket de `/chat` (ver fila 20 arriba); se sacó la sala grupal, que el back no soporta | — |
| ~~Pantalla de usuarios en el admin~~ — hecha, incluido dar de baja y restaurar (ver fila 15 arriba) | `components/admin/UsersManager.tsx` |
| Calcular "Lección X/Y" y próxima lección del dashboard con el temario (si el back no lo agrega) | `dashboard.view.ts` |
| Bio real del instructor en la tab "Instructor" — el 04/10/2026 se sacó el párrafo fijo que era igual para todos los docentes; hace falta un campo `bio` en el User | `CourseTabs.tsx` |
| Lint heredado: `set-state-in-effect` en `auth/callback` y `AiTutorDrawer`, `<img>` en `OrderSummary`, variable sin usar en `DashboardTopbar` | — |

## Qué sigue siendo mock

| Dato | Dónde |
|---|---|
| ~~Logros~~ — ya son reales (`GET /me/achievements`); el 04/10/2026 se borró `data/dashboard.mock.ts`, que sólo tenía un stat que nadie renderizaba | — |
| ~~Texto de la bio del instructor~~ — se sacó el 04/10/2026 en vez de dejar uno inventado | `CourseTabs.tsx` |
| ~~Blog~~ — el 04/10/2026 `data/blog.mock.ts` pasó a `data/blog.ts` con tres notas reales sobre el producto (tutor IA, dictado por voz, certificados), firmadas por el equipo y no por autores inventados | `data/blog.ts` |
| Todo el catálogo, **sólo** si `NEXT_PUBLIC_COURSES_SOURCE=mock` | `data/*.mock.ts` |
| El chat (incluida la sala grupal por curso, que el back no tiene), **sólo** si `NEXT_PUBLIC_CHAT_SOURCE=mock` | `data/chat.mock.ts` |

Con `NEXT_PUBLIC_COURSES_SOURCE` sin definir (lo normal, y lo que tiene que
estar en producción) todo sale del back.
