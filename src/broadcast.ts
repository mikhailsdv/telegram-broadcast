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

export class Broadcast {
	public chats: NonNullable<BroadcastParams["chats"]> = []
	public shuffleChats: boolean = false
	public paseMode: NonNullable<BroadcastParams["paseMode"]> = "HTML"
	public abTestStrategy: NonNullable<BroadcastParams["abTestStrategy"]> =
		"distributed"
	public debug: NonNullable<BroadcastParams["debug"]> = false
	private bot: Bot
	private messages: BroadcastMessage[] = []
	private messageIterator: number = 0
	private successfullySentCount = 0
	private totalSentCount = 0
	private totalErrorCount = 0
	private mediaMap = new Map<InputFile, string>()
	private uniquifyChats: boolean = true
	private broadcastFilename?: string = process.env.BROADCAST_FILENAME
	private stateFile?: string

	constructor(args?: BroadcastParams) {
		this.addEmptyMessage()
		this.bot = new Bot(BOT_TOKEN)
		this.chats = args?.chats ?? this.chats
		this.shuffleChats = args?.shuffleChats ?? this.shuffleChats
		this.abTestStrategy = args?.abTestStrategy ?? this.abTestStrategy
		this.paseMode = args?.paseMode ?? this.paseMode
		this.debug = args?.debug ?? this.debug

		if (!this.broadcastFilename) {
			throw new Error("BROADCAST_FILENAME is not set")
		}
		this.stateFile = path.join(
			process.cwd(),
			"broadcasts",
			`.broadcast.${this.broadcastFilename}.json`
		)
	}

	private addEmptyMessage() {
		this.messages[this.messageIterator] = this.getEmptyMessage()
	}

	private getEmptyMessage() {
		const emptyMessage: BroadcastMessage = {
			text: undefined,
			photo: undefined,
			video: undefined,
			videoNote: undefined,
			inlineKeyboard: undefined,
			disableNotification: false,
			disableLinkPreview: false,
		}
		return emptyMessage
	}

	public nextMessage() {
		const currentMessage = this.messages[this.messageIterator]
		this.checkMessageComplete(currentMessage)
		this.messageIterator += 1
		this.addEmptyMessage()
		return this
	}

	public addText(text: string) {
		const trimmedText = trim(text)
		if (isEmpty(trimmedText)) throw new Error("Can't add an empty text")
		this.messages[this.messageIterator].text = trimmedText
		return this
	}

	public addPhoto(photo: InputFileOrString) {
		this.messages[this.messageIterator].photo = photo
		return this
	}

	public addVideo(video: InputFileOrString) {
		this.messages[this.messageIterator].video = video
		return this
	}

	public addVideoNote(videoNote: InputFileOrString) {
		this.messages[this.messageIterator].videoNote = videoNote
		return this
	}

	public disableLinkPreview() {
		this.messages[this.messageIterator].disableLinkPreview = true
		return this
	}

	public disableNotification() {
		this.messages[this.messageIterator].disableNotification = true
		return this
	}

	public addChats(chatIds: ChatId[]) {
		this.chats = chatIds
		return this
	}

	public addButton(text: string, url: string) {
		if (this.messages[this.messageIterator].inlineKeyboard) {
			this.messages[this.messageIterator]
				.inlineKeyboard!.row()
				.url(text, url)
		} else {
			this.messages[this.messageIterator].inlineKeyboard =
				new InlineKeyboard().url(text, url)
		}
		return this
	}

	private getMessage(index?: number): BroadcastMessage {
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
		throw new Error("Can't define message type")
	}

	private checkMessageComplete(message: BroadcastMessage) {
		if (
			isEmpty(message.text) &&
			isEmpty(message.photo) &&
			isEmpty(message.video) &&
			isEmpty(message.videoNote)
		) {
			throw new Error(
				"Message must have either text, photo, video or videoNote"
			)
		}
	}

	async test(chatIdOrChatIds?: ChatId | ChatId[]) {
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
		if (isEmpty(this.chats)) {
			throw new Error(
				"Please set ADMIN_CHAT_ID .env variable or pass chat_id as an argument to use test broadcasts"
			)
		}
		console.log("Starting test broadcast ...")
		await this.start()
	}

	getMediaFileId(response: SupportedMessageType) {
		if ("photo" in response && Array.isArray(response.photo)) {
			return arrayEnd(response.photo)!.file_id
		} else if ("video" in response) {
			return response.video.file_id
		} else if ("video_note" in response) {
			return response.video_note.file_id
		}
		throw new Error("getMediaFileId: Unknown media type")
	}

	private saveState() {
		if (!this.stateFile) return

		const state: BroadcastState = {
			lastRunDate: new Date().toISOString(),
			totalSentCount: this.totalSentCount,
			successfullySentCount: this.successfullySentCount,
		}

		try {
			writeFileSync(this.stateFile, JSON.stringify(state, null, 2))
		} catch (error) {
			console.error(`Failed to save state: ${error}`)
		}
	}

	private loadState(): BroadcastState | null {
		if (!this.stateFile || !existsSync(this.stateFile)) return null

		try {
			const data = readFileSync(this.stateFile, "utf8")
			return JSON.parse(data) as BroadcastState
		} catch (error) {
			console.error(`Failed to load state: ${error}`)
			return null
		}
	}

	async send(chatId: ChatId, index: number) {
		this.totalSentCount = index + 1
		console.log(`Sending message to chatId ${chatId}, index ${index} ...`)

		const timedOutAbortController = new AbortController()
		timedOutAbortController.signal.addEventListener("abort", () => {
			console.log(
				`Message with index ${index} to chatId ${chatId} timed out. Skipping ...`
			)
		})
		const abortTimeout = setTimeout(() => {
			timedOutAbortController.abort()
		}, MESSAGE_SEND_TIMEOUT_MS)

		try {
			const message = this.getMessage(index)
			const messageType = this.getMessageType(message)

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
			console.log(
				`Successfully sent to ${chatId}, index ${index}/${
					this.chats.length
				}, success ${this.successfullySentCount}/${
					this.totalSentCount
				} (${Math.round(
					(this.successfullySentCount / this.totalSentCount) * 100
				)}%)`
			)
		} catch (error: unknown) {
			clearTimeout(abortTimeout)
			this.totalErrorCount += 1
			console.log(
				`Error at index ${index}, chatId: ${chatId}. Skipping ...`
			)
			if (error instanceof GrammyError) {
				if (error.parameters.migrate_to_chat_id) {
					await this.send(error.parameters.migrate_to_chat_id, index)
					return
				} else {
					console.log(error.message)
				}
			}
			this.debug && console.log(error)
		}

		console.log("---")
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

	async start() {
		if (isEmpty(this.chats)) {
			throw new Error(
				"List of chat_id is empty. Add chats with .addChats() method"
			)
		}
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
			console.log(`Resuming from index ${startIndex}`)
			this.totalSentCount = state.totalSentCount
			this.successfullySentCount = state.successfullySentCount
		}
		console.log("---")

		const loop = async (index: number) => {
			const chatId = this.chats[index]
			if (chatId) {
				await this.send(chatId, index)
				this.saveState()
				await loop(index + 1)
			} else {
				console.log(
					`Finished! To start again remove ${this.stateFile} file and run the script again`
				)
			}
		}
		await loop(startIndex)
	}
}
