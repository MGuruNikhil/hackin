"use client"

import { Lightbulb, MessageCircle, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type Idea = {
	id: number
	title: string
	description: string
	content: string
	isFinal: boolean
	projectId: number
}

interface IdeaDisplayProps {
	projectId: number
}

export function IdeaDisplay({ projectId }: IdeaDisplayProps) {
	const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const loadSelectedIdea = async () => {
			try {
				const response = await fetch(`/api/ideas?projectId=${projectId}`)
				const result = await response.json()

				if (result.success) {
					// Find the idea marked as final (selected)
					const finalIdea = result.data.find((idea: Idea) => idea.isFinal)
					setSelectedIdea(finalIdea || null)
				}
			} catch (error) {
				console.error("Error loading ideas:", error)
				toast.error("Failed to load project ideas")
			} finally {
				setLoading(false)
			}
		}

		loadSelectedIdea()
	}, [projectId])

	const unselectIdea = async () => {
		if (!selectedIdea) return

		try {
			const response = await fetch("/api/ideas", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ideaId: selectedIdea.id, action: "unselect" }),
			})

			const result = await response.json()

			if (result.success) {
				setSelectedIdea(null)
				toast.success("Idea unselected successfully!")
			} else {
				toast.error(result.error || "Failed to unselect idea")
			}
		} catch (error) {
			console.error("Error unselecting idea:", error)
			toast.error("Failed to unselect idea")
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

	const getMainContent = (content: string): string => {
		return content.split("\n\n**Tech Stack:**")[0]
	}

	const getDifficultyColor = (difficulty: string): string => {
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
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Lightbulb className="h-5 w-5" />
						Project Idea
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-20">
						<p className="text-muted-foreground">Loading idea...</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Lightbulb className="h-5 w-5" />
					Project Idea
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{selectedIdea ? (
					<>
						{/* Selected Idea Display */}
						<div className="space-y-4">
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<h3 className="text-xl font-semibold mb-2">
										{selectedIdea.title}
									</h3>
									<p className="text-muted-foreground mb-3">
										{selectedIdea.description}
									</p>
								</div>
								<Badge
									variant="outline"
									className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
								>
									Selected
								</Badge>
							</div>

							<Separator />

							<div className="space-y-3">
								<h4 className="font-medium">Project Details</h4>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{getMainContent(selectedIdea.content)}
								</p>
							</div>

							{/* Tech Stack */}
							{parseTechStack(selectedIdea.content).length > 0 && (
								<>
									<Separator />
									<div className="space-y-2">
										<p className="text-sm font-medium text-muted-foreground">
											Tech Stack
										</p>
										<div className="flex gap-2 flex-wrap">
											{parseTechStack(selectedIdea.content).map(tech => (
												<Badge
													key={tech.trim()}
													variant="secondary"
													className="text-xs"
												>
													{tech.trim()}
												</Badge>
											))}
										</div>
									</div>
								</>
							)}

							{/* Difficulty and Time */}
							<Separator />
							<div className="flex gap-4">
								<div className="flex flex-col space-y-1">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Difficulty
									</p>
									<Badge
										variant="outline"
										className={`text-xs ${getDifficultyColor(parseDifficulty(selectedIdea.content))}`}
									>
										{parseDifficulty(selectedIdea.content)}
									</Badge>
								</div>
								<div className="flex flex-col space-y-1">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Time Estimate
									</p>
									<Badge
										variant="outline"
										className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800"
									>
										{parseTimeEstimate(selectedIdea.content)}
									</Badge>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 pt-2">
							<Link href={`/project/${projectId}/idea/${selectedIdea.id}`}>
								<Button variant="outline" className="flex items-center gap-2">
									<MessageCircle className="h-4 w-4" />
									Discuss & Refine
								</Button>
							</Link>
							<Button
								variant="outline"
								className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
								onClick={unselectIdea}
							>
								<X className="h-4 w-4" />
								Unselect Idea
							</Button>
						</div>
					</>
				) : (
					<>
						{/* No Idea Selected State */}
						<div className="text-center py-8">
							<div className="flex flex-col items-center gap-4">
								<div className="p-4 bg-muted/30 rounded-full">
									<Lightbulb className="h-8 w-8 text-muted-foreground" />
								</div>
								<div className="space-y-2">
									<h3 className="text-lg font-medium">No idea selected yet</h3>
									<p className="text-muted-foreground max-w-md">
										Use the idea generator above to create project ideas, then
										discuss them with your team. Once you find the perfect fit,
										select it as your final idea.
									</p>
								</div>
								<div className="flex gap-3">
									<Link href={`/project/${projectId}/idea`}>
										<Button className="flex items-center gap-2">
											<MessageCircle className="h-4 w-4" />
											Start Discussion
										</Button>
									</Link>
								</div>
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
