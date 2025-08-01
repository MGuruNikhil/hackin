import { format } from "date-fns"
import Link from "next/link"
import { getProjectWithTeam } from "@/app/actions/project"
import { DeleteProjectButton } from "@/components/project/delete-project-button"
import { ProjectIdeaAndSteps } from "@/components/project/project-idea-and-steps"
import TeamManagement from "@/components/project/team-management"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getCurrentSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function ProjectPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params

	const projectId = Number.parseInt(id)

	// Get current user session
	const { user } = await getCurrentSession()
	if (!user) {
		return (
			<div className="flex flex-col min-h-[100dvh] p-5 items-center justify-center text-center">
				<p className="text-destructive text-lg font-medium leading-tight">
					Unauthorized access
				</p>
				<Link
					href="/home"
					className="mt-4 block w-full max-w-[200px] text-center text-sm font-medium text-primary underline-offset-4 hover:underline bg-secondary p-4 rounded-lg"
				>
					Return to homepage
				</Link>
			</div>
		)
	}

	if (Number.isNaN(projectId)) {
		return (
			<div className="flex flex-col min-h-[100dvh] p-5 items-center justify-center text-center">
				<p className="text-destructive text-lg font-medium leading-tight">
					Invalid project ID
				</p>
				<Link
					href="/home"
					className="mt-4 block w-full max-w-[200px] text-center text-sm font-medium text-primary underline-offset-4 hover:underline bg-secondary p-4 rounded-lg"
				>
					Return to homepage
				</Link>
			</div>
		)
	}

	const result = await getProjectWithTeam(projectId)

	if (!result.success) {
		return (
			<div className="flex flex-col min-h-[100dvh] p-5 items-center justify-center text-center">
				<p className="text-destructive text-lg font-medium leading-tight">
					{result.error}
				</p>
				<Link
					href="/home"
					className="mt-4 block w-full max-w-[200px] text-center text-sm font-medium text-primary underline-offset-4 hover:underline bg-secondary p-4 rounded-lg"
				>
					Return to homepage
				</Link>
			</div>
		)
	}

	const project = result.data
	if (!project) {
		return (
			<div className="flex flex-col min-h-[100dvh] p-5 items-center justify-center text-center">
				<p className="text-destructive text-lg font-medium leading-tight">
					Project not found
				</p>
				<Link
					href="/project"
					className="mt-4 block w-full max-w-[200px] text-center text-sm font-medium text-primary underline-offset-4 hover:underline bg-secondary p-4 rounded-lg"
				>
					Return to projects
				</Link>
			</div>
		)
	}

	// Check if current user is the project owner
	const isOwner = project.userId === user.id

	return (
		<div className="flex flex-col min-h-[100dvh] p-4 w-full space-y-6">
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="text-3xl font-bold text-center">
						{project.hackathonName}
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="flex flex-col space-y-2">
						<p className="text-sm text-muted-foreground">Theme</p>
						<p className="text-lg font-medium">
							{project.theme || "Not specified"}
						</p>
					</div>

					<Separator />

					<div className="flex flex-col space-y-2">
						<p className="text-sm text-muted-foreground">
							Tools & Technologies
						</p>
						<div className="flex flex-wrap gap-2">
							{project.suggestedTech ? (
								project.suggestedTech.split(",").map((tech: string) => (
									<Badge
										key={tech.trim()}
										variant="outline"
										className="text-sm"
									>
										{tech.trim()}
									</Badge>
								))
							) : (
								<p className="text-muted-foreground">No tools specified</p>
							)}
						</div>
					</div>

					<Separator />

					<div className="flex flex-col space-y-2">
						<p className="text-sm text-muted-foreground">Submission Time</p>
						<p className="text-lg font-medium">
							{project.submissionTime
								? format(
										new Date(project.submissionTime),
										"MMMM d, yyyy 'at' h:mm a",
									)
								: "No deadline set"}
						</p>
					</div>

					{project.additionalData && (
						<>
							<Separator />
							<div className="flex flex-col space-y-2">
								<p className="text-sm text-muted-foreground">
									Additional Information
								</p>
								<p className="whitespace-pre-line">{project.additionalData}</p>
							</div>
						</>
					)}

					{/* Only show edit and delete buttons to project owner */}
					{isOwner && (
						<div className="pt-4 flex justify-center gap-3">
							<Button asChild variant="outline">
								<Link href={`/project/${project.id}/edit`}>Edit Project</Link>
							</Button>
							<DeleteProjectButton
								projectId={project.id}
								projectName={project.hackathonName}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Team Management Section */}
			<TeamManagement
				projectId={project.id}
				team={project.team}
				isOwner={isOwner}
			/>

			{/* Project Idea and Steps Sections */}
			<ProjectIdeaAndSteps projectId={project.id} />
		</div>
	)
}
