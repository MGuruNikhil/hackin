"use client"

import {
	CheckCircle2,
	Circle,
	Loader2,
	Plus,
	Sparkles,
	Target,
	Trash2,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
	description?: string
	order: number
	isCompleted: boolean
	createdAt: string
	todos: Todo[]
}

type Idea = {
	id: number
	title: string
	description: string
	content: string
	isFinal: boolean
	projectId: number
}

type StepsGeneratorProps = {
	projectId: number
	ideaId: string
	idea: Idea
}

export function StepsGenerator({ projectId, ideaId, idea }: StepsGeneratorProps) {
	const [sections, setSections] = useState<Section[]>([])
	const [loading, setLoading] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [showAddSection, setShowAddSection] = useState(false)
	const [newSectionTitle, setNewSectionTitle] = useState("")
	const [newSectionDescription, setNewSectionDescription] = useState("")
	const [showAddTodo, setShowAddTodo] = useState<number | null>(null)
	const [newTodoTitle, setNewTodoTitle] = useState("")
	const [newTodoDescription, setNewTodoDescription] = useState("")

	const loadSections = useCallback(async () => {
		setLoading(true)
		try {
			const response = await fetch(`/api/step-sections?ideaId=${ideaId}`)
			const result = await response.json()

			if (result.success) {
				setSections(result.data)
			} else {
				toast.error("Failed to load implementation plan")
			}
		} catch (error) {
			console.error("Error loading sections:", error)
			toast.error("Failed to load implementation plan")
		} finally {
			setLoading(false)
		}
	}, [ideaId])

	// Load existing sections
	useEffect(() => {
		loadSections()
	}, [loadSections])

	const generateSections = async () => {
		setGenerating(true)
		try {
			const response = await fetch("/api/step-sections/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ideaId }),
			})

			const result = await response.json()

		if (result.success) {
			setSections(result.sections)
			toast.success("Generated implementation plan!")
			// Trigger sidebar refresh
			window.dispatchEvent(new CustomEvent("sidebar-refresh"))
		} else {
			toast.error(result.error || "Failed to generate implementation plan")
		}		} catch (error) {
			console.error("Error generating sections:", error)
			toast.error("Failed to generate implementation plan")
		} finally {
			setGenerating(false)
		}
	}

	const addSection = async () => {
		if (!newSectionTitle.trim()) return

		try {
			const response = await fetch("/api/step-sections", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ideaId,
					title: newSectionTitle,
					description: newSectionDescription,
				}),
			})

			const result = await response.json()

		if (result.success) {
			setSections(prev => [...prev, result.data])
			setNewSectionTitle("")
			setNewSectionDescription("")
			setShowAddSection(false)
			toast.success("Section added!")
			// Trigger sidebar refresh
			window.dispatchEvent(new CustomEvent("sidebar-refresh"))
		} else {
			toast.error("Failed to add section")
		}		} catch (error) {
			console.error("Error adding section:", error)
			toast.error("Failed to add section")
		}
	}

	const addTodo = async (sectionId: number) => {
		if (!newTodoTitle.trim()) return

		try {
			const response = await fetch("/api/step-todos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sectionId,
					title: newTodoTitle,
					description: newTodoDescription,
				}),
			})

			const result = await response.json()

			if (result.success) {
				setSections(prev => prev.map(section => 
					section.id === sectionId 
						? { ...section, todos: [...section.todos, result.data] }
						: section
				))
				setNewTodoTitle("")
				setNewTodoDescription("")
				setShowAddTodo(null)
				toast.success("Todo added!")
			} else {
				toast.error("Failed to add todo")
			}
		} catch (error) {
			console.error("Error adding todo:", error)
			toast.error("Failed to add todo")
		}
	}

	const toggleSectionCompletion = async (sectionId: number) => {
		const section = sections.find(s => s.id === sectionId)
		if (!section) return

		const newCompletionStatus = !section.isCompleted

		// Optimistic update - update UI immediately
		setSections(prev => prev.map(s => 
			s.id === sectionId 
				? { 
					...s, 
					isCompleted: newCompletionStatus,
					// Also update all todos in this section
					todos: s.todos.map(todo => ({ ...todo, isCompleted: newCompletionStatus }))
				} 
				: s
		))

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
			const todoUpdatePromises = section.todos.map(todo => 
				fetch(`/api/step-todos/${todo.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isCompleted: newCompletionStatus }),
				})
			)

			// Also update any related individual steps for this idea
			// We'll mark all steps for the idea as completed/incomplete when any section changes
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
			setSections(prev => prev.map(s => 
				s.id === sectionId 
					? { 
						...s, 
						isCompleted: section.isCompleted,
						todos: section.todos // Restore original todos
					} 
					: s
			))
			console.error("Error updating section:", error)
			toast.error("Failed to update section")
		}
	}

	const toggleTodoCompletion = async (todoId: number, sectionId: number) => {
		const section = sections.find(s => s.id === sectionId)
		const todo = section?.todos.find(t => t.id === todoId)
		if (!todo || !section) return

		const newTodoStatus = !todo.isCompleted
		
		// Calculate what the section status should be after this todo change
		const updatedTodos = section.todos.map(t => 
			t.id === todoId ? { ...t, isCompleted: newTodoStatus } : t
		)
		const allTodosCompleted = updatedTodos.length > 0 && updatedTodos.every(t => t.isCompleted)
		const shouldSectionBeCompleted = allTodosCompleted
		
		// If section is currently completed and we're unchecking a todo, section should become incomplete
		const newSectionStatus = section.isCompleted && !newTodoStatus ? false : shouldSectionBeCompleted

		// Optimistic update - update UI immediately
		setSections(prev => prev.map(section => ({
			...section,
			isCompleted: section.id === sectionId ? newSectionStatus : section.isCompleted,
			todos: section.todos.map(t => 
				t.id === todoId ? { ...t, isCompleted: newTodoStatus } : t
			)
		})))

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
			if (newSectionStatus !== section.isCompleted) {
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
			setSections(prev => prev.map(section => ({
				...section,
				isCompleted: section.id === sectionId ? section.isCompleted : section.isCompleted,
				todos: section.todos.map(t => 
					t.id === todoId ? { ...t, isCompleted: todo.isCompleted } : t
				)
			})))
			console.error("Error updating todo:", error)
			toast.error("Failed to update task")
		}
	}

	const deleteSection = async (sectionId: number) => {
		try {
			const response = await fetch(`/api/step-sections/${sectionId}`, {
				method: "DELETE",
			})

		if (response.ok) {
			setSections(prev => prev.filter(s => s.id !== sectionId))
			toast.success("Section deleted")
			// Trigger sidebar refresh
			window.dispatchEvent(new CustomEvent("sidebar-refresh"))
		}		} catch (error) {
			console.error("Error deleting section:", error)
			toast.error("Failed to delete section")
		}
	}

	const deleteTodo = async (todoId: number, sectionId: number) => {
		try {
			const response = await fetch(`/api/step-todos/${todoId}`, {
				method: "DELETE",
			})

			if (response.ok) {
				setSections(prev => prev.map(section => 
					section.id === sectionId 
						? { ...section, todos: section.todos.filter(t => t.id !== todoId) }
						: section
				))
				toast.success("Todo deleted")
			}
		} catch (error) {
			console.error("Error deleting todo:", error)
			toast.error("Failed to delete todo")
		}
	}

	// Calculate progress
	const totalTodos = sections.reduce((acc, section) => acc + section.todos.length, 0)
	const completedTodos = sections.reduce((acc, section) => 
		acc + section.todos.filter(todo => todo.isCompleted).length, 0
	)
	const progressPercentage = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0

	if (loading) {
		return (
			<div className="w-full space-y-6">
				<div className="space-y-4">
					<div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
					<div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
				</div>
				<div className="space-y-4">
					{[1, 2, 3].map(i => (
						<div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-5xl mx-auto p-6 space-y-8">
			{/* Header */}
			<div className="space-y-6">
				<div className="flex items-start justify-between">
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
								<Target className="w-5 h-5 text-muted-foreground" />
							</div>
							<h1 className="text-2xl font-semibold text-foreground">Implementation Plan</h1>
						</div>
						<div className="space-y-1">
							<h2 className="text-lg font-medium text-foreground">{idea.title}</h2>
							<p className="text-muted-foreground">{idea.description}</p>
						</div>
					</div>
					
					{sections.length === 0 && (
						<Button 
							onClick={generateSections} 
							disabled={generating}
						>
							{generating ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<Sparkles className="w-4 h-4 mr-2" />
									Generate Plan
								</>
							)}
						</Button>
					)}
				</div>

				{/* Progress Overview */}
				{sections.length > 0 && (
					<div className="bg-muted/50 rounded p-4 border">
						<div className="flex items-center justify-between mb-3">
							<div>
								<div className="text-sm font-medium">
									{completedTodos} of {totalTodos} tasks completed
								</div>
								<div className="text-xs text-muted-foreground">
									{sections.filter(s => s.isCompleted).length} of {sections.length} sections done
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

			{/* Sections */}
			{sections.length === 0 ? (
				<div className="bg-muted/50 rounded-lg p-12 text-center">
					<div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
						<Target className="w-8 h-8 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-medium text-foreground mb-2">No implementation plan yet</h3>
					<p className="text-muted-foreground mb-6">
						Generate an AI-powered implementation plan or create sections manually
					</p>
				</div>
			) : (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold text-foreground">
							Implementation Sections
							<span className="ml-2 text-sm font-normal text-muted-foreground">({sections.length})</span>
						</h3>
						<Button
							variant="outline"
							onClick={() => setShowAddSection(!showAddSection)}
						>
							<Plus className="w-4 h-4 mr-2" />
							Add Section
						</Button>
					</div>

					{/* Add Section Form */}
					{showAddSection && (
						<div className="bg-muted/50 rounded p-4 border border-dashed">
							<div className="space-y-3">
								<div>
									<Label htmlFor="section-title" className="text-sm font-medium">Section Title</Label>
									<Input
										id="section-title"
										value={newSectionTitle}
										onChange={(e) => setNewSectionTitle(e.target.value)}
										placeholder="e.g., Frontend Development"
										className="mt-1"
									/>
								</div>
								<div>
									<Label htmlFor="section-description" className="text-sm font-medium">Description (Optional)</Label>
									<Textarea
										id="section-description"
										value={newSectionDescription}
										onChange={(e) => setNewSectionDescription(e.target.value)}
										placeholder="Brief description of what this section covers"
										rows={2}
										className="mt-1"
									/>
								</div>
								<div className="flex gap-2">
									<Button 
										onClick={addSection} 
										disabled={!newSectionTitle.trim()}
									>
										Add Section
									</Button>
									<Button 
										variant="ghost"
										onClick={() => {
											setShowAddSection(false)
											setNewSectionTitle("")
											setNewSectionDescription("")
										}}
									>
										Cancel
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Sections List */}
					<Accordion type="multiple" className="space-y-2">
						{sections.map((section) => {
							const completedTodosInSection = section.todos.filter(t => t.isCompleted).length

							return (
								<AccordionItem 
									key={section.id} 
									value={section.id.toString()}
									className="border rounded-lg"
								>
								<AccordionTrigger className="px-4 py-3 hover:no-underline">
									<div className="flex items-center justify-between w-full">
										<div className="flex items-center gap-3">
											<button
												onClick={(e) => {
													e.stopPropagation()
													toggleSectionCompletion(section.id)
												}}
												className="hover:scale-105 transition-transform"
											>
												{section.isCompleted ? (
													<CheckCircle2 className="w-4 h-4 text-green-600" />
												) : (
													<Circle className="w-4 h-4 text-muted-foreground" />
												)}
											</button>
											
											<div className="text-left">
												<Link 
													href={`/project/${projectId}/idea/${ideaId}/steps/${section.id}`}
													className="text-sm font-medium text-foreground hover:text-primary"
													onClick={(e) => e.stopPropagation()}
												>
													{section.title}
												</Link>
											</div>
										</div>
										
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span>{completedTodosInSection}/{section.todos.length}</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation()
													deleteSection(section.id)
												}}
												className="h-6 w-6 p-0 hover:text-destructive"
											>
												<Trash2 className="w-3 h-3" />
											</Button>
										</div>
									</div>
								</AccordionTrigger>									
								<AccordionContent className="px-4 pb-4">
									<div className="space-y-2">
										{section.todos.map((todo) => (
											<div
												key={todo.id}
												className="flex items-start gap-3 p-3 rounded border bg-muted/30"
											>
												<button
													onClick={() => toggleTodoCompletion(todo.id, section.id)}
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

												<Button
													variant="ghost"
													size="sm"
													onClick={() => deleteTodo(todo.id, section.id)}
													className="h-6 w-6 p-0 opacity-50 hover:opacity-100 hover:text-destructive"
												>
													<Trash2 className="w-3 h-3" />
												</Button>
											</div>
										))}
										{/* Add Todo */}
										{showAddTodo === section.id ? (
											<div className="bg-muted/50 rounded p-3 border border-dashed">
												<div className="space-y-3">
													<Input
														value={newTodoTitle}
														onChange={(e) => setNewTodoTitle(e.target.value)}
														placeholder="Task title..."
														className="text-sm"
													/>
													<Textarea
														value={newTodoDescription}
														onChange={(e) => setNewTodoDescription(e.target.value)}
														placeholder="Description (optional)..."
														className="text-sm"
														rows={2}
													/>
													<div className="flex gap-2">
														<Button 
															onClick={() => addTodo(section.id)} 
															disabled={!newTodoTitle.trim()}
															size="sm"
														>
															Add
														</Button>
														<Button 
															variant="ghost" 
															size="sm"
															onClick={() => {
																setShowAddTodo(null)
																setNewTodoTitle("")
																setNewTodoDescription("")
															}}
														>
															Cancel
														</Button>
													</div>
												</div>
											</div>
										) : (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setShowAddTodo(section.id)}
												className="w-full border-dashed"
											>
												<Plus className="w-4 h-4 mr-2" />
												Add Task
											</Button>
										)}										</div>
									</AccordionContent>
								</AccordionItem>
							)
						})}
					</Accordion>
				</div>
			)}
		</div>
	)
}