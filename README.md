# Guia SQL

Site: https://wallysondevs.github.io/guia-sql/

Curso de SQL em português, do zero ao avançado, feito para quem **nunca mexeu num banco de dados**. Funciona como uma escola: uma aula para cada assunto, organizadas em **3 níveis + projetos + referência** (122 páginas). Vai de `SELECT` e `WHERE` até `JOIN`, `GROUP BY`, criação de tabelas, transações e modelagem. No Nível 3, as aulas de dialetos mostram o que muda no MySQL, no PostgreSQL e no SQL Server.

Todas as aulas usam o mesmo banco de exemplo, a **Loja Aurora**: clientes, produtos, categorias, fornecedores, funcionários, pedidos e itens de pedido, com dados fictícios e fixos. Cada aula explica cada parte do comando (anatomia), mostra o resultado real, o que acontece quando dá errado (com a mensagem verdadeira do SQLite) e exercícios no fim. O guia ensina o SQL padrão usando o **SQLite 3.50.4**, e as saídas do terminal foram conferidas no `sqlite3` de verdade.

Para praticar, as páginas trazem dois recursos que rodam no seu navegador:

- **Quadro "Resultado"** (`pre.file[data-resultado]`): o SQLite roda o exemplo e desenha a tabela logo abaixo do código.
- **Editor "Experimente"** (`.trysql`): escreva o SQL, clique em **Rodar** e veja cada `SELECT` como tabela, quantas linhas cada `INSERT`/`UPDATE`/`DELETE` afetou e os erros em vermelho. Nas **missões**, a caixa confere se você chegou ao resultado pedido.

Os dois usam `assets/sqlsim.js` com o **SQLite de verdade** (o build WebAssembly oficial do sqlite.org, em `assets/sql/`). A cada **Rodar**, o banco é criado do zero na memória com a Loja Aurora: pode dar `DELETE` sem medo. Nada sai do seu computador.

Site 100% estático (HTML + CSS + JS, sem build e sem dependências externas): funciona no GitHub Pages. Para abrir no seu computador, sirva a pasta com um servidor local (o WebAssembly não carrega direto de `file://`).

## Estrutura

```
index.html                 página inicial
<tema>.html                uma aula por tema
assets/style.css           visual
assets/site.js             níveis/menu (lista NIVEIS), Anterior/Próximo, anatomia, exercícios
assets/sqlsim.js           o editor "Experimente" e os quadros "Resultado"
assets/sql/sqlite3.js      o SQLite em WebAssembly (build oficial)
assets/sql/sqlite3.wasm
assets/sql/VERSAO.txt      versão do SQLite do editor
assets/sql/aurora.sql      o banco da Loja Aurora (os comandos que criam o banco)
assets/sql/aurora.db       o mesmo banco, pronto para abrir no sqlite3
assets/sql/AURORA.md       dicionário da Loja Aurora: tabelas, colunas e dados
tools/sim.js               roda um SQL como o editor rodaria
tools/testar-missoes.js    testa as missões de cada página
tools/testar-navegador.js  abre as páginas num Chromium sem janela e confere o editor
tools/motor-node.js        carrega no Node o mesmo SQLite e a Loja Aurora
tools/DIFERENCAS.md        diferenças entre o editor e o sqlite3 do terminal
CONTRIBUINDO.md            como escrever uma aula
.nojekyll                  faz o GitHub Pages servir os arquivos como estão
```

## Testes

```bash
node tools/testar-missoes.js --todas         # todas as páginas
node tools/testar-missoes.js pagina.html     # só estas páginas (-q mostra só os problemas)
node tools/testar-missoes.js --nativo pagina.html   # compara também com o sqlite3 do laboratório
node tools/testar-navegador.js --todas       # abre as páginas num Chromium sem janela (precisa do puppeteer-core)
node tools/sim.js consulta.sql               # roda um SQL como o editor (ou: echo "SELECT 1;" | node tools/sim.js -)
```

## Publicar no GitHub Pages

Envie a pasta para um repositório e ative **Settings → Pages → Deploy from a branch → main / (root)**.

## Adicionar uma aula

Leia `CONTRIBUINDO.md` e inclua a página na lista `NIVEIS` de `assets/site.js`.
