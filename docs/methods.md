# Methods and interpretation

## Local exploration

The grid and robot starts are part of the experiment setup. A robot begins with an empty occupancy/visited map. Its sensor follows Bresenham grid rays to cell centres within a Euclidean radius, reveals the first blocked cell, and stops that ray. This is an ideal discrete sensor, not a LiDAR model. Nearby robot positions are likewise ideal observations.

A planner receives dimensions, its private map/state, sensed robot poses, and (for gossip) previous targets from visible communicating neighbors. It does not receive the ground-truth occupancy grid or reachable-cell metric set. BFS searches known free cells while temporarily avoiding sensed occupied centres. A frontier cell borders unknown space; these are preferred before remaining known unvisited cells. A chosen goal remains stable until reached, depleted, reserved by a lower-ID neighbor, or unreachable in the current known map. Both frontier policies use the same local seeded escape after three no-motion ticks.

Gossip takes a full snapshot of each sender's private map and visited set. Receivers merge only senders in range with clear grid line of sight. All snapshots are taken before any merge; information therefore advances at most one communication hop in a round. The simulator supplies synchronous rounds, reliable messages and perfect agent identity. A rotating simulation scheduler is not a distributed agreement protocol.

## Central safety shield

Each proposed step is a linear move of at most one cell. Obstacles are conservatively expanded to axis-aligned squares by the disc radius; a slab intersection test rejects the entire segment if it enters/touches one. This expansion is conservative near obstacle corners. Boundary clearance is checked for both endpoints; the rectangular world is convex.

For moving robots, relative motion is linear. The shield minimizes squared relative distance over the entire interval [0,1], including endpoints. Robot swaps, crossing paths and moves through held robots are rejected. Rotating priority considers already accepted paths and treats not-yet-processed robots as stationary. Some jointly safe moves may therefore be held. This deliberate conservative central safety layer is stronger than the agents' local planning knowledge. It is not a physical safety guarantee, learned controller or decentralized collision-avoidance result.

Every accepted set is checked again for simultaneous path conflicts. A violation aborts the run. `collisionCount: 0` is a property of successful reports under these invariant checks; unsafe trajectories are not returned as successful reports.

## Coverage and fairness

The denominator is the union of cardinal-connected free cells reachable from any start. Robot centres and radius limits make free cardinal edges traversable in the static world. All starts count as visited at tick zero. Physical coverage counts centres actually entered; mapping coverage counts reachable free cells observed by at least one robot. Ground truth is used only by sensors, setup, central safety, rendering and metrics.

The three policies use the same world, starts for each seed, sensing, local pose observations, motion model, safety layer, target and tick budget. The frontier baseline removes both gossip map sharing and peer target coordination. The random-walk comparison changes the planning strategy too, so it does not isolate the effect of communication. The zero-range gossip regression has exactly the independent-frontier frames and metrics, demonstrating no hidden global planner sharing.

A seeded LCG is warmed for eight draws to reduce nearby-seed initial-placement correlation. It is for deterministic experiments, not security. Agent-specific seeds control local escape/random moves and stable tie choices. The benchmark varies seeds 1–10 on each of three fixed maps. Ten seeds and three hand-made maps do not establish general performance.

## Report interpretation

A tick is a simulated synchronous move, not a wall-clock duration. Stalls count at least 20 consecutive ticks with no robot motion and stop at 40. Moving without gaining coverage is not counted as a no-motion stall; oscillation can persist until the budget. Distance sums accepted centre movements.

Target stopping censors final coverage close to 95%. Successful-only mean time excludes failed runs and must be read alongside success counts. Error bars are sample standard deviation, not confidence intervals. Map sharing, target coordination and seeded escape are combined mechanisms; an ablation study would be needed to attribute gains between them.

## Primary references

- Brian Yamauchi (1998), [Frontier-Based Exploration Using Multiple Robots](https://doi.org/10.1145/280765.280773), AGENTS '98, pp.47–53. Motivation: independent exploration decisions with separate maps and shared observations.
- Craig W. Reynolds (1987), [Flocks, Herds, and Schools: A Distributed Behavioral Model](https://www.red3d.com/cwr/papers/1987/boids.html). Motivation: aggregate behavior from local actors. This project does not implement the Boids rules or reproduce that paper's simulations.

Code, maps, experiment data and plots here are original. No paper text, source illustrations or third-party model/data files are redistributed.
