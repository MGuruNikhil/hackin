import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { stepPlanningChats } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function GET(request: Request) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return new Response("Unauthorized", { status: 401 })
		}

		const url = new URL(request.url)
		const ideaId = url.searchParams.get("ideaId")

		if (!ideaId) {
			return new Response("Idea ID is required", { status: 400 })
		}

		// Get chat history for this idea
		const chatHistory = await db
			.select()
			.from(stepPlanningChats)
			.where(eq(stepPlanningChats.ideaId, Number.parseInt(ideaId)))
			.orderBy(stepPlanningChats.createdAt)

		// Convert to chat format expected by useChat hook
		const messages = chatHistory.map(chat => ({
			id: chat.id.toString(),
			role: chat.message.startsWith("AI: ") ? "assistant" : "user",
			content: chat.message.startsWith("AI: ") 
				? chat.message.substring(4) 
				: chat.message,
			createdAt: chat.createdAt
		}))

		return Response.json({ messages })
	} catch (error) {
		console.error("Error fetching chat history:", error)
		return new Response("Failed to fetch chat history", { status: 500 })
	}
}