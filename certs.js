const fs = require('fs')
const pem = require('pem');
const NodeRSA = require('node-rsa');

const PFX_PATH = __dirname + '/CoreitPecatSoft.pfx';
const PFX_PASSWORD = '123456';
const PRIVATE_KEY_PATH = __dirname + '/private.key';
const PUBLIC_CERT_PATH = __dirname + '/certificate.pem';

module.exports = {

    extractCertificates: function () {
        const pfx = fs.readFileSync(PFX_PATH);
        pem.readPkcs12(pfx, {p12Password: PFX_PASSWORD}, (err, cert) => {

            // Saving Public Key
            fs.writeFileSync(PUBLIC_CERT_PATH, cert.cert);

            // Obtaining Private Key
            const RSAKey = cert.key;
            const key = new NodeRSA(RSAKey);
            const privateKey = key.exportKey('pkcs8');

            // Saving Private Key
            fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
        });
    },

    privateKey: function () {
        return fs.readFileSync(PRIVATE_KEY_PATH).toString();
    },

    publicCertificate: function () {
        // Removing placeholder parts from certificate.pem file
        return fs.readFileSync(PUBLIC_CERT_PATH).toString()
            .replace('-----BEGIN CERTIFICATE-----', '')
            .replace('-----END CERTIFICATE-----', '')
            .trim();
    }
}
