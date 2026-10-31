const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.post('/api/extrair', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Nenhuma URL informada.' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`Acessando o link: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const dadosExtraidos = await page.evaluate(() => {
            const tituloElement = document.querySelector('h1') || document.querySelector('meta[property="og:title"]');
            const titulo = tituloElement ? (tituloElement.innerText || tituloElement.content) : 'Produto Shopee';
            
            let preco = '0.00';
            const precoElement = document.querySelector('.pqH2JD') || document.querySelector('.text-2xl') || document.querySelector('span[class*="price"]');
            if (precoElement) {
                preco = precoElement.innerText.replace('R$', '').trim();
            }

            return { titulo: titulo.trim(), preco };
        });

        await browser.close();
        return res.json({ success: true, ...dadosExtraidos });

    } catch (err) {
        if (browser) await browser.close();
        console.error('Erro na extração:', err);
        return res.status(500).json({ error: 'Não foi possível extrair os dados automaticamente.', details: err.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Extrator rodando na porta ${PORT}`);
});
