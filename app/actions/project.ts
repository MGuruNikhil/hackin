"use server"

import { and, eq, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { projects, teams, users, userTeams } from "@/lib/schema"
import { getCurrentSession } from "@/lib/session"

export async function getUserProjects() {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return {
				success: false,
				error: "Unauthorized",
			}
		}

		// Single query to get all projects where user is owner OR team member
		const userProjects = await db
			.selectDistinct({
				id: projects.id,
				hackathonName: projects.hackathonName,
				theme: projects.theme,
				suggestedTech: projects.suggestedTech,
				judgingCriteria: projects.judgingCriteria,
				additionalData: projects.additionalData,
				submissionTime: projects.submissionTime,
				actualTech: projects.actualTech,
				userId: projects.userId,
				teamId: projects.teamId,
			})
			.from(projects)
			.leftJoin(userTeams, eq(projects.teamId, userTeams.teamId))
			.where(
				or(
					eq(projects.userId, user.id), // User is project owner
					eq(userTeams.userId, user.id), // User is team member
				),
			)
			.orderBy(projects.id)

		// Sort by id descending
		userProjects.sort((a, b) => b.id - a.id)

		return { success: true, data: userProjects }
	} catch (error) {
		console.error("Error fetching user projects:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to fetch projects",
		}
	}
}

export async function deleteProject(projectId: number) {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return {
				success: false,
				error: "Unauthorized",
			}
		}

		// First, get the project to check ownership and get teamId
		const [project] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))

		if (!project) {
			return {
				success: false,
				error: "Project not found or you don't have permission to delete it",
			}
		}

		const teamId = project.teamId

		// Use a transaction to ensure proper cleanup
		const result = await db.transaction(async tx => {
			// Delete the project - database CASCADE constraints will handle:
			// - ideas and their ideaChats
			// - steps and their stepChats
			// - pitches and their pitchDialogs
			const [deletedProject] = await tx
				.delete(projects)
				.where(eq(projects.id, projectId))
				.returning()

			// Clean up empty team if it exists
			if (teamId) {
				// Check if this team has any other projects
				const otherProjects = await tx
					.select({ id: projects.id })
					.from(projects)
					.where(eq(projects.teamId, teamId))

				// If no other projects reference this team, delete it and its user associations
				if (otherProjects.length === 0) {
					await tx.delete(userTeams).where(eq(userTeams.teamId, teamId))
					await tx.delete(teams).where(eq(teams.id, teamId))
				}
			}

			return deletedProject
		})

		return { success: true, data: result }
	} catch (error) {
		console.error("Error deleting project:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete project",
		}
	}
}

export async function getProject(projectId: number) {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return {
				success: false,
				error: "Unauthorized",
			}
		}

		if (Number.isNaN(projectId)) {
			return {
				success: false,
				error: "Invalid project ID",
			}
		}

		const project = await db.query.projects.findFirst({
			where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
		})

		if (!project) {
			return {
				success: false,
				error: "Project not found",
			}
		}

		return { success: true, data: project }
	} catch (error) {
		console.error("Error in getProject action:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to fetch project",
		}
	}
}

export async function getProjectWithTeam(projectId: number) {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return {
				success: false,
				error: "Unauthorized",
			}
		}

		if (Number.isNaN(projectId)) {
			return {
				success: false,
				error: "Invalid project ID",
			}
		}

		// First try to find project where user is owner
		let project = await db.query.projects.findFirst({
			where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
			with: {
				team: {
					with: {
						userTeams: {
							with: {
								user: {
									columns: {
										id: true,
										username: true,
										name: true,
										avatar: true,
									},
								},
							},
						},
					},
				},
			},
		})

		// If not owner, check if user is a team member
		if (!project) {
			const teamMemberProject = await db
				.select({
					id: projects.id,
					hackathonName: projects.hackathonName,
					theme: projects.theme,
					suggestedTech: projects.suggestedTech,
					judgingCriteria: projects.judgingCriteria,
					additionalData: projects.additionalData,
					submissionTime: projects.submissionTime,
					actualTech: projects.actualTech,
					userId: projects.userId,
					teamId: projects.teamId,
				})
				.from(projects)
				.innerJoin(userTeams, eq(projects.teamId, userTeams.teamId))
				.where(and(eq(projects.id, projectId), eq(userTeams.userId, user.id)))
				.limit(1)

			if (teamMemberProject.length > 0) {
				// Get the full project with team data
				project = await db.query.projects.findFirst({
					where: eq(projects.id, projectId),
					with: {
						team: {
							with: {
								userTeams: {
									with: {
										user: {
											columns: {
												id: true,
												username: true,
												name: true,
												avatar: true,
											},
										},
									},
								},
							},
						},
					},
				})
			}
		}

		if (!project) {
			return {
				success: false,
				error: "Project not found",
			}
		}

		return { success: true, data: project }
	} catch (error) {
		console.error("Error in getProjectWithTeam action:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to fetch project",
		}
	}
}

export async function createTeamForProject(
	projectId: number,
	teamName: string,
) {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return {
				success: false,
				error: "Unauthorized",
			}
		}

		// Verify the user owns the project
		const project = await db.query.projects.findFirst({
			where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
		})

		if (!project) {
			return {
				success: false,
				error: "Project not found or you don't have permission",
			}
		}

		// Check if project already has a team
		if (project.teamId) {
			return {
				success: false,
				error: "Project already has a team",
			}
		}

		// Create the team
		const [newTeam] = await db
			.insert(teams)
			.values({
				name: teamName,
			})
			.returning()

		// Add the project owner to the team
		await db.insert(userTeams).values({
			userId: user.id,
			teamId: newTeam.id,
		})

		// Update the project to associate it with the team
		await db
			.update(projects)
			.set({ teamId: newTeam.id })
			.where(eq(projects.id, projectId))

		return { success: true, data: newTeam }
	} catch (error) {
		console.error("Error creating team for project:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create team",
		}
	}
}

export async function addTeamMember(projectId: number, username: string) {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return {
				success: false,
				error: "Unauthorized",
			}
		}

		// Verify the user owns the project
		const project = await db.query.projects.findFirst({
			where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
		})

		if (!project) {
			return {
				success: false,
				error: "Project not found or you don't have permission",
			}
		}

		if (!project.teamId) {
			return {
				success: false,
				error: "Project doesn't have a team. Create a team first.",
			}
		}

		// Find the user to add
		const userToAdd = await db.query.users.findFirst({
			where: eq(users.username, username),
		})

		if (!userToAdd) {
			return {
				success: false,
				error: "User not found",
			}
		}

		// Check if user is already a team member
		const existingMember = await db.query.userTeams.findFirst({
			where: and(
				eq(userTeams.userId, userToAdd.id),
				eq(userTeams.teamId, project.teamId),
			),
		})

		if (existingMember) {
			return {
				success: false,
				error: "User is already a team member",
			}
		}

		// Add the user to the team
		await db.insert(userTeams).values({
			userId: userToAdd.id,
			teamId: project.teamId,
		})

		return {
			success: true,
			data: {
				id: userToAdd.id,
				username: userToAdd.username,
				name: userToAdd.name,
				avatar: userToAdd.avatar,
			},
		}
	} catch (error) {
		console.error("Error adding team member:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to add team member",
		}
	}
}

export async function removeTeamMember(projectId: number, userId: number) {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return {
				success: false,
				error: "Unauthorized",
			}
		}

		// Verify the user owns the project
		const project = await db.query.projects.findFirst({
			where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
		})

		if (!project) {
			return {
				success: false,
				error: "Project not found or you don't have permission",
			}
		}

		if (!project.teamId) {
			return {
				success: false,
				error: "Project doesn't have a team",
			}
		}

		// Don't allow removing the project owner
		if (userId === user.id) {
			return {
				success: false,
				error: "Cannot remove the project owner from the team",
			}
		}

		// Remove the user from the team
		const [removedMember] = await db
			.delete(userTeams)
			.where(
				and(eq(userTeams.userId, userId), eq(userTeams.teamId, project.teamId)),
			)
			.returning()

		if (!removedMember) {
			return {
				success: false,
				error: "User is not a team member",
			}
		}

		return { success: true, data: removedMember }
	} catch (error) {
		console.error("Error removing team member:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to remove team member",
		}
	}
}

export async function updateProject(
	projectId: number,
	data: {
		hackathonName: string
		theme?: string
		suggestedTech?: string
		judgingCriteria?: string
		additionalData?: string
		submissionTime: Date
	},
) {
	try {
		const { user } = await getCurrentSession()
		if (!user) {
			return {
				success: false,
				error: "Unauthorized",
			}
		}

		const [updatedProject] = await db
			.update(projects)
			.set({
				hackathonName: data.hackathonName,
				theme: data.theme || null,
				suggestedTech: data.suggestedTech || null,
				judgingCriteria: data.judgingCriteria || null,
				additionalData: data.additionalData || null,
				submissionTime: data.submissionTime,
			})
			.where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
			.returning()

		if (!updatedProject) {
			return {
				success: false,
				error: "Project not found or you don't have permission to edit it",
			}
		}

		return { success: true, data: updatedProject }
	} catch (error) {
		console.error("Error updating project:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update project",
		}
	}
}
