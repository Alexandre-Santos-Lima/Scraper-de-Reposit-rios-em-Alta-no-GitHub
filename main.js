/*
---
Projeto: GitHub Trending Scraper
Descrição: Uma ferramenta de linha de comando que busca e exibe os repositórios
           que estão em alta no GitHub para uma linguagem de programação específica.
           O script faz uma requisição HTTP para a página de trending, extrai (scrape)
           as informações e as exibe de forma organizada no terminal.

Bibliotecas necessárias: axios, cheerio
Como instalar: npm install axios cheerio

Como executar: node main.js <linguagem>
Exemplo: node main.js javascript
Exemplo: node main.js python
---
*/

const axios = require('axios');
const cheerio = require('cheerio');

// Cores para o terminal (ANSI escape codes)
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
};

/**
 * Busca a página de trending do GitHub para a linguagem especificada e extrai os dados.
 * @param {string} language - A linguagem de programação para buscar.
 * @returns {Promise<Array|null>} Uma promessa que resolve para um array de objetos de repositório ou null em caso de erro.
 */
async function fetchTrendingRepos(language) {
    const url = `https://github.com/trending/${language}`;
    console.log(`Buscando repositórios em alta para '${language}'...`);

    try {
        // Faz a requisição HTTP para obter o HTML da página
        const { data } = await axios.get(url, {
            // Adiciona um User-Agent para simular um navegador e evitar bloqueios
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        // Carrega o HTML no Cheerio para facilitar a manipulação (semelhante ao jQuery)
        const $ = cheerio.load(data);
        const repos = [];

        // Seleciona cada item da lista de repositórios na página
        $('article.Box-row').each((i, element) => {
            const repoElement = $(element);

            // Extrai o nome do repositório e a URL
            const titleElement = repoElement.find('h2 > a');
            const repoName = titleElement.text().replace(/\s/g, ''); // Remove espaços em branco
            const repoUrl = `https://github.com${titleElement.attr('href')}`;

            // Extrai a descrição
            const description = repoElement.find('p.col-9').text().trim();

            // Extrai o número de estrelas
            const stars = repoElement.find(`a[href$="/stargazers"]`).text().trim();

            if (repoName) {
                repos.push({
                    name: repoName,
                    url: repoUrl,
                    description: description,
                    stars: stars,
                });
            }
        });

        return repos;

    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.error(`Erro: A linguagem "${language}" não foi encontrada no GitHub Trending.`);
        } else {
            console.error('Erro ao buscar a página:', error.message);
        }
        return null;
    }
}

/**
 * Exibe os repositórios formatados no console.
 * @param {Array} repos - Um array de objetos de repositório.
 */
function displayRepos(repos) {
    if (!repos || repos.length === 0) {
        console.log('Nenhum repositório encontrado.');
        return;
    }

    console.log(`\n--- Top ${repos.length} Repositórios em Alta ---\n`);

    repos.forEach((repo, index) => {
        console.log(`${colors.bright}${index + 1}. ${colors.cyan}${repo.name}${colors.reset}`);
        console.log(`   ${colors.yellow}★ ${repo.stars} estrelas${colors.reset}`);
        console.log(`   ${repo.description || 'Sem descrição.'}`);
        console.log(`   ${colors.green}${repo.url}${colors.reset}\n`);
    });
}

/**
 * Função principal que inicializa o script.
 */
async function main() {
    // Pega a linguagem a partir dos argumentos da linha de comando
    const language = process.argv[2];

    if (!language) {
        console.error('Erro: Por favor, especifique uma linguagem.');
        console.log('Uso: node main.js <linguagem>');
        process.exit(1); // Encerra o script com código de erro
    }

    const repos = await fetchTrendingRepos(language.toLowerCase());
    
    if (repos) {
        displayRepos(repos);
    }
}

// Executa a função principal
main();