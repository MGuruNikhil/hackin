import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { projects } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

// Define the schema that matches the form data
const projectSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional(),
	tech_stack: z.string().optional(),
	timeline: z.string().optional(),
	additional_notes: z.string().optional(),
	target_deadline: z.string().datetime().optional(),
})

export async function POST(request: Request) {
	try {
		// Get the current session
		const { user } = await getCurrentSession()
		if (!user) {
			return new NextResponse("Unauthorized", { status: 401 })
		}

		// Parse and validate request body
		const body = await request.json()
		const validation = projectSchema.safeParse(body)

		if (!validation.success) {
			return new NextResponse(
				JSON.stringify({ error: validation.error.issues }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
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

	// Create the project in the database
	const [project] = await db
		.insert(projects)
		.values({
			hackathonName: name,
			theme: description || null,
			suggestedTech: tech_stack || null,
			judgingCriteria: timeline || null,
			additionalData: additional_notes || null,
			submissionTime: target_deadline ? new Date(target_deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			userId: user.id,
		})
		.returning()
		return NextResponse.json(project, { status: 201 })
	} catch (error) {
		console.error("Error creating project:", error)
		return new NextResponse(
			JSON.stringify({ error: "Internal server error" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		)
	}
}

export async function GET() {
	return new NextResponse("Method not allowed", { status: 405 })
}
