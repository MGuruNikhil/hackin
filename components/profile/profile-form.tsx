"use client"

import { Edit, ExternalLink, Github, Save, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { updateUserProfile } from "@/app/actions/user"
import { GithubAvatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface UserProfile {
	id: number
	name: string | null
	username: string
	avatar: string | null
	githubId: number
	skills: { name: string; level: string }[]
}

interface ProfileFormProps {
	user: UserProfile
}

export default function ProfileForm({ user }: ProfileFormProps) {
	const [name, setName] = useState(user.name || "")
	const [avatar, setAvatar] = useState(user.avatar || "")
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState("")
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setMessage("")

		const formData = new FormData()
		formData.append("name", name)
		formData.append("avatar", avatar)

		const result = await updateUserProfile(formData)

		if (result.success) {
			setMessage("Profile updated successfully!")
			router.refresh()
		} else {
			setMessage(result.error || "Failed to update profile")
		}

		setIsLoading(false)
	}

	return (
		<div className="space-y-6">
			{/* Profile Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Profile Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Current Avatar */}
					<div className="flex items-center space-x-4">
						<GithubAvatar username={user.username} size={64} />
						<div>
							<h3 className="font-semibold text-lg">
								{user.name || user.username}
							</h3>
							<p className="text-muted-foreground">@{user.username}</p>
							<a
								href={`https://github.com/${user.username}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
							>
								<Github className="h-3 w-3" />
								View GitHub Profile
								<ExternalLink className="h-3 w-3" />
							</a>
						</div>
					</div>

					<Separator />

					{/* Edit Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Display Name</Label>
								<Input
									id="name"
									value={name}
									onChange={e => setName(e.target.value)}
									placeholder="Enter your display name"
									disabled={isLoading}
								/>
								<p className="text-xs text-muted-foreground">
									This name will be displayed on your profile
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="username">Username</Label>
								<Input
									id="username"
									value={user.username}
									disabled
									className="bg-muted"
								/>
								<p className="text-xs text-muted-foreground">
									Username cannot be changed (linked to GitHub)
								</p>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="avatar">Avatar URL (Optional)</Label>
							<Input
								id="avatar"
								value={avatar}
								onChange={e => setAvatar(e.target.value)}
								placeholder="https://example.com/avatar.jpg"
								disabled={isLoading}
							/>
							<p className="text-xs text-muted-foreground">
								Leave empty to use your GitHub avatar
							</p>
						</div>

						{message && (
							<div
								className={`p-3 rounded-lg text-sm ${
									message.includes("successfully")
										? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
										: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
								}`}
							>
								{message}
							</div>
						)}

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full md:w-auto"
							suppressHydrationWarning
						>
							<Save className="h-4 w-4 mr-2" />
							{isLoading ? "Saving..." : "Save Changes"}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Skills Section */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<CardTitle>Skills & Expertise</CardTitle>
					<Link href="/onboarding">
						<Button variant="outline" size="sm" suppressHydrationWarning>
							<Edit className="h-4 w-4 mr-2" />
							Edit Skills
						</Button>
					</Link>
				</CardHeader>
				<CardContent>
					{user.skills && user.skills.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{user.skills.map(skill => (
								<Badge key={skill.name} variant="secondary" className="text-sm">
									{skill.name}
									{skill.level && ` (${skill.level})`}
								</Badge>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<p>No skills added yet</p>
							<p className="text-sm">Complete your onboarding to add skills</p>
							<Link href="/onboarding">
								<Button variant="link" suppressHydrationWarning>
									Start Onboarding
								</Button>
							</Link>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Account Information */}
			<Card>
				<CardHeader>
					<CardTitle>Account Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium">GitHub ID:</span>
						<Badge variant="outline">{user.githubId}</Badge>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium">Account Type:</span>
						<Badge variant="outline">GitHub Connected</Badge>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
