"use server"

import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function saveSkills(formData: FormData) {
	const { user } = await getCurrentSession()
	if (!user) {
		throw new Error("Unauthorized")
	}

	const skillsData = formData.get("skills") as string
	let skills: { name: string; level: string }[]

	try {
		skills = JSON.parse(skillsData)

		if (!Array.isArray(skills)) {
			throw new Error("Skills must be an array")
		}

		for (const skill of skills) {
			if (
				typeof skill !== "object" ||
				typeof skill.name !== "string" ||
				typeof skill.level !== "string"
			) {
				throw new Error(
					"Each skill must be an object with 'name' and 'level' properties",
				)
			}
		}

		await db.update(users).set({ skills }).where(eq(users.id, user.id))
	} catch (error) {
		console.error("Error updating skills:", error)
		throw error
	}

	// Redirect happens outside try-catch to avoid catching NEXT_REDIRECT error
	redirect(`/onboarding?success=true&count=${skills.length}`)
}

export async function getExistingSkills() {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return []
		}

		const userData = await db
			.select({ skills: users.skills })
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1)

		if (!userData.length || !userData[0].skills) {
			return []
		}

		return userData[0].skills
	} catch (error) {
		console.error("Error loading existing skills:", error)
		return []
	}
}
