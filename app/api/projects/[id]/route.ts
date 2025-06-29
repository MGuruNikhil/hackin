import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { projects } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

// Define the schema for updating a project
const updateProjectSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional(),
	tech_stack: z.string().optional(),
	timeline: z.string().optional(),
	additional_notes: z.string().optional(),
	target_deadline: z.string().datetime().optional(),
})

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		// Get the current session
		const { user } = await getCurrentSession()
		if (!user) {
			return new NextResponse("Unauthorized", { status: 401 })
		}

		const projectId = Number.parseInt(id)
		if (Number.isNaN(projectId)) {
			return new NextResponse(
				JSON.stringify({ error: "Invalid project ID" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			)
		}

		// Parse and validate request body
		const body = await request.json()
		const validation = updateProjectSchema.safeParse(body)

		if (!validation.success) {
			return new NextResponse(
				JSON.stringify({ error: validation.error.issues }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			)
		}

	const {
		name,
		description,
		tech_stack,
		timeline,
		additional_notes,
		target_deadline,
	} = validation.data

	// Update the project in the database
	const [updatedProject] = await db
		.update(projects)
		.set({
			hackathonName: name,
			theme: description || null,
			suggestedTech: tech_stack || null,
			judgingCriteria: timeline || null,
			additionalData: additional_notes || null,
			submissionTime: target_deadline ? new Date(target_deadline) : new Date(),
		})
		.where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
		.returning()
		if (!updatedProject) {
			return new NextResponse(
				JSON.stringify({ error: "Project not found or you don't have permission to edit it" }),
				{ status: 404, headers: { "Content-Type": "application/json" } }
			)
		}

		return NextResponse.json(updatedProject, { status: 200 })
	} catch (error) {
		console.error("Error updating project:", error)
		return new NextResponse(
			JSON.stringify({ error: "Internal server error" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		)
	}
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const { user } = await getCurrentSession()
		if (!user) {
			return new NextResponse("Unauthorized", { status: 401 })
		}

		const projectId = Number.parseInt(id)
		if (Number.isNaN(projectId)) {
			return new NextResponse(
				JSON.stringify({ error: "Invalid project ID" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			)
		}

		const project = await db.query.projects.findFirst({
			where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
		})

		if (!project) {
			return new NextResponse(
				JSON.stringify({ error: "Project not found" }),
				{ status: 404, headers: { "Content-Type": "application/json" } }
			)
		}

		return NextResponse.json(project)
	} catch (error) {
		console.error("Error fetching project:", error)
		return new NextResponse(
			JSON.stringify({ error: "Internal server error" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		)
	}
}
