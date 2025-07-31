import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { StepsGenerator } from "@/components/steps/steps-generator"
import { db } from "@/lib/db"
import { ideas } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export const dynamic = "force-dynamic"

interface PageProps {
	params: Promise<{
		id: string
		ideaId: string
	}>
}

export default async function StepsPage({ params }: PageProps) {
	const { id, ideaId } = await params
	const projectId = Number.parseInt(id)
	const selectedIdeaId = Number.parseInt(ideaId)

	const { user } = await getCurrentSession()
	if (!user) {
		return notFound()
	}

	if (Number.isNaN(projectId) || Number.isNaN(selectedIdeaId)) {
		return notFound()
	}

	// Get the specific idea
	const idea = await db
		.select()
		.from(ideas)
		.where(eq(ideas.id, selectedIdeaId))
		.limit(1)

	if (idea.length === 0) {
		return notFound()
	}

	return (
		<div className="min-h-full p-5">
			<StepsGenerator projectId={projectId} ideaId={ideaId} idea={idea[0]} />
		</div>
	)
}
