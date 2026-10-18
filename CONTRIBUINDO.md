# Como escrever uma página do Guia SQL

O guia é uma **escola**, estilo W3Schools, para quem **nunca mexeu num banco de dados**. **Uma aula = um assunto.** O dono do projeto já reclamou de outro guia que juntava vários assuntos numa página. Nunca mostre SQL "seco":
- explique cada parte (anatomia);
- mostre o **resultado real**: o SQLite de verdade roda cada exemplo no navegador do leitor e desenha a tabela;
- mostre o que acontece quando dá errado, com a mensagem **real** do SQLite;
- deixe o leitor praticar no editor do guia.

Antes de tudo, leia o `RECURSOS.md`: onde trabalhar (VPS) e como.

## 1. Esqueleto do arquivo
Use como modelo a estrutura de `/home/admin/guia-html/titulos.html` (cabeçalho, `<main>`, blocos, rodapé). Troque:
- `<title>SQL TEMA — descrição | Guia SQL</title>`;
- `<h1>SQL <span class="hl">TEMA</span></h1>`;
- a caixa `.tryhtml` por **`.trysql`**.

Menu, selo e Anterior/Próximo vêm de `assets/site.js` (`NIVEIS`). **Não mude a `NIVEIS`.** Links internos só para páginas que estão nela.

## 2. Ordem de uma aula
1. Intro.
2. "Você vai aprender".
3. A ideia antes do código, com uma comparação do dia a dia (um caderno de fichas, uma planilha, o estoque da lojinha).
4. Do simples ao completo, uma novidade por vez, com `dl.anatomy` ou uma tabela "parte → o que faz".
5. **O resultado** depois de cada exemplo (`pre.file` com `data-resultado`: o site roda o SQL de verdade e desenha a tabela).
6. **Pelo menos dois "Experimente"** (`.trysql`) por aula: um no meio e uma missão no fim.
7. Formas diferentes de fazer a mesma coisa + tabela "qual usar".
8. **Quando dá errado** (`div.cenario`): o SQL errado e a mensagem **real** do SQLite (colha no editor ou no lab, nunca de memória).
9. **Nos outros bancos** (`div.note`): quando MySQL/PostgreSQL/SQL Server fazem diferente, uma nota curta mostra a forma deles (ex.: `LIMIT` × `TOP` × `ROWNUM`). Não precisa em toda aula — só onde a diferença existe e importa.
10. Referência (`table.ref`).
11. Exercícios (3 ou mais: `.exercise`, `.mc`).
12. Resumo.

Páginas de **Projetos**: passo a passo (versão 1, 2, 3… do banco/consulta, cada uma com um `.trysql`). Páginas de **Referência**: tabelas, com poucos `.trysql`.

## 3. O banco das aulas: a Loja Aurora
Todas as aulas usam o mesmo banco de exemplo, a **Loja Aurora** (papel do Northwind do W3Schools): clientes, produtos, categorias, fornecedores, funcionários, pedidos e itens_pedido. O dicionário completo, com os casos pedagógicos (clientes sem email, clientes sem pedido, produtos nunca vendidos…), está em **`assets/sql/AURORA.md`** — leia antes de escrever. No editor, o banco já vem carregado e **cada Rodar parte do banco limpo** (o leitor pode dar DELETE sem medo). No lab, ele está em `~/loja.db`.

Invente o mínimo: use os dados que existem no banco. Toda saída mostrada numa aula tem de ser a saída real desses dados.

## 4. Componentes

### SQL para ler, com o resultado embaixo
```html
<pre class="file" data-file="consulta.sql" data-resultado>SELECT nome, cidade
FROM clientes
WHERE estado = 'PI';
</pre>
```
- Com `data-resultado`, o site **roda o SQL de verdade** (no SQLite do navegador, contra o banco limpo da Loja Aurora) e desenha o resultado num quadro logo abaixo: tabela para SELECT, "N linha(s) afetada(s)" para INSERT/UPDATE/DELETE, e a mensagem de erro real quando o exemplo é de erro. Nunca digite um resultado à mão.
- Sem `data-resultado`: só o código (por exemplo, um trecho de outro dialeto que o SQLite não roda).
- Dentro de `<pre>`, escape `<`, `>` e `&` (`&lt;`, `&gt;`, `&amp;`). O testador confere.

### Terminal (`pre.term`)
Igual aos outros guias: `$ ` = `ana@notebook:~$`, `sqlite> ` = o prompt do sqlite3, `> ` = continuação, `«` = anotação. Use-o para a linha de comando: abrir o banco (`sqlite3 loja.db`), comandos de ponto (`.tables`, `.mode`), import/export, backup. Toda saída vem do lab (`RECURSOS.md`).

### Editor "Experimente" (`.trysql`)
```html
<div class="trysql" data-goal="linhas:3">
<p class="try-task"><strong>Missão:</strong> mostre só os clientes do Piauí.</p>
<pre class="script" data-file="consulta.sql">SELECT nome, cidade FROM clientes;
</pre>
<pre class="solucao" data-file="consulta.sql">SELECT nome, cidade FROM clientes WHERE estado = 'PI';
</pre>
</div>
```
- O leitor edita o SQL, clica em Rodar e vê a tabela de verdade. Cada Rodar parte do banco limpo.
- Sem `data-goal`: caixa livre. Com `data-goal`: missão, e o `pre.solucao` é **obrigatório**.
- O código inicial **não pode** cumprir a meta; a solução **tem** de cumprir (o testador confere os dois).

## 5. Metas do .trysql
> **Esta seção é mantida pelo agente do simulador.** Antes de escrever uma frase do tipo "no editor…" que não esteja aqui, confira com as ferramentas dele.

### O que o editor faz a cada Rodar
1. Cria um banco **novo em memória** e carrega `assets/sql/aurora.sql` (a Loja Aurora). Determinístico: rodar duas vezes dá o mesmo resultado.
2. Executa o SQL da caixa, **vários comandos separados por `;`**, e mostra, na ordem:
   - cada SELECT como **tabela** (cabeçalho = nomes das colunas; `NULL` aparece como *NULL* em itálico) com o total de linhas embaixo;
   - cada INSERT/UPDATE/DELETE como "N linha(s) afetada(s)";
   - os demais comandos como "CREATE TABLE: ok", "DROP TABLE: ok"…;
   - um erro **para a execução ali** e aparece em vermelho com a mensagem **real** do SQLite (em inglês), depois de `Erro do SQLite:`. O que rodou antes do erro continua na tela.
3. Limites que o autor precisa saber:
   - comandos de ponto (`.tables`, `.mode`…) **não existem no editor** — são do programa `sqlite3`, não SQL; ali eles dão o erro real de sintaxe (`near ".": syntax error`). Ensine-os só no `pre.term`;
   - um SQL sem fim (ex.: `WITH RECURSIVE` sem `LIMIT`) é interrompido depois de ~4 s com o erro `interrupted`;
   - a tabela mostra até 500 linhas (as metas contam todas; de um SELECT gigante, só as 20 000 primeiras linhas entram na saída canônica);
   - `random()`, `datetime('now')`, `date('now')` mudam a cada Rodar: nunca os use numa meta nem num resultado citado no texto.

### Mensagens de erro: editor × terminal
O motor é o mesmo (SQLite 3.50.4, mesmas opções), então **o miolo da mensagem é idêntico**. O que muda é a moldura que o programa `sqlite3` põe em volta. Exemplos reais (editor = `node tools/sim.js`; terminal = lab, `sqlite3 loja.db`):

| SQL | No editor (`Erro do SQLite: …`) | No terminal, digitando no `sqlite>` |
|---|---|---|
| `SELECT nome FROM cliente;` | `no such table: cliente` | `Parse error: no such table: cliente` |
| `SELEC nome FROM clientes;` | `near "SELEC": syntax error` | `Parse error: near "SELEC": syntax error` + duas linhas: o SQL e a seta `^--- error here` |
| `SELECT "nomee" FROM clientes;` | `no such column: "nomee" - should this be a string literal in single-quotes?` | `Parse error: no such column: "nomee" - should this be …` + o SQL e a seta embaixo de `"nomee"` |
| `SELECT abs(-9223372036854775808);` | `integer overflow` | `Runtime error: integer overflow` |
| `INSERT INTO categorias (id, nome) VALUES (1, 'X');` | `UNIQUE constraint failed: categorias.id` | `Runtime error: UNIQUE constraint failed: categorias.id (19)` — o `(19)` é o código do erro |
| `.tables` | `near ".": syntax error` | lista as tabelas (é comando do programa) |

- `Parse error` = o SQLite nem conseguiu entender/preparar o comando; `Runtime error` = entendeu, mas deu errado ao executar.
- Com o SQL vindo de **arquivo** (`sqlite3 loja.db < erro.sql`), a moldura ganha a linha: `Parse error near line 2: no such table: cliente`.
- Com o SQL como **argumento** (`sqlite3 loja.db "SELECT nome FROM cliente;"`): `Error: in prepare, no such table: cliente`.
- No texto da aula, cite a mensagem **do lugar onde o leitor vai vê-la**: no `pre.file`/`.trysql`, a do editor; no `pre.term`, a do terminal, copiada do lab. Explique em português o que ela quer dizer.

### Editor × `sqlite3 loja.db` no terminal: o que pode dar diferente
- **Chaves estrangeiras.** O `aurora.sql` liga `PRAGMA foreign_keys = ON;`, então no editor um `INSERT` com `categoria_id = 99` dá `FOREIGN KEY constraint failed` (e `DELETE FROM produtos;` também: há itens de pedido apontando para eles). No terminal, **cada conexão nova começa com `foreign_keys` desligado** (`PRAGMA foreign_keys;` → `0` no lab): o mesmo `INSERT` em `sqlite3 loja.db` **passa sem erro** (e `DELETE FROM produtos;` apaga os 45). Na aula de chaves estrangeiras (e em qualquer `pre.term` que dependa delas), mostre o `PRAGMA foreign_keys = ON;` antes.
- **O banco não volta sozinho.** No editor, cada Rodar parte do banco limpo; no terminal, um `DELETE` em `loja.db` é para valer (no lab: `lab -n SEUNOME -r` recomeça a home).
- **Formato.** O terminal começa em `.mode list` sem cabeçalho (`Lápis Grafite HB|1.15`); o editor desenha tabela. Os valores (números, datas, `NULL`) saem iguais.
- **`EXPLAIN QUERY PLAN`.** O editor mostra a tabela crua (colunas `id`, `parent`, `notused`, `detail`; o que interessa é o `detail`); o terminal desenha a árvore (`QUERY PLAN` e, embaixo, `` `--SCAN pedidos ``). O conteúdo é o mesmo.
- **Funções que só o programa `sqlite3` tem.** O shell `sqlite3` embute extensões que a biblioteca SQLite (a do editor e a dos aplicativos) **não** tem: `generate_series`, o operador `REGEXP`, `median()`, `percentile()`, `base64()`, `sha3()`, `decimal_add()`, `readfile()`… No editor elas dão `no such table: generate_series` / `no such function: REGEXP`. Não as use em `.trysql` nem em `data-resultado` (a não ser como exemplo de erro, com `data-erro`); no `pre.term`, deixe claro que é coisa do terminal. Para gerar sequências no editor, use `WITH RECURSIVE … LIMIT`.
- O testador com `--nativo` confere o resto; as diferenças achadas ficam em `tools/DIFERENCAS.md`.

### A saída canônica (o que as metas `out:` e `contem:` enxergam)
Todas as linhas de **todos** os SELECTs da execução, no formato do `sqlite3 .mode list`: valores separados por `|`, um registro por linha, `NULL` vira vazio, números como o SQLite os escreve (`4.9`, não `4.90`). Ex.: `Lápis Grafite HB|1.15`.

### As metas (`data-goal`)
| Meta | Passa quando |
|---|---|
| `out:REGEX` | a saída canônica casa com a regex (JavaScript, **sem flags**: maiúsculas contam, `^` só casa o começo do texto todo). Cuidado com a barra vertical (nota abaixo) |
| `linhas:N` | o **último** SELECT devolveu exatamente N linhas |
| `colunas:a,b,c` | os nomes das colunas do último SELECT são exatamente esses, nessa ordem (use `AS`); `\,` é vírgula dentro de um nome |
| `contem:TEXTO` | o TEXTO aparece literalmente na saída canônica |
| `erro:` | a execução terminou em erro (qualquer um) |
| `erro:REGEX` | a mensagem de erro casa com a regex |
| `tabela:nome` | a tabela **ou view** (também TEMP) existe depois de rodar (nome em minúsculas); `mudou:` também conta as linhas de uma view |
| `mudou:tabela=N` | depois de rodar, a tabela tem exatamente N linhas |

- **A barra vertical no `out:`.** Na saída canônica, `|` separa as colunas, mas na regex `|` quer dizer "ou". Para casar o separador, escape com barra invertida: `out:^Papelaria\|` casa `Papelaria|…`. Sem a barra, `out:a|b` quer dizer "tem `a` ou tem `b`".
- **Mensagem de erro com quebra de linha.** Uma aspa sem fechar engole o resto do SQL, e a mensagem sai em várias linhas: `SELECT 1 WHERE x = 'PI;` + `SELECT 2;` na linha de baixo dá `unrecognized token: "'PI;` e, na linha seguinte, `SELECT 2;"`. O quadro vermelho mostra as duas linhas. Na regex do `erro:` o `.` **não** casa a quebra: use `[\s\S]*` (`erro:unrecognized token[\s\S]*SELECT 2`) ou case só o começo (`erro:unrecognized token`). Se a aspa sem fechar for a **última** coisa da caixa, a mensagem fica numa linha só (`unrecognized token: "'PI;"`), igual ao terminal: o editor tira os espaços e quebras do fim antes de rodar, como o `sqlite3`.
- Na saída do testador, uma quebra de linha dentro de uma mensagem aparece como `↵`.
- O filtro de privacidade do testador barra `wallyson`, mas deixa passar links para os guias irmãos em `wallysondevs.github.io`.
- Combine com `;;`: `data-goal="colunas:nome,preco;;linhas:3"` — **todas** precisam passar.
- Se o SQL deu erro, **só** metas `erro:` podem passar.
- O código inicial da caixa **não pode** cumprir a meta; o `pre.solucao` **tem** de cumprir. O testador confere os dois.
- Prefira metas que aceitem respostas equivalentes (`linhas:`, `mudou:`, `contem:`) a um `out:` que só casa com uma escrita exata.

### Escape de HTML (o testador acusa)
- Dentro de **todo** `<pre>` (`pre.file`, `pre.script`, `pre.solucao`, `pre.term`): escreva `<` como `&lt;` e `&` como `&amp;`. Um `<` cru pode virar uma tag e sumir com um pedaço do SQL (`WHERE a<b` vira negrito no navegador); o testador dá **FALHA**. O `>` pode ficar cru ou como `&gt;` (os dois funcionam).
- Nos `pre` de SQL, entidades com nome que o testador não conhece (`&eacute;`…) também dão FALHA: escreva o caractere direto (`é`).
- Dentro de `data-goal`, `"` vira `&quot;`: `data-goal="erro:no such column: &quot;?precoo"`.

### Exemplos de erro de propósito: `data-erro`
- Um `pre.file data-resultado` cujo SQL dá erro **de propósito** leva `data-erro`: `<pre class="file" data-resultado data-erro>`. Sem ele, o testador acusa FALHA ("o SQL dá erro"). Com ele e sem erro, também ("tem data-erro mas rodou sem erro").
- O mesmo vale para uma caixa **livre** (sem `data-goal`) cujo SQL inicial dá erro: `<div class="trysql" data-erro>`. Numa missão não precisa: o inicial pode dar erro à vontade ("conserte este SQL").

### O testador (na VPS)
```bash
node tools/testar-missoes.js pagina.html outra.html   # as missões da página
node tools/testar-missoes.js --nativo pagina.html     # + compara com o sqlite3 do lab
node tools/testar-missoes.js -q --todas               # todas as páginas, só FALHA/aviso
node tools/sim.js consulta.sql                        # roda um .sql como o editor rodaria
echo "SELECT 1;" | node tools/sim.js --goal "linhas:1" -   # testa uma meta solta
```
Do notebook: `~/guia-sql-lab/testar [--nativo] [-q] pagina.html` (já com `timeout`).

- Uma linha por item, com o número da linha no HTML: `ok`, `FALHA` (precisa consertar) ou `aviso` (olhe, mas não bloqueia). Código de saída: 0 = sem FALHA; 1 = alguma FALHA; 2 = página não encontrada.
- Em cada `.trysql`: meta conhecida e regex válida, um só `pre.script`, missão com `pre.solucao`, **o inicial falha** a meta, **a solução passa**. Caixa livre: o SQL roda sem erro (ou com `data-erro`).
- Cada `pre.file[data-resultado]` roda: erro só com `data-erro`.
- Também: `<`/`&` sem escape nos `pre`, link para página fora da NIVEIS (aviso), dado da máquina real (`/home/admin`, `ip-172-…` → FALHA), SQL que demora mais de 1,5 s ou devolve mais de 500 linhas (aviso), página sem missão (aviso).
- `--nativo` roda cada SQL também no `sqlite3` do lab (`sqlite3 -bail -batch`, com a Loja Aurora carregada) e compara a saída canônica e o erro; diferença vira aviso e fica registrada em `tools/DIFERENCAS.md`, na seção da página.
- `sim.js` serve para colher a saída real que você vai citar no texto da aula.
- No navegador de verdade (Chromium da VPS): `node tools/testar-navegador.js pagina.html` — ver `tools/ESTADO.md`.

## 6. Fidelidade: o laboratório (`~/guia-sql-lab/lab`, na VPS)
É a máquina da Ana (usuária `ana`, computador `notebook`, `/home/ana`, pt_BR) com o **sqlite3 3.50.4 de verdade** e o banco `~/loja.db` pronto. Toda saída de terminal mostrada numa aula vem de lá:
- o prompt interativo precisa de `-t` (tty): `~/guia-sql-lab/lab -n SEUNOME -t`;
- sessões roteirizadas: mande os comandos pelo stdin com `-i` (transcrição);
- **as mensagens de erro do SQLite saem em inglês** (`Parse error: no such table: cliente`): copie como saíram e explique em português;
- **Privacidade:** nada da máquina real nem da VPS; só `/home/ana/…`, `ana@notebook`.

## 7. Versão e dialeto
O guia ensina o **SQL padrão usando o SQLite 3.50** (o banco mais usado do mundo: está em todo celular e navegador). O editor e o lab usam o mesmo motor, então **toda saída bate**. As diferenças dos outros bancos entram como nota "Nos outros bancos" (§2.9) e nas aulas do grupo "Os Dialetos" do Nível 3. Nunca afirme "no MySQL é assim" sem conferir na documentação oficial — e marque como **ilustrativo** o que não dá para rodar no lab.

## 8. Escrita
- Português do Brasil, frases curtas, "você". O leitor nunca mexeu num banco.
- Termos em inglês ganham tradução na primeira vez: `SELECT` = "selecione", `WHERE` = "onde".
- Exemplos com a vida da Ana e a **Loja Aurora**: o estoque, os pedidos, os clientes.
- Boas práticas desde o começo, sempre com o porquê: nome de coluna minúsculo, `WHERE` antes de UPDATE/DELETE, aspas simples para texto, parâmetros contra SQL injection (no Nível 3).
- SQL em MAIÚSCULAS nas palavras-chave (`SELECT nome FROM clientes`), nomes de tabela/coluna em minúsculas.
