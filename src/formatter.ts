export function escape(str: string) {
	return String(str)
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/&/g, "&amp;")
}

export function $bold(str: string) {
	return `<b>${str}</b>`
}
export function bold(str: string) {
	return $bold(escape(str))
}

export function $italic(str: string) {
	return `<i>${str}</i>`
}
export function italic(str: string) {
	return $italic(escape(str))
}

export function $link(str: string, url: string) {
	return `<a href="${url}">${str}</a>`
}
export function link(str: string, url: string) {
	return $link(escape(str), url)
}

export function $mention(str: string, id: string) {
	return $link(str, `tg://user?id=${id}`)
}
export function mention(str: string, id: string) {
	return $mention(escape(str), id)
}

export function $quote(str: string) {
	return `<blockquote>${str}</blockquote>`
}
export function quote(str: string) {
	return $quote(escape(str))
}

export const FIRST_NAME_PLACEHOLDER = "{{FIRST_NAME}}"
export function hasFirstNamePlaceholder(str: string) {
	return str.includes(FIRST_NAME_PLACEHOLDER)
}
export function replaceFirstNamePlaceholder(str: string, firstName: string) {
	return str.replace(
		new RegExp(FIRST_NAME_PLACEHOLDER, "g"),
		escape(firstName)
	)
}

export const LAST_NAME_PLACEHOLDER = "{{LAST_NAME}}"
export function hasLastNamePlaceholder(str: string) {
	return str.includes(LAST_NAME_PLACEHOLDER)
}
export function replaceLastNamePlaceholder(str: string, lastName: string) {
	return str.replace(new RegExp(LAST_NAME_PLACEHOLDER, "g"), escape(lastName))
}

export const FULL_NAME_PLACEHOLDER = "{{FIRST_NAME}} {{LAST_NAME}}"
