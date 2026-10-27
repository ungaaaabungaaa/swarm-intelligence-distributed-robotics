# Swarm exploration lab implementation

Approved mapping: Automation-automatic → swarm-intelligence-distributed-robotics. Original main `07b025c5bd97a289a0a6994980287a0b492a5a19` is preserved and verified remotely at `archive/before-swarm-robotics-2026-10-27`. Repository ID `R_kgDOGWwNoQ`, 17 stars. Keep the 2021 MIT attribution and add attribution for new 2026 code. MyPortfolio stays unchanged. No generated cover is approved.

## Design

Deliver a deterministic 2D grid exploration lab with disc robots. Each robot has private occupancy and visited maps. Bounded perfect grid-ray sensing reveals nearby cells; neighbor gossip exchanges previous-step maps only within communication range and line of sight. Compare local frontier exploration with independent frontier and seeded random-walk baselines. Do not claim a reproduction of Boids or physical robot operation.

The simulator has ground truth for initial placement, reachable-denominator calculation and a centralized collision shield. Policies receive local maps, observations and neighbor snapshots. The shield checks whole segments against inflated obstacles and continuous relative robot motion, including swaps/crossings. Rotating priority may hold conflicts and cause stalls. Report this central safety assumption explicitly rather than calling the full stack decentralized.

## Steps

1. Preserve/rename the approved repository and create an isolated branch; retain legacy MIT attribution.
2. Write a bounded contract and failing behavior tests for full-path/radius geometry, simultaneous moves, snapshot exchange, determinism, disconnected metrics and invalid input; implement a dependency-free JS core.
3. Add scenarios, a CLI and a multi-seed benchmark with raw summaries and plots from actual runs. Report failures and stalls honestly.
4. Add an accessible browser replay/lab with worker simulation, policy/scenario/seed controls, play/pause/step/scrub and JSON export. Use real frames.
5. Verify behavior, CLI/server boundaries, benchmark reproducibility, real browser flows, build and CI. Document sources, limits, security, history and usage.
6. Commit/push and attach a PR. Root reviews/merges only after CI. Remove local sources/cache after verified remote preservation.

## Success evidence

Tests cover radius and obstacle contact, opposing/crossing paths, concavity, single agent, invalid/large input, local communication and actual metric counts. Physical visited coverage and sensed mapping coverage use the union of start-reachable free cells; unreachable cells are excluded. Equal time, sensor and safety rules apply across policies. Multi-seed results are measured, with no optimality, real-time, localization, radio, hardware or physical collision guarantee.
