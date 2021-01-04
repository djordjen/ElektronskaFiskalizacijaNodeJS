const builder = require('xmlbuilder2');
const tools = require('./tools');
const certs = require('./certs');
const config = require('./config');
const fs = require("fs");


const signAndEnvelopeXML = (xmlData, nodeName, uri) => {
    // Signing XML
    var SignedXml = require('xml-crypto').SignedXml;
    var sig = new SignedXml();
    sig.addReference(`//*[local-name(.)='${nodeName}']`,
        ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'],
        'http://www.w3.org/2001/04/xmlenc#sha256', uri, "", "", false);

    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    sig.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#';
    sig.digestAlgorithm = 'http://www.w3.org/2001/04/xmlenc#sha256';
    sig.signingKey = certs.privateKey();
    sig.keyInfoProvider = {
        getKeyInfo: (key, prefix) => {
            return `<X509Data><X509Certificate>${certs.publicCertificate()}</X509Certificate></X509Data>`
        }
    };
    sig.computeSignature(xmlData);
    const xmlSigned = sig.getSignedXml();

    // Enveloping XML
    const xmlEnveloped = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body>${
        xmlSigned
    }</soapenv:Body></soapenv:Envelope>`;

    return xmlEnveloped;
}

module.exports = {

    // Passing in the `invoice` object, with line items in order to get the fully signed and enveloped XML
    registerInvoiceRequest: function (invoice) {

        // Preparing data
        invoice['TotPriceWoVAT'] = 0;
        invoice['TotVATAmt'] = 0;
        invoice['TotPrice'] = 0;

        let taxes = {}

        invoice.items.map(i => {
            // Calculating summaries for line items
            i.UPA = tools.roundNo(i.UPB * (1 + i.VR / 100));
            i.PB = tools.roundNo(i.UPB * i.Q);
            i.PA = tools.roundNo(i.UPA * i.Q);
            i.VA = tools.roundNo(i.PA - i.PB);

            // Updating Invoice summary
            invoice.TotPriceWoVAT = tools.roundNo(invoice.TotPriceWoVAT + i.PB);
            invoice.TotVATAmt = tools.roundNo(invoice.TotVATAmt + i.VA);
            invoice.TotPrice = tools.roundNo(invoice.TotPrice + i.PA);

            // Adding info to taxes object
            let tax = taxes[i.VR.toFixed(2)]
            if (!tax) {
                taxes[i.VR.toFixed(2)] = {
                    NumOfItems: 1,
                    PriceBefVAT: i.PB,
                    VATRate: i.VR,
                    VATAmt: i.VA
                }
            } else {
                tax.NumOfItems = tax.NumOfItems + 1;
                tax.PriceBefVAT = tax.PriceBefVAT + i.PB;
                tax.VATAmt = tax.VATAmt + i.VA;
            }
        });

        const currentDateTime = tools.generateDateTime();
        const currentYear = new Date().getFullYear();

        const iicData = tools.generateIIC(
            config.Taxpayer.TIN,
            currentDateTime,
            invoice.ORD,
            config.Taxpayer.BU,
            config.Taxpayer.CR,
            config.Taxpayer.SW,
            invoice.TotPrice.toFixed(2)
        );

        const invoiceData = {
            RegisterInvoiceRequest: {
                '@xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
                '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                '@xmlns': 'https://efi.tax.gov.me/fs/schema',
                '@Id': 'Request',
                '@Version': '1',
                Header: {
                    '@UUID': tools.generateUUID(),
                    '@SendDateTime': currentDateTime,
                },
                Invoice: {
                    '@TypeOfInv': 'NONCASH',
                    '@IsSimplifiedInv': 'false',
                    '@IssueDateTime': currentDateTime,
                    '@InvNum': `${config.Taxpayer.BU}/${invoice.ORD}/${currentYear}/${config.Taxpayer.CR}`,
                    '@InvOrdNum': invoice.ORD,
                    '@TCRCode': config.Taxpayer.CR,
                    '@IsIssuerInVAT': 'true',
                    '@TotPriceWoVAT': invoice.TotPriceWoVAT.toFixed(2),
                    '@TotVATAmt': invoice.TotVATAmt.toFixed(2),
                    '@TotPrice': invoice.TotPrice.toFixed(2),
                    '@OperatorCode': config.Taxpayer.OP,
                    '@BusinUnitCode': config.Taxpayer.BU,
                    '@SoftCode': config.Taxpayer.SW,
                    '@IIC': iicData.iic,
                    '@IICSignature': iicData.iicSignature,
                    '@IsReverseCharge': 'false',
                    PayMethods: {
                        PayMethod: {
                            '@Type': 'ACCOUNT',
                            '@Amt': invoice.TotPrice.toFixed(2)
                        }
                    },
                    Seller: {
                        '@IDType': config.Seller.IDType,
                        '@IDNum': config.Taxpayer.TIN,
                        '@Name': config.Seller.Name
                    },
                    Buyer: {
                        '@IDType': invoice.Buyer.IDType,
                        '@IDNum': invoice.Buyer.IDNum,
                        '@Name': invoice.Buyer.Name
                    },
                    Items: {I: []},
                    SameTaxes: {SameTax: []}
                }
            }
        };

        Object.entries(taxes).forEach(([_, val]) => {
            invoiceData.RegisterInvoiceRequest.Invoice.SameTaxes.SameTax.push({
                '@NumOfItems': val.NumOfItems,
                '@PriceBefVAT': val.PriceBefVAT.toFixed(2),
                '@VATRate': val.VATRate.toFixed(2),
                '@VATAmt': val.VATAmt.toFixed(2)
            })
        });

        Object.entries(invoice.items).forEach(([_, val]) => {
            invoiceData.RegisterInvoiceRequest.Invoice.Items.I.push({
                '@N': val.N,
                '@C': val.C,
                '@U': val.U,
                '@Q': val.Q,
                '@UPB': val.UPB.toFixed(2),
                '@UPA': val.UPA.toFixed(2),
                '@R': val.R,
                '@RR': val.RR,
                '@PB': val.PB.toFixed(2),
                '@VR': val.VR.toFixed(2),
                '@VA': val.VA.toFixed(2),
                '@PA': val.PA.toFixed(2)
            });
        });

        const xmlObj = builder.create(invoiceData);
        const xmlDoc = xmlObj.root().toString();

        // const xml = xmlObj.end({prettyPrint: true});
        // console.log(xml);

        const signedAndEnvelopedXML = signAndEnvelopeXML(xmlDoc, 'RegisterInvoiceRequest', '#Request');
        fs.writeFileSync('request.xml', signedAndEnvelopedXML);

        const link = `https://efitest.tax.gov.me/ic/#/verify?iic=${
            iicData.iic
        }&tin=${
            config.Taxpayer.TIN
        }&crtd=${
            currentDateTime
        }&ord=${
            invoice.ORD
        }&bu=${
            config.Taxpayer.BU
        }&cr=${
            config.Taxpayer.CR
        }&sw=${
            config.Taxpayer.SW
        }&prc=${
            invoice.TotPrice
        }`;

        return {xml: signedAndEnvelopedXML, iic: iicData.iic, link: link};
    }
}
