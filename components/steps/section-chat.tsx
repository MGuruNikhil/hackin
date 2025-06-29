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
import { toast } from "sonner"
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

export function SectionChat({ projectId, ideaId, sectionId, idea, section }: SectionChatProps) {
	const [todos, setTodos] = useState<Todo[]>([])
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

		try {
			const response = await fetch(`/api/step-todos/${todoId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isCompleted: !todo.isCompleted }),
			})

			if (response.ok) {
				setTodos(prev => prev.map(t => 
					t.id === todoId ? { ...t, isCompleted: !t.isCompleted } : t
				))
			}
		} catch (error) {
			console.error("Error updating todo:", error)
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
		placeholder: "Ask about this section, request tasks, or discuss implementation details...",
		emptyStateTitle: "Ready to discuss this section?",
		emptyStateDescription: "Ask questions about implementation details, get guidance, or request specific tasks.",
		loadingText: "Loading section chat...",
		onSuccess: () => {
			console.log(`[SECTION] Tool call successful, reloading todos`)
			// This will now only trigger when AI actually uses tools to modify data
			loadTodos()
		},
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
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
									<Target className="w-5 h-5 text-muted-foreground" />
								</div>
								<h1 className="text-2xl font-semibold text-foreground">{section.title}</h1>
							</div>
							<div className="space-y-1">
								{section.description && (
									<p className="text-muted-foreground">{section.description}</p>
								)}
								<p className="text-sm text-muted-foreground">
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
