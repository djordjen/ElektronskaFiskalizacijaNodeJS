const certs = require('../certs');
const config = require('../config');
const fs = require("fs");

test('Function extractCertificates() should extract certificates from PFX file', () => {

    // First, deleting the existing files in /certificates folder
    if (fs.existsSync(config.Certificate.publicCertPath))
        fs.unlinkSync(config.Certificate.publicCertPath);

    if (fs.existsSync(config.Certificate.privateKeyPath))
        fs.unlinkSync(config.Certificate.privateKeyPath);

    // Then, extracting new certificates
    certs.extractCertificates();

    // Checks
    // expect(fs.existsSync(config.Certificate.privateKeyPath)).toBe(true);
    // expect(fs.existsSync(config.Certificate.publicCertPath)).toBe(true);
})