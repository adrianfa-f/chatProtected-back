import webPush, { PushSubscription } from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurar VAPID keys desde .env
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!
};

webPush.setVapidDetails(
    'mailto:contacto@tudominio.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Interfaz para la suscripción
interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function savePushSubscription(userId: string, subscription: PushSubscriptionData) {
    await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: subscription as any } // Forzar tipo para Prisma
    });
}

export async function sendPushNotification(userId: string, message: string, chatId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushSubscription: true }
    });

    if (!user || !user.pushSubscription) return;

    // Convertir el objeto JSON a PushSubscription
    const subscription = user.pushSubscription as unknown as PushSubscription;

    const payload = JSON.stringify({
        title: 'Nuevo mensaje',
        body: message,
        icon: '/icon-192x192.png',
        data: { url: `${process.env.FRONTEND_URL}/chat/${chatId}` }
    });

    try {
        await webPush.sendNotification(subscription, payload);
    } catch (error: any) {
        console.error('Error enviando notificación push:', error);
        // Eliminar suscripción inválida
        if (error.statusCode === 410) {
            await prisma.user.update({
                where: { id: userId },
                data: { pushSubscription: null as any } // Forzar tipo para Prisma
            });
        }
    }
}