CREATE TABLE "step_planning_chat" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idea_id" integer NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "step" ADD COLUMN "idea_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "step_planning_chat" ADD CONSTRAINT "step_planning_chat_idea_id_idea_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_planning_chat" ADD CONSTRAINT "step_planning_chat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_idea_id_idea_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE cascade ON UPDATE no action;