const express = require('express');
const QRCode = require('qrcode');
const sharp = require('sharp');

const app = express();

// endpoint utama
app.get('/qrcode', async (req, res) => {
    const text = req.query.text || 'hello';
    const size = req.query.size || 300;
    const margin = parseInt(req.query.margin) || 1; // padding
    const color = req.query.color ? `#` + req.query.color.replace(`#`, ``) : '#000000ff';
    const bg = req.query.bg ? `#` + req.query.bg : '#ffffffff';

    if (!text) {
        return res.status(400).json({
            error: 'Parameter text wajib diisi'
        });
    }

    try {
        // generate QR dalam bentuk PNG buffer
        const qrImage = await QRCode.toBuffer(text, {
            width: parseInt(size),
            margin: margin, // ini paddingnya
            color: { dark: color, light: bg },
            errorCorrectionLevel: 'H'
        });

        if (req.query.logo) {
            const logoUrl = req.query.logo;

            // ambil logo dari URL
            const response = await fetch(logoUrl);
            const logoBuffer = await response.arrayBuffer();

            const logoSize = size * 0.2; // 25% dari QR

            // 3. resize logo
            const resizedLogo = await sharp(Buffer.from(logoBuffer))
                .resize(logoSize, logoSize)
                .toBuffer();

            const circleMask = Buffer.from(`
                <svg width="${logoSize}" height="${logoSize}">
                    <circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2}" fill="${bg}"/>
                </svg>
            `);

            const circleLogo = await sharp(resizedLogo)
                .composite([{ input: circleMask, blend: 'dest-in' }])
                .png()
                .toBuffer();

            const bgSize = logoSize + 5;

            const whiteCircle = Buffer.from(`
                <svg width="${bgSize}" height="${bgSize}">
                    <circle cx="${bgSize / 2}" cy="${bgSize / 2}" r="${bgSize / 2}" fill="${bg}"/>
                </svg>
            `);

            // 4. gabungkan
            const finalImage = await sharp(qrImage)
                .composite([
                    {
                        input: whiteCircle,
                        gravity: 'center',
                    },
                    {
                        input: circleLogo,
                        gravity: 'center'
                    }
                ])
                .png()
                .toBuffer();

            res.setHeader('Content-Type', 'image/png');
            return res.send(finalImage);
        }

        res.setHeader('Content-Type', 'image/png');
        res.send(qrImage);

    } catch (err) {
        res.status(500).json({
            error: 'Gagal generate QR Code'
        });
    }
});

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>QR Code API</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    background: #f5f5f5;
                }
                .container {
                    max-width: 800px;
                    margin: auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #2c3e50;
                }
                code {
                    background: #eee;
                    padding: 5px 8px;
                    border-radius: 5px;
                }
                a {
                    color: blue;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
                .example {
                    margin-bottom: 10px;
                    overflow:auto;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 QR Code API</h1>
                <p>API sederhana untuk generate QR Code dalam bentuk gambar (PNG).</p>

                <h2>📌 Endpoint</h2>
                <code>/qrcode?text=ISI_TEXT</code>

                <h2>⚙️ Parameter</h2>
                <ul>
                    <li><b>text</b> (wajib) → isi QR</li>
                    <li><b>size</b> (opsional) → ukuran (default: 300)</li>
                    <li><b>margin</b> (opsional) → padding (default: 2)</li>
                    <li><b>color</b> (opsional) → warna QR (default: black)</li>
                    <li><b>bg</b> (opsional) → background (default: white)</li>
                </ul>

                <h2>🔗 Contoh</h2>

                <div class="example">
                    <a href="/qrcode?text=HelloWorld" target="_blank">
                        Basic QR → /qrcode?text=HelloWorld
                    </a>
                </div>

                <div class="example">
                    <a href="/qrcode?text=Halo Dunia&size=400" target="_blank">
                        Dengan ukuran → /qrcode?text=Halo Dunia&size=400
                    </a>
                </div>

                <div class="example">
                    <a href="/qrcode?text=Custom Margin&margin=6" target="_blank">
                        Dengan padding → /qrcode?text=Custom Margin&margin=6
                    </a>
                </div>

                <div class="example">
                    <a href="/qrcode?text=Custom Color&color=0004ffff&bg=ffee00ff" target="_blank">
                        Custom warna → /qrcode?text=Custom Color&color=0004ffff&bg=ffee00ff
                    </a>
                </div>

                <div class="example">
                    <a href="/qrcode?text=Custom Logo&logo=https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPk_xDaJnm3ZL763fRERK4TDGeySaUQqmR6g&s" target="_blank">
                        Custom warna → /qrcode?text=Custom Logo&logo=https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPk_xDaJnm3ZL763fRERK4TDGeySaUQqmR6g&s
                    </a>
                </div>

                <h2>📷 Output</h2>
                <p>Endpoint akan langsung menghasilkan gambar QR (PNG).</p>

                <h2>🧠 Tips</h2>
                <ul>
                    <li>Gunakan margin ≥ 4 agar mudah di-scan</li>
                    <li>Gunakan kontras tinggi (hitam & putih)</li>
                </ul>

                <hr/>
                <p>Made with ❤️ using Node.js + Express + QRCode</p>
            </div>
        </body>
        </html>
    `);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});