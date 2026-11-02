const express = require('express');
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
    res.json({ status: 'Online', servico: 'Achadinhos Extrator Vercel (Auto-Extração)' });
});

app.post('/api/processar-achadinho', async (req, res) => {
    try {
        const { url, plataforma, precoEstimado, tituloManual, comissao_estimada, link_afiliado } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Nenhuma URL informada.' });
        }

        let tituloProduto = tituloManual || '';
        let precoProduto = precoEstimado || '0.00';
        let linkFinal = link_afiliado || url;

        // 1. Automação de Expansão e Extração Inteligente
        try {
            const responseFetch = await fetch(url, { 
                method: 'GET', 
                redirect: 'follow',
                headers: { 
                    // Simulamos um bot de rede social (WhatsApp/Telegram), o que força Shopee e Meli a entregarem o HTML limpo com o título e dados do produto
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' 
                }
            });
            
            linkFinal = responseFetch.url || linkFinal;
            const htmlText = await responseFetch.text();

            // Extração automática do Título pelas tags Open Graph
            if (!tituloProduto) {
                const matchOgTitle = htmlText.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) || 
                                     htmlText.match(/<meta[^>]*name="og:title"[^>]*content="([^"]*)"[^>]*>/i) ||
                                     htmlText.match(/<meta[^>]*name="twitter:title"[^>]*content="([^"]*)"[^>]*>/i);
                
                if (matchOgTitle && matchOgTitle[1]) {
                    tituloProduto = matchOgTitle[1].trim();
                    // Limpeza de sufixos comuns da Shopee/Meli no título
                    tituloProduto = tituloProduto.replace(/\| Shopee Brasil/gi, '').replace(/Mercado Livre/gi, '').trim();
                } else {
                    const matchTitleTag = htmlText.match(/<title>([^<]*)<\/title>/i);
                    if (matchTitleTag && matchTitleTag[1]) {
                        tituloProduto = matchTitleTag[1].replace(/\| Shopee Brasil/gi, '').trim();
                    }
                }
            }

            // Tentativa de extração automática de preço se estiver presente nas meta tags
            if (!precoProduto || precoProduto === '0.00') {
                const matchPrice = htmlText.match(/content="R\$ ([^"]*)"/i) || htmlText.match(/R\$\s*([\d.,]+)/);
                if (matchPrice && matchPrice[1]) {
                    precoProduto = matchPrice[1].trim();
                }
            }

        } catch (errExt) {
            console.log('Aviso na extração automática, usando fallback.');
        }

        // Se após a automação ainda estiver vazio, aplicamos um título descritivo baseado na URL
        if (!tituloProduto) {
            tituloProduto = tituloManual || (url.includes('mercadolivre') ? 'Achado Imperdível no Mercado Livre' : 'Achadinho Imperdível na Shopee');
        }

        if (!precoProduto) {
            precoProduto = '0.00';
        }

        const plataformaNome = plataforma || (url.includes('mercadolivre') ? 'Mercado Livre' : 'Shopee');
        const hashtagsDinamicas = `#achadinhos #${plataformaNome.toLowerCase().replace(/\s+/g, '')} #ofertas #achadosdodia #promocao #achados`;

        // 2. Sistema de Rotação de 5 Estilos Dinâmicos
        const modelosDeCopy = [
            `✨ Olha só o que acabou de aparecer por aqui! 
            
O item **${tituloProduto}** é daqueles que facilitam demais a rotina em casa. Quem tem, recomenda! 🏡💛

💸 Por apenas **R$ ${precoProduto}** na ${plataformaNome}.

Corre para garantir o seu antes que esgote:
👉 ${linkFinal}

${hashtagsDinamicas}`,

            `🚨 **ACHADO IMPERDÍVEL!** 🚨

Achamos o **${tituloProduto}** com um preço excelente na ${plataformaNome}! 📉

💰 Apenas **R$ ${precoProduto}**

As unidades costumam acabar muito rápido, então não deixe para depois:
🛒 Garanta o seu aqui: ${linkFinal}

${hashtagsDinamicas}`,

            `😍 Deixar a casa organizada e prática ficou muito mais fácil com o **${tituloProduto}**! 

Encontrei essa super dica na ${plataformaNome} por um valor que cabe no bolso:
🏷️ Apenas **R$ ${precoProduto}**! 

Corre que vale muito a pena:
👇 Acesse e aproveite:
${linkFinal}

${hashtagsDinamicas}`,

            `🤫 **Dica de ouro que eu achei para vocês!** 

Gente, olha que achado maravilhoso esse **${tituloProduto}**! Encontrei escondido na ${plataformaNome} por um preço super especial. 🌟

Super útil e com ótimo custo-benefício:
💲 Apenas **R$ ${precoProduto}**

Corre antes que acabe o estoque:
🔗 ${linkFinal}

${hashtagsDinamicas}`,

            `🤔 Quem aí estava à procura de um desses? 

O **${tituloProduto}** apareceu com desconto na ${plataformaNome} e eu não podia deixar de trazer para vocês! 😱

Preço excelente por **R$ ${precoProduto}**! 🏷️

Quem vai querer aproveitar? Deixa eu saber nos comentários ou garante o seu direto no link abaixo:
👇 ${linkFinal}

${hashtagsDinamicas}`
        ];

        const indiceAleatorio = Math.floor(Math.random() * modelosDeCopy.length);
        const copyGerada = modelosDeCopy[indiceAleatorio];

        return res.json({
            success: true,
            titulo: tituloProduto,
            preco: precoProduto,
            copyPronta: copyGerada
        });

    } catch (erroServer) {
        console.error('Erro no processamento:', erroServer);
        return res.status(500).json({ error: `Erro ao processar achadinho: ${erroServer.message}` });
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
