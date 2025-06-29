import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText, tool } from "ai"
import { eq, desc, max } from "drizzle-orm"
import { z } from "zod"
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

		// Get previous chat messages for context
		const previousChats = await db
			.select()
			.from(stepSectionChats)
			.where(eq(stepSectionChats.sectionId, section.id))
			.orderBy(desc(stepSectionChats.createdAt))
			.limit(10)

		const chatHistory = previousChats
			.reverse()
			.map(chat =>
				chat.message.startsWith("AI:")
					? `Assistant: ${chat.message.slice(3)}`
					: chat.message
			)
			.join("\n")

		console.log(`[API] Processing chat for section ${sectionId}, user message: "${userMessage}"`)
		console.log(`[API] Section details:`, { id: section.id, title: section.title })
		console.log(`[API] Existing todos:`, existingTodos.length)

		const openrouter = createOpenRouter({
			apiKey: env.OPENROUTER_API_KEY,
		})

		console.log(`[API] Starting streamText with model...`)

		const result = await streamText({
			model: openrouter("qwen/qwen-2.5-coder-32b-instruct:free"),
			system: `You are a helpful AI assistant that manages software development tasks. You have access to tools and you MUST use them when users request task management.

Project Context:
- Idea: ${idea.title}
- Section: ${section.title}

Current Tasks in this Section:
${existingTodos.length > 0 
	? existingTodos.map((todo, index) => 
		`${index + 1}. ID:${todo.id} - ${todo.title}${todo.description ? ` (${todo.description})` : ''} ${todo.isCompleted ? '✅' : '⏳'}`
	).join('\n')
	: 'No tasks have been created yet for this section.'}

CRITICAL RULES:
1. When a user asks to delete/remove a task, you MUST immediately call the deleteTodo tool
2. When a user asks to create a task, you MUST immediately call the createTodo tool  
3. When a user asks to update/modify a task, you MUST immediately call the updateTodo tool
4. DO NOT explain what you would do - just do it immediately using the tools
5. Find the correct task ID from the list above and use it

User requested task management - USE THE TOOLS NOW, don't just talk about them!`,
			messages: [{ role: "user", content: userMessage }],
			tools: {
				createTodo: tool({
					description: "Create a new todo/task in this section",
					parameters: z.object({
						title: z.string().describe("The title of the todo/task"),
						description: z.string().optional().describe("Optional description of the task"),
					}),
					execute: async ({ title, description }) => {
						try {
							console.log(`[TOOL] Creating todo: "${title}"`)
							
							const maxOrderResult = await db
								.select({ maxOrder: max(stepTodos.order) })
								.from(stepTodos)
								.where(eq(stepTodos.sectionId, section.id))

							const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1

							const newTodo = await db
								.insert(stepTodos)
								.values({
									title,
									description: description || null,
									sectionId: section.id,
									order: nextOrder,
								})
								.returning()

							console.log(`[TOOL] Created todo successfully:`, newTodo[0])
							return `✅ Created new task: "${title}" (ID: ${newTodo[0].id})`
						} catch (error) {
							console.error(`[TOOL] Error creating todo:`, error)
							return `❌ Failed to create task: ${error}`
						}
					},
				}),
				updateTodo: tool({
					description: "Update an existing todo/task",
					parameters: z.object({
						todoId: z.number().describe("The ID of the todo to update"),
						title: z.string().optional().describe("New title for the todo"),
						description: z.string().optional().describe("New description for the todo"),
						isCompleted: z.boolean().optional().describe("Mark todo as completed or not"),
					}),
					execute: async ({ todoId, title, description, isCompleted }) => {
						try {
							console.log(`[TOOL] Updating todo ${todoId}`)
							
							const updateData: Partial<{
								title: string;
								description: string | null;
								isCompleted: boolean;
							}> = {}
							if (title !== undefined) updateData.title = title
							if (description !== undefined) updateData.description = description
							if (isCompleted !== undefined) updateData.isCompleted = isCompleted

							const updatedTodo = await db
								.update(stepTodos)
								.set(updateData)
								.where(eq(stepTodos.id, todoId))
								.returning()

							if (updatedTodo.length === 0) {
								return `❌ Todo with ID ${todoId} not found`
							}

							console.log(`[TOOL] Updated todo successfully:`, updatedTodo[0])
							return `✅ Updated task: "${updatedTodo[0].title}" (ID: ${todoId})`
						} catch (error) {
							console.error(`[TOOL] Error updating todo:`, error)
							return `❌ Failed to update task: ${error}`
						}
					},
				}),
				deleteTodo: tool({
					description: "Delete a todo/task by ID",
					parameters: z.object({
						todoId: z.number().describe("The ID of the todo to delete"),
					}),
					execute: async ({ todoId }) => {
						try {
							console.log(`[TOOL] Deleting todo ${todoId}`)
							
							const deletedTodo = await db
								.delete(stepTodos)
								.where(eq(stepTodos.id, todoId))
								.returning()

							if (deletedTodo.length === 0) {
								return `❌ Todo with ID ${todoId} not found`
							}

							console.log(`[TOOL] Deleted todo successfully:`, deletedTodo[0])
							return `🗑️ Deleted task: "${deletedTodo[0].title}" (ID: ${todoId})`
						} catch (error) {
							console.error(`[TOOL] Error deleting todo:`, error)
							return `❌ Failed to delete task: ${error}`
						}
					},
				}),
				getCurrentTodos: tool({
					description: "Get all current todos/tasks in this section",
					parameters: z.object({}),
					execute: async () => {
						try {
							console.log(`[TOOL] Getting current todos for section ${section.id}`)
							
							const todos = await db
								.select()
								.from(stepTodos)
								.where(eq(stepTodos.sectionId, section.id))
								.orderBy(stepTodos.order)

							console.log(`[TOOL] Found ${todos.length} todos`)

							if (todos.length === 0) {
								return `📝 No tasks found in this section`
							}

							const todoList = todos.map((todo, index) => 
								`${index + 1}. ID:${todo.id} - ${todo.title}${todo.description ? ` (${todo.description})` : ''} ${todo.isCompleted ? '✅' : '⏳'}`
							).join('\n')

							return `📝 Current tasks in this section:\n${todoList}`
						} catch (error) {
							console.error(`[TOOL] Error getting todos:`, error)
							return `❌ Failed to get tasks: ${error}`
						}
					},
				}),
			},
			onFinish: async (finishResult) => {
				console.log(`[API] AI response finished:`, {
					text: finishResult.text
				})
				
				// Store AI response
				await db.insert(stepSectionChats).values({
					sectionId: section.id,
					message: `AI: ${finishResult.text}`,
					createdAt: new Date(),
				})
			},
		})

		console.log(`[API] StreamText created successfully, returning response`)
		return result.toDataStreamResponse()
	} catch (error) {
		console.error(`[API] Error in streamText:`, error)
		return new Response(`Failed to process chat message: ${error}`, { status: 500 })
	}
}