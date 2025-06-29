"use client"

import { useChat } from "@ai-sdk/react"
import { 
	ArrowLeft, 
	CheckCircle2, 
	Circle, 
	MessageCircle, 
	Send, 
	Sparkles, 
	Target, 
	Trash2,
	Plus,
	Loader2 
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

type Idea = {
	id: number
	title: string
	description: string
	content: string
	isFinal: boolean
	projectId: number
}

type Step = {
	id: string
	title: string
	isDone: boolean
	order: number
}

interface StepsChatProps {
	projectId: number
	ideaId: string
	idea: Idea
}

export function StepsChat({ projectId, ideaId, idea }: StepsChatProps) {
	const [steps, setSteps] = useState<Step[]>([])
	const [loading, setLoading] = useState(true)
	const [showAddForm, setShowAddForm] = useState(false)
	const [newStepContent, setNewStepContent] = useState("")
	const [initialMessages, setInitialMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([])
	const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false)

	// Use the useChat hook for streaming AI chat
	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		isLoading: chatLoading,
		setMessages,
	} = useChat({
		api: "/api/steps/chat",
		initialMessages: initialMessages,
		body: {
			data: {
				ideaId: ideaId,
			},
		},
		onError: error => {
			toast.error("Failed to generate steps")
			console.error("Chat error:", error)
		},
		onFinish: (message) => {
			parseAndCreateSteps(message.content)
		},
	})

	// Fetch existing steps and chat history
	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch steps
				const stepsResponse = await fetch(`/api/steps?ideaId=${ideaId}`)
				if (stepsResponse.ok) {
					const stepsResult = await stepsResponse.json()
					setSteps(stepsResult.data || [])
				}

				// Fetch chat history
				const chatResponse = await fetch(`/api/steps/chat/history?ideaId=${ideaId}`)
				if (chatResponse.ok) {
					const chatResult = await chatResponse.json()
					setInitialMessages(chatResult.messages || [])
					setMessages(chatResult.messages || [])
					setChatHistoryLoaded(true)
				}
			} catch (error) {
				console.error("Error fetching data:", error)
			} finally {
				setLoading(false)
			}
		}
		
		if (ideaId) {
			fetchData()
		}
	}, [ideaId, setMessages])

	const parseAndCreateSteps = async (aiResponse: string) => {
		const stepLines = aiResponse
			.split("\n")
			.filter(line => line.trim().startsWith("-") || line.trim().match(/^\d+\./))
			.map(line => line.replace(/^[-\d.]\s*/, "").trim())
			.filter(line => line.length > 0)

		for (const stepContent of stepLines) {
			if (stepContent) {
				await createStep(stepContent)
			}
		}
	}

	const createStep = async (content: string) => {
		try {
			const response = await fetch("/api/steps", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ideaId: ideaId,
					content: content,
				}),
			})
			if (response.ok) {
				const result = await response.json()
				setSteps(prev => [...prev, result.data])
			}
		} catch (error) {
			console.error("Error creating step:", error)
		}
	}

	const addManualStep = async () => {
		if (!newStepContent.trim()) return
		await createStep(newStepContent)
		setNewStepContent("")
		setShowAddForm(false)
	}

	const deleteStep = async (stepId: string) => {
		try {
			const response = await fetch(`/api/steps/${stepId}`, {
				method: "DELETE",
			})
			if (response.ok) {
				setSteps(prev => prev.filter(s => s.id !== stepId))
			}
		} catch (error) {
			console.error("Error deleting step:", error)
		}
	}

	const toggleStepCompletion = async (stepId: string) => {
		const step = steps.find(s => s.id === stepId)
		if (!step) return

		const newStepStatus = !step.isDone

		// Optimistic update - update UI immediately
		setSteps(prev =>
			prev.map(s =>
				s.id === stepId ? { ...s, isDone: newStepStatus } : s
			)
		)

		try {
			const response = await fetch(`/api/steps/${stepId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					isDone: newStepStatus,
				}),
			})
			
			if (response.ok) {
				// After updating the step, check if we need to update section completion
				// Get all sections for this idea and update their completion based on step status
				const sectionsResponse = await fetch(`/api/step-sections?ideaId=${ideaId}`)
				if (sectionsResponse.ok) {
					const sectionsResult = await sectionsResponse.json()
					if (sectionsResult.success && sectionsResult.data.length > 0) {
						// Calculate if all steps are completed
						const updatedSteps = steps.map(s =>
							s.id === stepId ? { ...s, isDone: newStepStatus } : s
						)
						const allStepsCompleted = updatedSteps.length > 0 && updatedSteps.every(s => s.isDone)
						const anyStepIncomplete = updatedSteps.some(s => !s.isDone)

						// Update all sections based on step completion
						const sectionUpdatePromises = sectionsResult.data.map((section: { id: number; isCompleted: boolean }) => {
							// If all steps are done, mark section as complete
							// If any step is incomplete and section was complete, mark section as incomplete
							const shouldBeCompleted = allStepsCompleted
							const shouldBeIncomplete = anyStepIncomplete && section.isCompleted

							if (section.isCompleted !== shouldBeCompleted || shouldBeIncomplete) {
								return fetch(`/api/step-sections/${section.id}`, {
									method: "PATCH",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ isCompleted: shouldBeCompleted }),
								})
							}
							return Promise.resolve({ ok: true })
						})

						await Promise.allSettled(sectionUpdatePromises)
					}
				}
			} else {
				// Rollback on error
				setSteps(prev =>
					prev.map(s =>
						s.id === stepId ? { ...s, isDone: step.isDone } : s
					)
				)
				toast.error("Failed to update step")
			}
		} catch (error) {
			// Rollback on error
			setSteps(prev =>
				prev.map(s =>
					s.id === stepId ? { ...s, isDone: step.isDone } : s
				)
			)
			console.error("Error updating step:", error)
			toast.error("Failed to update step")
		}
	}

	const generateSteps = () => {
		const prompt = `Based on this project idea, generate 5-8 detailed implementation steps:
Title: ${idea.title}
Description: ${idea.description}
Content: ${idea.content}
Please provide actionable, specific steps that a development team can follow to implement this idea. Each step should be clear and focused on a particular aspect of the development process.`
		
		handleSubmit(new Event("submit") as unknown as React.FormEvent, {
			data: { ideaId, prompt }
		})
	}

	const completedSteps = steps.filter(step => step.isDone).length
	const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0

	if (loading) {
		return (
			<div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
				<div className="p-6 space-y-4">
					<div className="h-8 bg-muted animate-pulse rounded" />
					<div className="h-4 bg-muted animate-pulse rounded w-3/4" />
				</div>
				<div className="flex-1 p-6 space-y-4">
					{[1, 2, 3, 4].map(i => (
						<div key={i} className="h-16 bg-muted animate-pulse rounded" />
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-[calc(100vh-4rem)] bg-background">
			{/* Steps Sidebar */}
			<div className="w-full max-w-sm lg:w-96 border-r bg-muted/20 flex flex-col">
				{/* Header */}
				<div className="p-4 lg:p-6 border-b bg-background">
					<div className="flex items-center gap-3 mb-4">
						<Link href={`/project/${projectId}/idea/${ideaId}`}>
							<Button variant="ghost" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								<span className="hidden sm:inline">Back to Idea</span>
							</Button>
						</Link>
					</div>
					<div className="space-y-2">
						<h1 className="text-lg lg:text-xl font-bold flex items-center gap-3">
							<div className="p-2 bg-blue-100 rounded-lg">
								<Target className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
							</div>
							<span className="hidden sm:inline">Implementation Plan</span>
						</h1>
						<div className="space-y-1">
							<h2 className="font-medium text-foreground text-sm lg:text-base">{idea.title}</h2>
							<p className="text-xs lg:text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
						</div>
					</div>

					{/* Progress Overview */}
					{steps.length > 0 && (
						<div className="mt-4 p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
							<div className="flex items-center justify-between mb-2">
								<div>
									<div className="text-xs lg:text-sm font-semibold text-blue-900">Progress</div>
									<div className="text-xs text-blue-700">
										{completedSteps} of {steps.length} completed
									</div>
								</div>
								<div className="text-right">
									<div className="text-lg font-bold text-blue-900">
										{progressPercentage.toFixed(0)}%
									</div>
								</div>
							</div>
							<div className="w-full bg-blue-200 rounded-full h-1.5">
								<div 
									className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
									style={{ width: `${progressPercentage}%` }}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Steps List */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-3 lg:p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="font-medium text-xs lg:text-sm">
									Implementation Steps
									{steps.length > 0 && (
										<Badge variant="secondary" className="ml-2 text-xs">
											{steps.length}
										</Badge>
									)}
								</h3>
								<Button 
									variant="outline" 
									size="sm"
									onClick={() => setShowAddForm(!showAddForm)}
								>
									<Plus className="h-3 w-3 mr-1" />
									<span className="hidden sm:inline">Add</span>
								</Button>
							</div>

							{/* Add Step Form */}
							{showAddForm && (
								<Card className="bg-muted/30 border-dashed">
									<CardContent className="p-3 space-y-2">
										<Textarea
											value={newStepContent}
											onChange={(e) => setNewStepContent(e.target.value)}
											placeholder="Describe the step..."
											className="min-h-[60px] text-sm"
										/>
										<div className="flex gap-1">
											<Button 
												onClick={addManualStep} 
												disabled={!newStepContent.trim()}
												size="sm"
												className="text-xs h-7"
											>
												Add
											</Button>
											<Button 
												variant="ghost" 
												size="sm"
												className="text-xs h-7"
												onClick={() => {
													setShowAddForm(false)
													setNewStepContent("")
												}}
											>
												Cancel
											</Button>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Steps List */}
							{steps.length === 0 ? (
								<div className="text-center py-6 lg:py-8 space-y-3">
									<div className="p-3 bg-muted/50 rounded-full w-fit mx-auto">
										<Target className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground" />
									</div>
									<div className="space-y-1">
										<h4 className="font-medium text-sm">No steps yet</h4>
										<p className="text-xs text-muted-foreground">
											Generate steps with AI or add manually
										</p>
									</div>
								</div>
							) : (
								<div className="space-y-2">
									{steps.map((step, index) => (
										<div
											key={step.id}
											className={`group flex items-start gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg border transition-all hover:shadow-sm ${
												step.isDone 
													? 'bg-green-50/50 border-green-200' 
													: 'bg-background hover:bg-muted/30'
											}`}
										>
											<button
												onClick={() => toggleStepCompletion(step.id)}
												className="mt-0.5 hover:scale-110 transition-transform"
											>
												{step.isDone ? (
													<CheckCircle2 className="h-4 w-4 text-green-600" />
												) : (
													<Circle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
												)}
											</button>
											
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<Badge variant="outline" className="text-xs font-mono px-1">
														{(index + 1).toString().padStart(2, '0')}
													</Badge>
													{step.isDone && (
														<Badge className="text-xs bg-green-600 hover:bg-green-700 px-1">
															Done
														</Badge>
													)}
												</div>
												<p className={`text-xs leading-relaxed ${
													step.isDone 
														? "line-through text-muted-foreground" 
														: "text-foreground"
												}`}>
													{step.title}
												</p>
											</div>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => deleteStep(step.id)}
												className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</ScrollArea>
				</div>
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Chat Header */}
				<div className="p-4 lg:p-6 border-b bg-background">
					<div className="flex items-start gap-4">
						<div className="p-2 bg-primary/10 rounded-lg">
							<MessageCircle className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<h1 className="text-lg lg:text-xl font-semibold">Steps Planning Assistant</h1>
							<p className="text-muted-foreground mt-1 text-sm lg:text-base">
								Generate implementation steps, ask for guidance, or refine your development plan
							</p>
						</div>
					</div>
				</div>

				{/* Chat Messages */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full p-4 lg:p-6">
						{!chatHistoryLoaded ? (
							<div className="flex items-center justify-center h-full">
								<div className="flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									<span className="text-sm text-muted-foreground">Loading chat history...</span>
								</div>
							</div>
						) : messages.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center space-y-4">
								<div className="p-4 bg-muted/30 rounded-full">
									<Target className="h-8 w-8 text-muted-foreground" />
								</div>
								<div className="space-y-2 max-w-md">
									<h3 className="text-lg font-medium">
										Ready to plan your implementation?
									</h3>
									<p className="text-muted-foreground text-sm lg:text-base">
										Get started by generating AI-powered implementation steps or ask specific questions about your development approach.
									</p>
								</div>
						{steps.length === 0 && (
							<Button onClick={generateSteps} disabled={chatLoading || !chatHistoryLoaded}>
								{chatLoading ? (
									<>
										<Sparkles className="h-4 w-4 mr-2 animate-spin" />
										Generating...
									</>
								) : (
									<>
										<Sparkles className="h-4 w-4 mr-2" />
										Generate Implementation Steps
									</>
								)}
							</Button>
						)}							</div>
						) : (
							<div className="space-y-4 max-w-4xl">
								{messages.map((message, index) => (
									<div
										key={index}
										className={`flex ${
											message.role === "user" ? "justify-end" : "justify-start"
										}`}
									>
										<div
											className={`max-w-[85%] lg:max-w-[80%] p-3 lg:p-4 rounded-lg ${
												message.role === "user"
													? "bg-primary text-primary-foreground"
													: "bg-muted"
											}`}
										>
											<p className="text-sm leading-relaxed whitespace-pre-wrap">
												{message.content}
											</p>
										</div>
									</div>
								))}
								{chatLoading && (
									<div className="flex justify-start">
										<div className="bg-muted p-3 lg:p-4 rounded-lg">
											<div className="flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin" />
												<span className="text-sm text-muted-foreground">
													AI is planning...
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
						)}
					</ScrollArea>
				</div>

				{/* Chat Input */}
				<div className="p-4 lg:p-6 border-t bg-background">
					<form onSubmit={handleSubmit} className="flex gap-3">
						<Textarea
							value={input}
							onChange={handleInputChange}
							placeholder="e.g., 'Generate implementation steps' or 'How should I structure the database?'"
							className="flex-1 min-h-[60px] max-h-32 resize-none text-sm lg:text-base"
							disabled={!chatHistoryLoaded}
							onKeyDown={e => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault()
									handleSubmit(e)
								}
							}}
						/>
						<Button
							type="submit"
							disabled={chatLoading || !input.trim() || !chatHistoryLoaded}
							size="lg"
							className="h-[60px] px-4 lg:px-6"
						>
							{chatLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</Button>
					</form>
				</div>
			</div>
		</div>
	)
}
