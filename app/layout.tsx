import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { GlobalAuthProvider } from "@/components/auth/global-provider"
import { ThemeProvider } from "@/components/theme/provider"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	title: "BuildFast - Rapid Software Development",
	description:
		"BuildFast helps developers turn ideas into reality with AI-powered guidance, step-by-step planning, and contextual support. Build faster, ship sooner.",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<GlobalAuthProvider>
						<div className="flex flex-col min-h-[100dvh]">
							<div className="flex flex-col grow">{children}</div>
						</div>
					</GlobalAuthProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
