import { desc, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stepTodos } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function GET(request: NextRequest) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const sectionId = searchParams.get("sectionId")

		if (!sectionId) {
			return NextResponse.json(
				{ error: "Section ID is required" },
				{ status: 400 },
			)
		}

		// Get all todos for the specific section
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
			.where(eq(stepTodos.sectionId, Number.parseInt(sectionId)))
			.orderBy(stepTodos.order)

		return NextResponse.json({
			success: true,
			data: todos,
		})
	} catch (error) {
		console.error("Error fetching todos:", error)
		return NextResponse.json(
			{ error: "Failed to fetch todos" },
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
		const { sectionId, title, description } = body

		if (!sectionId || !title) {
			return NextResponse.json(
				{ error: "Section ID and title are required" },
				{ status: 400 },
			)
		}

		// Get the next order number for this section
		const lastTodo = await db
			.select({ order: stepTodos.order })
			.from(stepTodos)
			.where(eq(stepTodos.sectionId, Number.parseInt(sectionId)))
			.orderBy(desc(stepTodos.order))
			.limit(1)

		const nextOrder = lastTodo.length > 0 && lastTodo[0].order !== null 
			? lastTodo[0].order + 1 
			: 1

		// Create the new todo
		const [newTodo] = await db
			.insert(stepTodos)
			.values({
				title: title,
				description: description,
				sectionId: Number.parseInt(sectionId),
				order: nextOrder,
				isCompleted: false,
			})
			.returning()

		return NextResponse.json({
			success: true,
			data: newTodo,
		})
	} catch (error) {
		console.error("Error creating todo:", error)
		return NextResponse.json(
			{ error: "Failed to create todo" },
			{ status: 500 },
		)
	}
}
