# Contributing

Use Node.js 22 or newer. Run `npm ci`, `npm run check`, `npm run test:coverage`, and `npm run benchmark -- --check`.

Test behavior and error cases before changing the core. Preserve seed determinism, local planner knowledge, equal baseline conditions, whole-segment geometry checks and metric denominators. Keep simulator ground truth out of planner inputs. Do not turn central arbitration into an unstated distributed guarantee.

If a deliberate algorithm change alters results, run `npm run benchmark`, review all raw outcomes, regenerate the figure with the optional Python requirements, and update the README table and interpretations. The build checks the figure's benchmark hash. Keep failure counts and censored/conditional metrics visible. Never cherry-pick seeds to make a claim.

After UI changes, run the real browser worker/replay flows, including validation, play/pause/step/scrub, cancelling and download. Use keyboard controls and check responsive layouts. Report the browsers and viewport sizes actually tested. Do not claim deployment or hardware checks from local tests.

Keep dependencies, generated logs, optional environments and unapproved concept art out of commits. Explain the user-facing problem, relevant method and actual validation in each pull request. Follow repository contribution/AI policies accurately when contributing elsewhere.
