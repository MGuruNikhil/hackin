import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText } from "ai"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { ideas } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function POST(request: Request) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return new Response("Unauthorized", { status: 401 })
		}

		const body = await request.json()
		const { messages, data } = body

		// Extract ideaId from data and get the latest user message
		const ideaId = data?.ideaId
		const userMessage = messages[messages.length - 1]?.content

		if (!ideaId || !userMessage) {
			return new Response("Idea ID and message are required", { status: 400 })
		}

		// Get the idea details
		const idea = await db
			.select()
			.from(ideas)
			.where(eq(ideas.id, Number.parseInt(ideaId)))
			.limit(1)

		if (idea.length === 0) {
			return new Response("Idea not found", { status: 404 })
		}

		const ideaData = idea[0]

		const systemPrompt = `You are an AI assistant helping to create detailed implementation steps for hackathon project ideas. You should generate clear, actionable, and specific steps that development teams can follow.

Current Idea Details:
Title: ${ideaData.title}
Description: ${ideaData.description}
Content: ${ideaData.content}

When generating steps, follow these guidelines:
- Create 5-8 detailed implementation steps
- Each step should be specific and actionable
- Focus on development workflow and technical implementation
- Include setup, development, testing, and deployment phases
- Consider the hackathon time constraints
- Use bullet points or numbered lists for clarity
- Be practical and focused on deliverable outcomes

Format your response as a clear list of implementation steps that can be easily parsed and converted into individual step items.`

		const openrouter = createOpenRouter({
			apiKey: env.OPENROUTER_API_KEY,
		})

		const result = await streamText({
			model: openrouter("mistralai/mistral-small-3.2-24b-instruct:free"),
			system: systemPrompt,
			messages: [{ role: "user", content: userMessage }],
		})

		return result.toDataStreamResponse()
	} catch (error) {
		console.error("Error in step generation:", error)
		return new Response("Failed to generate steps", { status: 500 })
	}
}
