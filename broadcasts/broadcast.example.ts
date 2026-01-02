import {InputFile} from "grammy"
import {Broadcast} from "../src/broadcast"
import {bold, italic} from "../src/formatter"

new Broadcast()
	.addChats([1231231, 12312312, 1231231, 12312312]) // Add pool of chat IDs
	.addText(`Hello, ${bold("world!")}`) // Adds text to the post, bold() makes it bold
	.addPhoto(new InputFile("foo/bar.jpg")) // Adds photo to the post. Photo is cached after first sending
	.addButton("Press me", "https://t.me/...") // Adds a button to the post
	.nextMessage() // Create second message for a/b test. They will alternate from user to user
	.addText(`Hello, ${italic("world!")}`) // Adds text to the post, italic() makes it italic
	.addVideo(new InputFile("foo/bar.mp4")) // Adds video to the post. Video is cached after first sending
	.nextMessage() // Create third message for a/b test. They will alternate from user to user
	.addVideoNote(new InputFile("foo/bar.mp4")) // Adds video note to the post. Video note is cached after first sending
	.test() // Send test message to yourself
// Or .start(), to start production broadcast to everyone

// Or you can divide messages with variables
const firstMessage = new Broadcast()
	.addChats([1231231, 12312312, 1231231, 12312312]) // Add pool of chat IDs
	.addText(`Hello, ${bold("world!")}`) // Adds text to the post, bold() makes it bold
	.addPhoto(new InputFile("foo/bar.jpg")) // Adds photo to the post. Photo is cached after first sending
	.addButton("Press me", "https://t.me/...") // Adds a button to the post

const otherMessage = firstMessage
	.nextMessage() // Create second message for a/b test. They will alternate from user to user
	.addText(`Hello, ${italic("world!")}`) // Adds text to the post, italic() makes it italic
	.addVideo(new InputFile("foo/bar.mp4")) // Adds video to the post. Video is cached after first sending

otherMessage.test() // Send test message to yourself
// Or .start(), to start production broadcast to everyone

// With onSuccess and onError callbacks
new Broadcast()
	.addChats([111111, 222222])
	.addText("With callbacks")
	.onSuccess(({chatId, index, message}) => {})
	.onError(({error, code, chatId, index, message}) => {})
	.start()

// You can also use custom action with .addCustomAction() method
new Broadcast()
	.addChats([333333, 444444])
	.addText("With custom action")
	.addCustomAction(async ({chatId, index, message}) => {})
	.start()
