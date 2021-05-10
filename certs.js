const fs = require('fs')
const pem = require('pem');
const NodeRSA = require('node-rsa');
const config = require('./config');

module.exports = {

    extractCertificates: function () {
        const pfx = fs.readFileSync(config.Certificate.pfxPath);
        pem.readPkcs12(pfx, {p12Password: config.Certificate.pfxPassword}, (err, cert) => {

            // Saving Public Key
            fs.writeFileSync(config.Certificate.publicCertPath, cert.cert);

            // Obtaining Private Key
            const RSAKey = cert.key;
            const key = new NodeRSA(RSAKey);
            const privateKey = key.exportKey('pkcs8');

            // Saving Private Key
            fs.writeFileSync(config.Certificate.privateKeyPath, privateKey);
        });
    },

    privateKey: function () {
        return fs.readFileSync(config.Certificate.privateKeyPath).toString();
    },

    publicCertificate: function () {
        // Removing placeholder parts from certificate.pem file
        return fs.readFileSync(config.Certificate.publicCertPath).toString()
            .replace('-----BEGIN CERTIFICATE-----', '')
            .replace('-----END CERTIFICATE-----', '')
            .trim();
    }
}
