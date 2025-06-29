import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stepSections } from "@/lib/schema"
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
		const sectionId = Number.parseInt(id)

		if (Number.isNaN(sectionId)) {
			return NextResponse.json({ error: "Invalid section ID" }, { status: 400 })
		}

		const body = await request.json()
		const { isCompleted } = body

		if (typeof isCompleted !== "boolean") {
			return NextResponse.json(
				{ error: "isCompleted must be a boolean" },
				{ status: 400 },
			)
		}

		// Update the section
		const [updatedSection] = await db
			.update(stepSections)
			.set({ isCompleted })
			.where(eq(stepSections.id, sectionId))
			.returning()

		if (!updatedSection) {
			return NextResponse.json({ error: "Section not found" }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			data: updatedSection,
		})
	} catch (error) {
		console.error("Error updating section:", error)
		return NextResponse.json(
			{ error: "Failed to update section" },
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
		const sectionId = Number.parseInt(id)

		if (Number.isNaN(sectionId)) {
			return NextResponse.json({ error: "Invalid section ID" }, { status: 400 })
		}

		// Check if the section exists
		const existingSection = await db
			.select()
			.from(stepSections)
			.where(eq(stepSections.id, sectionId))
			.limit(1)

		if (existingSection.length === 0) {
			return NextResponse.json({ error: "Section not found" }, { status: 404 })
		}

		// Delete the section (todos will be cascade deleted)
		await db.delete(stepSections).where(eq(stepSections.id, sectionId))

		return NextResponse.json({
			success: true,
			message: "Section deleted successfully",
		})
	} catch (error) {
		console.error("Error deleting section:", error)
		return NextResponse.json(
			{ error: "Failed to delete section" },
			{ status: 500 },
		)
	}
}
