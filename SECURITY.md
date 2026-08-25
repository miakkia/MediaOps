# Security Policy

MediaOps is under active development. Security-sensitive changes should be reviewed before release, and deployment credentials must remain outside source control.

## Supported versions

Until the first stable release, only the current `main` branch and actively maintained release branches/tags are expected to receive security fixes.

## Reporting a vulnerability

Please report security issues privately to the project maintainer rather than opening a public issue containing exploit details, credentials, tokens, private URLs, or sensitive logs.

When reporting, include enough information to reproduce the issue safely:

- affected MediaOps version/commit;
- deployment method;
- relevant feature/provider;
- expected versus observed behavior;
- sanitized logs or steps to reproduce.

Do not include live Discord bot tokens, webhook URLs/tokens, provider API keys, passwords, private certificates, or other credentials.

## Credential handling

MediaOps deployments may contain Discord tokens, Emby/Ombi API keys, Watch Party credentials, and optional Forum integration identifiers. These values must be injected at runtime and must never be committed to Git.

The companion Ombi Discord Router has a separate secret: `MEDIA_REQUESTS_WEBHOOK`, the full Discord webhook URL. The router owns this credential; MediaOps itself should receive only the non-secret webhook ID through `MEDIA_REQUESTS_WEBHOOK_ID`. Keeping these credentials separate limits the impact of either component being misconfigured or compromised.

Public templates and `.env.example` files contain placeholders only. If a credential appears in a screenshot, log, issue, commit, or other shared material, rotate it.

## Deployment expectations

Use least privilege wherever possible:

- do not run MediaOps or the router privileged;
- avoid Docker socket and media-library filesystem mounts;
- keep provider/API credentials scoped narrowly;
- expose only required network surfaces;
- keep the router `/ombi` endpoint private to a Docker/LAN trust boundary unless an authenticated reverse-proxy boundary is deliberately added;
- use a user-defined Docker network for Ombi-to-router service-name resolution instead of hard-coded container IPs;
- keep persistent runtime data outside container images and source control.

See [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) for the detailed trust boundaries and security goals.
