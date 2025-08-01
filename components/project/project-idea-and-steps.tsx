"use client"

import { useEffect, useState } from "react"
import { IdeaDisplay } from "./idea-display"
import { StepsDisplay } from "./steps-display"

type Idea = {
	id: number
	title: string
	description: string
	content: string
	isFinal: boolean
	projectId: number
}

interface ProjectIdeaAndStepsProps {
	projectId: number
}

export function ProjectIdeaAndSteps({ projectId }: ProjectIdeaAndStepsProps) {
	const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)

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
			}
		}

		loadSelectedIdea()

		// Listen for idea selection changes
		const handleIdeaChange = () => {
			loadSelectedIdea()
		}

		window.addEventListener("idea-selected", handleIdeaChange)
		window.addEventListener("idea-unselected", handleIdeaChange)

		return () => {
			window.removeEventListener("idea-selected", handleIdeaChange)
			window.removeEventListener("idea-unselected", handleIdeaChange)
		}
	}, [projectId])

	return (
		<>
			{/* Project Idea Section */}
			<IdeaDisplay projectId={projectId} />

			{/* Project Steps Section */}
			<StepsDisplay 
				projectId={projectId} 
				selectedIdeaId={selectedIdea?.id || null} 
			/>
		</>
	)
}
