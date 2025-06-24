"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const sodium_plus_1 = require("sodium-plus");
let sodium;
const initSodium = async () => {
    if (!sodium)
        sodium = await sodium_plus_1.SodiumPlus.auto();
    return sodium;
};
exports.CryptoService = {
    async generateKeyPair() {
        await initSodium();
        const keyPair = await sodium.crypto_box_keypair();
        return {
            publicKey: (await sodium.crypto_box_publickey(keyPair)).toString('base64'),
            privateKey: (await sodium.crypto_box_secretkey(keyPair)).toString('base64'),
        };
    },
    async hashPassword(password) {
        const bcrypt = await import('bcrypt');
        return bcrypt.hash(password, 12);
    },
    async comparePassword(password, hash) {
        const bcrypt = await import('bcrypt');
        return bcrypt.compare(password, hash);
    }
};
