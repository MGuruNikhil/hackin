import { desc, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stepSections, stepTodos } from "@/lib/schema"
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

		// Get all sections for the specific idea with their todos
		const sections = await db
			.select({
				id: stepSections.id,
				title: stepSections.title,
				description: stepSections.description,
				order: stepSections.order,
				isCompleted: stepSections.isCompleted,
				createdAt: stepSections.createdAt,
			})
			.from(stepSections)
			.where(eq(stepSections.ideaId, Number.parseInt(ideaId)))
			.orderBy(stepSections.order)

		// Get todos for each section
		const sectionsWithTodos = await Promise.all(
			sections.map(async (section) => {
				const todos = await db
					.select({
						id: stepTodos.id,
						title: stepTodos.title,
						description: stepTodos.description,
						isCompleted: stepTodos.isCompleted,
						order: stepTodos.order,
						createdAt: stepTodos.createdAt,
					})
					.from(stepTodos)
					.where(eq(stepTodos.sectionId, section.id))
					.orderBy(stepTodos.order)

				return {
					...section,
					todos,
				}
			})
		)

		return NextResponse.json({
			success: true,
			data: sectionsWithTodos,
		})
	} catch (error) {
		console.error("Error fetching step sections:", error)
		return NextResponse.json(
			{ error: "Failed to fetch step sections" },
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
		const { ideaId, title, description } = body

		if (!ideaId || !title) {
			return NextResponse.json(
				{ error: "Idea ID and title are required" },
				{ status: 400 },
			)
		}

		// Get the next order number for this idea
		const lastSection = await db
			.select({ order: stepSections.order })
			.from(stepSections)
			.where(eq(stepSections.ideaId, Number.parseInt(ideaId)))
			.orderBy(desc(stepSections.order))
			.limit(1)

		const nextOrder = lastSection.length > 0 && lastSection[0].order !== null 
			? lastSection[0].order + 1 
			: 1

		// Create the new section
		const [newSection] = await db
			.insert(stepSections)
			.values({
				title: title,
				description: description,
				ideaId: Number.parseInt(ideaId),
				order: nextOrder,
				isCompleted: false,
			})
			.returning()

		return NextResponse.json({
			success: true,
			data: {
				...newSection,
				todos: [],
			},
		})
	} catch (error) {
		console.error("Error creating step section:", error)
		return NextResponse.json(
			{ error: "Failed to create step section" },
			{ status: 500 },
		)
	}
}
