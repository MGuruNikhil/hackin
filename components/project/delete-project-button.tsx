"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { deleteProject } from "@/app/actions/project"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface DeleteProjectButtonProps {
	projectId: number
	projectName: string
}

export function DeleteProjectButton({
	projectId,
	projectName,
}: DeleteProjectButtonProps) {
	const [isDeleting, setIsDeleting] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const router = useRouter()

	const handleDelete = async () => {
		setIsDeleting(true)

		try {
			const result = await deleteProject(projectId)

			if (result.success) {
				toast.success("Project deleted successfully!", {
					description: "All related data has been removed.",
				})
				router.push("/project")
			} else {
				toast.error("Failed to delete project", {
					description: result.error || "An unexpected error occurred.",
				})
			}
		} catch (error) {
			console.error("Error deleting project:", error)
			toast.error("Failed to delete project", {
				description: "An unexpected error occurred. Please try again.",
			})
		} finally {
			setIsDeleting(false)
			setIsOpen(false)
		}
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" disabled={isDeleting}>
					{isDeleting ? "Deleting..." : "Delete Project"}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Are you sure you want to delete this project?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the
						project{" "}
						<span className="font-semibold">&quot;{projectName}&quot;</span> and
						remove all associated data.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="my-4">
					<p className="text-sm text-muted-foreground mb-2">
						This will delete:
					</p>
					<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
						<li>All project ideas and conversations</li>
						<li>Project steps and progress</li>
						<li>Pitch presentations and feedback</li>
						<li>Team associations</li>
					</ul>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? (
							<>
								<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Deleting...
							</>
						) : (
							"Delete Project"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
