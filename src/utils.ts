import {Api} from "grammy"
import {ChatId} from "./types"

export function trim(str: string) {
	return str.trim().replace(/\t+|^\n+|\n+$/g, "")
}

export function jsonStringify(obj: any) {
	return JSON.stringify(obj, null, 2)
}

export function arrayRandom(arr: any[]) {
	return arr[Math.floor(Math.random() * arr.length)]
}

export function preparePoll(question: string, options: string[]) {
	return {
		question,
		options: options.map(option => ({text: option})),
	}
}

export async function sendRaw(chatId: ChatId, api: Api, obj: any) {
	return await api.sendMessage(
		chatId,
		`<pre><code class="language-json">${jsonStringify(obj)}</code></pre>`,
		{parse_mode: "HTML"}
	)
}

export function arrayUnique(arr: Array<string | number>) {
	return [...new Set(arr.map(item => String(item)))]
}

export const arrayEnd = <T>(arr: T[]): T | null =>
	arr.length === 0 ? null : arr[arr.length - 1]

export function isEmpty(value: any) {
	if (value === null || value === undefined) return true
	if (Array.isArray(value) && value.length === 0) return true
	if (typeof value === "string" && trim(value) === "") return true
	if (
		typeof value === "object" &&
		value !== null &&
		Object.keys(value).length === 0
	)
		return true
	return false
}

export const wait = (delay: number) =>
	new Promise(resolve => setTimeout(resolve, delay))

export function prepareMongoExportedChats(arr: any[]) {
	return Array.from(
		new Set(
			arr.map(item => {
				if (typeof item.chat_id === "number") {
					return String(item.chat_id)
				}
				if (
					typeof item.chat_id === "object" &&
					item.chat_id.$numberLong
				) {
					return item.chat_id.$numberLong
				}
			})
		)
	)
}

export function shuffleArray(array: any[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
	return array
}
