import fs from "node:fs"
import { Readable } from "node:stream"
import { AssemblyAI } from "assemblyai"
import recorder from "node-record-lpcm16"

const run = async () => {
	const client = new AssemblyAI({
		apiKey: "ff33fd8b26f14cb596840a33352ba7c8", // Replace with your chosen API key
	})

	const transcriber = client.streaming.transcriber({
		sampleRate: 16_000,
		formatTurns: true,
	})

	const transcriptionFile = "transcriptions.txt"

	transcriber.on("open", ({ id }) => {
		console.log(`Session opened with ID: ${id}`)
	})

	transcriber.on("error", error => {
		console.error("Error:", error)
	})

	transcriber.on("close", (code, reason) =>
		console.log("Session closed:", code, reason),
	)

	transcriber.on("turn", turn => {
		if (!turn.transcript) {
			return
		}

		console.log("Turn:", turn.transcript)

		// Save the transcription to a file
		fs.appendFileSync(transcriptionFile, `${turn.transcript}\n`)
	})

	try {
		console.log("Connecting to streaming transcript service")

		await transcriber.connect()

		console.log("Starting recording")

		const recording = recorder.record({
			channels: 1,
			sampleRate: 16_000,
			audioType: "wav", // Linear PCM
		})

		Readable.toWeb(recording.stream()).pipeTo(transcriber.stream())

		// Stop recording and close connection using Ctrl-C.

		process.on("SIGINT", async () => {
			console.log()
			console.log("Stopping recording")
			recording.stop()

			console.log("Closing streaming transcript connection")
			await transcriber.close()

			process.exit()
		})
	} catch (error) {
		console.error(error)
	}
}

run()
