import {Bot} from "grammy"
import {
	addChatOption,
	addTokenOption,
	createCli,
	getRequiredOption,
} from "./cli.js"
import {sendRaw} from "./utils.js"

const cli = addChatOption(addTokenOption(createCli("raw")))
const parsed = cli.parse()
console.log(parsed.options)
const token = getRequiredOption(cli, parsed.options, "token", "bot token")
const chatId = getRequiredOption<number>(cli, parsed.options, "chat", "chat id")
const bot = new Bot(token)

bot.on("message", async ctx => {
	if (ctx.chatId === Number(chatId)) {
		await sendRaw(ctx.chatId, ctx.api, ctx.message)
	}
})

bot.start()
