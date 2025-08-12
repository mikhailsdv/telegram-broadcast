import {BOT_TOKEN, ADMIN_CHAT_ID} from "./env"
import {Bot, InputFile} from "grammy"
import {jsonStringify} from "./utils"
import {Message} from "grammy/types"
import {SupportedMediaTypes} from "./types"

const bot = new Bot(BOT_TOKEN)
const mediaType = process.argv[2] as SupportedMediaTypes
const src = process.argv[3]
const mediaTypeMap = {
	photo: "sendPhoto",
	video: "sendVideo",
	videoNote: "sendVideoNote",
} as const
if (!mediaTypeMap[mediaType]) {
	console.error(
		`Invalid media type: ${mediaType}. Supported types: ${Object.keys(
			mediaTypeMap
		).join(", ")}`
	)
	process.exit(1)
}
const apiMethod = mediaTypeMap[mediaType]
;(async () => {
	const response = await bot.api[apiMethod](ADMIN_CHAT_ID, new InputFile(src))
	console.log(jsonStringify(response))
	let fileId: string | void = undefined
	if (mediaType === "photo") {
		fileId = (response as Message.PhotoMessage).photo.at(-1)!.file_id
	} else if (mediaType === "video") {
		fileId = (response as Message.VideoMessage).video.file_id
	} else if (mediaType === "videoNote") {
		fileId = (response as Message.VideoNoteMessage).video_note.file_id
	}

	if (fileId) {
		console.log("file_id:", fileId)
	}
})()
