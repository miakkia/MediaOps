# Security Policy

Security matters for MediaOps because the application connects Discord to self-hosted media infrastructure and requires deployment credentials such as a Discord bot token and media-server API key.

## Project status

MediaOps is currently under active development and has not yet reached its first stable public release.

Security fixes may therefore land on `main` before a formal versioned support policy exists.

## Reporting a vulnerability

Please do **not** publish sensitive vulnerability details, credentials, tokens, private infrastructure information, or working exploits in a public GitHub issue.

For non-sensitive security hardening suggestions, a normal GitHub issue is appropriate.

A private vulnerability-reporting channel should be established before the first public packaged release. Until that mechanism is documented, avoid disclosing exploit details publicly and contact the repository owner through an appropriate private GitHub contact method when available.

## Secrets

Never include real values for:

- Discord bot tokens;
- Discord webhook URLs/tokens;
- Emby/Jellyfin/Plex API keys or access tokens;
- passwords;
- OAuth client secrets;
- private certificates;
- private Watch Party service credentials;
- infrastructure credentials.

If a credential is accidentally committed or shared, treat it as compromised and rotate it immediately.

The optional Ombi Discord Router owns its Discord webhook credential at runtime. MediaOps needs only the webhook's non-secret ID for source identification and must not be configured with the webhook URL/token.

## Deployment expectations

MediaOps should be deployed with the minimum access required for its configured features.

The intended security posture is:

- provider API access instead of direct media-library filesystem access;
- no privileged container mode;
- no unnecessary host mounts;
- persistent storage only for MediaOps-owned application state;
- runtime-injected secrets;
- bounded external requests;
- minimal Discord permissions appropriate to enabled features.

The optional Ombi Discord Router should remain on a private Docker/LAN network unless an authenticated external boundary is deliberately added. Its example deployment drops Linux capabilities, enables `no-new-privileges`, uses a read-only root filesystem, and persists only its request/thread index.

## Security model

The detailed project threat/trust model, provider boundary, Discord interaction validation, runtime-data handling, and future container requirements are documented in [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).

## Before contributing security-sensitive changes

Review [`docs/DEVELOPMENT_GUIDELINES.md`](docs/DEVELOPMENT_GUIDELINES.md) and verify at minimum that:

```bash
npx tsc --noEmit
npm audit
```

complete successfully for the relevant change, and inspect the diff for accidentally introduced secrets.

Additional automated security checks are planned as CI matures.
