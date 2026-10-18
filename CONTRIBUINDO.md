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
   - um erro **para a execução ali** e aparece em vermelho com a mensagem **real** do SQLite (em inglês).
3. Limites que o autor precisa saber:
   - comandos de ponto (`.tables`, `.mode`…) **não existem no editor** — são do programa `sqlite3`, não SQL; ali eles dão o erro real de sintaxe. Ensine-os só no `pre.term`;
   - um SQL sem fim (ex.: `WITH RECURSIVE` sem `LIMIT`) é interrompido depois de ~4 s com o erro `interrupted`;
   - a tabela mostra até 500 linhas (as metas contam todas).

### A saída canônica (o que as metas `out:` e `contem:` enxergam)
Todas as linhas de **todos** os SELECTs da execução, no formato do `sqlite3 .mode list`: valores separados por `|`, um registro por linha, `NULL` vira vazio, números como o SQLite os escreve (`4.9`, não `4.90`). Ex.: `Lápis Grafite HB|1.15`.

### As metas (`data-goal`)
| Meta | Passa quando |
|---|---|
| `out:REGEX` | a saída canônica casa com a regex (JavaScript, **sem flags**: maiúsculas contam, `^` só casa o começo do texto todo). `\|` dentro da regex casa um `\|` literal; `\|` sem escape é alternativa normal de regex |
| `linhas:N` | o **último** SELECT devolveu exatamente N linhas |
| `colunas:a,b,c` | os nomes das colunas do último SELECT são exatamente esses, nessa ordem (use `AS`); `\,` é vírgula dentro de um nome |
| `contem:TEXTO` | o TEXTO aparece literalmente na saída canônica |
| `erro:` | a execução terminou em erro (qualquer um) |
| `erro:REGEX` | a mensagem de erro casa com a regex |
| `tabela:nome` | a tabela existe depois de rodar (nome em minúsculas) |
| `mudou:tabela=N` | depois de rodar, a tabela tem exatamente N linhas |

- Combine com `;;`: `data-goal="colunas:nome,preco;;linhas:3"` — **todas** precisam passar.
- Se o SQL deu erro, **só** metas `erro:` podem passar.
- O código inicial da caixa **não pode** cumprir a meta; o `pre.solucao` **tem** de cumprir. O testador confere os dois.
- Escape de HTML vale também dentro de `data-goal` (`&quot;` etc.) e dos `pre`.
- Prefira metas que aceitem respostas equivalentes (`linhas:`, `mudou:`, `contem:`) a um `out:` que só casa com uma escrita exata.

### O testador (na VPS)
```bash
node tools/testar-missoes.js pagina.html outra.html   # as missões da página
node tools/testar-missoes.js --nativo pagina.html     # + compara com o sqlite3 do host
node tools/sim.js consulta.sql                        # roda um .sql como o editor rodaria
```
- `testar-missoes.js` extrai cada `.trysql` e confere: contrato válido (meta conhecida, regex válida, missão com `pre.solucao`), **inicial falha** a meta, **solução passa**. Também roda cada `pre.file[data-resultado]` e acusa SQL que dá erro sem ser um exemplo de erro (marque exemplos de erro de propósito com `data-erro` no `pre`).
- `--nativo` roda tudo também no `sqlite3` nativo e compara a saída canônica; diferenças ficam registradas em `tools/DIFERENCAS.md`.
- `sim.js` serve para colher a saída real que você vai citar no texto da aula.

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
