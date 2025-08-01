"use client"

import { CheckCircle2, Circle, Target, ArrowRight, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type Section = {
	id: number
	title: string
	description: string | null
	order: number
	isCompleted: boolean
	todos: Todo[]
}

type Todo = {
	id: number
	title: string
	description?: string
	isCompleted: boolean
	order: number
}

interface StepsDisplayProps {
	projectId: number
	selectedIdeaId?: number | null
}

export function StepsDisplay({ projectId, selectedIdeaId }: StepsDisplayProps) {
	const [sections, setSections] = useState<Section[]>([])
	const [loading, setLoading] = useState(true)
	const [hasIdea, setHasIdea] = useState(false)

	useEffect(() => {
		const loadSteps = async () => {
			if (!selectedIdeaId) {
				setLoading(false)
				setHasIdea(false)
				return
			}

			try {
				setHasIdea(true)
				
				// Load step sections for the finalized idea
				const response = await fetch(`/api/step-sections?ideaId=${selectedIdeaId}`)
				const result = await response.json()

				if (result.success) {
					setSections(result.data || [])
				} else {
					setSections([])
				}
			} catch (error) {
				console.error("Error loading steps:", error)
				toast.error("Failed to load implementation steps")
			} finally {
				setLoading(false)
			}
		}

		loadSteps()
	}, [selectedIdeaId])

	// Calculate progress
	const totalTodos = sections.reduce((acc, section) => acc + section.todos.length, 0)
	const completedTodos = sections.reduce(
		(acc, section) => acc + section.todos.filter(todo => todo.isCompleted).length,
		0
	)
	const completedSections = sections.filter(section => section.isCompleted).length
	const progressPercentage = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0

	if (loading) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Target className="h-5 w-5" />
						Implementation Steps
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-20">
						<p className="text-muted-foreground">Loading steps...</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="h-5 w-5" />
					Implementation Steps
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{!hasIdea ? (
					<>
						{/* No Idea Selected State */}
						<div className="text-center py-8">
							<div className="flex flex-col items-center gap-4">
								<div className="p-4 bg-muted/30 rounded-full">
									<Target className="h-8 w-8 text-muted-foreground" />
								</div>
								<div className="space-y-2">
									<h3 className="text-lg font-medium">No idea finalized yet</h3>
									<p className="text-muted-foreground max-w-md">
										Select and finalize a project idea first, then you can generate
										and manage implementation steps for your project.
									</p>
								</div>
								<div className="flex gap-3">
									<Link href={`/project/${projectId}/idea`}>
										<Button className="flex items-center gap-2">
											<MessageCircle className="h-4 w-4" />
											Go to Ideas
										</Button>
									</Link>
								</div>
							</div>
						</div>
					</>
				) : sections.length === 0 ? (
					<>
						{/* No Steps Generated State */}
						<div className="text-center py-8">
							<div className="flex flex-col items-center gap-4">
								<div className="p-4 bg-muted/30 rounded-full">
									<Target className="h-8 w-8 text-muted-foreground" />
								</div>
								<div className="space-y-2">
									<h3 className="text-lg font-medium">No implementation plan yet</h3>
									<p className="text-muted-foreground max-w-md">
										Generate an AI-powered implementation plan to break down your
										project into manageable steps and sections.
									</p>
								</div>
								<div className="flex gap-3">
									<Link href={`/project/${projectId}/idea/${selectedIdeaId}/steps`}>
										<Button className="flex items-center gap-2">
											<Target className="h-4 w-4" />
											Generate Steps
											<ArrowRight className="h-4 w-4" />
										</Button>
									</Link>
								</div>
							</div>
						</div>
					</>
				) : (
					<>
						{/* Steps Display */}
						<div className="space-y-4">
							{/* Progress Overview */}
							<div className="bg-muted/50 rounded p-4 border">
								<div className="flex items-center justify-between mb-3">
									<div>
										<div className="text-sm font-medium">
											{completedTodos} of {totalTodos} tasks completed
										</div>
										<div className="text-xs text-muted-foreground">
											{completedSections} of {sections.length} sections done
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

							<Separator />

							{/* Sections Overview */}
							<div className="space-y-3">
								<h4 className="font-medium">Implementation Sections</h4>
								<div className="space-y-2">
									{sections.slice(0, 3).map((section) => {
										const sectionProgress = section.todos.length > 0 
											? (section.todos.filter(todo => todo.isCompleted).length / section.todos.length) * 100 
											: 0

										return (
											<div
												key={section.id}
												className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
											>
												<div className="flex items-center gap-3">
													<div className="flex items-center">
														{section.isCompleted ? (
															<CheckCircle2 className="w-4 h-4 text-green-600" />
														) : (
															<Circle className="w-4 h-4 text-muted-foreground" />
														)}
													</div>
													<div className="flex-1">
														<p className="text-sm font-medium">{section.title}</p>
														{section.description && (
															<p className="text-xs text-muted-foreground">
																{section.description}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<span>
														{section.todos.filter(todo => todo.isCompleted).length}/
														{section.todos.length}
													</span>
													<div className="w-12 bg-muted rounded-full h-1">
														<div
															className="bg-primary h-1 rounded-full transition-all duration-300"
															style={{ width: `${sectionProgress}%` }}
														/>
													</div>
												</div>
											</div>
										)
									})}
									
									{sections.length > 3 && (
										<div className="text-center py-2">
											<p className="text-xs text-muted-foreground">
												+{sections.length - 3} more sections
											</p>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 pt-2">
							<Link href={`/project/${projectId}/idea/${selectedIdeaId}/steps`}>
								<Button className="flex items-center gap-2">
									<Target className="h-4 w-4" />
									Manage Steps
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
