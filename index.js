require('dotenv').config()
const fs = require('fs');

const tools = require('./tools');
const xmls = require('./xmls');

// Declaring Test Invoice object for sending to `PU`
const invoice = {
    ORD: 1,                                 // Invoice Ordinal Number
    Buyer: {
        IDType: 'TIN',
        IDNum: '12345678',
        Name: 'Test d.o.o.'
    },
    items: [                                // Invoice Items
        {
            N: 'Test artikal',              // Name of item (goods or services)
            C: '1234234',                   // Code of the item from the barcode or similar representation
            U: 'kom',                       // Unit of measure
            Q: 1,                           // Quantity
            UPB: 100.0,                     // Unit price before VAT is applied
            UPA: 121.0,                     // Unit price after VAT is applied
            R: 0,                           // Percentage of the rebate
            RR: 'true',                     // Is rebate reducing tax base amount? (true/false)
            PB: 100.0,                      // Total price of goods and services before the tax
            VR: 21.0,                       // VAT Rate
            VA: 21.0,                       // Amount of VAT for goods and services
            PA: 121.0                       // Price after applying VAT
        },
        {
            N: 'Maline',
            C: 'MAL-01',
            U: 'kg',
            Q: 0.321,
            UPB: 2.6,
            UPA: null,
            R: 0,
            RR: "true",
            PB: null,
            VR: 21.0,
            VA: null,
            PA: null
        },
        {
            N: 'Ugostiteljska usluga',
            C: 'USL-ABC',
            U: 'usl',
            Q: 2,
            UPB: 27.0,
            UPA: null,
            R: 0,
            RR: "true",
            PB: null,
            VR: 7.0,
            VA: null,
            PA: null
        }
    ]
};

// Creating XML file, signed and enveloped to be sent to PU
const {xml, iic, link} = xmls.registerInvoiceRequest(invoice);
console.log('IIC (IKOF):', iic);

const result = tools.sendToPU(xml);
result.then(
    resp => {
        fs.writeFileSync('response.xml', resp.data);

        // Parsing response XML into JavaScript object
        const {convert} = require('xmlbuilder2');
        const obj = convert(resp.data, {format: 'object'});
        console.log('FIC (JIKR):', obj['env:Envelope']['env:Body']['RegisterInvoiceResponse']['FIC']);

        console.log('Link:', link);

    }).catch(err => console.log(err))
return

// To extract Certificates from PFX, use function below
// certs.extractCertificates()
