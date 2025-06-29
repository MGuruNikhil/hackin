import { desc, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ideas, steps } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function GET(request: NextRequest) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const ideaId = searchParams.get("ideaId")

		if (!ideaId) {
			return NextResponse.json(
				{ error: "Idea ID is required" },
				{ status: 400 },
			)
		}

		// Get all steps for the specific idea, ordered by order field
		const ideaSteps = await db
			.select({
				id: steps.id,
				content: steps.content,
				isDone: steps.isDone,
				order: steps.order,
			})
			.from(steps)
			.where(eq(steps.ideaId, Number.parseInt(ideaId)))
			.orderBy(steps.order)

		// Transform the data to match what the component expects
		const transformedSteps = ideaSteps.map((step) => ({
			id: step.id.toString(),
			title: step.content, // Use content as title for now
			name: step.content,
			isDone: step.isDone,
			order: step.order,
		}))

		return NextResponse.json({
			success: true,
			data: transformedSteps,
		})
	} catch (error) {
		console.error("Error fetching steps:", error)
		return NextResponse.json(
			{ error: "Failed to fetch steps" },
			{ status: 500 },
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await request.json()
		const { ideaId, content } = body

		if (!ideaId || !content) {
			return NextResponse.json(
				{ error: "Idea ID and content are required" },
				{ status: 400 },
			)
		}

		// Get the project ID from the idea
		const idea = await db
			.select({ projectId: ideas.projectId })
			.from(ideas)
			.where(eq(ideas.id, Number.parseInt(ideaId)))
			.limit(1)

		if (idea.length === 0) {
			return NextResponse.json({ error: "Idea not found" }, { status: 404 })
		}

		const projectId = idea[0].projectId

		// Get the next order number for this idea
		const lastStep = await db
			.select({ order: steps.order })
			.from(steps)
			.where(eq(steps.ideaId, Number.parseInt(ideaId)))
			.orderBy(desc(steps.order))
			.limit(1)

		const nextOrder = lastStep.length > 0 && lastStep[0].order !== null 
			? lastStep[0].order + 1 
			: 1

		// Create the new step
		const [newStep] = await db
			.insert(steps)
			.values({
				content: content,
				ideaId: Number.parseInt(ideaId),
				projectId: projectId,
				order: nextOrder,
				isDone: false,
			})
			.returning()

		return NextResponse.json({
			success: true,
			data: {
				id: newStep.id.toString(),
				title: newStep.content,
				name: newStep.content,
				isDone: newStep.isDone,
				order: newStep.order,
			},
		})
	} catch (error) {
		console.error("Error creating step:", error)
		return NextResponse.json(
			{ error: "Failed to create step" },
			{ status: 500 },
		)
	}
}
