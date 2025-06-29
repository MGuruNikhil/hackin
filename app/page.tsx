"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit(e as unknown as React.FormEvent)
		}
	}

	return (
		<main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pt-6 pb-12">
			<div className="w-full text-center mb-4">
				<h2 className="text-5xl md:text-7xl font-bold text-primary">BuildFast</h2>
				<p className="mt-2 text-muted-foreground">Turn your ideas into reality</p>
			</div>

			<div className="text-center max-w-3xl mx-auto mb-8">
				<p className="text-muted-foreground text-md md:text-lg">
					Tell us what you want to build and we&apos;ll guide you through every step
				</p>
			</div>
			<form onSubmit={handleSubmit} className="max-w-2xl w-full space-y-4">
				<div className="w-full">
					<textarea
						placeholder="Type the Idea u want to Develop"
						className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary max-h-[18rem] min-h-[6rem]"
						value={projectIdea}
						onChange={(e) => {
							setProjectIdea(e.target.value);
							// Auto-resize the textarea
							e.target.style.height = 'auto';
							e.target.style.height = `${Math.min(e.target.scrollHeight, 320)}px`; // 320px = 20rem
						}}
						style={{ overflow: 'auto' }}
						onFocus={(e) => {
							e.target.style.height = 'auto';
							e.target.style.height = `${Math.min(e.target.scrollHeight, 320)}px`;
						}}
						onKeyDown={handleKeyDown}
					/>
				</div>
				<p className="text-sm text-center text-muted-foreground">
					{isLoading ? "Processing..." : "AI-powered guidance • Step-by-step planning • Built for developers"}
				</p>
			</form>
			<div className="mt-12 text-center">
				<p className="text-muted-foreground mb-4">You Know Why Your Here ?</p>
				<div className="flex flex-wrap justify-center gap-6">
					<Link href="/templates" className="text-primary hover:underline">
						Hackathon Project
					</Link>
					<Link href="/docs" className="text-primary hover:underline">
						Have an idea in mind ?
					</Link>
					<Link href="/examples" className="text-primary hover:underline">
						Projects For Resume
					</Link>
				</div>
			</div>
		</main>
	)
}
