import type { OAuth2Tokens } from "arctic"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { github } from "@/lib/oauth"
import { users } from "@/lib/schema"
import {
	createSession,
	generateSessionToken,
	setSessionTokenCookie,
} from "@/lib/session"

export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url)
	const code = url.searchParams.get("code")
	const state = url.searchParams.get("state")
	const cookieStore = await cookies()
	const storedState = cookieStore.get("github_oauth_state")?.value ?? null
	const redirectTo = cookieStore.get("github_oauth_redirect")?.value ?? "/app"

	console.log("OAuth callback:", {
		code: !!code,
		state: !!state,
		storedState: !!storedState,
		redirectTo,
	})

	if (code === null || state === null || storedState === null) {
		console.log("Missing parameters:", {
			code: !!code,
			state: !!state,
			storedState: !!storedState,
		})
		return new Response("Missing required parameters", {
			status: 400,
		})
	}
	if (state !== storedState) {
		console.log("State mismatch:", { received: state, stored: storedState })
		return new Response("State mismatch", {
			status: 400,
		})
	}

	let tokens: OAuth2Tokens
	try {
		tokens = await github.validateAuthorizationCode(code)
	} catch (error) {
		console.error("Error validating authorization code:", error)
		return new Response(null, {
			status: 400,
		})
	}
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${tokens.accessToken()}`,
		},
	})
	const githubUser = await githubUserResponse.json()
	const githubUserId = githubUser.id
	const githubUsername = githubUser.login

	const existingUser = await db
		.select()
		.from(users)
		.where(eq(users.githubId, githubUserId))
		.limit(1)

	if (existingUser.length > 0) {
		console.log("Existing user found:", existingUser[0].username)
		const sessionToken = generateSessionToken()
		const session = await createSession(sessionToken, existingUser[0].id)
		await setSessionTokenCookie(sessionToken, session.expiresAt)

		console.log("Session created and cookie set. Redirecting to /project")

		cookieStore.delete("github_oauth_redirect")
		cookieStore.delete("github_oauth_state")

		return new Response(null, {
			status: 302,
			headers: {
				Location: "/project",
			},
		})
	}

	const user = await createUser(githubUserId, githubUsername)
	console.log("New user created:", user.username)

	const sessionToken = generateSessionToken()
	const session = await createSession(sessionToken, user.id)
	await setSessionTokenCookie(sessionToken, session.expiresAt)

	console.log("Session created and cookie set. Redirecting to /onboarding")

	cookieStore.delete("github_oauth_redirect")
	cookieStore.delete("github_oauth_state")

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/onboarding",
		},
	})
}
async function createUser(githubUserId: number, githubUsername: string) {
	const [user] = await db
		.insert(users)
		.values({
			githubId: githubUserId,
			username: githubUsername,
		})
		.returning()

	return user
}
