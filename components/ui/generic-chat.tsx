"use client"

import { useChat } from "@ai-sdk/react"
import { Loader2, MessageCircle, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Markdown } from "@/components/markdown/render"

interface ChatConfig {
	apiEndpoint: string
	chatData: Record<string, unknown>
	messagesEndpoint?: string
	placeholder?: string
	emptyStateTitle?: string
	emptyStateDescription?: string
	loadingText?: string
	onSuccess?: () => void
}

interface GenericChatProps {
	config: ChatConfig
	className?: string
}

export function GenericChat({ config, className = "" }: GenericChatProps) {
	const [isLoadingMessages, setIsLoadingMessages] = useState(true)
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Use the useChat hook for streaming chat
	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		status,
		setMessages,
		error,
	} = useChat({
		api: config.apiEndpoint,
		body: {
			data: config.chatData,
		},
		onError: error => {
			console.error("Chat error details:", error)
			toast.error(`Failed to send message: ${error.message || 'Unknown error'}`)
		},
	onToolCall: ({ toolCall }) => {
		console.log(`[CHAT] Tool called:`, toolCall.toolName, toolCall.args)
		
		// Only trigger onSuccess when tools are actually called (meaning data was modified)
		if (config.onSuccess && (
			toolCall.toolName === 'createTodo' || 
			toolCall.toolName === 'updateTodo' || 
			toolCall.toolName === 'deleteTodo'
		)) {
			console.log(`[CHAT] Triggering onSuccess callback for tool:`, toolCall.toolName)
			// Use setTimeout to avoid triggering during render
			setTimeout(() => {
				config.onSuccess?.()
			}, 100)
		}
	},
	onFinish: (message) => {
		console.log(`[CHAT] Message finished:`, message)
	},	})

	// Function to scroll to bottom
	const scrollToBottom = () => {
		// Method 1: Use the messagesEndRef (most reliable)
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
			return
		}

		// Method 2: Try to find the Radix ScrollArea viewport
		if (scrollAreaRef.current) {
			// Try different possible selectors for Radix ScrollArea
			const selectors = [
				'[data-radix-scroll-area-viewport]',
				'.scroll-area-viewport',
				'[data-radix-scroll-area-viewport] > div',
				'div[style*="overflow"]'
			]

			for (const selector of selectors) {
				const scrollContainer = scrollAreaRef.current.querySelector(selector)
				if (scrollContainer) {
					scrollContainer.scrollTop = scrollContainer.scrollHeight
					return
				}
			}

			// Method 3: If Radix selectors don't work, try to find any scrollable element
			const allDivs = scrollAreaRef.current.querySelectorAll('div')
			for (const div of allDivs) {
				if (div.scrollHeight > div.clientHeight) {
					div.scrollTop = div.scrollHeight
					return
				}
			}
		}
	}

	// Auto-scroll when messages change or loading states change
	useEffect(() => {
		// Use requestAnimationFrame to ensure DOM has fully updated
		const frameId = requestAnimationFrame(() => {
			const timeoutId = setTimeout(() => {
				scrollToBottom()
			}, 50)
			
			// Cleanup timeout if component unmounts
			return () => clearTimeout(timeoutId)
		})

		return () => cancelAnimationFrame(frameId)
	}, [messages, isLoadingMessages, status])

	// Initial scroll to bottom when component mounts
	useEffect(() => {
		// Multiple attempts to ensure scrolling works
		const timeouts = [
			setTimeout(() => scrollToBottom(), 100),
			setTimeout(() => scrollToBottom(), 300),
			setTimeout(() => scrollToBottom(), 500),
		]

		return () => timeouts.forEach(timeout => clearTimeout(timeout))
	}, [])

	// Fetch existing chat messages when chat data changes
	useEffect(() => {
		const fetchChatMessages = async () => {
			if (!config.messagesEndpoint) {
				setIsLoadingMessages(false)
				return
			}

			setIsLoadingMessages(true)
			try {
				const response = await fetch(config.messagesEndpoint)
				if (response.ok) {
					const data = await response.json()
					setMessages(data.messages || [])
					
					// Scroll to bottom after messages are loaded
					setTimeout(() => {
						scrollToBottom()
					}, 100)
				} else {
					console.error("Failed to fetch chat messages")
				}
			} catch (error) {
				console.error("Error fetching chat messages:", error)
			} finally {
				setIsLoadingMessages(false)
			}
		}

		fetchChatMessages()
	}, [config.messagesEndpoint, config.chatData, setMessages])

	return (
		<div className={`flex flex-col ${className}`}>
			{/* Chat Messages */}
			<div className="flex-1 min-h-0 border rounded">
				{isLoadingMessages ? (
					<div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							{config.loadingText || "Loading..."}
						</p>
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-8">
						<MessageCircle className="h-8 w-8 text-muted-foreground" />
						<div className="space-y-1">
							<h3 className="font-medium">
								{config.emptyStateTitle || "Start the conversation"}
							</h3>
							<p className="text-sm text-muted-foreground">
								{config.emptyStateDescription || "Send a message to get started."}
							</p>
						</div>
					</div>
				) : (
					<ScrollArea ref={scrollAreaRef} className="h-full">
						<div className="space-y-3 p-4">
							{messages.map(message => (
								<div
									key={message.id}
									className={`flex ${
										message.role === "user" ? "justify-end" : "justify-start"
									}`}
								>
									<div
										className={`max-w-[75%] p-3 rounded text-sm ${
											message.role === "user"
												? "bg-primary text-primary-foreground"
												: "bg-muted"
										}`}
									>
										<div className="leading-relaxed">
											<Markdown>{message.content}</Markdown>
										</div>
									</div>
								</div>
							))}
							{(status === 'submitted' || status === 'streaming') && (
								<div className="flex justify-start">
									<div className="bg-muted p-3 rounded">
										<div className="flex items-center gap-2">
											<Loader2 className="h-4 w-4 animate-spin" />
											<span className="text-sm text-muted-foreground">
												Thinking...
											</span>
										</div>
									</div>
								</div>
							)}
							{error && (
								<div className="flex justify-center">
									<div className="bg-destructive/10 text-destructive rounded p-3 text-sm border border-destructive/20">
										{error.message}
									</div>
								</div>
							)}
							{/* Invisible element to scroll to */}
							<div ref={messagesEndRef} />
						</div>
					</ScrollArea>
				)}
			</div>

			{/* Chat Input - Sticky at bottom */}
			<div className="sticky bottom-0 border-t bg-background p-3 z-10">
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Textarea
						value={input}
						onChange={handleInputChange}
						placeholder={config.placeholder || "Type your message..."}
						className="flex-1 min-h-[40px] max-h-24 resize-none text-sm"
						disabled={isLoadingMessages}
						onKeyDown={e => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSubmit(e)
							}
						}}
					/>
					<Button
						type="submit"
						disabled={status !== 'ready' || !input.trim() || isLoadingMessages}
						size="sm"
						className="h-10 w-10 p-0"
					>
						{status === 'submitted' || status === 'streaming' ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-4 w-4" />
						)}
					</Button>
				</form>
			</div>
		</div>
	)
}