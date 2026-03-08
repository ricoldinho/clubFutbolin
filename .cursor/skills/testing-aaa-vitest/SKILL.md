---
name: testing-aaa-vitest
description: Escribe y revisa tests con Vitest siguiendo el patrón AAA (Arrange-Act-Assert). Usar cuando el usuario pida tests, testing, pruebas unitarias/integración, TDD, o cuando se trabaje en archivos .test.ts / .spec.ts.
---

# Testing con Vitest y patrón AAA

## Cuándo aplicar esta skill

- El usuario pide escribir tests, pruebas unitarias o de integración.
- Se trabaja en archivos `*.test.ts`, `*.spec.ts` o en carpetas `tests/`.
- Se menciona TDD, cobertura o refactor de tests.

## Patrón AAA (obligatorio)

Estructura cada test en tres bloques explícitos y separados por una línea en blanco:

1. **Arrange:** Preparar datos, mocks y estado necesario.
2. **Act:** Ejecutar la única acción bajo prueba.
3. **Assert:** Comprobar el resultado (expect).

```typescript
it('debería calcular el total correctamente', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  const calculator = new PriceCalculator();

  // Act
  const total = calculator.sum(items);

  // Assert
  expect(total).toBe(30);
});
```

Reglas:
- Un solo concepto por test; si hay varios "Act", dividir en varios `it()`.
- No poner lógica en Arrange más allá de crear datos y dependencias.
- Assert debe ser explícito: usar `expect(...).toBe()`, `toEqual()`, `toThrow()`, etc., no solo llamar funciones.

## Vitest: API mínima

- En este proyecto `globals` está en `false`: importar explícitamente `import { describe, it, expect, vi } from 'vitest'`.
- **describe / it / test:** agrupar y definir casos.
- **expect:** `toBe`, `toEqual`, `toBeNull`, `toBeDefined`, `toThrow`, `resolves`, `rejects`.
- **beforeEach / afterEach:** para setup/teardown compartido (p. ej. limpiar DB en integración).
- **vi.fn(), vi.spyOn(), vi.mock():** para dobles cuando haga falta; preferir Fakes en `tests/doubles/` cuando sea posible.

**Mocks en memoria (obligatorio):** Los tests se ejecutan con mocks en memoria. No usar DB real, red ni disco en tests unitarios. Dependencias externas: `vi.mock()`, `vi.fn()` o Fakes en `tests/doubles/`. El setup global (`vitest.setup.ts`) aplica `mockReset` y `restoreMocks`.

No uses `@jest/globals` ni APIs de Jest; el proyecto usa Vitest.

## Ubicación de tests

- Tests unitarios: `tests/unit/` (estructura espejo de `src/`). Usar alias `@/` para importar desde `src/` (ej: `import { Player } from '@/modules/players/domain/Player.entity'`).
- Tests de integración: `tests/integration/` o `tests/contracts/`.
- Dobles reutilizables: `tests/doubles/`.

Comprobar si existe `vitest.config.ts` o `vite.config.ts` con configuración de test; si no, sugerir añadir Vitest al proyecto.

## Checklist antes de terminar

- [ ] Cada test sigue AAA con comentarios `// Arrange`, `// Act`, `// Assert`.
- [ ] Nombres de test descriptivos (comportamiento esperado, no implementación).
- [ ] Sin lógica condicional ni bucles en el cuerpo del test.
- [ ] Uso de Vitest (`describe`, `it`, `expect`, `vi.*`) y no de Jest.
- [ ] Mocks en memoria: sin DB/red/disco real; usar `vi.mock`/`vi.fn` o Fakes en `tests/doubles/`.
