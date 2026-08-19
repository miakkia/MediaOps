# Contributing to MediaOps

MediaOps is under active development. Contributions should preserve the project's core goals: simple Discord UX, narrow infrastructure access, provider-independent architecture where useful, and safe self-hosting.

## Before making a change

Read the documentation relevant to the work:

- [`docs/PRODUCT_SCOPE.md`](docs/PRODUCT_SCOPE.md)
- [`docs/ARCHITECTURE_PRINCIPLES.md`](docs/ARCHITECTURE_PRINCIPLES.md)
- [`docs/DEVELOPMENT_GUIDELINES.md`](docs/DEVELOPMENT_GUIDELINES.md)
- [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md)
- [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) for provider work
- [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) for Discord UX changes

## Development workflow

Use a focused feature or fix branch rather than developing directly on `main`.

Examples:

```text
feat/watchparty-upcoming
feat/media-provider
fix/watchparty-timezone
security/provider-validation
```

Keep each branch centered on one coherent change. Avoid unrelated cleanup unless it is required for the feature.

## Coding expectations

- TypeScript should remain strict and type-safe.
- Validate data crossing trust boundaries.
- Keep provider-specific behavior inside provider/service layers rather than Discord command code.
- Reuse shared scheduling and interaction logic instead of duplicating flows.
- Keep user-facing Discord interactions concise.
- Add EN/FR strings through the i18n layer when practical.
- Do not introduce privileged host access when an API-based solution is sufficient.
- Do not commit runtime data or credentials.

## Validation

Before opening a pull request, run:

```bash
npx tsc --noEmit
npm audit
git diff --check
```

Also inspect the diff for secrets or credentials.

When automated tests are added, the project test suite will become part of the required validation workflow.

## Pull requests

A pull request should explain:

- what changed;
- why the change is needed;
- important architectural or security decisions;
- how the change was tested;
- any follow-up work intentionally left out.

Prefer small, reviewable PRs over large unrelated batches.

## Documentation

Documentation is part of the feature.

Update the relevant Markdown files when a change affects:

- user-visible Discord functionality;
- supported providers;
- security assumptions;
- deployment requirements;
- product scope;
- architecture;
- roadmap status.

Notable user-facing or architectural changes should also be reflected in [`CHANGELOG.md`](CHANGELOG.md).

## Security

Do not put vulnerability details or real secrets into public issues or pull requests. See [`SECURITY.md`](SECURITY.md) for the security policy.

## Project direction

MediaOps is self-hosted first. Future hosted functionality, Jellyfin/Plex support, and Unraid Community Apps distribution are planned directions, but new abstractions should solve real integration needs rather than add complexity for hypothetical use cases.
