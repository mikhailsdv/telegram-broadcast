import {Bot} from "grammy"
import {
	addChatOption,
	addFileIdOption,
	addTokenOption,
	createCli,
	getRequiredOption,
} from "./cli.js"
import {jsonStringify} from "./utils.js"

const cli = addFileIdOption(addChatOption(addTokenOption(createCli("get-file"))))
const parsed = cli.parse()
const token = getRequiredOption(cli, parsed.options, "token", "bot token")
const chatId = getRequiredOption(cli, parsed.options, "chat", "chat id")
const fileId = getRequiredOption(cli, parsed.options, "fileId", "file id")
const bot = new Bot(token)
;(async () => {
	const response = await bot.api.sendDocument(chatId, fileId)
	console.log(jsonStringify(response))
})()
