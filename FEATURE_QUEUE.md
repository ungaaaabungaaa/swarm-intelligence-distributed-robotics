# Feature queue

Delivered 28 October 2026: seeded directed gossip packet loss via `messageDropRate` / `--message-loss`. Map, visit and peer-target data share the same packet decision. Attempted/dropped counts are included in requested loss experiments. Existing benchmarks remain unchanged. Simulation only; centralized physics still enforces collision checks.

Next useful work:
Delivered final round: `npm run benchmark:loss --silent` reports every run for the fixed rooms scenario, seeds1–10 and loss rates0/.25/.5/.75/1, with per-rate coverage, target outcomes, stalls and collision counts. The library comparison is bounded to50paired runs and rejects duplicate/ambiguous settings.

- Add bounded delay experiments with explicit stale-packet age.
- Expand obstacle/seed benchmarks before making broader coordination claims.
