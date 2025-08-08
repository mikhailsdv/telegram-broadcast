import {BOT_TOKEN, ADMIN_CHAT_ID} from "./env"
import {Bot} from "grammy"
import {jsonStringify, preparePoll, sendRaw} from "./utils"

const {question, options} = preparePoll("Your question", [
	"Option 1",
	"Option 2",
	"Option 3",
])

const bot = new Bot(BOT_TOKEN)
;(async () => {
	const response = await bot.api.sendPoll(ADMIN_CHAT_ID, question, options)
	await sendRaw(ADMIN_CHAT_ID, bot.api, response)
	console.log(jsonStringify(response))
})()
