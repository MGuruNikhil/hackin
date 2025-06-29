CREATE TABLE "step_section_chat" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"section_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "idea_chat" ADD COLUMN "role" text NOT NULL;--> statement-breakpoint
ALTER TABLE "step_section_chat" ADD CONSTRAINT "step_section_chat_section_id_step_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."step_section"("id") ON DELETE cascade ON UPDATE no action;