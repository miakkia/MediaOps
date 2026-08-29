# GitHub to Discord notifications

MediaOps uses a repository-owned GitHub Actions workflow to publish selected project activity to Discord.

The workflow lives at:

```text
.github/workflows/discord-notifications.yml
```

It intentionally does **not** use GitHub's repository webhook configuration page and does not depend on a third-party Discord Action.

## What is published

Two independent Discord webhooks are used:

| GitHub event | Discord destination | Repository secret |
| --- | --- | --- |
| Pull request merged into `main` | `#github-updates` | `DISCORD_GITHUB_WEBHOOK` |
| GitHub Release published | `#releases` | `DISCORD_RELEASE_WEBHOOK` |

Release notifications include `@here` through Discord's allowed-mentions payload.

The pull-request job runs only when a PR targeting `main` is closed **and** GitHub reports that it was actually merged. Closing a PR without merging it does not publish a Discord update.

## Discord setup

Create two incoming webhooks in the Discord server:

1. Create one webhook in `#github-updates`.
2. Create one webhook in `#releases`.
3. Copy each webhook URL and treat it as a secret credential.

Suggested webhook names are:

```text
MediaOps GitHub
MediaOps Releases
```

Do not append `/github` to these URLs. The MediaOps workflow sends a normal Discord webhook JSON payload directly with `curl`; it is not using Discord's GitHub-compatible webhook endpoint.

## GitHub Actions secrets

In the repository, open:

```text
Settings
  -> Secrets and variables
  -> Actions
  -> Repository secrets
```

Create:

```text
DISCORD_GITHUB_WEBHOOK
DISCORD_RELEASE_WEBHOOK
```

Set each value to the full matching Discord webhook URL.

Never place either webhook URL in source files, workflow YAML, issues, pull-request comments, screenshots, logs, or documentation examples.

## Trigger behavior

The workflow subscribes to:

```yaml
pull_request:
  types: [closed]
  branches: [main]

release:
  types: [published]
```

The PR notification is additionally guarded by:

```text
github.event.pull_request.merged == true
```

This keeps routine branch pushes, opened PRs, comments, and failed/abandoned PRs out of the public update channel.

## Security model

Discord webhook URLs are bearer-style credentials: anyone who obtains one can post through that webhook until it is rotated or deleted.

For that reason:

- store webhook URLs only as GitHub Actions secrets;
- do not commit them to the repository;
- do not paste them into support discussions;
- avoid printing them in workflow output;
- rotate the affected Discord webhook immediately if a URL is exposed;
- keep the workflow free of unnecessary third-party actions that would receive secret values.

The current implementation uses GitHub-hosted runners, `jq`, and `curl` only for notification delivery. The workflow declares read-only repository content permission:

```yaml
permissions:
  contents: read
```

## Validation

After the secrets are configured and the workflow is present on `main`:

- merge a normal pull request into `main` and confirm one message appears in `#github-updates`;
- publish a real or test release according to the project's release process and confirm one message appears in `#releases`;
- confirm the release notification produces the intended `@here` behavior;
- inspect GitHub Actions logs and verify that no webhook URL is printed.

A direct manual POST to the Discord webhook can validate Discord itself, but it does not validate the GitHub event filters or the MediaOps workflow.

## Troubleshooting

If no Discord message appears:

1. Check that the workflow exists on the repository's default branch.
2. Check the corresponding GitHub Actions run and job result.
3. Confirm the exact repository secret name.
4. Confirm the Discord webhook still exists and targets the intended channel.
5. Confirm that the triggering event matches the workflow: a merged PR into `main` or a published Release.
6. If the webhook was recreated in Discord, update the matching GitHub Actions secret with the new URL.

A missing secret intentionally causes the notification job to fail instead of silently pretending that delivery succeeded.
