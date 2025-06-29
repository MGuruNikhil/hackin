import { Bot, Brain, Compass, Github, Hammer, Users } from "lucide-react"
import Link from "next/link"
import LinkButton from "@/components/link/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Nav } from "@/components/user/nav"

const features = [
	{
		key: "smart-team-insights",
		title: "Smart Team Insights",
		description:
			"Hackin looks at your team's skills, goals, and time available to suggest a project that actually fits. No more blank stares on day one.",
		icon: <Users className="size-4 md:size-6" />,
	},
	{
		key: "idea-generation",
		title: "Idea Generation",
		description:
			"Not sure what to build? Hackin helps you figure it out. It suggests ideas based on who you are, what you know, and what the hackathon's about.",
		icon: <Brain className="size-4 md:size-6" />,
	},
	{
		key: "guided-building",
		title: "Guided Building",
		description:
			"Once you’ve picked an idea, Hackin breaks it down into steps. You’ll always know what to do next, and you can check off tasks as you go.",
		icon: <Hammer className="size-4 md:size-6" />,
	},
	{
		key: "contextual-ai-help",
		title: "Contextual AI Help",
		description:
			"If you're stuck, you can ask for help right in the step you're working on. Hackin understands what you’re building and gives useful, focused answers.",
		icon: <Bot className="size-4 md:size-6" />,
	},
	{
		key: "open-source",
		title: "Open Source, Built for Builders",
		description:
			"Hackin is open source so you can fork it, improve it, or even run your own version. It's made by hackers, for hackers.",
		icon: <Github className="size-4 md:size-6" />,
	},
	{
		key: "project-compass",
		title: "Project Compass",
		description:
			"Hackin keeps your project on track from start to finish. It's like having a technical mentor and a product manager rolled into one.",
		icon: <Compass className="size-4 md:size-6" />,
	},
]

export default async function Index() {
	return (
		<div className="min-h-[100dvh] flex flex-col relative">
			<Nav />
			<Hero />
			<div className="w-[80vw] max-w-[1500px] m-auto">
				<Separator />
			</div>
			<Features />
			<div className="w-[80vw] max-w-[1500px] m-auto">
				<Separator />
			</div>
			<PipelineFlowchart />
			<div className="w-[80vw] max-w-[1500px] m-auto">
				<Separator />
			</div>
			<Footer />
		</div>
	)
}

function Hero() {
	return (
		<div className="flex flex-col items-center justify-center w-full min-h-[80dvh] gap-7 p-8">
			<h1 className="text-2xl md:text-4xl font-semibold text-center ">
				Actually Ship Your Hackathon Project
			</h1>
			<h2 className="text-lg md:text-xl text-center text-muted-foreground">
				<p className="font-semibold">From idea to demo in record time</p>
				<Link
					href="https://hackin.nirbar.in"
					className="text-foreground hover:underline decoration-2 underline-offset-4"
				>
					Hackin
				</Link>{" "}
				guides your team through every step of the hackathon journey
				<br />
				with AI powered insights and contextual help
			</h2>
			<div className="flex flex-col md:flex-row gap-4 items-center justify-center w-[80vw] max-w-[1000px]">
				<LinkButton
					to="/project"
					variant="default"
					className="w-full max-w-[300px]"
				>
					let&apos;s goooo
				</LinkButton>
				<LinkButton
					to="https://github.com/nirbarin/hackin"
					className="w-full max-w-[300px]"
				>
					<Github />
					star star please
					<Github />
				</LinkButton>
			</div>
		</div>
	)
}

function Features() {
	return (
		<div className="flex flex-col items-center justify-center w-[80vw] gap-7 py-10 max-w-[1500px] mx-auto">
			<h2 className="text-3xl font-medium lg:text-4xl">Feature Showcase</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:mt-20 w-full">
				{features.map(feature => (
					<Card key={feature.key} className="transition-all hover:shadow-lg">
						<CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent md:size-12">
								{feature.icon}
							</span>
							<CardTitle className="text-lg md:text-xl">
								{feature.title}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription className="text-sm md:text-base">
								{feature.description}
							</CardDescription>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}

function PipelineFlowchart() {
	return (
		<div className="flex flex-col items-center justify-center w-full min-h-[80dvh] gap-7 p-8">
			<h2 className="text-2xl md:text-4xl font-semibold text-center">
				Pipeline Flowchart
			</h2>
			<p className="text-lg md:text-xl text-center text-muted-foreground">
				How does Hackin guide you through every step of the hackathon journey?
			</p>
			<Card className="w-full max-w-[800px] h-[400px] flex items-center justify-center">
				placeholder for flowchart
			</Card>
		</div>
	)
}

function Footer() {
	return (
		<div className="flex flex-col items-center justify-center w-fit m-auto py-10 gap-2">
			<div className="flex w-full text-xl font-semibold gap-2 justify-between items-center">
				hackin [ a
				<Link
					href="https://nirbar.in"
					className="text-[#3348B8] dark:text-[#4696ff]"
				>
					nirbar
				</Link>
				product ]
			</div>
			<div className="flex items-center justify-center gap-2 text-muted-foreground">
				<LinkButton to="/team" variant="link">
					team
				</LinkButton>
				<LinkButton to="/money" variant="link">
					money
				</LinkButton>
				<LinkButton to="/legal" variant="link">
					legal
				</LinkButton>
			</div>
		</div>
	)
}