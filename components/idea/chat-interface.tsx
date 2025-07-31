"use client"

import { useChat } from "@ai-sdk/react"
import {
	ArrowLeft,
	Check,
	ChevronDown,
	ChevronRight,
	Lightbulb,
	Loader2,
	MessageCircle,
	Send,
	Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
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

interface IdeaChatInterfaceProps {
	projectId: number
	selectedIdea: Idea
	allIdeas: Idea[]
	projectName: string
}

export function IdeaChatInterface({
	projectId,
	selectedIdea,
	allIdeas,
	projectName,
}: IdeaChatInterfaceProps) {
	const router = useRouter()
	const [ideasExpanded, setIdeasExpanded] = useState(true)

	// Use the useChat hook for streaming chat
	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		isLoading: chatLoading,
		setMessages,
	} = useChat({
		api: "/api/ideas/chat",
		body: {
			data: {
				ideaId: selectedIdea.id,
			},
		},
		onError: error => {
			toast.error("Failed to send message")
			console.error("Chat error:", error)
		},
	})

	// Reset chat when idea changes
	useEffect(() => {
		setMessages([])
	}, [setMessages])

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

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty.toLowerCase()) {
			case "easy":
			case "beginner":
				return "bg-green-50 text-green-700 border-green-200"
			case "medium":
			case "intermediate":
				return "bg-yellow-50 text-yellow-700 border-yellow-200"
			case "hard":
			case "advanced":
				return "bg-red-50 text-red-700 border-red-200"
			default:
				return "bg-muted text-muted-foreground"
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
				toast.success("Idea selected successfully!")
				// Refresh the page to update the UI
				router.refresh()
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
				toast.success("Idea unselected successfully!")
				// Refresh the page to update the UI
				router.refresh()
			} else {
				toast.error(result.error || "Failed to unselect idea")
			}
		} catch (error) {
			console.error("Error unselecting idea:", error)
			toast.error("Failed to unselect idea")
		}
	}

	return (
		<div className="flex h-screen bg-background">
			{/* Sidebar with Ideas */}
			<div className="w-80 border-r bg-muted/20 flex flex-col">
				{/* Header */}
				<div className="p-4 border-b bg-background">
					<div className="flex items-center gap-3 mb-3">
						<Link href={`/project/${projectId}`}>
							<Button variant="ghost" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Project
							</Button>
						</Link>
					</div>
					<h2 className="font-semibold text-lg">{projectName}</h2>
					<p className="text-sm text-muted-foreground">Project Ideas Chat</p>
				</div>

				{/* Ideas List */}
				<div className="flex-1 overflow-hidden">
					<Collapsible open={ideasExpanded} onOpenChange={setIdeasExpanded}>
						<CollapsibleTrigger asChild>
							<Button
								variant="ghost"
								className="w-full justify-between p-4 h-auto font-medium"
							>
								<div className="flex items-center gap-2">
									<Lightbulb className="h-4 w-4" />
									Generated Ideas ({allIdeas.length})
								</div>
								{ideasExpanded ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<ScrollArea className="h-[calc(100vh-200px)]">
								<div className="p-2 space-y-2">
									{allIdeas.map(idea => {
										const isSelected = idea.id === selectedIdea.id
										const difficulty = parseDifficulty(idea.content)
										const timeEstimate = parseTimeEstimate(idea.content)

										return (
											<Card
												key={idea.id}
												className={`cursor-pointer transition-all hover:shadow-sm ${
													isSelected
														? "ring-2 ring-primary bg-primary/5"
														: "hover:bg-muted/50"
												} ${
													idea.isFinal
														? "ring-2 ring-green-500 bg-green-50/50"
														: ""
												}`}
												onClick={() => {
													if (!isSelected) {
														router.push(`/project/${projectId}/${idea.id}`)
													}
												}}
											>
												<CardHeader className="p-3">
													<div className="flex items-start justify-between gap-2">
														<div className="flex-1 min-w-0">
															<CardTitle className="text-sm leading-tight truncate">
																{idea.title}
															</CardTitle>
															<CardDescription className="text-xs mt-1 line-clamp-2">
																{idea.description}
															</CardDescription>
														</div>
														{idea.isFinal && (
															<div className="flex-shrink-0">
																<div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
																	<Check className="h-3 w-3" />
																	Selected
																</div>
															</div>
														)}
													</div>

													<div className="flex gap-1 flex-wrap mt-2">
														<Badge
															variant="outline"
															className={`text-xs ${getDifficultyColor(difficulty)}`}
														>
															{difficulty}
														</Badge>
														<Badge
															variant="outline"
															className="text-xs bg-blue-50 text-blue-700 border-blue-200"
														>
															{timeEstimate}
														</Badge>
													</div>

													{idea.isFinal && isSelected ? (
														<Button
															size="sm"
															variant="outline"
															onClick={e => {
																e.stopPropagation()
																unselectIdea(idea.id)
															}}
															className="mt-2 h-7 text-xs text-muted-foreground hover:text-destructive"
														>
															<Check className="h-3 w-3 mr-1 rotate-45" />
															Unselect Idea
														</Button>
													) : (
														!idea.isFinal &&
														isSelected && (
															<Button
																size="sm"
																onClick={e => {
																	e.stopPropagation()
																	chooseIdea(idea.id)
																}}
																className="mt-2 h-7 text-xs"
															>
																<Check className="h-3 w-3 mr-1" />
																Select This Idea
															</Button>
														)
													)}
												</CardHeader>
											</Card>
										)
									})}
								</div>
							</ScrollArea>
						</CollapsibleContent>
					</Collapsible>
				</div>

				{/* Generate More Ideas Button */}
				<div className="p-4 border-t bg-background">
					<Link href={`/project/${projectId}`}>
						<Button variant="outline" className="w-full">
							<Sparkles className="h-4 w-4 mr-2" />
							Generate More Ideas
						</Button>
					</Link>
				</div>
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col">
				{/* Chat Header */}
				<div className="p-6 border-b bg-background">
					<div className="flex items-start gap-4">
						<div className="p-2 bg-primary/10 rounded-lg">
							<MessageCircle className="h-5 w-5 text-primary" />
						</div>
						<div className="flex-1">
							<h1 className="text-xl font-semibold">{selectedIdea.title}</h1>
							<p className="text-muted-foreground mt-1">
								{selectedIdea.description}
							</p>

							{/* Idea details */}
							<div className="mt-3 p-4 bg-muted/30 rounded-lg">
								<h4 className="font-medium mb-2">Project Details</h4>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{getMainContent(selectedIdea.content)}
								</p>

								{/* Tech Stack */}
								{parseTechStack(selectedIdea.content).length > 0 && (
									<div className="mt-3">
										<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
											Tech Stack
										</p>
										<div className="flex gap-1 flex-wrap">
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
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Chat Messages */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full p-6">
						{messages.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center space-y-4">
								<div className="p-4 bg-muted/30 rounded-full">
									<MessageCircle className="h-8 w-8 text-muted-foreground" />
								</div>
								<div className="space-y-2 max-w-md">
									<h3 className="text-lg font-medium">
										Start the conversation
									</h3>
									<p className="text-muted-foreground">
										Ask questions, suggest improvements, or discuss
										implementation details for this project idea.
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-4 max-w-4xl">
								{messages.map((message, index) => (
									<div
										key={`${message.role}-${index}-${message.content?.slice(0, 50)}`}
										className={`flex ${
											message.role === "user" ? "justify-end" : "justify-start"
										}`}
									>
										<div
											className={`max-w-[80%] p-4 rounded-lg ${
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
										<div className="bg-muted p-4 rounded-lg">
											<div className="flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin" />
												<span className="text-sm text-muted-foreground">
													AI is thinking...
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
				<div className="p-6 border-t bg-background">
					<form onSubmit={handleSubmit} className="flex gap-3">
						<Textarea
							value={input}
							onChange={handleInputChange}
							placeholder="Ask questions, suggest improvements, or discuss implementation details..."
							className="flex-1 min-h-[60px] max-h-32 resize-none"
							onKeyDown={e => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault()
									handleSubmit(e)
								}
							}}
						/>
						<Button
							type="submit"
							disabled={chatLoading || !input.trim()}
							size="lg"
							className="h-[60px] px-6"
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
