import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText } from "ai"
import { env } from "@/lib/env"

export async function POST(request: Request) {
	try {
		const { messages } = await request.json()
		const userMessage = messages[messages.length - 1].content

		console.log(`[TEST] Received message: "${userMessage}"`)

		const openrouter = createOpenRouter({
			apiKey: env.OPENROUTER_API_KEY,
		})

		const result = await streamText({
			model: openrouter("mistralai/mistral-small-3.2-24b-instruct:free"),
			system: "You are a helpful assistant. Respond clearly to user messages.",
			messages: [{ role: "user", content: userMessage }],
		})

		console.log(`[TEST] StreamText created, returning response`)
		return result.toDataStreamResponse()
	} catch (error) {
		console.error(`[TEST] Error:`, error)
		return new Response(`Error: ${error}`, { status: 500 })
	}
}