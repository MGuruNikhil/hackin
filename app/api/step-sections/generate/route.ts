import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateObject } from "ai"
import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { ideas, stepSections, stepTodos } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

const StepSectionSchema = z.object({
	sections: z
		.array(
			z.object({
				title: z
					.string()
					.describe("A clear, actionable title for the implementation section"),
				description: z
					.string()
					.describe("A brief description of what this section covers"),
				todos: z
					.array(
						z.object({
							title: z
								.string()
								.describe("A specific, actionable todo item"),
							description: z
								.string()
								.optional()
								.describe("Additional details about the todo (optional)"),
						})
					)
					.describe("5-8 specific todo items for this section"),
			})
		)
		.length(5)
		.describe("Exactly 5 implementation sections with todos"),
})

export async function POST(request: NextRequest) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await request.json()
		const { ideaId } = body

		if (!ideaId) {
			return NextResponse.json(
				{ error: "Idea ID is required" },
				{ status: 400 },
			)
		}

		// Get the idea details
		const idea = await db
			.select()
			.from(ideas)
			.where(eq(ideas.id, Number.parseInt(ideaId)))
			.limit(1)

		if (idea.length === 0) {
			return NextResponse.json({ error: "Idea not found" }, { status: 404 })
		}

		const ideaData = idea[0]

		// Check if sections already exist
		const existingSections = await db
			.select()
			.from(stepSections)
			.where(eq(stepSections.ideaId, Number.parseInt(ideaId)))

		if (existingSections.length > 0) {
			return NextResponse.json(
				{ error: "Implementation plan already exists for this idea" },
				{ status: 400 },
			)
		}

		const prompt = `Generate a comprehensive implementation plan for this hackathon project idea:

**Project Idea:**
Title: ${ideaData.title}
Description: ${ideaData.description}
Content: ${ideaData.content}

**Requirements:**
1. Break down the implementation into 5 key sections (e.g., Planning & Setup, Backend Development, Frontend Development, Integration & Testing, Deployment & Polish)
2. Each section should have 5-8 specific, actionable todo items
3. Todos should be clear, concrete tasks that a development team can execute
4. Consider the typical hackathon timeline and scope
5. Focus on MVP features and essential functionality
6. Include setup, development, testing, and deployment phases
7. Make sure todos are specific enough to track progress

Create a logical flow from project setup to final deployment.`

		const openrouter = createOpenRouter({
			apiKey: env.OPENROUTER_API_KEY,
		})

		const result = await generateObject({
			model: openrouter("mistralai/mistral-small-3.2-24b-instruct:free"),
			schema: StepSectionSchema,
			prompt,
		})

		// Store generated sections and todos in database
		const savedSections = []
		for (let i = 0; i < result.object.sections.length; i++) {
			const section = result.object.sections[i]
			
			const [savedSection] = await db
				.insert(stepSections)
				.values({
					title: section.title,
					description: section.description,
					ideaId: Number.parseInt(ideaId),
					order: i + 1,
					isCompleted: false,
				})
				.returning()

			// Save todos for this section
			const savedTodos = []
			for (let j = 0; j < section.todos.length; j++) {
				const todo = section.todos[j]
				
				const [savedTodo] = await db
					.insert(stepTodos)
					.values({
						title: todo.title,
						description: todo.description || "",
						sectionId: savedSection.id,
						order: j + 1,
						isCompleted: false,
					})
					.returning()

				savedTodos.push(savedTodo)
			}

			savedSections.push({
				...savedSection,
				todos: savedTodos,
			})
		}

		return NextResponse.json({
			success: true,
			sections: savedSections,
		})
	} catch (error) {
		console.error("Error generating step sections:", error)
		return NextResponse.json(
			{ error: "Failed to generate step sections" },
			{ status: 500 },
		)
	}
}
