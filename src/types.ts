import {InlineKeyboard, Bot} from "grammy"
import {InputFile, Message} from "grammy/types"
import {ErrorCode} from "./errors.js"
import {Logger} from "./logger.js"

export type ChatId = string | number

export type SupportedMessageType =
	| Message.PhotoMessage
	| Message.VideoMessage
	| Message.VideoNoteMessage

export type SupportedMediaType = "photo" | "video" | "videoNote"

export type InputFileOrString = InputFile | string

export type BroadcastAbTestStrategy = "random" | "distributed"

export type BroadcastMessage = {
	text?: string
	photo?: InputFileOrString
	video?: InputFileOrString
	videoNote?: InputFileOrString
	inlineKeyboard?: InlineKeyboard
	disableNotification?: boolean
	disableLinkPreview?: boolean
}

export type BroadcastState = {
	lastRunDate: string
	totalSentCount: number
	successfullySentCount: number
}

export type BroadcastParams = {
	token: string
}

export type BroadcastErrorCallback = ({
	error,
	code,
	chatId,
	index,
	message,
	bot,
	logger,
}: {
	error: unknown
	code: ErrorCode | undefined
	chatId: ChatId
	index: number
	message: BroadcastMessage | null
	bot: Bot
	logger: Logger
}) => Promise<void>

export type BroadcastSuccessCallback = ({
	chatId,
	index,
	message,
	bot,
	logger,
}: {
	chatId: ChatId
	index: number
	message: BroadcastMessage | null
	bot: Bot
	logger: Logger
}) => Promise<void>

export type BroadcastCustomActionCallback = ({
	chatId,
	index,
	message,
	bot,
	logger,
}: {
	chatId: ChatId
	index: number
	message: BroadcastMessage | null
	bot: Bot
	logger: Logger
}) => Promise<void>

export type BroadcastBeforeSendCallback = ({
	chatId,
	index,
	message,
	bot,
	logger,
}: {
	chatId: ChatId
	index: number
	message: BroadcastMessage | null
	bot: Bot
	logger: Logger
}) => Promise<void>

export type ButtonColor = "red" | "blue" | "green"
