# Feature queue

Delivered 28 October 2026: seeded directed gossip packet loss via `messageDropRate` / `--message-loss`. Map, visit and peer-target data share the same packet decision. Attempted/dropped counts are included in requested loss experiments. Existing benchmarks remain unchanged. Simulation only; centralized physics still enforces collision checks.

Next useful work:
- Compare a fixed seed set across loss rates and report coverage and stalls without selecting favorable seeds.
- Add bounded delay experiments with explicit stale-packet age.
- Expand obstacle/seed benchmarks before making broader coordination claims.
