"use client"

import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { GithubAvatar } from "../ui/avatar"

export default function UserAvatar() {
	const { user, isLoggedIn } = useAuth()
	const router = useRouter()

	if (!isLoggedIn || !user) {
		return null
	}

	const handleLogout = () => {
		router.push("/identify/logout")
	}

	const handleProfile = () => {
		router.push("/profile")
	}

	const handleSettings = () => {
		router.push("/settings")
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="focus:outline-none rounded-full"
					suppressHydrationWarning
				>
					<GithubAvatar username={user.username} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{user.username}</p>
						<p className="text-xs leading-none text-muted-foreground">
							GitHub ID: {user.githubId}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleProfile}>
					<User className="mr-2 h-4 w-4" />
					<span>Profile</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleSettings}>
					<Settings className="mr-2 h-4 w-4" />
					<span>Settings</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout} variant="destructive">
					<LogOut className="mr-2 h-4 w-4" />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
