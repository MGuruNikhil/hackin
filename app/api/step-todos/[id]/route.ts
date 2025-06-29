import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stepTodos } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { id } = await params
		const todoId = Number.parseInt(id)

		if (Number.isNaN(todoId)) {
			return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 })
		}

		const body = await request.json()
		const { isCompleted } = body

		if (typeof isCompleted !== "boolean") {
			return NextResponse.json(
				{ error: "isCompleted must be a boolean" },
				{ status: 400 },
			)
		}

		// Update the todo
		const [updatedTodo] = await db
			.update(stepTodos)
			.set({ isCompleted })
			.where(eq(stepTodos.id, todoId))
			.returning()

		if (!updatedTodo) {
			return NextResponse.json({ error: "Todo not found" }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			data: updatedTodo,
		})
	} catch (error) {
		console.error("Error updating todo:", error)
		return NextResponse.json(
			{ error: "Failed to update todo" },
			{ status: 500 },
		)
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { id } = await params
		const todoId = Number.parseInt(id)

		if (Number.isNaN(todoId)) {
			return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 })
		}

		// Check if the todo exists
		const existingTodo = await db
			.select()
			.from(stepTodos)
			.where(eq(stepTodos.id, todoId))
			.limit(1)

		if (existingTodo.length === 0) {
			return NextResponse.json({ error: "Todo not found" }, { status: 404 })
		}

		// Delete the todo
		await db.delete(stepTodos).where(eq(stepTodos.id, todoId))

		return NextResponse.json({
			success: true,
			message: "Todo deleted successfully",
		})
	} catch (error) {
		console.error("Error deleting todo:", error)
		return NextResponse.json(
			{ error: "Failed to delete todo" },
			{ status: 500 },
		)
	}
}
