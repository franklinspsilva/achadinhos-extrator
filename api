module.exports = async (req, res) => {
    // Configuração completa de CORS para aceitar pedidos do painel da Fabi
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Nenhuma URL informada.' });
        }

        let linkReal = url;
        let tituloProduto = 'Achadinho Imperdível';
        let precoProduto = '49.90';
        let comissaoEstimada = '7.50';
        let plataforma = 'Shopee';

        if (url.includes('mercadolivre') || url.includes('mercadolito') || url.includes('mercadolivre.com')) {
            plataforma = 'Mercado Livre';
        }

        // Resolução do link encurtado e metadados
        try {
            const responseFetch = await fetch(url, { 
                method: 'GET', 
                redirect: 'follow',
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
                }
            });
            linkReal = responseFetch.url || url;

            const apiMicroLinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(linkReal)}`;
            const responseMeta = await fetch(apiMicroLinkUrl);
            const dataMeta = await responseMeta.json();

            if (dataMeta && dataMeta.status === 'success' && dataMeta.data && dataMeta.data.title) {
                tituloProduto = dataMeta.data.title
                    .replace(/\| Shopee Brasil/gi, '')
                    .replace(/Mercado Livre/gi, '')
                    .trim();
            } else {
                tituloProduto = plataforma === 'Shopee' ? 'Achado Incrível na Shopee' : 'Achado Imperdível no Mercado Livre';
            }
        } catch (errRedir) {
            console.log('Aviso ao expandir link:', errRedir);
        }

        const hashtagsDinamicas = `#achadinhos #${plataforma.toLowerCase().replace(/\s+/g, '')} #ofertas #achadosdodia #promocao #achados`;

        // Sistema de rotação dos 5 estilos de Copy
        const modelosDeCopy = [
            `✨ Olha só o que acabou de aparecer por aqui! 
            
O item **${tituloProduto}** é daqueles que facilitam demais a rotina em casa. Quem tem, recomenda! 🏡💛

💸 Por apenas **R$ ${precoProduto}** na ${plataforma}.

Corre para garantir o seu antes que esgote:
👉 ${linkReal}

${hashtagsDinamicas}`,

            `🚨 **ACHADO IMPERDÍVEL!** 🚨

Achamos o **${tituloProduto}** com um preço excelente na ${plataforma}! 📉

💰 Apenas **R$ ${precoProduto}**

As unidades costumam acabar muito rápido, então não deixe para depois:
🛒 Garanta o seu aqui: ${linkReal}

${hashtagsDinamicas}`,

            `😍 Deixar a casa organizada e prática ficou muito mais fácil com o **${tituloProduto}**! 

Encontrei essa super dica na ${plataforma} por um valor que cabe no bolso:
🏷️ Apenas **R$ ${precoProduto}**! 

Corre que vale muito a pena:
👇 Acesse e aproveite:
${linkReal}

${hashtagsDinamicas}`,

            `🤫 **Dica de ouro que eu achei para vocês!** 

Gente, olha que achado maravilhoso esse **${tituloProduto}**! Encontrei escondido na ${plataforma} por um preço super especial. 🌟

Super útil e com ótimo custo-benefício:
💲 Apenas **R$ ${precoProduto}**

Corre antes que acabe o estoque:
🔗 ${linkReal}

${hashtagsDinamicas}`,

            `🤔 Quem aí estava à procura de um desses? 

O **${tituloProduto}** apareceu com desconto na ${plataforma} e eu não podia deixar de trazer para vocês! 😱

Preço excelente por **R$ ${precoProduto}**! 🏷️

Quem vai querer aproveitar? Deixa eu saber nos comentários ou garante o seu direto no link abaixo:
👇 ${linkReal}

${hashtagsDinomicas || hashtagsDinamicas}`
        ];

        const copyGerada = modelosDeCopy[Math.floor(Math.random() * modelosDeCopy.length)];

        return res.status(200).json({
            success: true,
            titulo: tituloProduto,
            preco: precoProduto,
            comissao: comissaoEstimada,
            plataforma: plataforma,
            linkFinal: linkReal,
            copyPronta: copyGerada
        });

    } async (erroServer) {
        return res.status(500).json({ error: `Erro interno: ${erroServer.message}` });
    }
};
