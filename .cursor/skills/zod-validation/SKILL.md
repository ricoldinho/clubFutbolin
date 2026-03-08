---
name: zod-validation
description: Schemas Zod como fuente de verdad, inferencia de tipos e integración con Fastify para validar body/query. Usar cuando se hable de validación, Zod, schema o request body.
---

# Validación con Zod

## Cuándo aplicar

- Validación de request body, query o params; definición de schemas; integración con Fastify.

## Reglas

- **Fuente de verdad:** Zod es la única fuente de verdad para validación; inferir tipos TypeScript desde el schema (Schema-to-Type). Ver .cursorrules.
- **Fail Fast:** Validar configuración y entradas al inicio; si algo falta o es inválido, la request falla inmediatamente (400).
- **Fastify:** Validar el input antes de que llegue al handler; no duplicar lógica de validación en el dominio (el dominio recibe ya tipos validados o Value Objects construidos desde el handler/caso de uso).

## Referencias

- AGENT.md: Validación Zod, Next Task (Rutas Fastify + Zod).
- .cursorrules: Validación Zod, Fail Fast.
