import { asc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ideaChats, ideas } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const ideaId = Number.parseInt(id)

		if (Number.isNaN(ideaId)) {
			return NextResponse.json({ error: "Invalid idea ID" }, { status: 400 })
		}

		// Verify the idea exists and belongs to the user's project
		const idea = await db
			.select({
				id: ideas.id,
				projectId: ideas.projectId,
			})
			.from(ideas)
			.where(eq(ideas.id, ideaId))
			.limit(1)

		if (idea.length === 0) {
			return NextResponse.json({ error: "Idea not found" }, { status: 404 })
		}

		// Get chat messages for this idea
		const chatMessages = await db
			.select({
				id: ideaChats.id,
				message: ideaChats.message,
				role: ideaChats.role,
				createdAt: ideaChats.createdAt,
			})
			.from(ideaChats)
			.where(eq(ideaChats.ideaId, ideaId))
			.orderBy(asc(ideaChats.createdAt))

		// Transform to the format expected by the chat component
		const messages = chatMessages.map(chat => ({
			id: chat.id.toString(),
			content: chat.message,
			role: chat.role as "user" | "assistant",
			createdAt: chat.createdAt,
		}))

		return NextResponse.json({ messages })
	} catch (error) {
		console.error("Error fetching chat messages:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		)
	}
}
