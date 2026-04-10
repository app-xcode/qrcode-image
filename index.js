const express = require('express');
const QRCode = require('qrcode');

const app = express();

// endpoint utama
app.get('/qrcode', async (req, res) => {
    const text = req.query.text;
    const size = req.query.size || 300;
    const margin = parseInt(req.query.margin) || 1; // padding

    if (!text) {
        return res.status(400).json({
            error: 'Parameter text wajib diisi'
        });
    }

    try {
        // generate QR dalam bentuk PNG buffer
        const qrImage = await QRCode.toBuffer(text, {
            width: parseInt(size),
            margin: margin // ini paddingnya
        });

        res.setHeader('Content-Type', 'image/png');
        res.send(qrImage);

    } catch (err) {
        res.status(500).json({
            error: 'Gagal generate QR Code'
        });
    }
});

app.get('/', (req, res) => {
    res.send('QR Code API is running 🚀');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});