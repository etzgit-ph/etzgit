# ADR 0002: Agent Execution Loop

## Sequence
1. **Plan**: Decide what to do (PlannerService)
2. **Generate**: Call LLM (LLMService)
3. **Validate**: Local tests/SAST
4. **Execute**: Git commit/PR
5. **Govern**: Human approval

## Security Gates
- Path restriction
- Protected file checks
- Structured logging
- PR-only merge

## Human-in-the-Loop
- All changes require PR review and approval before merge.
