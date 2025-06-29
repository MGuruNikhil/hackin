import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { steps } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { id } = await params
		const stepId = Number.parseInt(id)

		if (Number.isNaN(stepId)) {
			return NextResponse.json({ error: "Invalid step ID" }, { status: 400 })
		}

		const body = await request.json()
		const { isDone } = body

		// Update the step completion status
		const [updatedStep] = await db
			.update(steps)
			.set({ isDone: isDone })
			.where(eq(steps.id, stepId))
			.returning()

		if (!updatedStep) {
			return NextResponse.json({ error: "Step not found" }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			data: {
				id: updatedStep.id.toString(),
				title: updatedStep.content,
				isDone: updatedStep.isDone,
				order: updatedStep.order,
			},
		})
	} catch (error) {
		console.error("Error updating step:", error)
		return NextResponse.json(
			{ error: "Failed to update step" },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { id } = await params
		const stepId = Number.parseInt(id)

		if (Number.isNaN(stepId)) {
			return NextResponse.json({ error: "Invalid step ID" }, { status: 400 })
		}

		// Delete the step
		const [deletedStep] = await db
			.delete(steps)
			.where(eq(steps.id, stepId))
			.returning()

		if (!deletedStep) {
			return NextResponse.json({ error: "Step not found" }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			message: "Step deleted successfully",
		})
	} catch (error) {
		console.error("Error deleting step:", error)
		return NextResponse.json(
			{ error: "Failed to delete step" },
			{ status: 500 }
		)
	}
}
