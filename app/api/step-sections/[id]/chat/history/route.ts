import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { stepSectionChats } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return new Response("Unauthorized", { status: 401 })
		}

		const { id: sectionId } = await params

		if (!sectionId) {
			return new Response("Section ID is required", { status: 400 })
		}

		// Get chat history for this section
		const chatHistory = await db
			.select()
			.from(stepSectionChats)
			.where(eq(stepSectionChats.sectionId, Number.parseInt(sectionId)))
			.orderBy(stepSectionChats.createdAt)

		// Convert to chat format expected by useChat hook
		const messages = chatHistory.map(chat => ({
			id: chat.id.toString(),
			role: chat.message.startsWith("AI: ") ? "assistant" : "user",
			content: chat.message.startsWith("AI: ") 
				? chat.message.substring(4) 
				: chat.message.startsWith("User: ")
				? chat.message.substring(6)
				: chat.message,
			createdAt: chat.createdAt
		}))

		return Response.json({ messages })
	} catch (error) {
		console.error("Error fetching section chat history:", error)
		return new Response("Failed to fetch chat history", { status: 500 })
	}
}