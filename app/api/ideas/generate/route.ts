import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateObject } from "ai"
import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { ideas, projects, users, userTeams } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

const IdeaSchema = z.object({
	ideas: z
		.array(
			z.object({
				title: z
					.string()
					.describe("A catchy, engaging title for the project idea"),
				description: z
					.string()
					.describe("A brief 1-2 sentence description of the core concept"),
				content: z
					.string()
					.describe(
						"Detailed explanation of the idea, including features, implementation approach, and potential impact. Should be 2-3 paragraphs.",
					),
				techStack: z
					.array(z.string())
					.describe("Suggested technologies and frameworks"),
				difficulty: z
					.enum(["beginner", "intermediate", "advanced"])
					.describe("Estimated difficulty level"),
				timeEstimate: z
					.string()
					.describe("Estimated time to complete (e.g., '2-3 days', '1 week')"),
				targetAudience: z
					.string()
					.describe("Who would benefit from this project"),
			}),
		)
		.length(3)
		.describe("Exactly 3 unique and creative project ideas"),
})

export async function POST(request: NextRequest) {
	try {
		const { user } = await getCurrentSession()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await request.json()
		const { projectId } = body

		if (!projectId) {
			return NextResponse.json(
				{ error: "Project ID is required" },
				{ status: 400 },
			)
		}

		// Get project details with team members and their skills
		const project = await db
			.select()
			.from(projects)
			.where(eq(projects.id, projectId))
			.limit(1)

		if (project.length === 0) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 })
		}

		const projectData = project[0]

		// Get team members and their skills
		let teamMembers: Array<{
			id: number
			name: string | null
			username: string
			skills: unknown
		}> = []
		if (projectData.teamId) {
			teamMembers = await db
				.select({
					id: users.id,
					name: users.name,
					username: users.username,
					skills: users.skills,
				})
				.from(users)
				.innerJoin(userTeams, eq(users.id, userTeams.userId))
				.where(eq(userTeams.teamId, projectData.teamId))
		} else {
			// Just get the project owner
			const owner = await db
				.select({
					id: users.id,
					name: users.name,
					username: users.username,
					skills: users.skills,
				})
				.from(users)
				.where(eq(users.id, projectData.userId))
				.limit(1)

			teamMembers = owner
		}

		// Get existing ideas for this project to avoid duplicates
		const existingIdeas = await db
			.select({
				title: ideas.title,
				description: ideas.description,
				content: ideas.content,
			})
			.from(ideas)
			.where(eq(ideas.projectId, projectId))

		// Compile all skills from team members
		const allSkills = teamMembers.flatMap(
			member => (member.skills as { name: string; level: string }[]) || [],
		)

		// Create context for AI
		const context = {
			hackathonName: projectData.hackathonName,
			theme: projectData.theme,
			suggestedTech: projectData.suggestedTech,
			judgingCriteria: projectData.judgingCriteria,
			additionalData: projectData.additionalData,
			teamSkills: allSkills,
			teamSize: teamMembers.length,
			submissionDeadline: projectData.submissionTime,
		}

		const prompt = `Generate 3 unique and innovative project ideas with the following context:

**Project Details:**
- Name: ${context.hackathonName}
- Description: ${context.theme || "Open project"}
- Preferred Technologies: ${context.suggestedTech || "Any technology"}
- Success Criteria: ${context.judgingCriteria || "Innovation, technical implementation, presentation"}
- Additional Requirements: ${context.additionalData || "None specified"}
- Target Deadline: ${context.submissionDeadline}

**Team Information:**
- Team Size: ${context.teamSize} member(s)
- Team Skills: ${allSkills.map(skill => `${skill.name} (${skill.level})`).join(", ") || "No specific skills listed"}

**IMPORTANT - Existing Ideas to AVOID (Generate completely different concepts):**
${
	existingIdeas.length > 0
		? existingIdeas
				.map(
					(idea, index) => `${index + 1}. ${idea.title}: ${idea.description}`,
				)
				.join("\n")
		: "No existing ideas yet"
}

**CRITICAL REQUIREMENTS:**
1. Each new idea MUST be completely different from the existing ideas listed above
2. Do NOT generate variations, improvements, or similar concepts to existing ideas
3. Think of entirely different problem domains, use cases, and approaches
4. If existing ideas cover certain areas (e.g., web apps, mobile apps, AI tools), explore other domains
5. Each idea should be unique and innovative
6. Consider the team's skill set and size
7. Ensure the project is feasible within the given timeframe
8. Provide actionable, detailed implementation guidance
9. Consider market viability and real-world impact

Generate ideas that are creative, technically sound, achievable by this specific team, and COMPLETELY DISTINCT from any existing ideas.`

		const openrouter = createOpenRouter({
			apiKey: env.OPENROUTER_API_KEY,
		})

		const result = await generateObject({
			model: openrouter("mistralai/mistral-small-3.2-24b-instruct:free"),
			schema: IdeaSchema,
			prompt,
		})

		// Store generated ideas in database
		const savedIdeas = []
		for (const idea of result.object.ideas) {
			const [savedIdea] = await db
				.insert(ideas)
				.values({
					title: idea.title,
					description: idea.description,
					content: `${idea.content}\n\n**Tech Stack:** ${idea.techStack.join(", ")}\n**Difficulty:** ${idea.difficulty}\n**Time Estimate:** ${idea.timeEstimate}\n**Target Audience:** ${idea.targetAudience}`,
					projectId: projectId,
					isFinal: false,
				})
				.returning()

			savedIdeas.push({
				...savedIdea,
				...idea, // Include the structured AI response
			})
		}

		return NextResponse.json({
			success: true,
			ideas: savedIdeas,
			context: context,
		})
	} catch (error) {
		console.error("Error generating ideas:", error)
		return NextResponse.json(
			{ error: "Failed to generate ideas" },
			{ status: 500 },
		)
	}
}
