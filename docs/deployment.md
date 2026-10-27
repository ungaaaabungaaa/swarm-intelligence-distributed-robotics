# Build and hosting

Run `npm run build` and deploy only `dist/` at the root of an HTTPS static origin. Eight public lab files are copied. The app uses a module worker and root-relative assets; opening the HTML directly as a file or deploying it under a subdirectory is unsupported without path changes.

Use the correct HTML, JavaScript, CSS, PNG and CSV content types. Configure these response headers at the host:

```text
Content-Security-Policy: default-src 'none'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Cache-Control: no-store
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

No remote libraries, fonts, telemetry, credentials or user data are required. The browser creates a fresh worker for each run and can terminate it with Cancel. Replay download uses a local Blob; no upload endpoint exists.

The included server binds to `127.0.0.1:8796`, accepts only GET/HEAD and fixed public paths, rejects unexpected Host headers and serves no source history or arbitrary file path. It is a local development server, not a production service. Set `PORT` to an integer from 1024 to 65535 when needed. No public deployment is claimed in this build.
