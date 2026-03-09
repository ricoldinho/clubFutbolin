# Dobles de prueba (mocks en memoria)

Los tests de Vitest se ejecutan **con mocks en memoria**: no se usa DB, red ni disco real en tests unitarios.

- **Fakes:** Implementaciones en memoria (p. ej. `InMemoryXRepository`) que implementan la misma interfaz que el adaptador real. Preferidos.
- **vi.mock() / vi.fn():** Para módulos concretos cuando un Fake no compensa.

Coloca aquí los Fakes reutilizables (p. ej. `InMemoryMatchRepository.ts`).
