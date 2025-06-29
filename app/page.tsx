"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function Index() {
	const [projectIdea, setProjectIdea] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!projectIdea.trim()) return

		setIsLoading(true)
		
		try {
			// Create a new project with the user's idea
			const response = await fetch("/api/new", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "New Project",
					description: projectIdea,
					hackathon_name: "Software Development Project",
					tech_stack: [],
					team_size: 1,
				}),
			})

			if (response.ok) {
				const project = await response.json()
				router.push(`/project/${project.id}`)
			}
		} catch (error) {
			console.error("Failed to create project:", error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-[100dvh] flex flex-col items-center justify-center p-8">
			<div className="w-full max-w-2xl space-y-8">
				<div className="text-center space-y-4">
					<h1 className="text-4xl md:text-6xl font-bold tracking-tight">
						Build it fast
					</h1>
					<p className="text-xl text-muted-foreground">
						Tell us what you want to build and we&apos;ll guide you through every step
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<Textarea
						placeholder="I want to build a web app that helps people track their daily habits..."
						value={projectIdea}
						onChange={(e) => setProjectIdea(e.target.value)}
						className="min-h-[120px] text-lg resize-none"
						disabled={isLoading}
					/>
					<Button
						type="submit"
						size="lg"
						disabled={!projectIdea.trim() || isLoading}
						className="w-full text-lg h-12"
					>
						{isLoading ? (
							"Creating your project..."
						) : (
							<>
								Start building
								<ArrowRight className="ml-2 h-5 w-5" />
							</>
						)}
					</Button>
				</form>

				<div className="text-center text-sm text-muted-foreground">
					AI-powered guidance • Step-by-step planning • Built for developers
				</div>
			</div>
		</div>
	)
}


