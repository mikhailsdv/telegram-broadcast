import {existsSync, readFileSync, writeFileSync} from "fs"
import path from "path"
import {InputFile} from "grammy/types"
import {AbortController} from "abort-controller"
import {
	BroadcastMessage,
	BroadcastParams,
	BroadcastState,
	ChatId,
	InputFileOrString,
	SupportedMessageType,
	BroadcastErrorCallback,
	BroadcastSuccessCallback,
	BroadcastCustomActionCallback,
	BroadcastBeforeSendCallback,
} from "./types"
import {
	arrayRandom,
	isEmpty,
	trim,
	arrayUnique,
	arrayEnd,
	shuffleArray,
} from "./utils"
import {Bot, GrammyError, InlineKeyboard} from "grammy"
import {
	hasFirstNamePlaceholder,
	hasLastNamePlaceholder,
	replaceFirstNamePlaceholder,
	replaceLastNamePlaceholder,
} from "./formatter"
import {ADMIN_CHAT_ID, BOT_TOKEN, MESSAGE_SEND_TIMEOUT_MS} from "./env"
import {getErrorCode} from "./errors"
import {createLogger, getLogFilePath, type Logger} from "./logger"

export class Broadcast {
	public chats: NonNullable<BroadcastParams["chats"]> = []
	public shuffleChats = false
	public paseMode: NonNullable<BroadcastParams["paseMode"]> = "HTML"
	public abTestStrategy: NonNullable<BroadcastParams["abTestStrategy"]> =
		"distributed"
	private bot: Bot
	private messages: BroadcastMessage[] = []
	private messagePointer = 0
	private successfullySentCount = 0
	private totalSentCount = 0
	private totalErrorCount = 0
	private mediaMap = new Map<InputFile, string>()
	private uniquifyChats = true
	private broadcastFilename = process.env.BROADCAST_FILENAME!
	private isTest = false
	private logger: Logger
	private stateFile?: string
	private onErrorCallback?: BroadcastErrorCallback
	private onSuccessCallback?: BroadcastSuccessCallback
	private onBeforeSendCallback?: BroadcastBeforeSendCallback
	private customActionCallback?: BroadcastCustomActionCallback

	constructor(args?: BroadcastParams) {
		this.bot = new Bot(BOT_TOKEN)
		this.chats = args?.chats ?? this.chats
		this.shuffleChats = args?.shuffleChats ?? this.shuffleChats
		this.abTestStrategy = args?.abTestStrategy ?? this.abTestStrategy
		this.paseMode = args?.paseMode ?? this.paseMode
		this.isTest = false

		if (!this.broadcastFilename) {
			this.fatalError(
				"BROADCAST_FILENAME environment variable is not set"
			)
		}
		this.logger = createLogger(this.broadcastFilename)
		this.stateFile = path.join(
			process.cwd(),
			"broadcasts",
			`.broadcast.${this.broadcastFilename}.json`
		)
	}

	private fatalError(message: string): never {
		this.logger.fatal(message)
		process.exit(1)
	}

	private addToCurrentMessage(properties: Partial<BroadcastMessage>) {
		this.messages[this.messagePointer] = {
			...this.messages[this.messagePointer],
			...properties,
		}
	}

	public nextMessage() {
		this.messagePointer += 1
		return this
	}

	public addText(text: string) {
		const trimmedText = trim(text)
		if (isEmpty(trimmedText)) this.fatalError("Can't add an empty text")
		this.addToCurrentMessage({text: trimmedText})
		return this
	}

	public addPhoto(photo: InputFileOrString) {
		this.addToCurrentMessage({photo})
		return this
	}

	public addVideo(video: InputFileOrString) {
		this.addToCurrentMessage({video})
		return this
	}

	public addVideoNote(videoNote: InputFileOrString) {
		this.addToCurrentMessage({videoNote})
		return this
	}

	public disableLinkPreview() {
		this.addToCurrentMessage({disableLinkPreview: true})
		return this
	}

	public disableNotification() {
		this.addToCurrentMessage({disableNotification: true})
		return this
	}

	public addChats(chatIds: ChatId[]) {
		this.chats = chatIds
		return this
	}

	public addButton(text: string, urlOrCallbackData: string) {
		const isUrl = /^https?:\/\//.test(urlOrCallbackData)
		const inlineKeyboard =
			this.messages[this.messagePointer]?.inlineKeyboard
		if (inlineKeyboard) {
			inlineKeyboard
				.row()
				[isUrl ? "url" : "text"](text, urlOrCallbackData)
		} else {
			this.addToCurrentMessage({
				inlineKeyboard: new InlineKeyboard()[isUrl ? "url" : "text"](
					text,
					urlOrCallbackData
				),
			})
		}
		return this
	}

	private getMessage(index?: number): BroadcastMessage | null {
		if (isEmpty(this.messages)) return null
		if (this.messages.length === 1) return this.messages[0]
		if (this.abTestStrategy === "random") {
			return arrayRandom(this.messages)
		}
		if (
			typeof index === "number" &&
			this.abTestStrategy === "distributed"
		) {
			return this.messages[index % this.messages.length]
		}
		return this.messages[0]
	}

	private getMessageType(message: BroadcastMessage) {
		if (!isEmpty(message.photo)) return "photo"
		if (!isEmpty(message.video)) return "video"
		if (!isEmpty(message.videoNote)) return "videoNote"
		if (!isEmpty(message.text)) return "text"
		this.fatalError("Can't define message type")
	}

	private validateBroadcast() {
		if (isEmpty(this.chats)) {
			if (this.isTest) {
				this.fatalError(
					"Please set ADMIN_CHAT_ID environment variable or pass chatIds as an argument to .test(...) method"
				)
			} else {
				this.fatalError(
					"List of chatIds is empty. Add chatIds with .addChats() method"
				)
			}
		}
		const hasEmptyMessage = this.messages.some(
			message =>
				isEmpty(message.text) &&
				isEmpty(message.photo) &&
				isEmpty(message.video) &&
				isEmpty(message.videoNote)
		)
		if (!this.customActionCallback && hasEmptyMessage) {
			this.fatalError(
				"All messages must have either text, photo, video or videoNote"
			)
		}
		if (isEmpty(this.messages) && !this.customActionCallback) {
			this.fatalError(
				"You must either pass chatIds as an argument to .test(...) or .addChats(...) methods or add custom action with .addCustomAction(...) method"
			)
		}
		if (!isEmpty(this.messages)) {
			for (const message of this.messages) {
				this.getMessageType(message)
			}
		}
	}

	public async test(chatIdOrChatIds?: ChatId | ChatId[]) {
		this.isTest = true
		if (chatIdOrChatIds) {
			if (Array.isArray(chatIdOrChatIds)) {
				this.chats = chatIdOrChatIds
			} else {
				this.chats = [chatIdOrChatIds]
			}
		} else if (ADMIN_CHAT_ID) {
			this.uniquifyChats = false
			this.chats = Array(this.messages.length).fill(ADMIN_CHAT_ID)
		}
		this.validateBroadcast()
		await this.start()
	}

	private getMediaFileId(response: SupportedMessageType) {
		if ("photo" in response && Array.isArray(response.photo)) {
			return arrayEnd(response.photo)!.file_id
		} else if ("video" in response) {
			return response.video.file_id
		} else if ("video_note" in response) {
			return response.video_note.file_id
		}
		this.fatalError("getMediaFileId: Unknown media type")
	}

	private saveState() {
		if (!this.stateFile || this.isTest) return

		const state: BroadcastState = {
			lastRunDate: new Date().toISOString(),
			totalSentCount: this.totalSentCount,
			successfullySentCount: this.successfullySentCount,
		}

		try {
			writeFileSync(this.stateFile, JSON.stringify(state, null, 2))
		} catch (error) {
			this.logger.error(`Failed to save state: ${error}`)
		}
	}

	private loadState(): BroadcastState | null {
		if (!this.stateFile || !existsSync(this.stateFile) || this.isTest)
			return null

		try {
			const data = readFileSync(this.stateFile, "utf8")
			return JSON.parse(data) as BroadcastState
		} catch (error) {
			this.logger.error(`Failed to load state: ${error}`)
			return null
		}
	}

	private async send({
		chatId,
		index,
		message,
	}: {
		chatId: ChatId
		index: number
		message: BroadcastMessage
	}) {
		const timedOutAbortController = new AbortController()
		timedOutAbortController.signal.addEventListener("abort", () => {
			this.logger.info(
				`Message with index ${index} to chatId: ${chatId} timed out. Skipping ...`
			)
		})
		const abortTimeout = setTimeout(() => {
			timedOutAbortController.abort()
		}, MESSAGE_SEND_TIMEOUT_MS)

		const messageType = this.getMessageType(message)

		try {
			if (message.text) {
				const shouldRequestChatInfo =
					hasFirstNamePlaceholder(message.text) ||
					hasLastNamePlaceholder(message.text)
				if (shouldRequestChatInfo) {
					const chatInfo = await this.bot.api.getChat(
						chatId,
						timedOutAbortController.signal
					)
					message.text = replaceFirstNamePlaceholder(
						message.text,
						chatInfo.first_name || ""
					)
					message.text = replaceLastNamePlaceholder(
						message.text,
						chatInfo.last_name || ""
					)
				}
			}

			switch (messageType) {
				case "text": {
					await this.bot.api.sendMessage(
						chatId,
						message.text!,
						{
							parse_mode: this.paseMode,
							reply_markup: message.inlineKeyboard,
							disable_notification: message.disableNotification,
							link_preview_options: {
								is_disabled: message.disableLinkPreview,
							},
						},
						timedOutAbortController.signal
					)
					break
				}
				case "photo": {
					const inputFileOfFileId = this.getCachedMediaFileIdIfExists(
						message.photo!
					)
					const response = await this.bot.api.sendPhoto(
						chatId,
						inputFileOfFileId,
						{
							parse_mode: this.paseMode,
							caption: message.text,
							reply_markup: message.inlineKeyboard,
							disable_notification: message.disableNotification,
						},
						timedOutAbortController.signal
					)
					this.setCachedMediaFileIdIfNeeded(
						inputFileOfFileId,
						response
					)
					break
				}
				case "videoNote": {
					const inputFileOfFileId = this.getCachedMediaFileIdIfExists(
						message.videoNote!
					)
					const response = await this.bot.api.sendVideoNote(
						chatId,
						inputFileOfFileId,
						{
							reply_markup:
								message.inlineKeyboard && message.text
									? undefined
									: message.inlineKeyboard,
							disable_notification: message.disableNotification,
						},
						timedOutAbortController.signal
					)
					if (message.text) {
						await this.bot.api.sendMessage(
							chatId,
							message.text,
							{
								parse_mode: this.paseMode,
								reply_markup: message.inlineKeyboard,
								disable_notification:
									message.disableNotification,
								link_preview_options: {
									is_disabled: message.disableLinkPreview,
								},
							},
							timedOutAbortController.signal
						)
					}
					this.setCachedMediaFileIdIfNeeded(
						inputFileOfFileId,
						response
					)
					break
				}
				case "video": {
					const inputFileOfFileId = this.getCachedMediaFileIdIfExists(
						message.video!
					)
					const response = await this.bot.api.sendVideo(
						chatId,
						message.video!,
						{
							caption: message.text,
							parse_mode: this.paseMode,
							disable_notification: message.disableNotification,
						},
						timedOutAbortController.signal
					)
					this.setCachedMediaFileIdIfNeeded(
						inputFileOfFileId,
						response
					)
					break
				}
			}

			clearTimeout(abortTimeout)
			this.successfullySentCount += 1
			this.logger.info(
				`Successfully sent to chatId: ${chatId}, index: ${index}/${
					this.chats.length - 1
				}, success ${this.successfullySentCount}/${
					this.totalSentCount
				} (${Math.round(
					(this.successfullySentCount / this.totalSentCount) * 100
				)}%)`
			)
			await this.onSuccessCallback?.({
				chatId,
				index,
				message,
				bot: this.bot,
				logger: this.logger,
			})
		} catch (error: unknown) {
			clearTimeout(abortTimeout)
			this.totalErrorCount += 1
			this.logger.error(
				`Error at index ${index}, chatId: ${chatId}. Skipping ...`
			)
			if (error instanceof GrammyError) {
				if (error.parameters.migrate_to_chat_id) {
					await this.send({
						chatId: error.parameters.migrate_to_chat_id,
						index,
						message,
					})
					return
				}
			}
			await this.onErrorCallback?.({
				error,
				code:
					error instanceof GrammyError
						? getErrorCode(error.description)
						: "UNKNOWN",
				chatId,
				index,
				message,
				bot: this.bot,
				logger: this.logger,
			})
			this.logger.error(error)
		}
	}

	private getCachedMediaFileIdIfExists(
		inputFileOfFileId: InputFile | string
	) {
		if (typeof inputFileOfFileId === "string") {
			return inputFileOfFileId
		}
		return this.mediaMap.get(inputFileOfFileId) || inputFileOfFileId
	}

	private setCachedMediaFileIdIfNeeded(
		inputFileOfFileId: InputFile | string,
		response: SupportedMessageType
	) {
		if (typeof inputFileOfFileId !== "string") {
			const fileId = this.getMediaFileId(response)
			this.mediaMap.set(inputFileOfFileId, fileId)
		}
	}

	public async start() {
		this.validateBroadcast()

		this.logger.info(
			`Starting ${this.isTest ? "test" : "production"} broadcast ${
				this.broadcastFilename
			} ...`
		)

		this.logger.info(
			`Logs will be saved to ${getLogFilePath(this.broadcastFilename)}`
		)

		if (this.uniquifyChats) {
			this.chats = arrayUnique(this.chats)
		}
		if (this.shuffleChats) {
			this.chats = shuffleArray(this.chats)
		}
		Object.freeze(this.chats)

		const state = this.loadState()
		let startIndex = 0

		if (state) {
			startIndex = state.totalSentCount + 1
			this.logger.info(`Resuming from index ${startIndex}`)
			this.totalSentCount = state.totalSentCount
			this.successfullySentCount = state.successfullySentCount
		}

		const loop = async (index: number) => {
			const chatId = this.chats[index]
			if (chatId) {
				this.totalSentCount = index + 1
				this.logger.info(
					`Sending message to chatId: ${chatId}, index: ${index} ...`
				)
				const message = this.getMessage(index)
				await this.onBeforeSendCallback?.({
					chatId,
					index,
					message,
					bot: this.bot,
					logger: this.logger,
				})
				if (message) {
					await this.send({chatId, index, message})
				}
				await this.customActionCallback?.({
					chatId,
					index,
					message,
					bot: this.bot,
					logger: this.logger,
				})
				this.saveState()
				await loop(index + 1)
			} else {
				this.logger.info(
					`Finished! To start again remove ${this.stateFile} file and run the script again`
				)
			}
		}
		await loop(startIndex)
	}

	public onBeforeSend(callback: BroadcastBeforeSendCallback) {
		this.onBeforeSendCallback = callback
		return this
	}

	public onError(callback: BroadcastErrorCallback) {
		this.onErrorCallback = callback
		return this
	}

	public onSuccess(callback: BroadcastSuccessCallback) {
		this.onSuccessCallback = callback
		return this
	}

	public addCustomAction(callback: BroadcastCustomActionCallback) {
		this.customActionCallback = callback
		return this
	}
}
