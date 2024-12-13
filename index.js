require('dotenv').config();
const https = require('https');
const express = require('express');
const app = express();
const line = require('@line/bot-sdk');
// const drive = google.drive({ version: "v3", auth: jwtClient });

const client = new line.Client({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN
});

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.LINE_ACCESS_TOKEN;

app.use(express.json());
app.use(express.urlencoded({
    extended : true
}));

app.get("/", (req, res) => {
    res.sendStatus(200);
});

app.post("/webhook", async (req, res) => {
    console.log("--------webhook-------");
    try {
        // リクエストの検証
        if (!req.body.events || !req.body.events.length) {
            return res.status(400).send('No events found');
        }

        const event = req.body.events[0];
        const replyMessages = [];
        const messageIds = [];

        console.log("length", req.body.events.length);
        // メッセージIDの処理
        for (const event of req.body.events) {
            if (event.message && event.message.id) {
                messageIds.push(event.message.id);
                console.log("Stored message IDs:", messageIds);
            }
            // ... rest of your event handling code ...
        }

        // デバッグ用ログ
        // console.log("messageIds", messageIds);
        // console.log("event type:", event.type);
        // console.log("event message:", event.message);

        if (event.type === "message") {
            if (event.message.type === "text") {
                replyMessages.push({
                    "type": "text",
                    "text": event.message.text
                });
            } else {
                // 画像などテキスト以外のメッセージ処理
                const messageId = event.message.id;
                try {
                    const stream = await client.getMessageContent(messageId);
                    stream.on('data', (chunk) => {
                        console.log("chunk", chunk);
                    });
                    stream.on('error', (err) => {
                        console.error("error", err);
                    });
                } catch (error) {
                    console.error("Error getting message content:", error);
                }

                replyMessages.push({
                    "type": "text",
                    "text": "テキストを入力してください"
                });
            }

            const dataString = JSON.stringify({
                replyToken: event.replyToken,
                messages: replyMessages
            });

            const headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + TOKEN
            };

            // LINE APIへのリクエスト
            try {
                const webhookOption = {
                    "hostname": "api.line.me",
                    "path": "/v2/bot/message/reply",
                    "method": "POST",
                    "headers": headers,
                    "body": dataString
                };

                await new Promise((resolve, reject) => {
                    const request = https.request(webhookOption, (response) => {
                        let data = '';
                        response.on('data', (chunk) => {
                            data += chunk;
                        });
                        response.on('end', () => resolve(data));
                    });

                    request.on("error", reject);
                    request.write(dataString);
                    request.end();
                });

                // 最後にリクエストの成功を返す
                return res.status(200).send('OK');
            } catch (error) {
                console.error("Error sending reply:", error);
                return res.status(500).send('Error sending reply');
            }
        }

        // イベントがmessage以外の場合
        return res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});