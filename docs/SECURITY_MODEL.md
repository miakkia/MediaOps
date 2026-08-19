# Security Model

MediaOps is a self-hosted integration layer that handles Discord interactions, media-server API access, Watch Party coordination, and persistent runtime state. Security therefore depends on keeping trust boundaries explicit and minimizing the privileges MediaOps requires.

## Security goals

MediaOps should:

- keep deployment secrets outside source control;
- avoid direct access to media files when provider APIs are sufficient;
- validate all external input and provider responses;
- expose only the minimum network surface required;
- fail safely without leaking sensitive configuration;
- remain usable without privileged container access;
- preserve administrator control of credentials and infrastructure.

## Secrets

Sensitive values include, but are not limited to:

- Discord bot tokens;
- media server API keys/tokens;
- passwords;
- private certificates;
- future OAuth/client secrets;
- hosted-edition tenant credentials.

These values must not be committed to Git.

Production `.env` files must remain ignored. Public examples must contain placeholders only.

If a secret is accidentally committed, removing it from the latest file is not sufficient. The credential must be rotated and repository history should be assessed for exposure.

## Discord trust boundary

Discord interactions are untrusted input.

MediaOps validates or constrains:

- slash-command option length and required fields;
- button custom-ID namespaces and formats;
- embedded provider item IDs;
- modal input formats;
- scheduling dates and times;
- organizer identity for cancellation;
- guild/channel context for server-only operations.

Administrative commands should require appropriate Discord permissions.

## Provider API trust boundary

MediaOps must not trust provider JSON simply because the request succeeded.

Provider adapters should validate:

- HTTP response status;
- response structure;
- expected item IDs;
- media type where relevant;
- optional metadata types;
- collection response shape and counts.

HTTP clients should use bounded timeouts and explicit redirect behavior appropriate to the integration.

Credentials should be sent only to the configured provider endpoint.

## Media server access

MediaOps should prefer provider APIs over direct filesystem access.

The normal deployment should not require mounting:

- Movies;
- Series;
- Downloads;
- other media-library paths.

This reduces the impact of an application compromise and simplifies container permissions.

## Watch Party security

MediaOps coordinates Watch Party metadata and links but should not collect media-server passwords from users.

Authentication to the Watch Party/media service should happen directly with that service where possible.

Watch Party codes and provider item IDs are identifiers, not secrets, but they should still be validated before use.

Scheduled Watch Party cancellation must be restricted to the organizer or a future explicitly authorized administrative role.

## Persistent runtime data

Watch Party scheduling state is stored as application runtime data and is not source code.

The persistence layer validates stored JSON before accepting it and writes through a temporary file followed by rename to reduce the chance of partial writes.

Runtime data must remain excluded from Git and should live in a persistent application-data volume in production.

Future persisted guild configuration should follow the same separation.

## Error handling and logs

Discord users should receive concise, safe error messages.

Do not expose:

- tokens;
- API keys;
- passwords;
- stack traces;
- sensitive internal request headers;
- unnecessary infrastructure details.

Technical logs may contain operational context but must avoid credential values.

## Container security target

The production Docker image should target:

- non-root execution where practical;
- no privileged mode;
- no unnecessary Linux capabilities;
- `no-new-privileges` where supported;
- bridge networking unless a documented integration requires otherwise;
- persistent mount only for MediaOps-owned state;
- reasonable memory and PID limits;
- no media-library filesystem mounts by default;
- runtime-injected secrets;
- a healthcheck suitable for deployment monitoring.

## Unraid deployment

The planned Unraid Community Apps template should expose only required configuration.

Sensitive fields such as Discord tokens and provider API keys should be marked/handled as secrets or masked values where the template ecosystem supports it.

MediaOps should be validated as a standalone container before Community Apps submission.

## Dependency security

Dependency risk should be reviewed continuously.

Before meaningful merges, development currently includes:

```bash
npm audit
```

Future CI should automate:

- dependency auditing;
- secret scanning;
- TypeScript validation;
- automated tests;
- security-oriented static analysis where useful.

Dependency updates should be reviewed rather than blindly applying breaking fixes.

## Self-hosted Discord bot model

In the self-hosted edition, each administrator should use their own Discord application/bot credentials.

MediaOps must never ship a personal or developer bot token in the repository, container image, template, or documentation.

Setup documentation should explain how to create and invite a Discord bot with the minimum permissions needed.

## Future hosted model

A hosted MediaOps bot creates a stronger security requirement because one service may handle multiple Discord guilds and provider integrations.

A hosted edition must add:

- strict tenant isolation;
- encrypted secret storage;
- tenant-scoped authorization;
- auditable configuration changes;
- rate limiting and abuse controls;
- secure OAuth flows where applicable;
- backup and recovery procedures;
- separation between customer data and application logs.

Hosted functionality must not weaken the self-hosted security model.

## Security review checklist

Before a public release or major integration change, verify:

- no credential values are present in the Git diff or history being released;
- `.env` and runtime data remain ignored;
- provider endpoints and protocols are validated;
- external responses are validated;
- Discord custom IDs cannot inject arbitrary data;
- privileged actions enforce authorization;
- logs do not print credentials;
- container permissions remain minimal;
- dependency audit is reviewed;
- security documentation matches actual deployment behavior.

## Guiding rule

MediaOps should require only the access it genuinely needs. If a feature can be implemented through a narrow provider API instead of broad host or filesystem access, the narrower path should be preferred.
