"use client"

import {
	ArrowRight,
	Check,
	Lightbulb,
	Loader2,
	Sparkles,
	Trash2,
	X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

type Idea = {
	id: number
	title: string
	description: string
	content: string
	isFinal: boolean
	projectId: number
	// Extended properties from AI generation
	techStack?: string[]
	difficulty?: string
	timeEstimate?: string
	targetAudience?: string
}

type IdeaGeneratorProps = {
	projectId: number
}

export function IdeaGenerator({ projectId }: IdeaGeneratorProps) {
	const router = useRouter()
	const [ideas, setIdeas] = useState<Idea[]>([])
	const [loading, setLoading] = useState(false)
	const [generating, setGenerating] = useState(false)

	const loadIdeas = useCallback(async () => {
		setLoading(true)
		try {
			const response = await fetch(`/api/ideas?projectId=${projectId}`)
			const result = await response.json()

			if (result.success) {
				setIdeas(result.data)
			} else {
				toast.error("Failed to load ideas")
			}
		} catch (error) {
			console.error("Error loading ideas:", error)
			toast.error("Failed to load ideas")
		} finally {
			setLoading(false)
		}
	}, [projectId])

	// Load existing ideas
	useEffect(() => {
		loadIdeas()
	}, [loadIdeas])

	const generateIdeas = async () => {
		setGenerating(true)
		try {
			const response = await fetch("/api/ideas/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectId }),
			})

			const result = await response.json()

			if (result.success) {
				// Prepend new ideas to existing ones
				setIdeas(prev => [...result.ideas, ...prev])

				// Trigger sidebar refresh
				window.dispatchEvent(new CustomEvent("sidebar-refresh"))

				toast.success("Generated 3 new ideas!")
			} else {
				toast.error(result.error || "Failed to generate ideas")
			}
		} catch (error) {
			console.error("Error generating ideas:", error)
			toast.error("Failed to generate ideas")
		} finally {
			setGenerating(false)
		}
	}

	const chooseIdea = async (ideaId: number) => {
		try {
			const response = await fetch("/api/ideas", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ideaId, action: "choose" }),
			})

			const result = await response.json()

			if (result.success) {
				// Update local state
				setIdeas(prev =>
					prev.map(idea => ({
						...idea,
						isFinal: idea.id === ideaId,
					})),
				)

				// Save selected idea to localStorage
				const selectedIdea = ideas.find(idea => idea.id === ideaId)
				if (selectedIdea) {
					localStorage.setItem(`selectedIdea_${projectId}`, ideaId.toString())
				}

				// Trigger sidebar refresh
				window.dispatchEvent(new CustomEvent("sidebar-refresh"))

				toast.success("Idea selected successfully!")
			} else {
				toast.error(result.error || "Failed to select idea")
			}
		} catch (error) {
			console.error("Error choosing idea:", error)
			toast.error("Failed to select idea")
		}
	}

	const unselectIdea = async (ideaId: number) => {
		try {
			const response = await fetch("/api/ideas", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ideaId, action: "unselect" }),
			})

			const result = await response.json()

			if (result.success) {
				// Update local state
				setIdeas(prev =>
					prev.map(idea => ({
						...idea,
						isFinal: false,
					})),
				)

				// Remove from localStorage
				localStorage.removeItem(`selectedIdea_${projectId}`)

				// Trigger sidebar refresh
				window.dispatchEvent(new CustomEvent("sidebar-refresh"))

				toast.success("Idea unselected successfully!")
			} else {
				toast.error(result.error || "Failed to unselect idea")
			}
		} catch (error) {
			console.error("Error unselecting idea:", error)
			toast.error("Failed to unselect idea")
		}
	}

	const deleteIdea = async (ideaId: number) => {
		try {
			const response = await fetch(`/api/ideas/${ideaId}`, {
				method: "DELETE",
			})

			const result = await response.json()

			if (result.success) {
				// Remove from local state
				setIdeas(prev => prev.filter(idea => idea.id !== ideaId))

				// Remove from localStorage if it was selected
				const selectedIdeaId = localStorage.getItem(`selectedIdea_${projectId}`)
				if (selectedIdeaId === ideaId.toString()) {
					localStorage.removeItem(`selectedIdea_${projectId}`)
				}

				// Trigger sidebar refresh
				window.dispatchEvent(new CustomEvent("sidebar-refresh"))

				toast.success("Idea deleted successfully!")
			} else {
				toast.error(result.error || "Failed to delete idea")
			}
		} catch (error) {
			console.error("Error deleting idea:", error)
			toast.error("Failed to delete idea")
		}
	}

	const parseTechStack = (content: string): string[] => {
		const techMatch = content.match(/\*\*Tech Stack:\*\* (.+?)(?:\n|$)/)
		return techMatch ? techMatch[1].split(", ") : []
	}

	const parseDifficulty = (content: string): string => {
		const diffMatch = content.match(/\*\*Difficulty:\*\* (.+?)(?:\n|$)/)
		return diffMatch ? diffMatch[1] : "Unknown"
	}

	const parseTimeEstimate = (content: string): string => {
		const timeMatch = content.match(/\*\*Time Estimate:\*\* (.+?)(?:\n|$)/)
		return timeMatch ? timeMatch[1] : "Unknown"
	}

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty.toLowerCase()) {
			case "easy":
			case "beginner":
				return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
			case "medium":
			case "intermediate":
				return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800"
			case "hard":
			case "advanced":
				return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800"
			default:
				return "bg-muted text-muted-foreground dark:bg-muted/50 dark:border-muted-foreground/20"
		}
	}

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto p-6 space-y-8">
				{/* Header Skeleton */}
				<div className="space-y-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96" />
					<Skeleton className="h-10 w-32" />
				</div>

				{/* Cards Skeleton */}
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{[1, 2, 3].map(i => (
						<Card key={i} className="h-80">
							<CardHeader className="space-y-3">
								<Skeleton className="h-6 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<div className="flex gap-2">
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-6 w-20" />
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<Skeleton className="h-16 w-full" />
								<Skeleton className="h-8 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-8">
			{/* Header Section */}
			<div className="space-y-6">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
							<div className="p-2 bg-primary/10 rounded-lg">
								<Lightbulb className="h-6 w-6 text-primary" />
							</div>
							Project Ideas
						</h1>
						<p className="text-lg text-muted-foreground max-w-2xl">
							AI-generated project ideas tailored to your project context and
							team expertise
						</p>
					</div>

					{/* Go to Steps button - only show if an idea is selected */}
					{ideas.some(idea => idea.isFinal) && (
						<Button
							onClick={() =>
								router.push(
									`/project/${projectId}/idea/${ideas.find(idea => idea.isFinal)?.id}/steps`,
								)
							}
							variant="secondary"
						>
							Go to Steps
							<ArrowRight />
						</Button>
					)}
				</div>

				<Button
					onClick={generateIdeas}
					disabled={generating}
					size="lg"
					className="h-12 px-6"
				>
					{generating ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
							Generating Ideas...
						</>
					) : (
						<>
							<Sparkles className="h-4 w-4 mr-2" />
							Generate New Ideas
						</>
					)}
				</Button>
			</div>

			{/* Content Section */}
			{ideas.length === 0 ? (
				<Card className="border-dashed border-2 bg-muted/20">
					<CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-6">
						<div className="p-4 bg-muted rounded-full">
							<Lightbulb className="h-12 w-12 text-muted-foreground" />
						</div>
						<div className="space-y-2">
							<h3 className="text-xl font-semibold">No Ideas Yet</h3>
							<p className="text-muted-foreground max-w-md">
								Generate AI-powered project ideas based on your project
								context and team skills to get started.
							</p>
						</div>
						<Button onClick={generateIdeas} disabled={generating} size="lg">
							{generating ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									Generating...
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4 mr-2" />
									Generate Ideas
								</>
							)}
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{ideas.map(idea => {
						const techStack = parseTechStack(idea.content)
						const difficulty = parseDifficulty(idea.content)
						const timeEstimate = parseTimeEstimate(idea.content)

						return (
							<Card
								key={idea.id}
								className={`relative flex flex-col transition-all duration-200 hover:shadow-md ${
									idea.isFinal
										? "ring-2 ring-green-500 border-green-200"
										: "hover:border-muted-foreground/20"
								}`}
							>
								{/* Delete button */}
								<div className="absolute top-2 right-2 z-20">
									<Button
										variant="ghost"
										size="sm"
										onClick={e => {
											e.stopPropagation()
											deleteIdea(idea.id)
										}}
										className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>

								{idea.isFinal && (
									<div className="absolute -top-2 -left-2 z-10">
										<div className="bg-green-500 dark:bg-green-700 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
											<Check className="h-3 w-3" />
											Selected
										</div>
									</div>
								)}

								<CardHeader
									className="space-y-4 grow cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg flex flex-col"
									onClick={() => {
										// Save idea to localStorage before navigating
										localStorage.setItem(
											`selectedIdea_${projectId}`,
											idea.id.toString(),
										)
										router.push(`/project/${projectId}/idea/${idea.id}`)
									}}
								>
									<div className="space-y-2">
										<CardTitle className="text-lg leading-tight">
											{idea.title}
										</CardTitle>
										<CardDescription className="text-sm leading-relaxed">
											{idea.description}
										</CardDescription>
									</div>

									<div className="grow" />

									<div className="flex gap-2 flex-wrap">
										<Badge
											variant="outline"
											className={getDifficultyColor(difficulty)}
										>
											{difficulty}
										</Badge>
										<Badge
											variant="outline"
											className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800"
										>
											{timeEstimate}
										</Badge>
									</div>
								</CardHeader>

								<CardContent className="space-y-4">
									{techStack.length > 0 && (
										<div className="space-y-2">
											<Separator />
											<div>
												<p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
													Tech Stack
												</p>
												<div className="flex gap-1 flex-wrap">
													{techStack.slice(0, 4).map((tech, index) => (
														<Badge
															key={index}
															variant="secondary"
															className="text-xs bg-muted/50 hover:bg-muted dark:bg-muted/30 dark:hover:bg-muted/60"
														>
															{tech.trim()}
														</Badge>
													))}
													{techStack.length > 4 && (
														<Badge
															variant="secondary"
															className="text-xs bg-muted/50 dark:bg-muted/30"
														>
															+{techStack.length - 4}
														</Badge>
													)}
												</div>
											</div>
										</div>
									)}

									<div className="flex gap-2 pt-2">
										{idea.isFinal ? (
											<Button
												variant="outline"
												size="sm"
												onClick={() => unselectIdea(idea.id)}
												className="w-full h-9 text-muted-foreground hover:text-destructive"
											>
												<X className="h-4 w-4 mr-2" />
												Unselect
											</Button>
										) : (
											<Button
												size="sm"
												onClick={() => chooseIdea(idea.id)}
												className="w-full h-9"
											>
												<Check className="h-4 w-4 mr-2" />
												Select
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>
			)}
		</div>
	)
}
