const uuid = require('uuid');
const dateFormat = require('dateformat');
const certs = require('./certs')
const crypto = require('crypto');
const md5 = require('md5');
const axios = require('axios');
const https = require('https');

module.exports = {

    generateUUID: function () {
        return uuid.v4();
    },

    generateDateTime: function () {
        const now = new Date().toLocaleString("en-US", {timeZone: "Europe/Podgorica"});
        return dateFormat(now, 'yyyy-mm-dd"T"HH:MM:ssp');
    },

    generateIIC: function (taxpayerID, currentDateTime, invoiceOrd, businessUnit, enuCode, softwareCode, totalPrice) {
        const dataElement = `${taxpayerID}|${currentDateTime}|${invoiceOrd}|${businessUnit}|${enuCode}|${softwareCode}|${totalPrice}`;
        const iicSignature = crypto.sign('sha256', Buffer.from(dataElement), {
            key: certs.privateKey(),
            padding: crypto.constants.RSA_PKCS1_PADDING
        });

        const iic = md5(iicSignature)
        return {
            iic, iicSignature: iicSignature.toString('hex')
        };
    },

    sendToPU: async function (xmlData) {
        const agent = new https.Agent({rejectUnauthorized: false});
        return await axios.post('https://efitest.tax.gov.me:443/fs-v1', xmlData,
            {
                headers: {'Content-Type': 'text/xml'},
                httpsAgent: agent
            });
    },

    roundNo: function (x) {
        return Math.round((x + Number.EPSILON) * 100) / 100;
    }
};
