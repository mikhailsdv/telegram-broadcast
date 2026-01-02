import fs from "fs"
import path from "path"
import os from "os"
import pino from "pino"
import pretty from "pino-pretty"

export type Logger = pino.Logger

const logDir = path.join(os.homedir(), ".telegram-broadcast", "logs")
fs.mkdirSync(logDir, {recursive: true})

export function getLogFilePath(broadcastName: string): string {
	return path.join(logDir, `broadcast.${broadcastName}.log`)
}

export function createLogger(broadcastName: string): pino.Logger {
	const logFilePath = getLogFilePath(broadcastName)

	// Поток в файл
	const fileStream = pino.destination({dest: logFilePath, sync: true})

	// Поток для консоли с читаемым выводом
	const consoleStream = pretty({
		colorize: true,
		sync: true,
		translateTime: "SYS:standard", // ISO или HH:MM:ss
	})

	const streams = [{stream: fileStream}, {stream: consoleStream}]

	return pino(
		{
			timestamp: pino.stdTimeFunctions.isoTime,
		},
		pino.multistream(streams)
	)
}
