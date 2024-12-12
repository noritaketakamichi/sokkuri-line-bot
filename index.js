require('dotenv').config();
const https = require('https');
const express = require('express');
const app = express();

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