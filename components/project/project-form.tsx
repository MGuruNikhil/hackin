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
	name: z.string().min(1),
	description: z.string().optional(),
	tech_stack: z.string().optional(),
	timeline: z.string().optional(),
	additional_notes: z.string().optional(),
	target_deadline: z.coerce.date(),
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
			name: initialData?.name || "",
			description: initialData?.description || "",
			tech_stack: initialData?.tech_stack || "",
			timeline: initialData?.timeline || "",
			additional_notes: initialData?.additional_notes || "",
			target_deadline: initialData?.target_deadline || new Date(),
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
				target_deadline: values.target_deadline.toISOString(),
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
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Project Name <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Input placeholder="My Awesome Project" type="text" {...field} />
								</FormControl>
								<FormDescription>
									Give your project a memorable name.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="A brief description of what you're building..."
										className="resize-none"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									Describe your project idea and goals.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="tech_stack"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Tech Stack</FormLabel>
								<FormControl>
									<Input
										placeholder="React, Node.js, MongoDB, etc..."
										type="text"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									List the technologies you plan to use.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="timeline"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Timeline</FormLabel>
								<FormControl>
									<Input
										placeholder="2 weeks, 1 month, etc..."
										type="text"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									Expected duration for completing this project.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="additional_notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Additional Notes</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Any other details about your project..."
										className="resize-none"
										{...field}
									/>
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
						name="target_deadline"
						render={({ field }) => (
							<FormItem className="flex flex-col">
								<FormLabel>
									Target Deadline <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<DateTimePicker
										value={field.value}
										onChange={field.onChange}
									/>
								</FormControl>
								<FormDescription>
									When do you want to complete this project?
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
