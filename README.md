# INCA, formulário online e painel de dados

Este pacote cria uma primeira versão do sistema INCA:

- `docs/index.html`: formulário público para municípios e estados preencherem.
- `worker/worker.js`: pequena API para receber os dados e gravar no GitHub sem expor o token.
- `data/respostas/`: banco de dados em arquivos JSON, uma resposta por arquivo.
- `.github/workflows/consolidar.yml`: workflow que consolida as respostas.
- `docs/dashboard.html`: painel simples com ranking e estatísticas.

## Arquitetura recomendada

1. O repositório é publicado no GitHub Pages usando a pasta `docs`.
2. O formulário envia os dados para um Cloudflare Worker.
3. O Worker grava cada resposta como JSON no repositório GitHub.
4. O GitHub Actions consolida os arquivos em `data/consolidado.json`.
5. O painel lê o arquivo consolidado e apresenta os dados.

## Por que usar Worker?

GitHub Pages é estático e não consegue gravar dados sozinho no repositório.
Não é seguro colocar um token do GitHub diretamente no JavaScript do formulário.
Por isso, o token fica protegido no Worker.

## Configuração no GitHub

1. Crie um repositório, por exemplo: `inca-avaliacao`.
2. Envie todos os arquivos deste pacote.
3. Ative o GitHub Pages:
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: `/docs`

## Configuração do token GitHub

Crie um Fine-grained Personal Access Token com permissão de escrita apenas neste repositório:

- Contents: Read and write

Guarde esse token para configurar no Worker.

## Configuração do Cloudflare Worker

Crie um Worker com o conteúdo de `worker/worker.js`.

Configure estas variáveis de ambiente no Worker:

- `GITHUB_OWNER`: seu usuário ou organização no GitHub
- `GITHUB_REPO`: nome do repositório
- `GITHUB_BRANCH`: main
- `GITHUB_TOKEN`: token criado no GitHub

Depois de publicar o Worker, copie a URL gerada e cole em:

`docs/assets/app.js`

Substitua:

```js
const API_URL = "COLE_AQUI_A_URL_DO_SEU_WORKER";
```

pela URL do Worker.

## Painel

O painel ficará disponível em:

`https://SEU_USUARIO.github.io/SEU_REPOSITORIO/dashboard.html`

O formulário ficará em:

`https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

## Próximo passo recomendado

Depois dessa versão funcionar, o painel pode evoluir para:

- mapa do Brasil por município
- filtro por UF
- gráfico de distribuição de classificação
- ranking por dimensão
- exportação CSV
- validação técnica das respostas


## Ajuste do formulário territorial

Nesta versão, os campos de identificação pessoal foram removidos. O formulário usa apenas:

- UF
- Município ou Estado

A seleção de município é carregada automaticamente pela API pública de localidades do IBGE, de acordo com a UF selecionada. Assim, ao selecionar RJ, por exemplo, o campo de município passa a exibir somente os municípios do Rio de Janeiro.

