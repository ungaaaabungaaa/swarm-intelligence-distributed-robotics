# Security and limits

This is an offline simulation and local browser lab. It has no robot, flight, actuator or sensor-hardware connection. Do not use its replay as a physical motion command or safety approval.

Configuration bounds cover grid cells, agent count, ticks, sensor/communication ranges, radius, target and finite numeric values. Product limits bound planning and gossip work. Replay output is checked against 1001 frames, 16016 position records and 2 MiB JSON. A worker isolates browser simulation work and can be terminated. These are computational limits, not real-time guarantees.

The CLI writes only an explicitly requested new output path and refuses overwrite. The local server uses a fixed allowlist and never serves arbitrary paths, Git history or private files. It binds to loopback, checks Host, permits GET/HEAD and sets a restrictive CSP. Static hosts must apply equivalent headers. No telemetry, remote dependencies, persistent user data or replay import is shipped.

Report a reproducible issue with synthetic input through GitHub issues. Use private vulnerability reporting for sensitive defects where available; otherwise request a private channel with a minimal public-safe description. Do not include credentials, private location data or real operational maps in public reports. Version 0.1 is the supported line; no response-time promise is made.
