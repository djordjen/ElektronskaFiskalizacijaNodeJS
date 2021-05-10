module.exports = {
    Taxpayer: {
        TIN: '12345678',                    // Taxpayer Identification Number (PIB)
        BU: 'xx123xx123',                   // Business Unit Code (PJ)
        CR: 'si747we972',                   // Cash Register (ENU)
        SW: 'ss123ss123',                   // Software Code
        OP: 'oo123oo123'                    // Operator Code
    },
    Seller: {
        IDType: 'TIN',
        Name: 'Test d.o.o.'
    },
    Certificate: {
        pfxPath: './certificates/CoreitPecatSoft.pfx',
        pfxPassword: '123456',
        privateKeyPath: './certificates/private.key',
        publicCertPath: './certificates/certificate.pem'
    }
};
