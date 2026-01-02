import {InlineKeyboard} from "grammy"
import {InputFile, Message, ParseMode} from "grammy/types"
import {ErrorCode} from "./errors"

export type ChatId = string | number

export type SupportedMessageType =
	| Message.PhotoMessage
	| Message.VideoMessage
	| Message.VideoNoteMessage

export type SupportedMediaTypes = "photo" | "video" | "videoNote"

export type InputFileOrString = InputFile | string

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
	chats?: ChatId[]
	shuffleChats?: boolean
	abTestStrategy?: "random" | "distributed"
	paseMode?: ParseMode
	debug?: boolean
}

export type BroadcastErrorCallback = ({
	error,
	code,
	chatId,
	index,
	message,
}: {
	error: unknown
	code: ErrorCode | undefined
	chatId: ChatId
	index: number
	message: BroadcastMessage | null
}) => void

export type BroadcastSuccessCallback = ({
	chatId,
	index,
	message,
}: {
	chatId: ChatId
	index: number
	message: BroadcastMessage | null
}) => void

export type BroadcastCustomActionCallback = ({
	chatId,
	index,
	message,
}: {
	chatId: ChatId
	index: number
	message: BroadcastMessage | null
}) => Promise<void>
