"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToTokens = sendToTokens;
exports.sendToTopic = sendToTopic;
const messaging_1 = require("firebase-admin/messaging");
async function sendToTokens(params) {
    const tokens = (params.tokens || []).filter(Boolean);
    if (tokens.length === 0)
        return;
    await (0, messaging_1.getMessaging)().sendEachForMulticast({
        tokens,
        notification: { title: params.title, body: params.body },
        data: params.data,
    });
}
async function sendToTopic(params) {
    await (0, messaging_1.getMessaging)().send({
        topic: params.topic,
        notification: { title: params.title, body: params.body },
        data: params.data,
    });
}
