const express = require('express');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(express.json());

// Permitir CORS para o painel da Fabi aceder sem bloqueios
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Rota de boas-vindas
app.get('/', (req, res) => {
    res.json({ status: 'Online', servico: 'Achadinhos Extrator Vercel' });
});

// Inicializa a IA
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/processar-achadinho', async (req, res) => {
    const { url, plataforma, precoEstimado, tituloManual, comissao_estimada, link_afiliado } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Nenhuma URL informada.' });
    }

    let tituloProduto = tituloManual || 'Achadinho Imperdível para o Lar';
    let precoProduto = precoEstimado || '0.00';
    let linkFinal = link_afiliado || url;

    // Resolvedor de links leve e nativo (segue o redirecionamento da Shopee/ML sem Puppeteer)
    if (url && (url.includes('s.shopee.com.br') || url.includes('mercadolivre.com/sec'))) {
        try {
            const responseFetch = await fetch(url, { 
                method: 'GET', 
                redirect: 'follow',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            linkFinal = responseFetch.url || linkFinal;
        } catch (errRedir) {
            console.log('Aviso: Não foi possível expandir o link automaticamente, mantendo o original.');
        }
    }

    // Se o usuário digitou um título manualmente, prioriza ele
    if (tituloManual) tituloProduto = tituloManual;

    // Gera a Copy Comercial Profissional com a IA do Gemini
    try {
        const prompt = `Crie uma copy comercial vendedora e cativante para redes sociais (Instagram/WhatsApp/Telegram) para o seguinte produto de achados de afiliado:
        - Produto: ${tituloProduto}
        - Plataforma: ${plataforma || 'Shopee'}
        - Preço: R$ ${precoProduto}
        - Comissão Estimada: R$ ${comissao_estimada || '5.00'}
        - Link de Afiliado: ${linkFinal}
        
        A estrutura deve conter:
        1. Um título chamativo com emojis.
        2. Uma breve descrição destacando os benefícios para o dia a dia e organização da casa.
        3. Informação clara do preço.
        4. Chamada para ação forte (CTA) convidando para garantir no link.
        5. No final de tudo, adicione de 4 a 6 hashtags populares e estratégicas para achadinhos e promoções (ex: #achadinhos #shopee #ofertas #achadosdodia).
        
        Mantenha a linguagem leve, amigável e vendedora.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
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
        return res.status(500).json({ error: `Erro ao gerar a copy com a IA: ${aiErr.message}` });
    }
});

// Execução local para testes no PC
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Extrator rodando na porta ${PORT}`);
    });
}

module.exports = app;
