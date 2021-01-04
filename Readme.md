# Elektronska fiskalizacija u NodeJS-u

### Bazirana na Python [primjeru](https://github.com/djordjen/ElektronskaFiskalizacijaPython) od ranije 🚀

---

> S' obzirom da sam početnik u NodeJS-u - nemojte zamjeriti ako naiđete na grešku, već budite slobodni poslati _Pull Request_. 😊

---

## 0️⃣ Priprema

Ključna podešavanja se nalaze u fajlovima **config.js** i **certs.js**. 

U [config.js](config.js) definišu se detalji vezani za poslovni subjekt koji generiše i šalje fakture.

```javascript
Taxpayer: {
    TIN: '12345678',               // Taxpayer Identification Number (PIB)
    BU: 'xx123xx123',              // Business Unit Code (PJ)
    CR: 'si747we972',              // Cash Register (ENU)
    SW: 'ss123ss123',              // Software Code
    OP: 'oo123oo123'               // Operator Code
},
Seller: {
    IDType: 'TIN',
    Name: 'Test d.o.o.'
}
```

U [certs.js](certs.js) definišu se detalji vezani za sertifikat:

```javascript
const PFX_PATH = __dirname + '/CoreitPecatSoft.pfx';
const PFX_PASSWORD = '123456';
const PRIVATE_KEY_PATH = __dirname + '/private.key';
const PUBLIC_CERT_PATH = __dirname + '/certificate.pem';
```

Ukoliko imate **PFX** fajl, odgovarajuće sertifikate možete eksport-ovati upotrebom funkcije `extractCertificates()`. Program će sačuvati privatni i javni ključ na lokacije definisane konstantama: `PRIVATE_KEY_PATH` i `PUBLIC_CERT_PATH`.

> Radi jednostavnosti, sertifikati su već uključeni u ovaj test projekat i dostupni u lokalnom folderu. Inicijalna podešavanja su definisana za privredni subjekat **Test d.o.o.** i fiskalizacija prolazi i bez ikakvih izmjena ovih parametara.

---

## 1️⃣ Start

Program se može pokrenuti uobičajenom komandom:

```shell
node index.js
```

Rezultat pokretanja programa bez ikakvih modifikacija izgleda otprilike ovako:

```shell
node index.js
IIC (IKOF): 59159b4c4f59fcf957c156bdacbd96d2
FIC (JIKR): 51db05b7-a97c-4b47-b5a7-54e41ebc4f7e
Link: https://efitest.tax.gov.me/ic/#/verify?iic=59159b4c4f59fcf957c156bdacbd96d2&tin=12345678&crtd=2021-01-04T12:50:30+01:00&ord=1&bu=xx123xx123&cr=si747we972&sw=ss123ss123&prc=179.79
```

I to za bezgotovinski račun koji je definisan objektom **invoice** u [index.js](index.js) fajlu.

```javascript
const invoice = {
    ORD: 1,                       // Invoice Ordinal Number
    Buyer: {
        IDType: 'TIN',
        IDNum: '12345678',
        Name: 'Test d.o.o.'
    },
    items: [                      // Invoice Items
        {
            N: 'Test artikal',    // Name of item (goods or services)
            C: '1234234',         // Code of the item from the barcode or similar representation
            U: 'kom',             // Unit of measure
            Q: 1,                 // Quantity
            UPB: 100.0,           // Unit price before VAT is applied
            UPA: 121.0,           // Unit price after VAT is applied
            R: 0,                 // Percentage of the rebate
            RR: 'true',           // Is rebate reducing tax base amount? (true/false)
            PB: 100.0,            // Total price of goods and services before the tax
            VR: 21.0,             // VAT Rate
            VA: 21.0,             // Amount of VAT for goods and services
            PA: 121.0             // Price after applying VAT
        },
        { N: 'Maline', C: 'MAL-01', U: 'kg', Q: 0.321, UPB: 2.6, UPA: null,
          R: 0, RR: "true", PB: null, VR: 21.0, VA: null, PA: null },
        { N: 'Ugostiteljska usluga', C: 'USL-ABC', U: 'usl', Q: 2, UPB: 27.0, UPA: null,
          R: 0, RR: "true", PB: null, VR: 7.0, VA: null, PA: null }
    ]
};
```

Radi jednostavnosti, nijesam kalkulisao rabat, već ostavio inicijalnu vrijednost **0**, kao i parametar **RR** na **true**. To će, vjerovatno, biti dopunjeno u nekoj narednoj verziji.

Mogao sam preskočiti svojstva koja nose inicijalnu vrijednost `null` (te vrijednosti se svakako kalkulišu kasnije, u okviru funkcije `registerInvoiceRequest()`, međutim htio sam da zadržim striktan raspored parametara).

> Funkcije su pomalo raštrkane, `.env` fajl je samo *placeholder* i sve je to još uvijek u fazi prototipa, ali ako vrijeme dozvoli - biće dovedeno u red. ☺

