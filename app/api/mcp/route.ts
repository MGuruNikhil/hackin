import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { stepSectionChats, stepTodos } from "@/lib/schema";
import { getCurrentSession } from "@/lib/session";

const handler = createMcpHandler(server => {
  // Echo tool (example)
  server.tool(
    "echo",
    { message: z.string() },
    async ({ message }) => ({
      content: [{ type: "text", text: `Tool echo: ${message}` }],
    })
  );

  // Get section chat history (context API)
  server.tool(
    "getSectionChatHistory",
    { sectionId: z.string() },
    async ({ sectionId }) => {
      const { user } = await getCurrentSession();
      if (!user) {
        return {
          content: [{ type: "text", text: "Unauthorized" }],
          isError: true,
        };
      }
      if (!sectionId) {
        return {
          content: [{ type: "text", text: "Section ID is required" }],
          isError: true,
        };
      }
      const chatHistory = await db
        .select()
        .from(stepSectionChats)
        .where(eq(stepSectionChats.sectionId, Number.parseInt(sectionId)))
        .orderBy(stepSectionChats.createdAt);

      // Format chat history as needed
      return {
        content: chatHistory.map(chat => ({
          type: "text",
          text: chat.message, // adjust if your schema differs
        })),
      };
    }
  );

  // List section todos (todo API)
  server.tool(
    "listSectionTodos",
    { sectionId: z.string() },
    async ({ sectionId }) => {
      const { user } = await getCurrentSession();
      if (!user) {
        return {
          content: [
            { type: "text", text: "Unauthorized" }
          ],
          isError: true
        };
      }
      if (!sectionId) {
        return {
          content: [
            { type: "text", text: "Section ID is required" }
          ],
          isError: true
        };
      }
      const todos = await db
        .select({
          id: stepTodos.id,
          title: stepTodos.title,
          description: stepTodos.description,
          isCompleted: stepTodos.isCompleted,
          order: stepTodos.order,
          createdAt: stepTodos.createdAt,
        })
        .from(stepTodos)
        .where(eq(stepTodos.sectionId, Number.parseInt(sectionId)))
        .orderBy(stepTodos.order);
      return {
        content: [
          { type: "text", text: `Found ${todos.length} todos.` }
        ],
        todos
      };
    }
  );

  // Create a new todo in a section
  server.tool(
    "createSectionTodo",
    { sectionId: z.string(), title: z.string(), description: z.string().optional() },
    async ({ sectionId, title, description }) => {
      const { user } = await getCurrentSession();
      if (!user) {
        return {
          content: [
            { type: "text", text: "Unauthorized" }
          ],
          isError: true
        };
      }
      if (!sectionId || !title) {
        return {
          content: [
            { type: "text", text: "Section ID and title are required" }
          ],
          isError: true
        };
      }
      const lastTodo = await db
        .select({ order: stepTodos.order })
        .from(stepTodos)
        .where(eq(stepTodos.sectionId, Number.parseInt(sectionId)))
        .orderBy(desc(stepTodos.order))
        .limit(1);
      const nextOrder = lastTodo.length > 0 && lastTodo[0].order !== null 
        ? lastTodo[0].order + 1 
        : 1;
      const [newTodo] = await db
        .insert(stepTodos)
        .values({
          title: title,
          description: description,
          sectionId: Number.parseInt(sectionId),
          order: nextOrder,
          isCompleted: false,
        })
        .returning();
      return {
        content: [
          { type: "text", text: `Todo created: ${newTodo.title}` }
        ],
        todo: newTodo
      };
    }
  );
});

export { handler as GET, handler as POST, handler as DELETE };
