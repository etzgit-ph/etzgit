# Observability Dashboard (Placeholder)

This document lists the key panels and metrics to monitor for the Autonomous Code Agent (ACA).

Panels:

1. Agent Execution Status
   - Logs: Filter on `AgentService` start/success/critical failure
   - Alerts: `ProtectedPathModificationError`, `Executor rollback failure`

2. API Health
   - Metrics: Request rate, request duration (p50/p95), error rate (4xx/5xx)
   - Uptime: endpoint `/api/v1/status` health check

3. Security Audit Log
   - Events: `ProtectedPathModificationError`, 403 hits on `/run-agent`, suspicious commit messages

Notes:
- This is a documentation placeholder for a future dashboard (Grafana/Cloud). Use OTEL metrics and Winston structured logs to populate these panels.
