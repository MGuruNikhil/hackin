"use client"

import { Lightbulb, MessageCircle, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
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

interface IdeaSelectionProps {
	projectId: number
}

export function IdeaSelection({ projectId }: IdeaSelectionProps) {
	const router = useRouter()
	const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
	const [loading, setLoading] = useState(false)

	// Load selected idea from localStorage on mount
	const loadIdea = useCallback(
		async (ideaId: number) => {
			setLoading(true)
			try {
				const response = await fetch(`/api/ideas/${ideaId}`)
				if (response.ok) {
					const idea = await response.json()
					setSelectedIdea(idea)
					localStorage.setItem(`selectedIdea_${projectId}`, idea.id.toString())
				}
			} catch (error) {
				console.error("Failed to load idea:", error)
			} finally {
				setLoading(false)
			}
		},
		[projectId],
	)

	useEffect(() => {
		const savedIdeaId = localStorage.getItem(`selectedIdea_${projectId}`)
		if (savedIdeaId) {
			loadIdea(Number.parseInt(savedIdeaId))
		}
	}, [projectId, loadIdea])

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

	const goToIdeaSelection = () => {
		router.push(`/project/${projectId}/idea`)
	}

	const discussIdea = () => {
		if (selectedIdea) {
			router.push(`/project/${projectId}/idea/${selectedIdea.id}`)
		}
	}

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
				localStorage.removeItem(`selectedIdea_${projectId}`)
				// Could show a toast here if needed
			} else {
				console.error("Failed to unselect idea:", result.error)
			}
		} catch (error) {
			console.error("Error unselecting idea:", error)
		}
	}

	if (loading) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Lightbulb className="h-5 w-5" />
						Selected Idea
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse space-y-4">
						<div className="h-4 bg-muted rounded w-3/4" />
						<div className="h-4 bg-muted rounded w-1/2" />
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!selectedIdea) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Lightbulb className="h-5 w-5" />
						Project Ideas
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground">
						No idea selected for this project. Generate and select an idea to
						start working on it.
					</p>
					<Button onClick={goToIdeaSelection} className="w-full">
						<Sparkles className="h-4 w-4 mr-2" />
						Generate & Select Ideas
					</Button>
				</CardContent>
			</Card>
		)
	}

	const techStack = parseTechStack(selectedIdea.content)
	const difficulty = parseDifficulty(selectedIdea.content)
	const timeEstimate = parseTimeEstimate(selectedIdea.content)

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Lightbulb className="h-5 w-5 text-yellow-500" />
						Selected Idea
					</CardTitle>
					<div className="flex items-center gap-2">
						{selectedIdea.isFinal && (
							<Badge
								variant="default"
								className="bg-green-600 dark:bg-green-800 dark:border-green-700"
							>
								Final Idea
							</Badge>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={unselectIdea}
							className="text-muted-foreground hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<h3 className="font-semibold text-lg mb-2">{selectedIdea.title}</h3>
					<p className="text-muted-foreground mb-4">
						{selectedIdea.description}
					</p>
				</div>

				{/* Idea Details */}
				<div className="space-y-3">
					{techStack.length > 0 && (
						<div>
							<p className="text-sm font-medium mb-2">Tech Stack:</p>
							<div className="flex flex-wrap gap-2">
								{techStack.map(tech => (
									<Badge key={tech} variant="secondary">
										{tech}
									</Badge>
								))}
							</div>
						</div>
					)}

					<div className="flex gap-4">
						<Badge variant="outline">
							<Sparkles className="h-3 w-3 mr-1" />
							{difficulty}
						</Badge>
						<Badge variant="outline">⏱️ {timeEstimate}</Badge>
					</div>
				</div>

				<Separator />

				<div className="flex gap-2">
					<Button onClick={discussIdea} className="flex-1">
						<MessageCircle className="h-4 w-4 mr-2" />
						Discuss Idea
					</Button>
					<Button variant="outline" onClick={goToIdeaSelection}>
						Change Idea
					</Button>
					<Button
						variant="outline"
						onClick={unselectIdea}
						className="text-muted-foreground hover:text-destructive"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
