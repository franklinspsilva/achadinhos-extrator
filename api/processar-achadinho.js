module.exports = async (req, res) => {
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
        let tituloProduto = '';
        let precoProduto = '0.00';
        let plataforma = 'Shopee';

        if (url.includes('mercadolivre') || url.includes('mercadolito') || url.includes('mercadolivre.com')) {
            plataforma = 'Mercado Livre';
        }

        try {
            const responseFetch = await fetch(url, { 
                method: 'GET', 
                redirect: 'follow',
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            });
            linkReal = responseFetch.url || url;

            const apiMicroLinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(linkReal)}`;
            const responseMeta = await fetch(apiMicroLinkUrl);
            const dataMeta = await responseMeta.json();

            if (dataMeta && dataMeta.status === 'success' && dataMeta.data) {
                if (dataMeta.data.title) {
                    tituloProduto = dataMeta.data.title
                        .replace(/\| Shopee Brasil/gi, '')
                        .replace(/Mercado Livre/gi, '')
                        .replace(/[?&]utm_.*/gi, '')
                        .trim();
                }
                // Tenta extrair preço se vier nas meta tags ou descrição
                const desc = dataMeta.data.description || '';
                const matchPreco = desc.match(/R\$\s*([\d.,]+)/) || dataMeta.data.text?.match(/R\$\s*([\d.,]+)/);
                if (matchPreco && matchPreco[1]) {
                    precoProduto = matchPreco[1].replace('.', '').replace(',', '.');
                }
            }
        } catch (errRedir) {
            console.log('Aviso ao expandir link:', errRedir);
        }

        // Fallbacks inteligentes se não capturar título/preço automáticos
        if (!tituloProduto || tituloProduto.length < 5) {
            tituloProduto = plataforma === 'Shopee' ? 'Achado Imperdível na Shopee' : 'Achado Imperdível no Mercado Livre';
        }
        if (precoProduto === '0.00') {
            precoProduto = '49.90'; // Preço base estimado seguro
        }

        // Cálculo dinâmico de comissão estimada (ex: ~12% de comissão média de afiliado)
        const valorNumerico = parseFloat(precoProduto) || 49.90;
        const comissaoEstimada = (valorNumerico * 0.12).toFixed(2);

        const hashtagsDinamicas = `#achadinhos #${plataforma.toLowerCase().replace(/\s+/g, '')} #ofertas #achadosdodia #promocao #achados`;

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

${hashtagsDinamicas}`
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

    } catch (erroServer) {
        return res.status(500).json({ error: `Erro interno: ${erroServer.message}` });
    }
};
