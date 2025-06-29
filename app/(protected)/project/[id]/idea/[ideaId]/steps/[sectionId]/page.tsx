import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { SectionChat } from "@/components/steps/section-chat"
import { db } from "@/lib/db"
import { ideas, stepSections } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export const dynamic = "force-dynamic"

interface PageProps {
	params: Promise<{
		id: string
		ideaId: string
		sectionId: string
	}>
}

export default async function SectionPage({ params }: PageProps) {
	const { id, ideaId, sectionId } = await params
	const projectId = Number.parseInt(id)
	const selectedIdeaId = Number.parseInt(ideaId)
	const selectedSectionId = Number.parseInt(sectionId)

	const { user } = await getCurrentSession()
	if (!user) {
		return notFound()
	}

	if (Number.isNaN(projectId) || Number.isNaN(selectedIdeaId) || Number.isNaN(selectedSectionId)) {
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

	// Get the specific section
	const section = await db
		.select()
		.from(stepSections)
		.where(eq(stepSections.id, selectedSectionId))
		.limit(1)

	if (section.length === 0) {
		return notFound()
	}

	return (
		<div className="max-w-5xl mx-auto p-6 space-y-8">
			<SectionChat 
				projectId={projectId} 
				ideaId={ideaId} 
				sectionId={sectionId}
				idea={idea[0]} 
				section={section[0]}
			/>
		</div>
	)
}
