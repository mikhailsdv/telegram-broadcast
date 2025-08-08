import {existsSync} from "fs"
import {spawn} from "child_process"
import path from "path"

const args = process.argv.slice(2)

if (args.length === 0) {
	console.error("Error: specify your broadcast name")
	process.exit(1)
}

let fileName = args[0]
if (!fileName.endsWith(".ts")) {
	fileName = `${fileName}.ts`
}
const filePath = path.join(__dirname, "../broadcasts", fileName)

if (!existsSync(filePath)) {
	console.error(`Error: broadcast "${filePath}" not found`)
	process.exit(1)
}

const child = spawn("ts-node", ["--transpile-only", filePath], {
	stdio: "inherit",
	env: {
		...process.env,
		BROADCAST_FILENAME: fileName.replace(".ts", ""),
	},
})

child.on("error", error => {
	console.error(`Execution error: ${error.message}`)
})

child.on("close", code => {
	if (code !== 0) {
		console.error(`Process exited with code ${code}`)
	}
})
