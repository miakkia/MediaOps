# Development Guidelines

These guidelines describe how MediaOps should be developed as it grows from a personal self-hosted bot into a reusable public project.

## Core principles

1. Prefer simple user flows over feature-heavy interfaces.
2. Keep provider-specific logic out of Discord command code when possible.
3. Do not commit secrets, runtime data, or environment-specific credentials.
4. Reuse shared services instead of duplicating business logic between commands and interactions.
5. Validate untrusted input at every external boundary.
6. Keep changes small enough to test and review confidently.

## Branching and pull requests

Use feature branches for meaningful work.

Suggested naming:

```text
feat/<feature>
fix/<bug>
docs/<topic>
refactor/<area>
```

A typical workflow is:

```text
git checkout main
git pull --ff-only origin main
git checkout -b feat/example
```

Before opening a pull request:

- run TypeScript validation;
- run dependency audit;
- run `git diff --check`;
- inspect `git status` for unexpected files;
- scan the diff for secrets;
- test the user-facing flow in Discord where applicable.

Prefer squash merges for focused feature branches unless preserving individual commits provides real value.

## TypeScript

MediaOps uses TypeScript with explicit runtime validation at important boundaries.

Guidelines:

- prefer typed interfaces over `any`;
- treat external JSON as `unknown` until validated;
- validate Discord custom IDs and modal input before use;
- validate provider API responses before trusting fields;
- keep exported interfaces focused on domain concepts rather than raw provider payloads;
- use `undefined` consistently for unavailable optional metadata.

Run before commit:

```bash
npx tsc --noEmit
```

## Discord interaction code

Keep interaction routing explicit.

Current interaction categories include:

- chat-input slash commands;
- buttons;
- modal submissions.

Dedicated handlers are preferred over one large interaction function. A handler should return whether it handled an interaction when multiple handlers share the same Discord event type.

Custom IDs must:

- use a predictable namespace;
- stay within Discord length limits;
- be parsed strictly;
- never carry secrets;
- carry provider IDs only when those IDs have been validated before use.

## User-facing text and i18n

New user-facing strings should normally be added to the i18n layer instead of embedded directly in command logic.

Exceptions can be acceptable during short-lived UX prototyping, but final user flows should be migrated before merge.

Technical logs may remain English.

Public mixed-language panels may intentionally contain both EN and FR when that reduces user configuration and improves clarity.

## Services and domain logic

Commands should orchestrate rather than own business logic.

For example, Watch Party scheduling is shared through a scheduling service so slash commands and modal flows do not implement separate persistence and announcement logic.

Prefer this direction:

```text
Discord interaction
    -> domain/service function
    -> provider/storage adapter
```

Avoid:

```text
Discord command
    -> provider HTTP details
    -> storage file manipulation
    -> duplicated announcement rendering
```

## Media provider development

The current implementation uses Emby, but new work should avoid making provider-specific assumptions outside provider adapters when practical.

Future providers may include Jellyfin and Plex.

Provider implementations should normalize media into common MediaOps concepts such as:

- provider item ID;
- display title;
- original title;
- sort title;
- production year;
- overview;
- media type.

Do not introduce a generic abstraction merely for style. Introduce it when at least one additional provider or integration requirement makes the abstraction useful.

## Security requirements

Never commit:

- Discord bot tokens;
- media server API keys/tokens;
- passwords;
- private certificates;
- runtime data containing user state;
- production `.env` files.

Environment files should remain ignored except for a sanitized example file.

HTTP integrations should use:

- protocol validation;
- bounded timeouts;
- explicit authentication headers;
- response status checks;
- redirect behavior appropriate to the trust model;
- runtime validation of returned data.

Error messages shown to Discord users must not expose secrets, raw tokens, stack traces, or internal URLs unnecessarily.

## Runtime data

Runtime state is not source code.

Persistent Watch Party data belongs in the configured MediaOps data directory and must remain outside Git.

The eventual container distribution should mount that directory as persistent appdata.

## Dependencies

Before merging meaningful changes:

```bash
npm audit
```

Do not automatically apply dependency updates that introduce breaking changes without reviewing the resulting code and behavior.

CI should eventually enforce TypeScript validation, tests, dependency checks, and secret scanning.

## Testing expectations

Until automated coverage is complete, meaningful Discord workflows should be tested end-to-end.

Examples:

- search a movie and series;
- retrieve latest media;
- run several random movie selections;
- reroll and choose a random movie;
- submit valid and invalid scheduling dates;
- verify RSVP updates;
- verify organizer-only cancellation;
- test setup-panel random and scheduling actions.

Automated tests should gradually replace repeated manual validation for parsing, matching, storage, i18n, and interaction-ID logic.

## Documentation

A feature is not fully public-ready if users cannot configure or understand it.

When behavior changes, update the relevant documentation:

- `ROADMAP.md` for planned direction;
- `DISCORD_FEATURES.md` for user-facing bot capabilities;
- `PROVIDER_MODEL.md` for provider architecture;
- `SECURITY_MODEL.md` for trust/security decisions;
- installation/configuration docs once Docker/public distribution is introduced.

## Definition of done

A feature is generally ready to merge when:

- the intended user flow works end-to-end;
- TypeScript passes with zero errors;
- no known dependency vulnerability was introduced;
- the diff contains no accidental secrets or runtime files;
- error handling is safe;
- the change fits the architecture instead of creating unnecessary duplication;
- documentation is updated when the change alters public behavior or architecture.
