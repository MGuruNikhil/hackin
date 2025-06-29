import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText } from "ai"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { ideas, stepSections, stepSectionChats, stepTodos } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return new Response("Unauthorized", { status: 401 })
		}

		const { id: sectionId } = await params
		const { messages } = await request.json()
		const userMessage = messages[messages.length - 1].content

		console.log(`[API] Processing chat for section ${sectionId}, user message: "${userMessage}"`)
		console.log(`[API] Total messages in conversation:`, messages.length)

		// Get section and idea details
		const sectionData = await db
			.select({
				section: stepSections,
				idea: ideas,
			})
			.from(stepSections)
			.innerJoin(ideas, eq(stepSections.ideaId, ideas.id))
			.where(eq(stepSections.id, Number.parseInt(sectionId)))
			.limit(1)

		if (sectionData.length === 0) {
			return new Response("Section not found", { status: 404 })
		}

		const { section, idea } = sectionData[0]

		// Get existing todos in this section for context
		const existingTodos = await db
			.select()
			.from(stepTodos)
			.where(eq(stepTodos.sectionId, section.id))
			.orderBy(stepTodos.order)

		// Store user message
		await db.insert(stepSectionChats).values({
			sectionId: section.id,
			message: `User: ${userMessage}`,
			createdAt: new Date(),
		})

		console.log(`[API] Section details:`, { id: section.id, title: section.title })
		console.log(`[API] Existing todos:`, existingTodos.length)

		const openrouter = createOpenRouter({
			apiKey: env.OPENROUTER_API_KEY,
		})

		console.log(`[API] Starting streamText with model...`)
		console.log(`[API] OpenRouter API Key present:`, !!env.OPENROUTER_API_KEY)
		console.log(`[API] Latest user message:`, userMessage)
		console.log(`[API] Full conversation has ${messages.length} messages`)

		const result = await streamText({
			model: openrouter("mistralai/mistral-small-3.2-24b-instruct:free"),
			system: `You are a helpful AI assistant for software development tasks. 

Project Context:
- Idea: ${idea.title}
- Section: ${section.title}

Current Tasks in this Section:
${existingTodos.length > 0 
	? existingTodos.map((todo, index) => 
		`${index + 1}. ${todo.title}${todo.description ? ` (${todo.description})` : ''} ${todo.isCompleted ? '✅' : '⏳'}`
	).join('\n')
	: 'No tasks have been created yet for this section.'}

Help the user with questions about this section, provide guidance, discuss implementation details, and offer suggestions for completing the tasks.`,
			messages: messages, // Pass the full conversation history
			onFinish: async (finishResult) => {
				console.log(`[API] AI response finished - Text length:`, finishResult.text?.length || 0)
				console.log(`[API] AI response text:`, finishResult.text)
				
				// Store AI response
				await db.insert(stepSectionChats).values({
					sectionId: section.id,
					message: `AI: ${finishResult.text}`,
					createdAt: new Date(),
				})
			},
		})

		console.log(`[API] StreamText created successfully, returning response`)
		
		// Return the streaming response with proper headers
		const response = result.toDataStreamResponse()
		
		// Add CORS headers if needed
		response.headers.set('Access-Control-Allow-Origin', '*')
		response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
		
		console.log(`[API] Response headers:`, Object.fromEntries(response.headers.entries()))
		
		return response
	} catch (error) {
		console.error(`[API] Error in streamText:`, error)
		return new Response(`Failed to process chat message: ${error}`, { status: 500 })
	}
}