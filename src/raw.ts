import {Bot} from "grammy"
import {addTokenOption, createCli, getRequiredOption} from "./cli.js"
import {sendRaw} from "./utils.js"

const cli = addTokenOption(createCli("raw"))
const {options} = cli.parse()
const token = getRequiredOption(cli, options, "token", "bot token")
const bot = new Bot(token)

bot.on("message", async ctx => {
	await sendRaw(ctx.chatId, ctx.api, ctx.message)
})

bot.start()
