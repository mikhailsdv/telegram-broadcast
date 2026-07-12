# Agent Instructions

This file applies to the whole repository.

## Project Overview

`telegram-broadcast` is a TypeScript project for sending Telegram broadcast campaigns through `grammy`.

Broadcast scripts live in `broadcasts/` and are run with:

```bash
npm run broadcast <filename>
```

Core implementation files are in `src/`, especially:

- `src/broadcast.ts` - main `Broadcast` fluent API and sending loop.
- `src/types.ts` - shared public types for the broadcast API and callbacks.
- `src/formatter.ts` - text formatting helpers.
- `src/cli.ts` - CLI argument parsing for helper scripts.
- `src/utils.ts` - shared helpers.

## Broadcast API Conventions

`Broadcast` instances must receive the bot token through the constructor:

```typescript
new Broadcast({token})
```

Do not make `src/broadcast.ts` depend on project-level `.env` variables for `BOT_TOKEN`, `ADMIN_CHAT_ID`, `MESSAGES_PER_SECOND`, or message timeout settings. Broadcast-specific settings belong on the `Broadcast` instance.

Use fluent methods for optional broadcast configuration:

- `.addChats(chatIds)`
- `.setAdminChatId(chatId)`
- `.setMessagesPerSecond(value)`
- `.setShuffleChats(value)`
- `.setAbTestStrategy(value)`
- `.setPaseMode(value)`

Keep the existing defaults unless explicitly asked to change them:

- `shuffleChats`: `false`
- `abTestStrategy`: `"distributed"`
- `paseMode`: `"HTML"`
- `messagesPerSecond`: `1`

The `paseMode` spelling is part of the current API. Do not rename it unless specifically asked.

## ESM

The project uses native ESM (`"type": "module"` in `package.json`). Relative imports must include the `.js` extension:

```typescript
import {Broadcast} from "../src/broadcast.js"
```

Scripts are executed with `tsx`.

## CLI Configuration

Helper scripts use CLI flags instead of `.env` variables:

- `-t, --token` for the Telegram bot token.
- `-c, --chat` for the Telegram chat ID.
- `-f, --file-id` for the Telegram file ID (`get-file` only).

`Broadcast` itself should not require a project-level `.env` file. If a broadcast is missing required instance config, fail with a clear English error message.

## Coding Style

Follow the existing TypeScript style:

- Tabs for indentation.
- No semicolons.
- Double quotes for strings.
- Keep fluent broadcast examples readable and compact.
- Do not run `npm run format` unless explicitly requested.

Do not add comments unless specifically requested. Do not delete or rewrite existing comments unless specifically requested.

## Validation

Put runtime validation in `Broadcast.validateBroadcast()` when it concerns whether a broadcast can safely start.

Current important validations include:

- A broadcast must have chat IDs, or test mode must receive a chat ID / admin chat ID.
- Messages must have content unless a custom action is configured.
- `messagesPerSecond` must be a positive number.

## Documentation And Examples

When changing public API, update both:

- `README.md`
- `broadcasts/broadcast.example.ts`

Keep examples aligned with the current fluent API and avoid showing removed constructor options.

## Commands

Use `--` after `npm run <script>` when passing flags to helper scripts.

`npm run broadcast <filename>` runs a broadcast file from `broadcasts/`:

```bash
npm run broadcast <filename>
```

`npm run raw` starts the bot in raw mode and replies with incoming Telegram update payloads:

```bash
npm run raw -- -t your_bot_token
npm run raw -- --token your_bot_token
```

`npm run poll` sends a sample poll to a chat and replies with the raw Telegram response:

```bash
npm run poll -- -t your_bot_token -c 123456789
npm run poll -- --token your_bot_token --chat 123456789
```

`npm run cache` uploads media and prints the resulting `file_id`:

```bash
npm run cache -- photo path/to/image.jpg -t your_bot_token -c 123456789
npm run cache -- video path/to/video.mp4 --token your_bot_token --chat 123456789
npm run cache -- videoNote path/to/videonote.mp4 -t your_bot_token -c 123456789
```

`npm run get-file` sends a Telegram file by `file_id` to a chat:

```bash
npm run get-file -- -f <file_id> -t your_bot_token -c 123456789
npm run get-file -- --file-id <file_id> --token your_bot_token --chat 123456789
```

`npm run format` formats the repository with Prettier:

```bash
npm run format
```

There is no dedicated test script in `package.json` at the moment. Use targeted TypeScript/linter diagnostics when available instead of broad formatting or unrelated cleanup.
