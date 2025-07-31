import { GitHub } from "arctic"
import { env } from "./env"

const redirectURI =
	process.env.NODE_ENV === "production"
		? `${env.APP_URL}/identify/github/callback`
		: "http://localhost:3000/identify/github/callback"

export const github = new GitHub(env.GITHUB_ID, env.GITHUB_SECRET, redirectURI)
