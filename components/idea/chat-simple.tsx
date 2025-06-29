"use client"

import {
	ArrowLeft,
	ArrowRight,
	Check,
	LightbulbIcon,
	Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/markdown/render"
import { GenericChat } from "@/components/ui/generic-chat"


type Idea = {
	id: number
	title: string
	description: string
	content: string
	isFinal: boolean
	projectId: number
}

interface IdeaChatSimpleProps {
	projectId: number
	selectedIdea: Idea
}

export function IdeaChatSimple({
	projectId,
	selectedIdea,
}: IdeaChatSimpleProps) {
	const router = useRouter()

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

	const techStack = parseTechStack(selectedIdea.content)
	const difficulty = parseDifficulty(selectedIdea.content)
	const timeEstimate = parseTimeEstimate(selectedIdea.content)

	const finalizeIdea = async () => {
		try {
			const response = await fetch("/api/ideas", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ideaId: selectedIdea.id, action: "choose" }),
			})

			const result = await response.json()

			if (result.success) {
				// Trigger sidebar refresh
				window.dispatchEvent(new CustomEvent("sidebar-refresh"))

				toast.success("Idea finalized successfully!")

				// Navigate to steps
				router.push(`/project/${projectId}/idea/${selectedIdea.id}/steps`)
			} else {
				toast.error(result.error || "Failed to finalize idea")
			}
		} catch (error) {
			console.error("Error finalizing idea:", error)
			toast.error(`Error finalizing idea: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}
	}

	const goToSteps = () => {
		router.push(`/project/${projectId}/idea/${selectedIdea.id}/steps`)
	}

	// Chat configuration
	const chatConfig = {
		apiEndpoint: "/api/ideas/chat",
		chatData: {
			ideaId: selectedIdea.id,
		},
		messagesEndpoint: `/api/ideas/${selectedIdea.id}/messages`,
		placeholder: "Discuss this idea...",
		emptyStateTitle: "Start discussing this idea",
		emptyStateDescription: "Ask questions, refine details, or explore implementation possibilities",
		loadingText: "Loading chat history...",
		onSuccess: () => {
			// Trigger sidebar refresh when chat generates updates
			window.dispatchEvent(new CustomEvent("sidebar-refresh"))
		},
	}
	return (
		<div className="flex flex-col bg-background">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sticky top-0 z-20 p-6 border-b bg-background gap-4">
				<div className="flex flex-col sm:flex-row sm:items-center gap-3">				<div className="flex items-center gap-3">
					<Link href={`/project/${projectId}/idea`}>
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							<span className="xs:inline">Back to Ideas</span>
						</Button>
					</Link>
				</div>
				</div>
				<div className="flex items-center gap-2">
					{selectedIdea.isFinal && (
						<Badge variant="default" className="bg-green-600 dark:bg-green-800 dark:border-green-700">
							<Check className="h-3 w-3 mr-1" />
							Final Idea
						</Badge>
					)}
					{selectedIdea.isFinal ? (
						<Button onClick={goToSteps} size="sm" variant="secondary">
							Go to Steps
							<ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					) : (
						<Button onClick={finalizeIdea} size="sm" variant="secondary">
							Finalize & Go to Steps
							<ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					)}
				</div>
			</div>
			<div className="p-6 border-b bg-background">

				<div className="space-y-4">
					<div>
						<h1 className="text-2xl font-bold flex items-center gap-2">
							<LightbulbIcon className="h-6 w-6 text-yellow-500" />
							<span className="truncate">{selectedIdea.title}</span>
						</h1>
						<p className="text-muted-foreground mt-2">
							{selectedIdea.description}
						</p>
					</div>

					{/* Full Content Display */}
					{selectedIdea.content && (
						<div className="bg-muted/30 rounded-lg p-4 border">
							<h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
								Detailed Content
							</h3>
							<div className="prose prose-sm max-w-none text-foreground">
								<Markdown>{selectedIdea.content}</Markdown>
							</div>
						</div>
					)}

					{/* Idea Details */}
					<div className="flex flex-wrap gap-4">
						{techStack.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{techStack.map((tech, index) => (
									<Badge key={index} variant="secondary">
										{tech}
									</Badge>
								))}
							</div>
						)}
						<Badge variant="outline">
							<Sparkles className="h-3 w-3 mr-1" />
							{difficulty}
						</Badge>
						<Badge variant="outline">⏱️ {timeEstimate}</Badge>
					</div>
				</div>
			</div>

			{/* Chat Interface */}
			<div className="flex-1 flex flex-col">
				<div className="p-6 flex-1">
					<GenericChat 
						config={chatConfig}
					/>
				</div>
			</div>
		</div>
	)
}
