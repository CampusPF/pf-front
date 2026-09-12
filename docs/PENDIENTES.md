# Pendientes — front y back

Estado al 11/09/2026. En el código, cada punto está marcado con `TODO(back)` o
`TODO(campus)`: buscá esos textos para ver exactamente dónde impacta.

## Back (`pf-back`)

Ordenado por lo que más destraba al front.

| # | Qué | Por qué | Front cuando esté |
|---|---|---|---|
| 1 | `GET /courses/:id` con `modules.lessons` (ordenadas, sin `content`/`videoUrl`) y **público** | Hoy sin sesión sólo se ven los módulos, y con sesión se hace un request por módulo | `loadSyllabus` deja de pedir nada solo (el adapter detecta `lessons` en la respuesta) |
| 2 | `GET /courses/slug/:slug` | El front resuelve slug → id bajando el listado entero | `getCourseBySlug` pasa a un solo `apiFetch` |
| 3 | Permisos de **teacher** en cursos, módulos y lecciones (`@Roles(ADMIN, TEACHER)` + chequear que `course.instructor.id === user.id`) | El panel ya deja entrar al teacher, pero sus escrituras vuelven 403 | Nada: ya funciona |
| 4 | Filtros y paginación en `GET /courses` (`category`, `level`, `isFree`, `search`, `page`, `limit`) | Se filtra en el cliente con el listado completo | `CLIENT_SIDE_FILTERING = false` en `courses.service.ts` y borrar `courses.client-filter.ts` |
| 5 | Sacar `imageUrl` de `CreateCourseDto` / `CreateCategoryDto` | Las imágenes se suben por archivo; el front ya no lo manda | Nada |
| 6 | Inscripción automática para suscriptores Premium | Ven las lecciones pagas pero sin inscripción no registran progreso | Nada |
| 7 | `GET /course-enrollments/me` con total de lecciones por curso y próxima lección | El dashboard oculta "Lección X/Y" y el módulo/próxima lección de "Continuá" | `dashboard.view.ts` |
| 8 | Endpoints de racha, logros y horas estudiadas | Son mock en el dashboard | `dashboard.view.ts` (`buildStats`) |
| 9 | Métricas agregadas de admin (ingresos, ventas por curso) | El resumen cuenta listados completos; no escala | `getAdminStats` |
| 10 | Campos de catálogo: `subtitle`, `tags`, rating, cantidad de alumnos, título/bio del instructor | Se ocultan para los cursos reales | `courses.adapter.ts` |
| 11 | `GET /courses?instructorId=` | El teacher ve "sus" cursos filtrados en el cliente | `AdminCoursesList` |
| 12 | Reordenar módulos/lecciones en bloque | Hoy el orden se edita campo por campo | `SyllabusEditor` |
| 13 | ~~El seeder (`run-seed.ts`) no pasa `ssl`~~ — resuelto en `feature/seed-ssl-supabase` | Ya conecta a Supabase/Render | — |
| 14 | El seed carga `imageUrl` apuntando a `cdn.campuslite.com`, un dominio que **no existe** | Cada portada tira `ERR_NAME_NOT_RESOLVED` en la consola del navegador. El front ya cae al gradiente, pero el request falla igual | Conviene dejar `imageUrl` en `null` en el seed y subir las portadas desde el panel |
| 15 | `GET /users` no lista los usuarios dados de baja y no acepta `?includeDeleted=true` | El panel de usuarios no puede ofrecer "restaurar", aunque `PATCH /users/:id/restore` exista | `UsersManager` |
| 16 | No hay endpoint para **quitar** una imagen (dejar un curso o categoría sin portada) | Sólo se puede reemplazar por otra | Faltaría un `DELETE /courses/:id/image` |
| 17 | El avatar y las portadas quedan en Cloudinary cuando se da de baja al usuario o al curso | Archivos huérfanos que consumen cuota | — |

## Front (`pf-front`)

| Qué | Dónde |
|---|---|
| Pantallas "Tutor IA" y "Logros" (hoy `comingSoon` en el sidebar) | `DashboardSidebar.tsx` |
| Conectar el drawer del tutor IA a `/ai-tutor/conversations` (el back ya existe) | `components/ai-tutor/` |
| Pantalla de usuarios en el admin (cambiar rol con `PATCH /users/:id`) | `components/admin/` |
| Calcular "Lección X/Y" y próxima lección del dashboard con el temario (si el back no lo agrega) | `dashboard.view.ts` |
| Bio real del instructor en la tab "Instructor" | `CourseTabs.tsx` |
| Lint heredado: `set-state-in-effect` en `auth/callback` y `AiTutorDrawer`, `<img>` en `OrderSummary`, variable sin usar en `DashboardTopbar` | — |

## Qué sigue siendo mock

| Dato | Dónde |
|---|---|
| Racha, logros y horas estudiadas | `data/dashboard.mock.ts` (tarjetas + topbar) |
| Texto de la bio del instructor | `CourseTabs.tsx` |
| Todo el catálogo, **sólo** si `NEXT_PUBLIC_COURSES_SOURCE=mock` | `data/*.mock.ts` |

Con `NEXT_PUBLIC_COURSES_SOURCE` sin definir (lo normal, y lo que tiene que
estar en producción) todo sale del back.
