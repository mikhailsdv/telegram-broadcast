import {BOT_TOKEN} from "./env"
import {Bot} from "grammy"
import {sendRaw} from "./utils"

const bot = new Bot(BOT_TOKEN)

bot.on("message", async ctx => {
	await sendRaw(ctx.chatId, ctx.api, ctx.message)
})

bot.start()
