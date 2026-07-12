import {Bot} from "grammy"
import {
	addChatOption,
	addTokenOption,
	createCli,
	getRequiredOption,
} from "./cli.js"
import {jsonStringify, preparePoll, sendRaw} from "./utils.js"

const {question, options: pollOptions} = preparePoll("Your question", [
	"Option 1",
	"Option 2",
	"Option 3",
])

const cli = addChatOption(addTokenOption(createCli("poll")))
const {options: cliOptions} = cli.parse()
const token = getRequiredOption(cli, cliOptions, "token", "bot token")
const chatId = getRequiredOption(cli, cliOptions, "chat", "chat id")
const bot = new Bot(token)
;(async () => {
	const response = await bot.api.sendPoll(chatId, question, pollOptions)
	await sendRaw(chatId, bot.api, response)
	console.log(jsonStringify(response))
})()
