import {BOT_TOKEN, ADMIN_CHAT_ID} from "./env"
import {Bot} from "grammy"
import {jsonStringify} from "./utils"

const bot = new Bot(BOT_TOKEN)
const fileId = process.argv[2]
;(async () => {
	const response = await bot.api.sendDocument(ADMIN_CHAT_ID, fileId)
	console.log(jsonStringify(response))
})()
