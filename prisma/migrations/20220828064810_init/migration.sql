-- CreateEnum
CREATE TYPE "conversation_type" AS ENUM ('dm', 'group');

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "type" "conversation_type" NOT NULL,
    "name" TEXT,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "conversation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "text" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mime_types" (
    "mime" TEXT NOT NULL,
    "extenstion" TEXT NOT NULL,

    CONSTRAINT "mime_types_pkey" PRIMARY KEY ("mime")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "file_id" TEXT NOT NULL,
    "mime_type_id" TEXT NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_name_idx" ON "conversations"("name");

-- CreateIndex
CREATE INDEX "messages_text_idx" ON "messages"("text");

-- CreateIndex
CREATE INDEX "messages_conversation_id_member_id_idx" ON "messages"("conversation_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "mime_types_extenstion_key" ON "mime_types"("extenstion");

-- CreateIndex
CREATE INDEX "attachments_file_id_idx" ON "attachments"("file_id");

-- CreateIndex
CREATE INDEX "attachments_message_id_idx" ON "attachments"("message_id");

-- CreateIndex
CREATE INDEX "attachments_mime_type_id_idx" ON "attachments"("mime_type_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_mime_type_id_fkey" FOREIGN KEY ("mime_type_id") REFERENCES "mime_types"("mime") ON DELETE RESTRICT ON UPDATE CASCADE;
