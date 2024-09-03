-- db shtuff
DROP DATABASE IF EXISTS eventdb;
CREATE DATABASE eventdb;
\c eventdb;

-- table shtuff
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
	"email" text UNIQUE,
	"username" text NOT NULL UNIQUE,
	"hashed_password" text NOT NULL,
	"address" text NOT NULL,
	"session_token" text NOT NULL,
	"email_opt_in" boolean,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "events" (
	"id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
	"is_private" boolean NOT NULL,
	"yt_link" text,
	"admin_id" bigint NOT NULL,
	"event_name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp without time zone NOT NULL,
	"address" text NOT NULL,
	"event_date" timestamp without time zone NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tags" (
	"id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
	"name" text NOT NULL,
	"event_id" bigint NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "private_event_members" (
	"user_id" bigint NOT NULL,
	"event_id" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "event_registrants" (
	"event_id" bigint NOT NULL,
	"user_id" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "comments" (
	"id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
	"body" text NOT NULL,
	"poster_id" bigint NOT NULL,
	"event_id" bigint NOT NULL,
	"created_at" timestamp without time zone NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "direct_message" (
	"id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
	"body" text NOT NULL,
	"poster_id" bigint NOT NULL,
	"recepient_id" bigint NOT NULL,
	"sent_at" timestamp without time zone NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pending_invitation" (
	"id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
	"event_id" bigint NOT NULL,
	"url_hash" text NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "social_media_share" (
	"id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
	"event_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"platform" text NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "blocked_users" (
	"blocker_id" bigint NOT NULL,
	"blocked_id" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
	"user_id" bigint NOT NULL,
	"event_id" bigint,
	"body" text NOT NULL,
	"created_at" timestamp without time zone NOT NULL,
	PRIMARY KEY ("id")
);


ALTER TABLE "events" ADD CONSTRAINT "events_fk3" FOREIGN KEY ("admin_id") REFERENCES "users"("id");
ALTER TABLE "tags" ADD CONSTRAINT "tags_fk2" FOREIGN KEY ("event_id") REFERENCES "events"("id");
ALTER TABLE "private_event_members" ADD CONSTRAINT "private_event_members_fk0" FOREIGN KEY ("user_id") REFERENCES "users"("id");

ALTER TABLE "private_event_members" ADD CONSTRAINT "private_event_members_fk1" FOREIGN KEY ("event_id") REFERENCES "events"("id");
ALTER TABLE "event_registrants" ADD CONSTRAINT "event_registrants_fk0" FOREIGN KEY ("event_id") REFERENCES "events"("id");

ALTER TABLE "event_registrants" ADD CONSTRAINT "event_registrants_fk1" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "comments" ADD CONSTRAINT "comments_fk2" FOREIGN KEY ("poster_id") REFERENCES "users"("id");

ALTER TABLE "comments" ADD CONSTRAINT "comments_fk3" FOREIGN KEY ("event_id") REFERENCES "events"("id");
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_fk2" FOREIGN KEY ("poster_id") REFERENCES "users"("id");

ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_fk3" FOREIGN KEY ("recepient_id") REFERENCES "users"("id");
ALTER TABLE "pending_invitation" ADD CONSTRAINT "pending_invitation_fk1" FOREIGN KEY ("event_id") REFERENCES "events"("id");
ALTER TABLE "social_media_share" ADD CONSTRAINT "social_media_share_fk1" FOREIGN KEY ("event_id") REFERENCES "events"("id");

ALTER TABLE "social_media_share" ADD CONSTRAINT "social_media_share_fk2" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_fk0" FOREIGN KEY ("blocker_id") REFERENCES "users"("id");

ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_fk1" FOREIGN KEY ("blocked_id") REFERENCES "users"("id");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_fk1" FOREIGN KEY ("user_id") REFERENCES "users"("id");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_fk2" FOREIGN KEY ("event_id") REFERENCES "events"("id");

ALTER TABLE "private_event_members" DROP CONSTRAINT IF EXISTS "private_event_members_event_id_key";
ALTER TABLE "private_event_members" ADD CONSTRAINT "private_event_members_user_event_unique" UNIQUE ("user_id", "event_id");

ALTER TABLE "users" ADD COLUMN "facebook_id" VARCHAR(255), ADD COLUMN "first_name" VARCHAR(255), ADD COLUMN "last_name" VARCHAR(255);
