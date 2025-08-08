# Telegram Broadcast

A powerful TypeScript-based low-code project for sending mass broadcasts with support for A/B testing, media caching, and advanced formatting.

## Features

-   **Mass Broadcast**: Send messages to multiple chat IDs with rate limiting
-   **A/B Testing**: Create multiple message variants that alternate between users
-   **Media Support**: Send photos, videos, and video notes with automatic caching
-   **Rich Formatting**: HTML formatting with bold, italic, links, mentions, and quotes
-   **Inline Buttons**: Add clickable buttons to your messages
-   **Personalization**: Use placeholders for first name and last name
-   **Progress Tracking**: Monitor sending progress and success rates
-   **Test Mode**: Preview messages before sending to all recipients
-   **Resume Capability**: Continue interrupted broadcasts from where they left off

## Installation

1. Clone the repository:

```bash
git clone https://github.com/mikhailsdv/telegram-broadcast.git
cd telegram-broadcast
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
BOT_TOKEN=your_telegram_bot_token
MESSAGES_PER_SECOND=1
ADMIN_CHAT_ID=your_chat_id
MESSAGE_SEND_TIMEOUT_MS=20000
```

## Usage

### Creating a Broadcast

Create a new broadcast file in the `broadcasts/` directory:

```typescript
import {InputFile} from "grammy"
import {Broadcast} from "../src/broadcast"
import {bold, italic, link} from "../src/formatter"

new Broadcast()
	.addChats([123456789, 987654321]) // Add chat IDs
	.addText(`Hello, ${bold("world!")}`)
	.addPhoto(new InputFile("path/to/image.jpg"))
	.addButton("Visit Website", "https://example.com")
	.nextMessage() // Create A/B test variant
	.addText(`Hello, ${italic("world!")}`)
	.addVideo(new InputFile("path/to/video.mp4"))
	.test() // Send test to admin
// .start() // Start production broadcast
```

### Running Broadcasts

### `npm run broadcast <filename>`

Runs a broadcast file from the `broadcasts/` directory.

**Usage:**

```bash
npm run broadcast my-campaign
```

### `npm run cache`

Caches media files by uploading them to Telegram and getting file IDs. This improves sending performance for subsequent broadcasts.

**Usage:**

```bash
npm run cache photo path/to/image.jpg
npm run cache video path/to/video.mp4
npm run cache videoNote path/to/videonote.mp4
```

### `npm run get-file`

Retrieves a file from Telegram using its file ID and sends it to the admin chat.

**Usage:**

```bash
npm run get-file <file_id>
```

### `npm run poll`

Sends a poll to the admin chat for testing purposes.

### `npm run raw`

Starts the bot in raw mode to receive and process incoming messages.

## API Reference

### Broadcast Class

#### Constructor Options

-   `chats?: ChatId[]` - Initial list of chat IDs
-   `shuffleChats?: boolean` - Whether to shuffle chat order (default: false)
-   `abTestStrategy?: "random" | "distributed"` - A/B test distribution strategy (default: "distributed")
-   `paseMode?: ParseMode` - Message parsing mode (default: "HTML")
-   `debug?: boolean` - Enable debug mode (default: false)

#### Methods

**Content Methods:**

-   `.addText(text: string)` - Add text to the current message
-   `.addPhoto(photo: InputFile | string)` - Add photo to the current message
-   `.addVideo(video: InputFile | string)` - Add video to the current message
-   `.addVideoNote(videoNote: InputFile | string)` - Add video note to the current message
-   `.addButton(text: string, url: string)` - Add inline button to the current message
-   `.disableLinkPreview()` - Disable link preview for the current message
-   `.disableNotification()` - Send message silently

**Control Methods:**

-   `.addChats(chatIds: ChatId[])` - Add chat IDs to the broadcast list
-   `.nextMessage()` - Create a new message variant for A/B testing
-   `.test(chatIdOrChatIds?: ChatId | ChatId[])` - Send test message(s)
-   `.start()` - Start the production broadcast

### Formatter Functions

-   `bold(text: string)` - Make text bold
-   `italic(text: string)` - Make text italic
-   `link(text: string, url: string)` - Create a clickable link
-   `mention(text: string, id: string)` - Create a user mention
-   `quote(text: string)` - Create a blockquote

### Personalization Placeholders

-   `{{FIRST_NAME}}` - Replaced with user's first name
-   `{{LAST_NAME}}` - Replaced with user's last name
-   `{{FIRST_NAME}} {{LAST_NAME}}` - Replaced with user's full name

## Examples

### Simple Text Broadcast

```typescript
import {Broadcast} from "../src/broadcast"
import {bold} from "../src/formatter"

new Broadcast()
	.addChats([123456789, 987654321])
	.addText(`Welcome to our channel! ${bold("Don't forget to subscribe!")}`)
	.start()
```

### Media Broadcast with A/B Testing

```typescript
import {InputFile} from "grammy"
import {Broadcast} from "../src/broadcast"
import {bold, italic} from "../src/formatter"

new Broadcast()
	.addChats([123456789, 987654321])
	.addText(`Check out our new product! ${bold("Limited time offer!")}`)
	.addPhoto(new InputFile("product.jpg"))
	.addButton("Buy Now", "https://shop.example.com")
	.nextMessage()
	.addText(`Special announcement! ${italic("Don't miss out!")}`)
	.addVideo(new InputFile("promo.mp4"))
	.addButton("Learn More", "https://example.com")
	.test()
```

### Personalized Broadcast

```typescript
import {Broadcast} from "../src/broadcast"

new Broadcast()
	.addChats([123456789, 987654321])
	.addText(`Hello {{FIRST_NAME}} {{LAST_NAME}}! Welcome to our community.`)
	.start()
```

## Environment Variables

| Variable                  | Description                       | Default  |
| ------------------------- | --------------------------------- | -------- |
| `BOT_TOKEN`               | Your Telegram bot token           | Required |
| `MESSAGES_PER_SECOND`     | Rate limiting for message sending | Required |
| `ADMIN_CHAT_ID`           | Chat ID for admin notifications   | Required |
| `MESSAGE_SEND_TIMEOUT_MS` | Timeout for message sending       | 20000    |

## Dependencies

-   **grammy** - Telegram Bot API framework
-   **dotenv** - Environment variable management
-   **abort-controller** - Request cancellation
-   **typescript** - TypeScript support
-   **ts-node** - TypeScript execution

## License

MIT License - see LICENSE file for details.

## Author

Telegram – [@mikhailsdv](https://t.me/mikhailsdv)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Issues

Report bugs and request features on the [GitHub issues page](https://github.com/mikhailsdv/telegram-broadcast/issues).
