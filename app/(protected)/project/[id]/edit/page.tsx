import { notFound, redirect } from "next/navigation"
import { getProject } from "@/app/actions/project"
import ProjectForm from "@/components/project/project-form"
import { getCurrentSession } from "@/lib/session"

export default async function EditProjectPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const projectId = Number.parseInt(id)

	// Get current user session
	const { user } = await getCurrentSession()
	if (!user) {
		redirect("/identify/github")
	}

	if (Number.isNaN(projectId)) {
		notFound()
	}

	const result = await getProject(projectId)

	if (!result.success || !result.data) {
		notFound()
	}

	const project = result.data

	// Prepare initial data for the form
	const initialData = {
		hackathon_name: project.hackathonName,
		theme: project.theme || "",
		tools: project.suggestedTech || "",
		judging_criteria: project.judgingCriteria || "",
		additional_data: project.additionalData || "",
		submision_time: project.submissionTime ? new Date(project.submissionTime) : new Date(),
	}

	return (
		<ProjectForm
			mode="edit"
			projectId={projectId}
			initialData={initialData}
		/>
	)
}
