import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText } from "ai"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { ideas, stepPlanningChats } from "@/lib/schema"
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

		// Get previous chat messages for context
		const previousChats = await db
			.select()
			.from(stepPlanningChats)
			.where(eq(stepPlanningChats.ideaId, Number.parseInt(ideaId)))
			.orderBy(desc(stepPlanningChats.createdAt))
			.limit(10)

		// Save user message to database
		await db.insert(stepPlanningChats).values({
			message: userMessage,
			ideaId: Number.parseInt(ideaId),
			userId: user.id,
		})

		// Build conversation context
		const chatHistory = previousChats
			.reverse()
			.map(chat =>
				chat.message.startsWith("AI: ")
					? `Assistant: ${chat.message.substring(4)}`
					: `User: ${chat.message}`,
			)
			.join("\n")

		const systemPrompt = `You are an AI assistant helping to create detailed implementation steps for hackathon project ideas. You should be:
- Practical and action-oriented
- Focused on clear, achievable milestones
- Knowledgeable about development workflows
- Able to break down complex tasks into manageable steps
- Helpful with project planning and time management
- Aware of hackathon constraints and best practices

Current Idea Details:
Title: ${ideaData.title}
Description: ${ideaData.description}
Content: ${ideaData.content}

Previous conversation:
${chatHistory}

When generating steps, follow these guidelines:
- Create 5-8 detailed implementation steps
- Each step should be specific and actionable
- Focus on development workflow and technical implementation
- Include setup, development, testing, and deployment phases
- Consider the hackathon time constraints
- Use bullet points or numbered lists for clarity
- Be practical and focused on deliverable outcomes

Respond helpfully to create, refine, or improve implementation steps. Be specific and actionable in your suggestions.`

		const openrouter = createOpenRouter({
			apiKey: env.OPENROUTER_API_KEY,
		})

		const result = await streamText({
			model: openrouter("mistralai/mistral-small-3.2-24b-instruct:free"),
			system: systemPrompt,
			messages: [{ role: "user", content: userMessage }],
			onFinish: async completion => {
				// Save AI response to database after streaming is complete
				await db.insert(stepPlanningChats).values({
					message: `AI: ${completion.text}`,
					ideaId: Number.parseInt(ideaId),
					userId: user.id,
				})
			},
		})

		return result.toDataStreamResponse()
	} catch (error) {
		console.error("Error in steps chat:", error)
		return new Response("Failed to process chat message", { status: 500 })
	}
}
