# Security Incident Runbook

Guía operativa para responder incidentes de seguridad en clubFutbolin.

## 1. Triage inicial (0-30 min)

- Clasificar severidad (critical/high/medium/low).
- Identificar alcance: API, web, CI/CD, secretos, sesiones.
- Abrir canal interno de incidente y asignar Incident Commander.

## 2. Contención inmediata

- Rotar secretos comprometidos:
  - `JWT_SECRET`,
  - credenciales de DB,
  - tokens de CI (incluyendo `SNYK_TOKEN`).
- Invalidar sesiones activas si hay sospecha de robo de refresh token.
- Si aplica, bloquear temporalmente endpoints afectados con feature flag o WAF rule.

## 3. Erradicación

- Aplicar fix de código/configuración.
- Añadir tests de regresión de seguridad.
- Cerrar vectores de reentrada (CSP, CSRF, rate limits, revocación de refresh).

## 4. Recuperación

- Desplegar fix.
- Verificar observabilidad (`401/403/429`, errores 5xx, login failures).
- Monitorear al menos 24h con alertas reforzadas.

## 5. Comunicación

- Comunicación interna a equipo y stakeholders.
- Si afecta usuarios, preparar nota de impacto y acciones recomendadas.
- Registrar timeline del incidente.

## 6. Postmortem

- Documentar causa raíz y contributing factors.
- Crear acciones preventivas con owner/fecha.
- Revisar si se requieren nuevos checks en CI.

## Playbook de alertas automatizadas

### Snyk (SCA)

- Revisar advisory.
- Actualizar dependencia o aplicar mitigación.
- Si no hay fix inmediato, registrar excepción temporal con expiración.

### CodeQL (SAST)

- Validar si es true positive.
- Corregir en código y añadir test.
- Bloquear merge de PR con findings severos pendientes.

### TruffleHog (Secret scanning)

- Revocar secreto inmediatamente.
- Limpiar historial/credencial comprometida según criticidad.
- Generar secreto nuevo y actualizar en GitHub Secrets.

## Simulacro tabletop (trimestral)

- Escenario: filtración de refresh token + intento de reuse.
- Duración objetivo: 45 minutos.
- Entregables: timeline, decisiones, gaps y acciones correctivas.
