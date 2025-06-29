import { Hammer, Plus, Users } from "lucide-react"
import Link from "next/link"
import { getUserProjects } from "@/app/actions/project"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

export default async function ProjectsPage() {
	const { data: projects = [] } = await getUserProjects()

	return (
		<div className="container mx-auto py-8 px-4 grow flex flex-col">
			{projects.length === 0 ? (
				<div className="flex flex-col items-center justify-center w-full grow gap-7 p-8 text-center">
					<h1 className="text-2xl md:text-4xl font-semibold text-center">
						Start Building Amazing Projects
					</h1>
					<p className="text-lg text-center text-muted-foreground max-w-2xl">
						Turn your ideas into reality with guided project
						management and AI powered assistance
					</p>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
						<Card className="transition-all hover:shadow-lg">
							<CardHeader className="flex flex-row items-center gap-4 space-y-0">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
									<Plus className="h-5 w-5" />
								</div>
								<CardTitle>Create</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-left">
									Document your projects with all the important
									details and track your progress.
								</CardDescription>
							</CardContent>
						</Card>
						<Card className="transition-all hover:shadow-lg">
							<CardHeader className="flex flex-row items-center gap-4 space-y-0">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
									<Hammer className="h-5 w-5" />
								</div>
								<CardTitle>Build</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-left">
									Follow guided steps to turn your idea into a working prototype
									with AI assistance.
								</CardDescription>
							</CardContent>
						</Card>
						<Card className="transition-all hover:shadow-lg">
							<CardHeader className="flex flex-row items-center gap-4 space-y-0">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
									<Users className="h-5 w-5" />
								</div>
								<CardTitle>Showcase</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-left">
									Show the beautiful shit you build to the world, they will love
									it.
								</CardDescription>
							</CardContent>
						</Card>
					</div>
					<Button asChild size="lg" className="mt-8">
						<Link href="/project/new" className="gap-2">
							<Plus className="h-5 w-5" />
							Create New Project
						</Link>
					</Button>
				</div>
			) : (
				<>
					<div className="flex justify-between items-center mb-8">
						<div className="flex flex-col gap-1">
							<h1 className="text-3xl font-bold tracking-tight">
								Your Projects
							</h1>
							<p className="text-muted-foreground">
								View and manage all your projects
							</p>
						</div>
						<Button asChild>
							<Link href="/project/new">
								<Plus className="mr-2 h-4 w-4" />
								New Project
							</Link>
						</Button>
					</div>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{projects.map(project => (
							<Card key={project.id} className="flex flex-col h-full">
								<CardHeader>
									<CardTitle className="truncate">
										{project.hackathonName}
									</CardTitle>
									<CardDescription className="line-clamp-2">
										{project.theme || "No theme specified"}
									</CardDescription>
								</CardHeader>
								<CardContent className="flex-1">
									<div className="space-y-2 text-sm">
										<div>
											<span className="font-medium">Tech Stack:</span>{" "}
											<span className="text-muted-foreground">
												{project.actualTech || "Not specified"}
											</span>
										</div>
										<div>
											<span className="font-medium">Submitted:</span>{" "}
											<span className="text-muted-foreground">
												{new Date(project.submissionTime).toLocaleDateString()}
											</span>
										</div>
									</div>
								</CardContent>
								<CardFooter>
									<Button asChild variant="outline" className="w-full">
										<Link href={`/project/${project.id}`}>View Project</Link>
									</Button>
								</CardFooter>
							</Card>
						))}
					</div>
				</>
			)}
		</div>
	)
}
