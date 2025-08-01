"use client"

import {
	ArrowLeft,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Circle,
	MessageSquare,
	Target,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { GenericChat } from "@/components/ui/generic-chat"

type Todo = {
	id: number
	title: string
	description?: string
	isCompleted: boolean
	order: number
	createdAt: string
}

type Section = {
	id: number
	title: string
	description: string | null
	order: number
	isCompleted: boolean
	ideaId: number
	createdAt: Date
}

type Idea = {
	id: number
	title: string
	description: string
	content: string
	isFinal: boolean
	projectId: number
}

type SectionChatProps = {
	projectId: number
	ideaId: string
	sectionId: string
	idea: Idea
	section: Section
}

export function SectionChat({
	projectId,
	ideaId,
	sectionId,
	idea,
	section,
}: SectionChatProps) {
	const [todos, setTodos] = useState<Todo[]>([])
	const [sectionState, setSectionState] = useState<Section>(section)
	const [loading, setLoading] = useState(false)
	const [detailsExpanded, setDetailsExpanded] = useState(true)

	const loadTodos = useCallback(async () => {
		setLoading(true)
		try {
			const response = await fetch(`/api/step-todos?sectionId=${sectionId}`)
			const result = await response.json()

			if (result.success) {
				setTodos(result.data)
			} else {
				toast.error("Failed to load todos")
			}
		} catch (error) {
			console.error("Error loading todos:", error)
			toast.error("Failed to load todos")
		} finally {
			setLoading(false)
		}
	}, [sectionId])

	// Load existing todos
	useEffect(() => {
		loadTodos()
	}, [loadTodos])

	const toggleTodoCompletion = async (todoId: number) => {
		const todo = todos.find(t => t.id === todoId)
		if (!todo) return

		const newTodoStatus = !todo.isCompleted

		// Calculate what the section status should be after this todo change
		const updatedTodos = todos.map(t =>
			t.id === todoId ? { ...t, isCompleted: newTodoStatus } : t,
		)
		const allTodosCompleted =
			updatedTodos.length > 0 && updatedTodos.every(t => t.isCompleted)

		// If section is currently completed and we're unchecking a todo, section should become incomplete
		const newSectionStatus =
			sectionState.isCompleted && !newTodoStatus ? false : allTodosCompleted

		// Optimistic update - update UI immediately
		setTodos(prev =>
			prev.map(t =>
				t.id === todoId ? { ...t, isCompleted: newTodoStatus } : t,
			),
		)
		setSectionState(prev => ({ ...prev, isCompleted: newSectionStatus }))

		try {
			// Update the todo
			const todoResponse = await fetch(`/api/step-todos/${todoId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isCompleted: newTodoStatus }),
			})

			if (!todoResponse.ok) {
				throw new Error("Failed to update todo")
			}

			// Update section completion if it changed
			if (newSectionStatus !== sectionState.isCompleted) {
				const sectionResponse = await fetch(`/api/step-sections/${sectionId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isCompleted: newSectionStatus }),
				})

				if (!sectionResponse.ok) {
					console.warn("Failed to update section completion status")
					// Don't throw error here, todo update was successful
				}
			}
		} catch (error) {
			// Rollback on error
			setTodos(prev =>
				prev.map(t =>
					t.id === todoId ? { ...t, isCompleted: todo.isCompleted } : t,
				),
			)
			setSectionState(prev => ({
				...prev,
				isCompleted: sectionState.isCompleted,
			}))
			console.error("Error updating todo:", error)
			toast.error("Failed to update task")
		}
	}

	const toggleSectionCompletion = async () => {
		const newCompletionStatus = !sectionState.isCompleted

		// Optimistic update - update UI immediately
		setSectionState(prev => ({ ...prev, isCompleted: newCompletionStatus }))
		setTodos(prev =>
			prev.map(todo => ({ ...todo, isCompleted: newCompletionStatus })),
		)

		try {
			// Update section completion status
			const sectionResponse = await fetch(`/api/step-sections/${sectionId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isCompleted: newCompletionStatus }),
			})

			if (!sectionResponse.ok) {
				throw new Error("Failed to update section")
			}

			// Update all todos in this section
			const todoUpdatePromises = todos.map(todo =>
				fetch(`/api/step-todos/${todo.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isCompleted: newCompletionStatus }),
				}),
			)

			// Also update any related individual steps for this idea
			const stepsResponse = await fetch(`/api/steps?ideaId=${ideaId}`)
			if (stepsResponse.ok) {
				const stepsResult = await stepsResponse.json()
				if (stepsResult.success && stepsResult.data.length > 0) {
					const stepUpdatePromises = stepsResult.data.map(
						(step: { id: number }) =>
							fetch(`/api/steps/${step.id}`, {
								method: "PATCH",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ isDone: newCompletionStatus }),
							}),
					)
					await Promise.allSettled(stepUpdatePromises)
				}
			}

			const todoResults = await Promise.allSettled(todoUpdatePromises)

			// Check if any todo updates failed
			const failedUpdates = todoResults.filter(
				result => result.status === "rejected",
			)
			if (failedUpdates.length > 0) {
				console.warn(`${failedUpdates.length} todo updates failed`)
				toast.error("Some tasks could not be updated")
			}
		} catch (error) {
			// Rollback on error
			setSectionState(prev => ({
				...prev,
				isCompleted: sectionState.isCompleted,
			}))
			setTodos(prev =>
				prev.map((todo, index) => ({
					...todo,
					isCompleted: todos[index]?.isCompleted || false,
				})),
			)
			console.error("Error updating section:", error)
			toast.error("Failed to update section")
		}
	}

	// Calculate progress
	const completedTodos = todos.filter(todo => todo.isCompleted).length
	const progressPercentage =
		todos.length > 0 ? (completedTodos / todos.length) * 100 : 0

	// Chat configuration
	const chatConfig = {
		apiEndpoint: `/api/step-sections/${sectionId}/chat`,
		messagesEndpoint: `/api/step-sections/${sectionId}/chat/history`,
		chatData: {
			sectionId: sectionId,
			ideaId: ideaId,
		},
		placeholder:
			"Ask about this section, request tasks, or discuss implementation details...",
		emptyStateTitle: "Ready to discuss this section?",
		emptyStateDescription:
			"Ask questions about implementation details, get guidance, or request specific tasks.",
		loadingText: "Loading section chat...",
	}

	if (loading) {
		return (
			<div className="space-y-6 p-4">
				<div className="space-y-4">
					<div className="h-8 bg-muted rounded w-64 animate-pulse" />
					<div className="h-4 bg-muted rounded w-96 animate-pulse" />
				</div>
				<div className="space-y-4">
					{[1, 2, 3].map(i => (
						<div key={i} className="h-16 bg-muted rounded animate-pulse" />
					))}
				</div>
			</div>
		)
	}
	return (
		<div className="h-full flex flex-col bg-background">
			{/* Navigation */}
			<div className="sticky top-0 z-20 p-4 border-b bg-background">
				<Link
					href={`/project/${projectId}/idea/${ideaId}/steps`}
					className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4 mr-1" />
					Back to Implementation Plan
				</Link>
			</div>

			{/* Header */}
			<div className="p-6 border-b bg-background">
				<div className="flex items-start gap-4">
					<div className="p-2 bg-primary/10 rounded-lg">
						<Target className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<div className="flex items-center justify-between">
							<h1 className="text-xl font-semibold">{sectionState.title}</h1>
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									{sectionState.isCompleted ? "Completed" : "Mark as complete"}
								</span>
								<button
									type="button"
									onClick={toggleSectionCompletion}
									className="hover:scale-105 transition-transform"
								>
									{sectionState.isCompleted ? (
										<CheckCircle2 className="w-6 h-6 text-green-600" />
									) : (
										<Circle className="w-6 h-6 text-muted-foreground" />
									)}
								</button>
							</div>
						</div>
						{sectionState.description && (
							<p className="text-muted-foreground mt-1">
								{sectionState.description}
							</p>
						)}
						<p className="text-sm text-muted-foreground mt-1">
							From: <span className="font-medium">{idea.title}</span>
						</p>

						{/* Section details */}
						<div className="mt-3 p-4 bg-muted/30 rounded-lg">
							<Collapsible
								open={detailsExpanded}
								onOpenChange={setDetailsExpanded}
							>
								<CollapsibleTrigger className="w-full">
									<div className="flex items-center justify-between hover:bg-muted/50 rounded p-2 -m-2">
										<h4 className="font-medium text-left">
											Section Details ({todos.length} tasks)
										</h4>
										{detailsExpanded ? (
											<ChevronDown className="h-4 w-4" />
										) : (
											<ChevronRight className="h-4 w-4" />
										)}
									</div>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className="mt-3 space-y-4">
										{/* Progress Overview */}
										{todos.length > 0 && (
											<div>
												<div className="flex items-center justify-between mb-3">
													<div>
														<div className="text-sm font-medium">
															{completedTodos} of {todos.length} tasks completed
														</div>
													</div>
													<div className="text-lg font-bold">
														{progressPercentage.toFixed(0)}%
													</div>
												</div>
												<div className="w-full bg-muted rounded-full h-2">
													<div
														className="bg-primary h-2 rounded-full transition-all duration-300"
														style={{ width: `${progressPercentage}%` }}
													/>
												</div>
											</div>
										)}

										{/* Tasks */}
										<div>
											<h5 className="font-medium mb-3">Tasks</h5>
											{todos.length === 0 ? (
												<div className="text-center py-8">
													<div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
														<MessageSquare className="w-6 h-6 text-muted-foreground" />
													</div>
													<h6 className="font-medium mb-2">No tasks yet</h6>
													<p className="text-sm text-muted-foreground">
														Use the chat below to generate tasks for this
														section
													</p>
												</div>
											) : (
												<div className="space-y-2">
													{todos.map(todo => (
														<div
															key={todo.id}
															className="flex items-start gap-3 p-3 rounded border bg-background"
														>
															<button
																type="button"
																onClick={() => toggleTodoCompletion(todo.id)}
																className="mt-0.5"
															>
																{todo.isCompleted ? (
																	<CheckCircle2 className="w-4 h-4 text-green-600" />
																) : (
																	<Circle className="w-4 h-4 text-muted-foreground" />
																)}
															</button>

															<div className="flex-1 min-w-0">
																<p
																	className={`text-sm ${
																		todo.isCompleted
																			? "line-through text-muted-foreground"
																			: "text-foreground"
																	}`}
																>
																	{todo.title}
																</p>
																{todo.description && (
																	<p className="text-xs text-muted-foreground mt-1">
																		{todo.description}
																	</p>
																)}
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>
				</div>
			</div>

			{/* Chat Interface */}
			<div className="flex-1 flex flex-col min-h-0">
				<div className="p-6 flex-1 flex flex-col min-h-0">
					<GenericChat config={chatConfig} className="h-full" />
				</div>
			</div>
		</div>
	)
}
