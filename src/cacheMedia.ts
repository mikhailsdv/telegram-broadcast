import {Bot, InputFile} from "grammy"
import {
	addChatOption,
	addTokenOption,
	createCli,
	getRequiredArg,
	getRequiredOption,
} from "./cli.js"
import {jsonStringify} from "./utils.js"
import {Message} from "grammy/types"
import {SupportedMediaType} from "./types.js"

const cli = addChatOption(addTokenOption(createCli("cache")))
const parsed = cli.parse()
const token = getRequiredOption(cli, parsed.options, "token", "bot token")
const chatId = getRequiredOption(cli, parsed.options, "chat", "chat id")
const bot = new Bot(token)
const mediaType = getRequiredArg(
	cli,
	parsed.args,
	0,
	"media type"
) as SupportedMediaType
const src = getRequiredArg(cli, parsed.args, 1, "media path")
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
	const response = await bot.api[apiMethod](chatId, new InputFile(src))
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
