require('dotenv').config();
const https = require('https');
const express = require('express');
const app = express();
const line = require('@line/bot-sdk');
const drive = google.drive({ version: "v3", auth: jwtClient });

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

app.post("/webhook", (req, res, next) => {
    res.send("HTTP POST request sent to the webhook URL!");

    const replyMessages = [];
    const messageIds = [];

    console.log("messageId", req.body.events[0].message.id);
    // store message ids as array
    if (req.body.events && req.body.events.length > 0) {
        messageIds.push(req.body.events[0].message.id);
        console.log("Stored message IDs:", messageIds);
    }
    console.log("messageIds", messageIds);

    console.log("**************************************");
    console.log("length", req.body.events.length);
    console.log("++++++++++++++++++++++++++++++++++++++");
    console.log(req.body);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    console.log(req.body.events);
    console.log("--------------------------------");
    console.log(req.body.events[0].message);

    if (req.body.events[0].type === "message"){

        //req.body.events[0].message.typeがtextかどうかで分岐
        if (req.body.events[0].message.type === "text"){
            //textだった場合は、その内容をそのまま返す
            replyMessages.push({
                    "type" : "text",
                    "text" : req.body.events[0].message.text
            }); 
        }else{
            const messageId = req.body.events[0].message.id;
            client.getMessageContent(messageId)
            .then((stream) => {
                stream.on('data', (chunk) => {
                    console.log("chunk", chunk);
                });
                stream.on('error', (err) => {
                    console.error("error", err);
                });
            });
            //textじゃない場合は、固定の文字列を返す
            replyMessages.push({
                "type" : "text",
                "text" : "テキストを入力してください"
            })
        };

        // console.log(replyMessages);
        // console.log("token", TOKEN);

        const dataString = JSON.stringify({
            replyToken: req.body.events[0].replyToken,
            messages: replyMessages
        }); 

        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + TOKEN
        };

        const webhookOption = {
            "hostname": "api.line.me",
            "path": "/v2/bot/message/reply",
            "method": "POST",
            "headers": headers,
            "body": dataString
        }

        const request = https.request(webhookOption, (res) => {
            res.on("data", (d) => {
                process.stdout.write(d);
            });
        });

        request.on("error", (err) => {
            console.error(err);
        });

        request.write(dataString);
        request.end();
    }
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});