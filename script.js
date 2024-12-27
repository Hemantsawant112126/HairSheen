const express = require('express');
const bodyParser = require('body-parser');
const paytmchecksum = require('paytmchecksum');
const dotenv = require('dotenv');

// Initialize dotenv
dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Paytm Credentials from your Paytm Merchant Account
const paytmMerchantKey = process.env.PAYTM_MERCHANT_KEY;
const paytmMerchantId = process.env.PAYTM_MERCHANT_ID;
const paytmWebsite = process.env.PAYTM_WEBSITE;
const paytmIndustryType = process.env.PAYTM_INDUSTRY_TYPE;

// Route to get payment data from the frontend
app.post('/payment', (req, res) => {
    const orderId = 'ORDER_' + Date.now(); // Unique Order ID
    const customerId = req.body.customerId; // Get customer ID from frontend (can be static or dynamic)

    const txnAmount = req.body.amount; // Amount to be paid
    const data = {
        MID: paytmMerchantId,
        WEBSITE: paytmWebsite,
        INDUSTRY_TYPE_ID: paytmIndustryType,
        CHANNEL_ID: 'WEB',
        ORDER_ID: orderId,
        CUST_ID: customerId,
        TXN_AMOUNT: txnAmount,
        EMAIL: req.body.email,
        MOBILE_NO: req.body.mobileNo,
        CALLBACK_URL: process.env.PAYTM_CALLBACK_URL, // URL to receive payment response
    };

    // Generate checksum hash
    paytmchecksum.generateSignature(data, paytmMerchantKey).then((checksum) => {
        data.CHECKSUMHASH = checksum;

        // Send the data to Paytm
        res.json({
            txnData: data,
        });
    });
});

// Handle Paytm Callback after transaction
app.post('/payment/callback', (req, res) => {
    const response = req.body;
    const checksum = response.CHECKSUMHASH;

    // Validate checksum
    const isValidChecksum = paytmchecksum.verifySignature(response, paytmMerchantKey, checksum);
    
    if (isValidChecksum) {
        if (response.STATUS === 'TXN_SUCCESS') {
            res.send('Payment Successful');
        } else {
            res.send('Payment Failed');
        }
    } else {
        res.send('Checksum Mismatch');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
