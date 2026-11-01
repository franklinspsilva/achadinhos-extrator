const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(express.json());

// Inicializa a IA usando a variável de ambiente configurada
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/processar-achadinho', async (req, res) => {
    const { url, plataforma, precoEstimado } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Nenhuma URL informada.' });
    }

    let browser;
    let tituloProduto = 'Achadinho Imperdível';
    let precoProduto = precoEstimado || '0.00';

    try {
        // Configuração do Puppeteer otimizada para o ambiente Serverless do Vercel
        const executablePath = await chromium.executablePath();
        
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`Acessando link para extração: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

        const dadosExtraidos = await page.evaluate(() => {
            const tituloElement = document.querySelector('h1') || document.querySelector('meta[property="og:title"]');
            const titulo = tituloElement ? (tituloElement.innerText || tituloElement.content) : '';
            
            let preco = '';
            const precoElement = document.querySelector('.pqH2JD') || document.querySelector('.text-2xl') || document.querySelector('span[class*="price"]');
            if (precoElement) {
                preco = precoElement.innerText.replace('R$', '').trim();
            }

            return { titulo: titulo.trim(), preco };
        });

        if (dadosExtraidos.titulo) tituloProduto = dadosExtraidos.titulo;
        if (dadosExtraidos.preco && dadosExtraidos.preco !== '0.00') precoProduto = dadosExtraidos.preco;

        await browser.close();
    } catch (err) {
        if (browser) await browser.close();
        console.log('Aviso: Extração via Puppeteer pulada ou bloqueada, prosseguindo com dados base:', err.message);
    }

    // 2. Gera a Copy Comercial Profissional com a IA do Gemini
    try {
        const prompt = `Crie uma copy comercial vendedora e cativante para redes sociais (Instagram/WhatsApp) para o seguinte produto de achados de afiliado:
        - Produto: ${tituloProduto}
        - Plataforma: ${plataforma || 'Shopee'}
        - Preço: R$ ${precoProduto}
        
        A estrutura deve conter:
        1. Um título chamativo com emojis.
        2. Uma breve descrição destacando os benefícios para o dia a dia.
        3. Informação clara do preço.
        4. Chamada para ação forte (CTA) convidando para garantir no link.
        Mantenha a linguagem leve, amigável e vendedora.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const copyGerada = response.text;

        return res.json({
            success: true,
            titulo: tituloProduto,
            preco: precoProduto,
            copyPronta: copyGerada
        });

    } catch (aiErr) {
        console.error('Erro ao gerar copy com IA:', aiErr);
        return res.status(500).json({ error: 'Erro ao gerar a copy com a Inteligência Artificial.' });
    }
});

// Execução local para testes no PC
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Extrator rodando na porta ${PORT}`);
    });
}

// Essencial para o Vercel gerir a função serverless
module.exports = app;
