# Baseline tecnico previo al roadmap

Fecha de captura: 2026-04-15.

## Comandos ejecutados

- `npm run lint` -> OK (`real 6.66s`)
- `npm run typecheck` -> OK (`real 6.35s`)
- `npm run test:run` -> OK (`real 9.49s`)
- `npm run test:integration` -> fallo por dependencia externa (`P1001: localhost:5433 no disponible`)
- `npm run test:run -w @clubfutbolin/web` -> OK (`real 4.15s`)

## Observaciones iniciales

- El baseline confirma estabilidad de lint/typecheck/tests unitarios.
- El fallo de integración era de entorno (BD de test apagada), no de lógica.
- CI ya tenía Postgres de servicio y pipeline principal de build+tests.

## Uso

Este baseline sirve como referencia para comparar tiempos, estabilidad y regresiones
durante la implementación del plan de hardening/calidad/delivery.
