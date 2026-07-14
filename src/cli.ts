import {cac, type CAC} from "cac"
import {isEmpty} from "./utils.js"

export function createCli(name: string) {
	return cac(name).help()
}

export function addTokenOption(cli: CAC) {
	return cli.option("-t, --token <token>", "Telegram bot token")
}

export function addChatOption(cli: CAC) {
	return cli.option("-c, --chat <chat>", "Telegram chat ID")
}

export function addFileIdOption(cli: CAC) {
	return cli.option("-f, --file-id <fileId>", "Telegram file ID")
}

export function getRequiredOption<T = string>(
	cli: CAC,
	options: Record<string, unknown>,
	name: string,
	description: string
): T {
	const value = options[name] as T
	if (
		(typeof value !== "string" && typeof value !== "number") ||
		isEmpty(value)
	) {
		console.error(`Missing required ${description}`)
		cli.outputHelp()
		process.exit(1)
	}
	return value
}

export function getRequiredArg(
	cli: CAC,
	args: readonly string[],
	index: number,
	description: string
): string {
	const value = args[index]
	if (isEmpty(value)) {
		console.error(`Missing required ${description}`)
		cli.outputHelp()
		process.exit(1)
	}
	return value
}
