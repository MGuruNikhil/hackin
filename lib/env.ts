import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
	server: {
		GITHUB_ID: z.string().min(1),
		GITHUB_SECRET: z.string().min(1),
		DATABASE_URL: z.string().url(),
		OPENROUTER_API_KEY: z.string().min(1),
		APP_URL: z.string().url().optional(),
	},
	client: {},
	runtimeEnv: {
		GITHUB_ID: process.env.GITHUB_ID,
		GITHUB_SECRET: process.env.GITHUB_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
		APP_URL: process.env.APP_URL,
	},
})
