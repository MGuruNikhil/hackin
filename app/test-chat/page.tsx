"use client"

import { useChat } from "@ai-sdk/react"

export default function TestChatPage() {
	const { messages, input, handleInputChange, handleSubmit } = useChat({
		api: "/api/test-chat",
	})

	return (
		<div className="max-w-2xl mx-auto p-4">
			<h1 className="text-xl font-bold mb-4">Test Chat</h1>
			
			<div className="space-y-4 mb-4">
				{messages.map(message => (
					<div key={message.id} className={`p-2 rounded ${
						message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
					}`}>
						<strong>{message.role}:</strong> {message.content}
					</div>
				))}
			</div>

			<form onSubmit={handleSubmit} className="flex gap-2">
				<input
					value={input}
					onChange={handleInputChange}
					placeholder="Type a message..."
					className="flex-1 p-2 border rounded"
				/>
				<button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
					Send
				</button>
			</form>
		</div>
	)
}