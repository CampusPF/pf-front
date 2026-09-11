/* De dónde salen los cursos: el back ("api", default) o los mocks de data/.

   NEXT_PUBLIC_COURSES_SOURCE=mock en .env.local sirve para trabajar en la UI
   sin el back levantado. En modo "api" NO se cae a los mocks si el back falla:
   eso escondería errores reales detrás de datos falsos. */
export const USE_MOCK_COURSES = process.env.NEXT_PUBLIC_COURSES_SOURCE === "mock";
