import path from "path"
import env from "dotenv"
env.config({path: path.resolve(__dirname, "../.env")})

export const BOT_TOKEN = process.env.BOT_TOKEN as string
export const MESSAGES_PER_SECOND = Number(process.env.MESSAGES_PER_SECOND)
export const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID as string
export const MESSAGE_SEND_TIMEOUT_MS =
	Number(process.env.MESSAGE_SEND_TIMEOUT_MS) || 20000
