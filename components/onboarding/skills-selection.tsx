"use client"

import { Award, ChevronDownIcon, Filter, Plus, Search, X } from "lucide-react"
import * as React from "react"
import { useFormStatus } from "react-dom"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Types
export interface Skill {
	id: string
	name: string
	category: string
}

export interface SelectedSkill {
	skill: Skill
	level: SkillLevel
}

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert"

// Data
export const skillLevels: {
	value: SkillLevel
	label: string
	description: string
}[] = [
	{
		value: "beginner",
		label: "Beginner",
		description: "Just getting started, basic understanding",
	},
	{
		value: "intermediate",
		label: "Intermediate",
		description: "Comfortable with fundamentals, some experience",
	},
	{
		value: "advanced",
		label: "Advanced",
		description: "Extensive experience, can handle complex tasks",
	},
	{
		value: "expert",
		label: "Expert",
		description: "Mastery level, can teach and lead others",
	},
]

export const skillsData: Skill[] = [
	// Frontend Technologies
	{ id: "html", name: "HTML", category: "Frontend" },
	{ id: "css", name: "CSS", category: "Frontend" },
	{ id: "javascript", name: "JavaScript", category: "Frontend" },
	{ id: "typescript", name: "TypeScript", category: "Frontend" },
	{ id: "react", name: "React", category: "Frontend" },
	{ id: "nextjs", name: "Next.js", category: "Frontend" },
	{ id: "vue", name: "Vue.js", category: "Frontend" },
	{ id: "angular", name: "Angular", category: "Frontend" },
	{ id: "svelte", name: "Svelte", category: "Frontend" },
	{ id: "tailwind", name: "Tailwind CSS", category: "Frontend" },
	// Backend Technologies
	{ id: "nodejs", name: "Node.js", category: "Backend" },
	{ id: "python", name: "Python", category: "Backend" },
	{ id: "java", name: "Java", category: "Backend" },
	{ id: "csharp", name: "C#", category: "Backend" },
	{ id: "php", name: "PHP", category: "Backend" },
	{ id: "golang", name: "Go", category: "Backend" },
	{ id: "rust", name: "Rust", category: "Backend" },
	{ id: "ruby", name: "Ruby", category: "Backend" },
	// Databases
	{ id: "mysql", name: "MySQL", category: "Database" },
	{ id: "postgresql", name: "PostgreSQL", category: "Database" },
	{ id: "mongodb", name: "MongoDB", category: "Database" },
	{ id: "redis", name: "Redis", category: "Database" },
	{ id: "sqlite", name: "SQLite", category: "Database" },
	// DevOps & Tools
	{ id: "docker", name: "Docker", category: "DevOps" },
	{ id: "kubernetes", name: "Kubernetes", category: "DevOps" },
	{ id: "aws", name: "AWS", category: "DevOps" },
	{ id: "azure", name: "Azure", category: "DevOps" },
	{ id: "gcp", name: "Google Cloud", category: "DevOps" },
	{ id: "git", name: "Git", category: "DevOps" },
	// Mobile
	{ id: "react-native", name: "React Native", category: "Mobile" },
	{ id: "flutter", name: "Flutter", category: "Mobile" },
	{ id: "swift", name: "Swift", category: "Mobile" },
	{ id: "kotlin", name: "Kotlin", category: "Mobile" },
]

function SubmitButton({
	skillsCount,
	isInSidebar = false,
}: {
	skillsCount: number
	isInSidebar?: boolean
}) {
	const { pending } = useFormStatus()

	return (
		<div className="flex justify-center mt-8">
			<Button
				type="submit"
				size={isInSidebar ? "default" : "lg"}
				className={cn(
					"cursor-pointer",
					isInSidebar ? "w-full text-sm" : "min-w-[300px]",
				)}
				variant={skillsCount === 0 ? "outline" : "default"}
				disabled={pending}
			>
				<span className={isInSidebar ? "text-center leading-tight" : ""}>
					{pending
						? "Saving..."
						: isInSidebar
							? `Continue (${skillsCount} selected)`
							: `Continue to Projects (${skillsCount} skills selected)`}
				</span>
			</Button>
		</div>
	)
}

interface SkillsSelectionFormProps {
	initialSkills: SelectedSkill[]
	saveSkillsAction: (formData: FormData) => Promise<void>
}

export function SkillsSelectionForm({
	initialSkills,
	saveSkillsAction,
}: SkillsSelectionFormProps) {
	// Transform initial skills to SelectedSkill format
	const transformedInitialSkills: SelectedSkill[] = React.useMemo(() => {
		if (!Array.isArray(initialSkills)) return []

		return initialSkills
			.map((skill: SelectedSkill) => {
				const foundSkill = skillsData.find(s => s.name === skill.skill.name)
				return {
					skill: foundSkill || {
						id: skill.skill.name.toLowerCase().replace(/\s+/g, "-"),
						name: skill.skill.name,
						category: "Unknown",
					},
					level: skill.level as SkillLevel,
				}
			})
			.filter(skill => skill.skill)
	}, [initialSkills])

	const [selectedSkills, setSelectedSkills] = React.useState<SelectedSkill[]>(
		transformedInitialSkills,
	)
	const [openItems, setOpenItems] = React.useState<string[]>([])
	const [searchTerm, setSearchTerm] = React.useState("")
	const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
	const [showCustomSkillInput, setShowCustomSkillInput] = React.useState(false)
	const [customSkillName, setCustomSkillName] = React.useState("")

	// Filter skills based on search and category
	const filteredSkills = React.useMemo(() => {
		let filtered = skillsData
		if (searchTerm) {
			filtered = filtered.filter(
				skill =>
					skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					skill.category.toLowerCase().includes(searchTerm.toLowerCase()),
			)
		}
		if (selectedCategory !== "all") {
			filtered = filtered.filter(skill => skill.category === selectedCategory)
		}
		return filtered
	}, [searchTerm, selectedCategory])

	// Group filtered skills by category
	const skillsByCategory = React.useMemo(() => {
		return filteredSkills.reduce(
			(acc, skill) => {
				if (!acc[skill.category]) {
					acc[skill.category] = []
				}
				acc[skill.category].push(skill)
				return acc
			},
			{} as Record<string, Skill[]>,
		)
	}, [filteredSkills])

	// Get unique categories
	const categories = React.useMemo(() => {
		return Array.from(new Set(skillsData.map(skill => skill.category)))
	}, [])

	const isSkillSelected = (skillId: string) => {
		return selectedSkills.some(s => s.skill.id === skillId)
	}

	const getSelectedSkillLevel = (skillId: string) => {
		return selectedSkills.find(s => s.skill.id === skillId)?.level
	}

	const handleSkillSelect = (skill: Skill, level: SkillLevel) => {
		const newSelectedSkills = [...selectedSkills]
		const existingIndex = newSelectedSkills.findIndex(
			s => s.skill.id === skill.id,
		)
		if (existingIndex >= 0) {
			newSelectedSkills[existingIndex] = { skill, level }
		} else {
			newSelectedSkills.push({ skill, level })
		}
		setSelectedSkills(newSelectedSkills)
		// Close the accordion after selecting a level
		setOpenItems(prev => prev.filter(item => item !== skill.id))
	}

	const handleAddCustomSkill = (skillName: string, level: SkillLevel) => {
		if (!skillName.trim()) return

		const customSkill: Skill = {
			id: `custom-${skillName.toLowerCase().replace(/\s+/g, "-")}`,
			name: skillName.trim(),
			category: "Custom",
		}

		handleSkillSelect(customSkill, level)
		setCustomSkillName("")
		setShowCustomSkillInput(false)
	}

	const handleSkillDeselect = (skillId: string) => {
		const newSelectedSkills = selectedSkills.filter(s => s.skill.id !== skillId)
		setSelectedSkills(newSelectedSkills)
		// Close the accordion item when deselecting
		setOpenItems(prev => prev.filter(item => item !== skillId))
	}

	const handleAccordionValueChange = (value: string[]) => {
		setOpenItems(value)
	}

	const getLevelIcon = (level: SkillLevel) => {
		const icons: Record<SkillLevel, string> = {
			beginner: "🌱",
			intermediate: "🌿",
			advanced: "🌳",
			expert: "⭐",
		}
		return icons[level]
	}

	const getLevelColor = (level: SkillLevel) => {
		const colors: Record<SkillLevel, string> = {
			beginner:
				"bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700",
			intermediate:
				"bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700",
			advanced:
				"bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700",
			expert:
				"bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-700",
		}
		return colors[level]
	}

	const handleSubmit = async (formData: FormData) => {
		// Add the skills data to the form data
		const skillsToSave = selectedSkills.map(skill => ({
			name: skill.skill.name,
			level: skill.level,
		}))

		formData.append("skills", JSON.stringify(skillsToSave))
		await saveSkillsAction(formData)
	}

	return (
		<form action={handleSubmit}>
			<div className="w-full max-w-7xl mx-auto p-6">
				{/* Header */}
				<div className="mb-8">
					<h2 className="text-3xl font-bold mb-2">Tell us about your skills</h2>
					<p className="text-muted-foreground text-lg">
						Select the technologies you&apos;re familiar with and indicate your
						level of expertise.
					</p>
				</div>

				{/* Skill Level Reference */}
				<div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
					<h4 className="font-semibold mb-3 text-sm">Skill Level Reference:</h4>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{skillLevels.map(level => (
							<div key={level.value} className="flex items-start gap-2">
								<span className="text-lg mt-0.5">
									{getLevelIcon(level.value)}
								</span>
								<div className="min-w-0">
									<div className="font-medium text-sm">{level.label}</div>
									<div className="text-xs text-muted-foreground leading-tight">
										{level.description}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Main Layout - Skills Selection (3/4) + Selected Skills Sidebar (1/4) */}
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Skills Selection Panel - 3/4 width on desktop */}
					<div className="lg:col-span-3">
						{/* Search and Filter */}
						<div className="mb-6 flex flex-col sm:flex-row gap-4">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
								<Input
									placeholder="Search skills..."
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
							<div className="flex items-center gap-2">
								<Filter className="h-4 w-4 text-muted-foreground" />
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type="button"
											className="bg-background border border-input rounded-md text-sm flex w-fit px-2 py-1"
										>
											{selectedCategory === "all" ? "filter" : selectedCategory}
											<ChevronDownIcon className="ml-2 h-4 w-4" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-48">
										<DropdownMenuItem
											onClick={() => setSelectedCategory("all")}
											onSelect={() => setSelectedCategory("all")}
										>
											All Categories
										</DropdownMenuItem>
										{categories.map(category => (
											<DropdownMenuItem
												key={category}
												onClick={() => setSelectedCategory(category)}
											>
												{category}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						{/* Skills Grid */}
						{Object.entries(skillsByCategory).map(([category, skills]) => (
							<div key={category} className="mb-8">
								<div className="flex items-center gap-2 mb-4">
									<h3 className="text-lg font-semibold text-primary">
										{category}
									</h3>
									<Badge variant="outline">
										{skills.filter(skill => isSkillSelected(skill.id)).length} /{" "}
										{skills.length}
									</Badge>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start auto-rows-max">
									{skills.map(skill => {
										const isSelected = isSkillSelected(skill.id)
										const selectedLevel = getSelectedSkillLevel(skill.id)
										return (
											<div
												key={skill.id}
												className={cn(
													"border border-border rounded-lg transition-all duration-200 hover:shadow-md mb-3 overflow-hidden",
													isSelected
														? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
														: "bg-background hover:border-primary/50",
												)}
											>
												<Accordion
													type="multiple"
													value={openItems}
													onValueChange={handleAccordionValueChange}
													className="w-full"
												>
													<AccordionItem value={skill.id} className="border-0">
														<AccordionTrigger
															className={cn(
																"px-4 py-3 hover:no-underline",
																isSelected && "text-primary font-medium",
															)}
														>
															<div className="flex items-center justify-between w-full">
																<div className="flex items-center gap-2">
																	<span>{skill.name}</span>
																	{isSelected && selectedLevel && (
																		<Badge
																			variant="outline"
																			className={cn(
																				"text-xs",
																				getLevelColor(selectedLevel),
																			)}
																		>
																			{getLevelIcon(selectedLevel)}{" "}
																			{selectedLevel}
																		</Badge>
																	)}
																</div>
																{isSelected && (
																	<div
																		onClick={e => {
																			e.stopPropagation()
																			handleSkillDeselect(skill.id)
																		}}
																		onKeyDown={e => {
																			if (e.key === "Enter" || e.key === " ") {
																				e.stopPropagation()
																				handleSkillDeselect(skill.id)
																			}
																		}}
																		role="button"
																		tabIndex={0}
																		className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer rounded flex items-center justify-center transition-colors"
																	>
																		<X className="h-4 w-4 stroke-[2.5]" />
																	</div>
																)}
															</div>
														</AccordionTrigger>
														<AccordionContent className="px-4 pb-4">
															<div className="space-y-2">
																{skillLevels.map(level => (
																	<Button
																		key={level.value}
																		type="button"
																		variant={
																			selectedLevel === level.value
																				? "default"
																				: "outline"
																		}
																		size="sm"
																		onClick={() =>
																			handleSkillSelect(skill, level.value)
																		}
																		className="w-full justify-start h-auto p-3"
																	>
																		<div className="flex items-center gap-2">
																			<span className="text-lg">
																				{getLevelIcon(level.value)}
																			</span>
																			<span className="font-medium">
																				{level.label}
																			</span>
																		</div>
																	</Button>
																))}
															</div>
														</AccordionContent>
													</AccordionItem>
												</Accordion>
											</div>
										)
									})}
								</div>
							</div>
						))}

						{/* No results message and Add Custom Skill */}
						{Object.keys(skillsByCategory).length === 0 && (
							<div className="text-center py-8 space-y-4">
								<div className="text-muted-foreground mb-4">
									<Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
									<p>No skills found matching your search.</p>
								</div>
								<div className="flex flex-col gap-3 items-center">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setSearchTerm("")
											setSelectedCategory("all")
										}}
									>
										Clear filters
									</Button>
									{!showCustomSkillInput ? (
										<Button
											type="button"
											variant="ghost"
											onClick={() => setShowCustomSkillInput(true)}
											className="text-sm text-primary"
										>
											+ Add custom skill
										</Button>
									) : (
										<div className="w-full max-w-xs space-y-3">
											<Input
												placeholder="Enter skill name"
												value={customSkillName}
												onChange={e => setCustomSkillName(e.target.value)}
												autoFocus
											/>
											<div className="space-y-2">
												<p className="text-sm font-medium">
													Select skill level:
												</p>
												<div className="grid grid-cols-2 gap-2">
													{skillLevels.map(level => (
														<Button
															key={level.value}
															type="button"
															variant="outline"
															size="sm"
															disabled={!customSkillName.trim()}
															onClick={() => {
																handleAddCustomSkill(
																	customSkillName,
																	level.value,
																)
															}}
															className="h-auto p-2 flex flex-col items-center gap-1"
														>
															<span className="text-sm">
																{getLevelIcon(level.value)}
															</span>
															<span className="text-xs font-medium">
																{level.label}
															</span>
														</Button>
													))}
												</div>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													setShowCustomSkillInput(false)
													setCustomSkillName("")
												}}
												className="w-full"
											>
												Cancel
											</Button>
										</div>
									)}
								</div>
							</div>
						)}

						{!showCustomSkillInput &&
							Object.keys(skillsByCategory).length > 0 && (
								<div className="mt-6">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setShowCustomSkillInput(true)}
										className="w-full gap-2"
									>
										<Plus className="h-4 w-4" />
										Add Custom Skill
									</Button>
								</div>
							)}

						{showCustomSkillInput &&
							Object.keys(skillsByCategory).length > 0 && (
								<div className="mt-4 p-4 bg-muted/30 rounded-lg border">
									<div className="flex items-center justify-between mb-3">
										<h4 className="text-sm font-medium">Add Custom Skill</h4>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0"
											onClick={() => {
												setShowCustomSkillInput(false)
												setCustomSkillName("")
											}}
										>
											<X className="h-3 w-3" />
										</Button>
									</div>
									<div className="space-y-4">
										<Input
											placeholder="Enter skill name"
											value={customSkillName}
											onChange={e => setCustomSkillName(e.target.value)}
											onKeyDown={e => {
												if (e.key === "Escape") {
													setShowCustomSkillInput(false)
													setCustomSkillName("")
												}
											}}
										/>
										<div className="space-y-3">
											<p className="text-sm font-medium">Select skill level:</p>
											<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
												{skillLevels.map(level => (
													<Button
														key={level.value}
														type="button"
														variant="outline"
														size="sm"
														disabled={!customSkillName.trim()}
														onClick={() => {
															handleAddCustomSkill(customSkillName, level.value)
														}}
														className="h-auto p-3 flex flex-col items-center gap-1"
													>
														<span className="text-lg">
															{getLevelIcon(level.value)}
														</span>
														<span className="text-xs font-medium">
															{level.label}
														</span>
													</Button>
												))}
											</div>
										</div>
									</div>
								</div>
							)}
					</div>

					{/* Selected Skills Sidebar - 1/4 width on desktop */}
					<div className="lg:col-span-1">
						<div className="bg-background rounded-lg border p-6 sticky top-6">
							<div className="flex items-center gap-2 mb-4">
								<Award className="h-5 w-5 text-primary" />
								<h3 className="font-semibold text-lg">Selected Skills</h3>
							</div>

							<div className="mb-4">
								<span className="text-sm text-muted-foreground">
									{selectedSkills.length} skill
									{selectedSkills.length !== 1 ? "s" : ""} selected
								</span>
							</div>

							{selectedSkills.length === 0 ? (
								<div className="text-center py-8">
									<div className="text-muted-foreground text-sm">
										No skills selected yet. Choose skills from the left panel to
										get started.
									</div>
								</div>
							) : (
								<div className="space-y-3 max-h-96 overflow-y-auto">
									{selectedSkills.map(({ skill, level }) => (
										<div
											key={skill.id}
											className={cn(
												"flex flex-col gap-2 p-3 rounded-lg border text-sm",
												getLevelColor(level),
											)}
										>
											<div className="flex items-center justify-between">
												<span className="font-medium">{skill.name}</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => handleSkillDeselect(skill.id)}
													className="h-6 w-6 p-0 hover:text-destructive"
												>
													<X className="h-3 w-3" />
												</Button>
											</div>
											<div className="flex items-center gap-1 text-xs">
												<span>{getLevelIcon(level)}</span>
												<span className="capitalize opacity-75">{level}</span>
											</div>
										</div>
									))}
								</div>
							)}

							{/* Submit button in sidebar for desktop */}
							<div className="mt-6 hidden lg:block">
								<SubmitButton
									skillsCount={selectedSkills.length}
									isInSidebar={true}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Submit button for mobile - shown when sidebar is not visible */}
				<div className="lg:hidden">
					<SubmitButton skillsCount={selectedSkills.length} />
				</div>
			</div>
		</form>
	)
}
