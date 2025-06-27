import Link from "next/link"
import { getCurrentSession } from "@/lib/session"
import ThemeToggle from "../theme/toggle"
import UserAvatar from "./avatar"

export async function Nav() {
	const { user } = await getCurrentSession()
	return (
		<div className="flex w-full text-xl font-semibold p-5 justify-between items-center">
			<Link href="/" className="hover:opacity-80 transition-opacity">
				hackin.
				<span className="text-[#3348B8] dark:text-[#4696ff]">nirbar</span>
				.in
			</Link>
			<div className="grow" />
			<div className="flex gap-2">
				{user ? <UserAvatar /> : null}
				<ThemeToggle />
			</div>
		</div>
	)
}
