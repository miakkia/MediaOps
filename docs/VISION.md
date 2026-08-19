# MediaOps Vision

MediaOps aims to become a practical bridge between Discord communities and self-hosted media infrastructure.

The project begins with a simple idea: members should be able to interact with a media library and organize Watch Parties from Discord without needing to understand the underlying media server, provider API, network topology, or deployment details.

## What MediaOps should feel like

For a normal user, MediaOps should feel simple:

- search for something to watch;
- see what was recently added;
- get a random suggestion;
- schedule a movie night;
- RSVP;
- open or join a synchronized session.

The user experience should be guided by buttons, concise slash commands, and small modals rather than complex configuration or long command sequences.

## What MediaOps should be for administrators

For administrators, MediaOps should be predictable and self-hosted friendly:

- credentials remain under administrator control;
- deployment should work cleanly in Docker;
- persistent state should survive upgrades;
- integrations should be replaceable behind provider adapters;
- unnecessary filesystem and host access should be avoided;
- configuration and security expectations should be documented.

## Provider-independent future

Emby is the current reference implementation, not the permanent boundary of the product.

The long-term goal is one consistent Discord experience backed by provider-specific adapters for ecosystems such as:

- Emby;
- Jellyfin;
- Plex.

Media library access and synchronized Watch Party support should remain separate integration capabilities so each provider can evolve at its own pace.

## Self-hosted first

MediaOps should remain useful as a fully self-hosted project.

A self-hosted administrator should be able to operate MediaOps with:

- their own Discord bot;
- their own media server;
- their own credentials;
- their own persistent state;
- no required central MediaOps cloud dependency.

Docker should become the standard distribution format, with Unraid Community Apps as a planned installation path for Unraid users.

## Optional hosted future

A future hosted edition may offer an official universal MediaOps Discord bot, managed updates, simplified onboarding, monitoring, and subscription features.

That option should complement—not replace—the self-hosted edition.

The hosted architecture must enforce strict tenant isolation and secure secret storage.

## Product identity

MediaOps should not become a replacement media server or another complicated administration suite.

Its role is orchestration:

```text
Discord community
      |
      v
   MediaOps
   /      \
Media     Watch Party
Provider  Provider
```

Over time, additional integrations such as media-request systems, notifications, and community automation can join this model without turning Discord commands into provider-specific code.

## Guiding values

- Simplicity for normal users
- Control for self-hosted administrators
- Secure handling of credentials
- Clear integration boundaries
- Provider portability
- Useful documentation
- Incremental development based on real needs

## Long-term success

MediaOps succeeds if a community member can use Discord to interact naturally with the media experience while the administrator can change providers, deployment environments, and infrastructure without rebuilding the user experience from scratch.
