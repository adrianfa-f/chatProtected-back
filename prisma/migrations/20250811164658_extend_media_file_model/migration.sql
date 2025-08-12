/*
  Warnings:

  - Added the required column `chatId` to the `MediaFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverId` to the `MediaFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `MediaFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MediaFile" ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "receiverId" TEXT NOT NULL,
ADD COLUMN     "senderId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'delivered';

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
