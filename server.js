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
    res.json({ status: 'Online', servico: 'Achadinhos Extrator Vercel (Com Extração Leve)' });
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

        // 1. Extração Leve de Metadados via HTML (Sem Puppeteer)
        try {
            const responseFetch = await fetch(url, { 
                method: 'GET', 
                redirect: 'follow',
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
                }
            });
            
            linkFinal = responseFetch.url || linkFinal;
            const htmlText = await responseFetch.text();

            // Se o usuário não digitou o título manualmente, tenta extrair da tag og:title ou <title>
            if (!tituloProduto) {
                const matchOgTitle = htmlText.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) || 
                                     htmlText.match(/<meta[^>]*name="og:title"[^>]*content="([^"]*)"[^>]*>/i);
                
                if (matchOgTitle && matchOgTitle[1]) {
                    tituloProduto = matchOgTitle[1].trim();
                } else {
                    const matchTitleTag = htmlText.match(/<title>([^<]*)<\/title>/i);
                    if (matchTitleTag && matchTitleTag[1]) {
                        tituloProduto = matchTitleTag[1].trim();
                    }
                }
            }
        } catch (errExt) {
            console.log('Aviso: Extração leve por HTML limitada, usando dados base/manuais.');
        }

        // Fallback caso não consiga extrair nada do link
        if (!tituloProduto) {
            tituloProduto = tituloManual || 'Achadinho Imperdível para o Lar';
        }

        const plataformaNome = plataforma || 'Shopee';
        const hashtagsDinamicas = `#achadinhos #${plataformaNome.toLowerCase()} #ofertas #achadosdodia #promocao #achados`;

        // 2. Sistema de Variação de Layouts (5 Estilos diferentes)
        const modelosDeCopy = [
            // Estilo 1: Foco em Utilidade e Praticidade
            `✨ Olha só o que acabou de aparecer por aqui! 
            
O item **${tituloProduto}** é daqueles que facilitam demais a rotina em casa. Quem tem, recomenda! 🏡💛

💸 Por apenas **R$ ${precoProduto}** na ${plataformaNome}.

Corre para garantir o seu antes que esgote:
👉 ${linkFinal}

${hashtagsDinamicas}`,

            // Estilo 2: Foco em Urgência e Preço Baixo
            `🚨 **ACHADO IMPERDÍVEL!** 🚨

Achamos o **${tituloProduto}** com um preço excelente na ${plataformaNome}! 📉

💰 Apenas **R$ ${precoProduto}**

As unidades costumam acabar muito rápido, então não deixe para depois:
🛒 Garanta o seu aqui: ${linkFinal}

${hashtagsDinamicas}`,

            // Estilo 3: Foco em Desejo e Organização
            `😍 Deixar a casa organizada e prática ficou muito mais fácil com o **${tituloProduto}**! 

Encontrei essa super dica na ${plataformaNome} por um valor que cabe no bolso:
🏷️ Apenas **R$ ${precoProduto}**! 

Corre que vale muito a pena:
👇 Acesse e aproveite:
${linkFinal}

${hashtagsDinamicas}`,

            // Estilo 4: Foco em "Achado Secreto / Dica de Ouro"
            `🤫 **Dica de ouro que eu achei para vocês!** 

Gente, olha que achado maravilhoso esse **${tituloProduto}**! Encontrei escondido na ${plataformaNome} por um preço super especial. 🌟

Super útil e com ótimo custo-benefício:
💲 Apenas **R$ ${precoProduto}**

Corre antes que acabe o estoque:
🔗 ${linkFinal}

${hashtagsDinamicas}`,

            // Estilo 5: Foco em Interação / Pergunta
            `🤔 Quem aí estava à procura de um desses? 

O **${tituloProduto}** apareceu com desconto na ${plataformaNome} e eu não podia deixar de trazer para vocês! 😱

Preço excelente por **R$ ${precoProduto}**! 🏷️

Quem vai querer aproveitar? Deixa eu saber nos comentários ou garante o seu direto no link abaixo:
👇 ${linkFinal}

${hashtagsDinamicas}`
        ];

        // Sorteia aleatoriamente um dos 5 modelos
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
