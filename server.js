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
    res.json({ status: 'Online', servico: 'Achadinhos Extrator Vercel (Definitivo)' });
});

app.post('/api/processar-achadinho', async (req, res) => {
    try {
        const { url, plataforma, precoEstimado, tituloManual, comissao_estimada, link_afiliado } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Nenhuma URL informada.' });
        }

        let linkFinal = link_afiliado || url;

        // Tenta expandir o link encurtado nativamente
        if (url && (url.includes('s.shopee.com.br') || url.includes('mercadolivre.com/sec'))) {
            try {
                const responseFetch = await fetch(url, { 
                    method: 'GET', 
                    redirect: 'follow',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                linkFinal = responseFetch.url || linkFinal;
            } catch (errRedir) {
                console.log('Aviso: Não foi possível expandir o link automaticamente.');
            }
        }

        // Blindagem de Título: Prioriza o que foi digitado/enviado ou define um padrão limpo
        let tituloProduto = tituloManual;
        if (!tituloProduto || tituloProduto.trim() === '') {
            tituloProduto = url.includes('mercadolivre') ? 'Achado Imperdível no Mercado Livre' : 'Achadinho Imperdível na Shopee';
        }

        // Blindagem de Preço: Garante que usa o preço enviado pela tela do painel e nunca zero
        let precoProduto = precoEstimado;
        if (!precoProduto || precoProduto === '' || precoProduto === '0' || precoProduto === '0.00') {
            precoProduto = '0.00';
        }

        const plataformaNome = plataforma || (url.includes('mercadolivre') ? 'Mercado Livre' : 'Shopee');
        const hashtagsDinamicas = `#achadinhos #${plataformaNome.toLowerCase().replace(/\s+/g, '')} #ofertas #achadosdodia #promocao #achados`;

        // === SISTEMA DE ROTAÇÃO DE 5 ESTILOS DINÂMICOS ===
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
