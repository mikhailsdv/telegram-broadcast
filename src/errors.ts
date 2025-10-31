export type ErrorCode =
	| "BLOCKED_BY_USER"
	| "CHAT_NOT_FOUND"
	| "USER_DEACTIVATED"
	| "BOT_CANNOT_INITIATE_CONVERSATION"
	| "UNKNOWN"

const errors = [
	{
		code: "BLOCKED_BY_USER",
		message: "Forbidden: bot was blocked by the user",
	},
	{
		code: "CHAT_NOT_FOUND",
		message: "Bad Request: chat not found",
	},
	{
		code: "USER_DEACTIVATED",
		message: "Forbidden: user is deactivated",
	},
	{
		code: "BOT_CANNOT_INITIATE_CONVERSATION",
		message: "Forbidden: bot can't initiate conversation with a user",
	},
]

const errorsMap = new Map(errors.map(error => [error.message, error.code]))

export function getErrorCode(message: string): ErrorCode {
	return errorsMap.has(message)
		? (errorsMap.get(message) as ErrorCode)
		: "UNKNOWN"
}
