# Migración a bundler (pendiente)

Actualmente el paquete **@clubfutbolin/api** usa **tsconfig-paths** en tiempo de ejecución para resolver el alias `@/` en desarrollo (`npm run dev` desde la raíz) y en producción (`npm start`). El build es `tsc` y el resultado queda en **`apps/api/dist/`**, con referencias a `@/`, por eso hace falta `-r tsconfig-paths/register` al ejecutar Node.

**Objetivo:** En el futuro migrar a un **bundler** que resuelva los path aliases en **build time** y genere un artefacto que Node pueda ejecutar sin tsconfig-paths. Así el despliegue es más estándar y se puede eliminar la dependencia de tsconfig-paths en producción.

---

## Opciones de bundler (resumen)

### 1. **tsup**

- **Qué es:** Wrapper sobre esbuild pensado para librerías y apps Node/TypeScript. Cero config por defecto, usa tu `tsconfig.json`.
- **Pros:** Muy fácil de configurar, soporta path aliases y `@/` sin plugins, genera CommonJS/ESM, una sola dependencia, rápido.
- **Contras:** Menos flexible que webpack si más adelante necesitas loaders muy específicos o integraciones complejas.
- **Bueno para:** Apps Node/API como esta. Comando típico: `tsup src/main.ts --format cjs`.

### 2. **esbuild**

- **Qué es:** Bundler y minificador en Go, muy rápido. No es solo para TypeScript; se usa mucho como base de otras herramientas (Vite, tsup).
- **Pros:** Velocidad máxima, soporte nativo de TypeScript y path aliases (con un poco de config), sin dependencias pesadas.
- **Contras:** Config más manual que tsup, no hace type-check (hay que seguir usando `tsc --noEmit` en CI).
- **Bueno para:** Proyectos que quieren control fino y el build más rápido posible.

### 3. **webpack**

- **Qué es:** Bundler muy usado y con ecosistema enorme (loaders, plugins).
- **Pros:** Máxima flexibilidad, mucha documentación y ejemplos, integración con todo tipo de assets y entornos.
- **Contras:** Config más compleja y builds más lentos que esbuild/tsup; para una API Node simple suele ser más de lo necesario.
- **Bueno para:** Apps con muchos tipos de recursos (CSS, imágenes, etc.) o necesidades de build muy específicas.

### 4. **Rollup**

- **Qué es:** Bundler orientado a generar módulos y librerías limpios (tree-shaking muy bueno).
- **Pros:** Output muy controlado, ideal para librerías; plugins para TypeScript y path aliases.
- **Contras:** Más pensado para librerías que para apps Node; config no trivial para una API.
- **Bueno para:** Publicar paquetes npm; para una API sola, tsup o esbuild suelen ser más directos.

---

## Recomendación para este proyecto

Para una API Node con Fastify y Prisma, **tsup** es la opción más equilibrada: poca config, path aliases resueltos, build rápido y sin necesidad de tsconfig-paths en producción. **esbuild** es una buena alternativa si se prefiere no usar un wrapper y tener control total.

---

## Recordatorio

Cuando se retome el tema de **build**, **despliegue** o **optimización del arranque en producción**, revisar esta doc y valorar la migración a bundler (por ejemplo tsup) para dejar de depender de `tsconfig-paths` en `npm start`.
