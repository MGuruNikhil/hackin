import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { projects } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

// Define the schema that matches the form data
const projectSchema = z.object({
	hackathon_name: z.string().min(1, "Hackathon name is required"),
	theme: z.string().optional(),
	tools: z.string().optional(),
	judging_criteria: z.string().optional(),
	additional_data: z.string().optional(),
	submision_time: z.string().datetime(),
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
			hackathon_name,
			theme,
			tools,
			judging_criteria,
			additional_data,
			submision_time,
		} = validation.data

		// Create the project in the database
		const [project] = await db
			.insert(projects)
			.values({
				hackathonName: hackathon_name,
				theme: theme || null,
				suggestedTech: tools || null,
				judgingCriteria: judging_criteria || null,
				additionalData: additional_data || null,
				submissionTime: submision_time
					? new Date(submision_time)
					: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
