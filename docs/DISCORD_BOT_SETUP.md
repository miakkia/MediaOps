# Discord Bot Setup — Self-Hosted v1

MediaOps v1 is a **self-hosted, single-tenant deployment**. Each MediaOps operator creates and owns a Discord application/bot for their own Discord server and connects that bot to their own MediaOps container and media backends.

The public MediaOps Community demo bot is **not** a universal hosted bot for other servers. Do not invite a bot instance that is configured for someone else's Emby/Ombi/Watch Party backends.

## Deployment model

```text
Your Discord server
        |
        v
Your Discord application / bot
        |
        v
Your MediaOps container
   |        |        |
   v        v        v
 Emby      Ombi   Watch Party
```

One v1 MediaOps container is intended to represent one operator/guild/backend configuration. Multi-tenant guild configuration and an official universal hosted bot are future roadmap items.

## 1. Create the Discord application

1. Open the Discord Developer Portal.
2. Create a new application, for example `MediaOps`.
3. Open **Bot** and create/add the bot user if Discord has not created it automatically.
4. Copy the application ID from **General Information**. This becomes `DISCORD_CLIENT_ID`.
5. Copy/reset the bot token from **Bot**. This becomes `DISCORD_TOKEN`.

Treat the bot token as a password. Never post it in Discord, screenshots, GitHub issues, logs, or support messages.

## 2. Bot visibility

For a normal self-hosted v1 installation, the bot only needs to be installable by the operator who owns the deployment.

Recommended after the bot has been added to the intended Discord server:

- **Public Bot:** Off, unless you intentionally need other people to install this exact bot instance.
- **Install Link:** None, after installation if you do not want a public install link.
- **User Install:** Off.
- **Guild Install:** On.

Disabling public installation does not remove the bot from a guild where it is already installed.

## 3. Gateway intents

Under **Bot -> Privileged Gateway Intents**:

- **Server Members Intent:** On
- **Message Content Intent:** On
- **Presence Intent:** Off

These match the current MediaOps gateway requirements. Do not enable additional privileged intents unless a future MediaOps release explicitly requires them.

## 4. Installation scopes

When generating/installing the bot into your Discord server, use:

```text
bot
applications.commands
```

## 5. Bot permissions

Use least privilege. Do **not** grant Administrator.

Current recommended bot permissions:

```text
View Channels
Send Messages
Embed Links
Read Message History
Use Application Commands
Manage Messages
Manage Threads
Create Public Threads
Send Messages in Threads
```

For the optional Media Request Forum workflow, the bot may additionally require the channel/thread management permissions documented in `REQUEST_FORUM.md`. Grant only the permissions needed in the channels where MediaOps is used.

The following permissions are not required for the normal v1 bot and should remain disabled unless a documented future feature needs them:

```text
Administrator
Manage Roles
Kick Members
Ban Members
Mention @everyone
Connect
Speak
```

`Manage Server` is **not** a permission that must be granted to the bot. MediaOps uses Discord's `Manage Server` permission to restrict certain administrator-only slash commands to the human member invoking them.

## 6. Invite the bot

Install the application into the Discord guild that will use this MediaOps deployment.

Then enable Discord **Developer Mode** on your Discord account and copy:

- **Server ID** -> `DISCORD_GUILD_ID`
- any channel/forum/tag IDs required by optional workflows

Guild and channel IDs are identifiers, not secrets.

## 7. Configure MediaOps

At minimum the container needs:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_server_id
```

The same container also holds the Emby/Ombi/Watch Party configuration for this deployment. In v1 that provider configuration is global to the container, which is why the same bot instance should not be invited into unrelated guilds that need different backend credentials.

## 8. Deploy slash commands

After the container is running:

```bash
docker exec <mediaops-container> npm run deploy-commands
```

A successful v1 deployment reports 15 registered guild commands.

Run the command again after a MediaOps update that changes command definitions or command permissions.

## 9. Recommended Discord layout

Channel names are not hard-coded. A simple layout is:

```text
Media / Bot Commands
Request Demo or Requests
Watch Party
Private Admin / Bot Logs
```

Run:

- `/mediaops-setup` in the normal user/help channel;
- `/watchparty-setup` in the Watch Party channel;
- `/mediaops-admin-setup` in a private administrator/moderator channel.

`/ping`, `/health`, `/mediaops-setup`, `/watchparty-setup`, and `/mediaops-admin-setup` require **Manage Server** for the invoking member by default.

## 10. Verify the installation

Start with:

```text
/health
/movie
/tv
/latest
```

Then validate `/request` if Ombi is configured and the Watch Party workflow if the Watch Party integration is enabled.

## Security boundary

A v1 MediaOps Discord bot is part of one self-hosted deployment. Its Discord identity may technically be installable in multiple guilds, but MediaOps does not yet maintain isolated Emby/Ombi/Watch Party credentials per guild. Do not use one v1 instance as a universal public bot across unrelated customers/servers.

Future multi-tenant support must provide per-guild configuration, strict tenant isolation, encrypted secret handling, and a safe method for reaching each operator's private media services without silently routing other guilds to the demo/operator backend.
