"use client"

import {
	ArrowLeft,
	CheckCircle2,
	Circle,
	MessageSquare,
	Target,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { GenericChat } from "@/components/ui/generic-chat"
import { toast } from "sonner"

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

export function SectionChat({ projectId, ideaId, sectionId, idea, section }: SectionChatProps) {
	const [todos, setTodos] = useState<Todo[]>([])
	const [sectionState, setSectionState] = useState<Section>(section)
	const [loading, setLoading] = useState(false)

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
			t.id === todoId ? { ...t, isCompleted: newTodoStatus } : t
		)
		const allTodosCompleted = updatedTodos.length > 0 && updatedTodos.every(t => t.isCompleted)
		
		// If section is currently completed and we're unchecking a todo, section should become incomplete
		const newSectionStatus = sectionState.isCompleted && !newTodoStatus ? false : allTodosCompleted

		// Optimistic update - update UI immediately
		setTodos(prev => prev.map(t => 
			t.id === todoId ? { ...t, isCompleted: newTodoStatus } : t
		))
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
			setTodos(prev => prev.map(t => 
				t.id === todoId ? { ...t, isCompleted: todo.isCompleted } : t
			))
			setSectionState(prev => ({ ...prev, isCompleted: sectionState.isCompleted }))
			console.error("Error updating todo:", error)
			toast.error("Failed to update task")
		}
	}

	const toggleSectionCompletion = async () => {
		const newCompletionStatus = !sectionState.isCompleted

		// Optimistic update - update UI immediately
		setSectionState(prev => ({ ...prev, isCompleted: newCompletionStatus }))
		setTodos(prev => prev.map(todo => ({ ...todo, isCompleted: newCompletionStatus })))

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
				})
			)

			// Also update any related individual steps for this idea
			const stepsResponse = await fetch(`/api/steps?ideaId=${ideaId}`)
			if (stepsResponse.ok) {
				const stepsResult = await stepsResponse.json()
				if (stepsResult.success && stepsResult.data.length > 0) {
					const stepUpdatePromises = stepsResult.data.map((step: { id: number }) => 
						fetch(`/api/steps/${step.id}`, {
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ isDone: newCompletionStatus }),
						})
					)
					await Promise.allSettled(stepUpdatePromises)
				}
			}

			const todoResults = await Promise.allSettled(todoUpdatePromises)
			
			// Check if any todo updates failed
			const failedUpdates = todoResults.filter(result => result.status === 'rejected')
			if (failedUpdates.length > 0) {
				console.warn(`${failedUpdates.length} todo updates failed`)
				toast.error("Some tasks could not be updated")
			}

		} catch (error) {
			// Rollback on error
			setSectionState(prev => ({ ...prev, isCompleted: sectionState.isCompleted }))
			setTodos(prev => prev.map((todo, index) => ({ 
				...todo, 
				isCompleted: todos[index]?.isCompleted || false 
			})))
			console.error("Error updating section:", error)
			toast.error("Failed to update section")
		}
	}

	// Calculate progress
	const completedTodos = todos.filter(todo => todo.isCompleted).length
	const progressPercentage = todos.length > 0 ? (completedTodos / todos.length) * 100 : 0

	// Chat configuration
	const chatConfig = {
		apiEndpoint: `/api/step-sections/${sectionId}/chat`,
		messagesEndpoint: `/api/step-sections/${sectionId}/chat/history`,
		chatData: {
			sectionId: sectionId,
			ideaId: ideaId,
		},
		placeholder: "Ask about this section, discuss implementation details, or get guidance...",
		emptyStateTitle: "Ready to discuss this section?",
		emptyStateDescription: "Ask questions about implementation details, get guidance, or discuss approaches.",
		loadingText: "Loading section chat...",
	}

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="space-y-4">
					<div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
					<div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
				</div>
				<div className="space-y-4">
					{[1, 2, 3].map(i => (
						<div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
					))}
				</div>
			</div>
		)
	}
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-6">
				<div className="flex items-start justify-between">
					<div className="space-y-3">
						<Link 
							href={`/project/${projectId}/idea/${ideaId}/steps`}
							className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4 mr-1" />
							Back to Implementation Plan
						</Link>
					
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
									<Target className="w-5 h-5 text-muted-foreground" />
								</div>
								<h1 className="text-2xl font-semibold text-foreground">{sectionState.title}</h1>
							</div>
							<button
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
						<div className="space-y-1">
							{sectionState.description && (
								<p className="text-muted-foreground">{sectionState.description}</p>
							)}								<p className="text-sm text-muted-foreground">
									From: <span className="font-medium">{idea.title}</span>
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Progress Overview */}
				{todos.length > 0 && (
					<div className="bg-muted/50 rounded p-4 border">
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
			</div>

			{/* Tasks */}
			{todos.length === 0 ? (
				<div className="bg-muted/50 rounded p-12 text-center border">
					<div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
						<MessageSquare className="w-8 h-8 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-medium text-foreground mb-2">No tasks yet</h3>
					<p className="text-muted-foreground mb-6">
						Use the chat below to generate tasks for this section
					</p>
				</div>
			) : (
				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-foreground">
						Tasks ({todos.length})
					</h3>
					<div className="space-y-2">
						{todos.map((todo) => (
							<div
								key={todo.id}
								className="flex items-start gap-3 p-3 rounded border bg-muted/30"
							>
								<button
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
									<p className={`text-sm ${
										todo.isCompleted 
											? "line-through text-muted-foreground" 
											: "text-foreground"
									}`}>
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
				</div>
			)}

			{/* Chat Interface */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold text-foreground">Section Chat</h3>
				
				<div className="h-[500px]">
					<GenericChat config={chatConfig} />
				</div>
			</div>
		</div>
	)
}
