import { sha256 } from "@oslojs/crypto/sha2"
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { cache } from "react"
import { db } from "./db"
import { sessions, users } from "./schema"

export interface User {
	id: number
	githubId: number
	username: string
}

export async function validateSessionToken(
	token: string,
): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
	console.log("Validating·session·token:", `${sessionId.substring(0, 10)}...`)

	const sessionWithUser = await db
		.select()
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.limit(1)

	console.log(
		"Session query result:",
		sessionWithUser.length > 0 ? "Found" : "Not found",
	)

	if (!sessionWithUser.length || !sessionWithUser[0]?.session || !sessionWithUser[0]?.user) {
		console.error("Session or user not found in query result:", sessionWithUser)
		return { session: null, user: null }
	}

	const sessionData = sessionWithUser[0]
	const session: Session = {
		id: sessionData.session.id,
		userId: sessionData.session.userId,
		expiresAt: sessionData.session.expiresAt,
	}

	const user: User = {
		id: sessionData.user.id,
		githubId: sessionData.user.githubId,
		username: sessionData.user.username,
	}

	console.log(
		"Session expires at:",
		session.expiresAt,
		"Current time:",
		new Date(),
	)

	if (Date.now() >= session.expiresAt.getTime()) {
		console.log("Session expired, deleting...")
		await db.delete(sessions).where(eq(sessions.id, session.id))
		return { session: null, user: null }
	}

	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, session.id))
		console.log("Session refreshed, new expiry:", session.expiresAt)
	}

	return { session, user }
}

export const getCurrentSession = cache(
	async (): Promise<SessionValidationResult> => {
		const cookiesStore = await cookies()
		const token = cookiesStore.get("session")?.value ?? null
		console.log("getCurrentSession - token exists:", !!token)
		if (token === null) {
			return { session: null, user: null }
		}
		const result = await validateSessionToken(token)
		console.log(
			"getCurrentSession - validation result:",
			result.session ? "valid" : "invalid",
		)
		return result
	},
)

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export async function invalidateUserSessions(userId: number): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId))
}

export async function setSessionTokenCookie(
	token: string,
	expiresAt: Date,
): Promise<void> {
	const cookiesStore = await cookies()
	console.log("Setting session cookie with expiry:", expiresAt)
	cookiesStore.set("session", token, {
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		expires: expiresAt,
	})
	console.log("Session cookie set successfully")
}

export async function deleteSessionTokenCookie(): Promise<void> {
	const cookiesStore = await cookies()
	cookiesStore.set("session", "", {
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
	})
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20)
	crypto.getRandomValues(tokenBytes)
	const token = encodeBase32(tokenBytes).toLowerCase()
	return token
}

export async function createSession(
	token: string,
	userId: number,
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
	}

	await db.insert(sessions).values({
		id: session.id,
		userId: session.userId,
		expiresAt: session.expiresAt,
	})

	return session
}

export interface Session {
	id: string
	expiresAt: Date
	userId: number
}

type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null }
