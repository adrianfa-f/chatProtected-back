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
    const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh
        }
    };

    await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: subscriptionData }
    });
}

// Modificar la función sendPushNotification
export async function sendPushNotification(userId: string, message: string, chatId: string, senderName: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushSubscription: true }
    });

    // 4. Verificar y castear explícitamente el tipo
    const subscriptionData = user?.pushSubscription as unknown as PushSubscriptionData | null;

    if (!subscriptionData) return;

    // 5. Crear objeto de suscripción compatible con web-push
    const subscription: PushSubscription = {
        endpoint: subscriptionData.endpoint,
        expirationTime: null,
        keys: {
            auth: subscriptionData.keys.auth,
            p256dh: subscriptionData.keys.p256dh
        }
    };

    // 6. Crear payload
    const payload = JSON.stringify({
        title: senderName,
        body: 'Nuevo mensaje',
        icon: '/icon-192x192.png',
        data: {
            url: `${process.env.FRONTEND_URL}/chat/${chatId}`,
            chatId: chatId
        }
    });

    try {
        console.log(`[Push] Enviando notificación a ${userId}`);
        await webPush.sendNotification(subscription, payload);
        console.log(`[Push] Notificación enviada con éxito a ${userId}`);
    } catch (error: any) {
        console.error('[Push] Error enviando notificación:', error);
        if (error.statusCode === 410) {
            console.log(`[Push] Eliminando suscripción inválida para ${userId}`);
            // 7. Actualizar usando 'set: null' para evitar errores de tipo
            await prisma.user.update({
                where: { id: userId },
                data: {
                    pushSubscription: {
                        set: null
                    } as any
                }
            });
        }
    }
}