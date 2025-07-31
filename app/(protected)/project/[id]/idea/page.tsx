import { IdeaGenerator } from "@/components/idea/generator"

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	return (
		<div className="p-6">
			{/* AI Idea Generator Section */}
			<IdeaGenerator projectId={Number(id)} />
		</div>
	)
}
