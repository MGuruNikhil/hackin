"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Countdown } from "@/components/cute/counter"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
	hackathon_name: z.string().min(1, "Hackathon name is required"),
	theme: z.string().optional(),
	tools: z.string().optional(),
	judging_criteria: z.string().optional(),
	additional_data: z.string().optional(),
	submision_time: z.coerce.date(),
})

export type ProjectFormData = z.infer<typeof formSchema>

interface ProjectFormProps {
	mode: "create" | "edit"
	initialData?: Partial<ProjectFormData>
	projectId?: number
	title?: string
}

export default function ProjectForm({
	mode,
	initialData,
	projectId,
	title = mode === "create" ? "Create a Project" : "Edit Project",
}: ProjectFormProps) {
	const [isSubmitted, setIsSubmitted] = useState(false)
	const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const router = useRouter()

	const form = useForm<ProjectFormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			hackathon_name: initialData?.hackathon_name || "",
			theme: initialData?.theme || "",
			tools: initialData?.tools || "",
			judging_criteria: initialData?.judging_criteria || "",
			additional_data: initialData?.additional_data || "",
			submision_time: initialData?.submision_time || new Date(),
		},
	})

	async function onSubmit(values: ProjectFormData) {
		setIsSubmitting(true)
		
		try {
			const url = mode === "create" ? "/api/new" : `/api/projects/${projectId}`
			const method = mode === "create" ? "POST" : "PUT"

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
			body: JSON.stringify({
				...values,
				submision_time: values.submision_time.toISOString(),
			}),			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(
					errorData.error?.message ||
						`Failed to ${mode} project. Please try again.`,
				)
			}

			const data = await response.json()
			console.log(`Project ${mode}d:`, data)

			if (mode === "create") {
				setCreatedProjectId(data.id)
				setIsSubmitted(true)
				toast.success("Project created successfully!", {
					description: "Your project has been created and you can now start adding ideas.",
				})
			} else {
				toast.success("Project updated successfully!", {
					description: "All changes have been saved.",
				})
				router.push(`/project/${projectId}`)
			}
		} catch (error) {
			console.error("Form submission error:", error)
			toast.error(
				`Failed to ${mode} project`,
				{
					description: error instanceof Error
						? error.message
						: `An unexpected error occurred. Please try again.`,
				}
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (mode === "create" && isSubmitted) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<div className="text-9xl mb-4">😊</div>
				<p className="text-xl">Project created successfully!</p>
				<p className="text-muted-foreground">
					You will be redirected in{" "}
					<Countdown
						from={5}
						onComplete={() => {
							if (createdProjectId) {
								window.location.href = `/project/${createdProjectId}`
							}
						}}
					/>
				</p>
				{createdProjectId && (
					<Button
						variant="link"
						onClick={() => {
							window.location.href = `/project/${createdProjectId}`
						}}
					>
						Go to project now
					</Button>
				)}
			</div>
		)
	}

	return (
		<div className="max-w-3xl mx-auto p-10 w-full">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-8"
				>
					<h1 className="text-3xl font-semibold mb-8">{title}</h1>
					<FormField
						control={form.control}
						name="hackathon_name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Hackathon Name <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Input placeholder="GDG Wow" type="text" {...field} />
								</FormControl>
								<FormDescription>
									This is Hackathon display name.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="theme"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Theme</FormLabel>
								<FormControl>
									<Input placeholder="AI, Sustainability, etc..." type="text" {...field} />
								</FormControl>
								<FormDescription>
									Theme of the hackathon.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="tools"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Tools</FormLabel>
								<FormControl>
									<Input placeholder="Figma, GitHub, etc..." type="text" {...field} />
								</FormControl>
								<FormDescription>
									Tools allowed or recommended for the hackathon.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="judging_criteria"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Judging Criteria</FormLabel>
								<FormControl>
									<Input placeholder="Innovation, Impact, etc..." type="text" {...field} />
								</FormControl>
								<FormDescription>
									How will projects be judged?
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="additional_data"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Additional Data</FormLabel>
								<FormControl>
									<Textarea placeholder="Any other details about the hackathon..." className="resize-none" {...field} />
								</FormControl>
								<FormDescription>
									Add any other relevant information.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="submision_time"
						render={({ field }) => (
							<FormItem className="flex flex-col">
								<FormLabel>
									Submission Date <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<DateTimePicker value={field.value} onChange={field.onChange} />
								</FormControl>
								<FormDescription>
									Add the date and time of submission.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex gap-3">
						<Button type="submit" className="flex-1" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									{mode === "create" ? "Creating..." : "Updating..."}
								</>
							) : (
								mode === "create" ? "Create Project" : "Update Project"
							)}
						</Button>
						{mode === "edit" && (
							<Button
								type="button"
								variant="outline"
								disabled={isSubmitting}
								onClick={() => router.push(`/project/${projectId}`)}
							>
								Cancel
							</Button>
						)}
					</div>
				</form>
			</Form>
		</div>
	)
}
