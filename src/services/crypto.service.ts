import { SodiumPlus } from 'sodium-plus';

let sodium: SodiumPlus;

const initSodium = async () => {
    if (!sodium) sodium = await SodiumPlus.auto();
    return sodium;
};

export const CryptoService = {
    async generateKeyPair() {
        await initSodium();
        const keyPair = await sodium.crypto_box_keypair();
        return {
            publicKey: (await sodium.crypto_box_publickey(keyPair)).toString('base64'),
            privateKey: (await sodium.crypto_box_secretkey(keyPair)).toString('base64'),
        };
    },

    async hashPassword(password: string) {
        const bcrypt = await import('bcrypt');
        return bcrypt.hash(password, 12);
    },

    async comparePassword(password: string, hash: string) {
        const bcrypt = await import('bcrypt');
        return bcrypt.compare(password, hash);
    }
};