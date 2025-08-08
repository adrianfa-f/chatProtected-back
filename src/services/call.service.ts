import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default {
    async createCall(
        fromId: string,
        toId: string,
        status: 'missed' | 'rejected' | 'answered',
        startedAt?: Date,
        endedAt?: Date
    ) {
        const data: any = {
            fromUserId: fromId,
            toUserId: toId,
            status: status
        };

        if (status === 'answered') {
            data.startedAt = startedAt;
            if (endedAt) {
                data.endedAt = endedAt;
            }
        }

        return await prisma.call.create({ data });
    },

    async getCallsForUser(userId: string) {
        return await prisma.call.findMany({
            where: {
                OR: [
                    { fromUserId: userId },
                    { toUserId: userId }
                ]
            },
            include: {
                fromUser: { select: { id: true, username: true } },
                toUser: { select: { id: true, username: true } }
            },
            orderBy: {
                startedAt: 'desc'
            }
        });
    }
};
