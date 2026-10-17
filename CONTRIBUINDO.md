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

*(placeholder — o agente do simulador escreve aqui o contrato das metas, o testador e o que o editor faz e não faz)*

## 6. Fidelidade: o laboratório (`~/guia-sql-lab/lab`, na VPS)
É a máquina da Ana (usuária `ana`, computador `notebook`, `/home/ana`, pt_BR) com o **sqlite3 3.50.6 de verdade** e o banco `~/loja.db` pronto. Toda saída de terminal mostrada numa aula vem de lá:
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
