CREATE TABLE "step_section" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"idea_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "step_todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"section_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "step_section" ADD CONSTRAINT "step_section_idea_id_idea_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_todo" ADD CONSTRAINT "step_todo_section_id_step_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."step_section"("id") ON DELETE cascade ON UPDATE no action;