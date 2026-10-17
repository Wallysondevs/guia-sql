# Loja Aurora — dicionário do banco de exemplo

Banco oficial do Guia SQL (papel do Northwind no W3Schools). Todos os dados são
fictícios e **fixos**: o seed é `aurora.sql` (determinístico, escrito à mão) e o
binário `aurora.db` é gerado dele com `sqlite3 aurora.db < aurora.sql`
(SQLite 3.50.6). Nunca edite o `.db` direto — mude o `.sql` e regenere.

A Loja Aurora é uma loja de departamentos fictícia com sede em Teresina (PI) que
vende papelaria, eletrônicos, utensílios, livros, brinquedos, artigos de esporte,
alimentos e jardinagem.

## Contagens

| Tabela | Linhas |
|---|---|
| categorias | 8 |
| fornecedores | 6 |
| produtos | 45 |
| clientes | 30 |
| funcionarios | 8 |
| pedidos | 90 |
| itens_pedido | 220 |

## Tabelas e colunas

### categorias
| Coluna | Tipo | Observações |
|---|---|---|
| id | INTEGER | chave primária (1–8) |
| nome | TEXT | ex.: Papelaria, Eletrônicos, Jardim |
| descricao | TEXT | frase curta |

### fornecedores
| Coluna | Tipo | Observações |
|---|---|---|
| id | INTEGER | chave primária (1–6) |
| nome | TEXT | inclui `Loja D'Água` (id 2, apóstrofo) |
| cidade | TEXT | Teresina, Fortaleza, São Paulo, Porto, Buenos Aires |
| estado | TEXT | UF; **NULL nos estrangeiros** (ids 4 e 5) |
| pais | TEXT | Brasil, Portugal (id 4), Argentina (id 5) |
| telefone | TEXT | formato brasileiro ou internacional, fictício |

### produtos
| Coluna | Tipo | Observações |
|---|---|---|
| id | INTEGER | chave primária (1–45) |
| nome | TEXT | |
| categoria_id | INTEGER | FK → categorias(id) |
| fornecedor_id | INTEGER | FK → fornecedores(id) |
| preco | REAL | decimais variados (1.15, 2.79, 89.99, 249.9…) |
| estoque | INTEGER | 0 nos descontinuados |
| descontinuado | INTEGER | 0 ou 1 |

### clientes
| Coluna | Tipo | Observações |
|---|---|---|
| id | INTEGER | chave primária (1–30) |
| nome | TEXT | nomes brasileiros fictícios, com acentos |
| email | TEXT | todos em `@exemplo.com.br`; **3 NULL** |
| cidade | TEXT | com repetições (ver abaixo) |
| estado | TEXT | UF |
| nascimento | TEXT | ISO `YYYY-MM-DD`; **2 NULL** |
| vip | INTEGER | 0 ou 1 (vips: 1, 3, 8, 16, 26) |

### funcionarios
| Coluna | Tipo | Observações |
|---|---|---|
| id | INTEGER | chave primária (1–8) |
| nome | TEXT | |
| cargo | TEXT | Gerente, Supervisora, Vendedor(a), Estoquista |
| salario | REAL | 2650.0 a 9800.0 |
| chefe_id | INTEGER | FK → funcionarios(id); **self-join**; NULL na gerente |

Hierarquia: Marta Lustosa (1, Gerente, chefe_id NULL) chefia 2, 3, 4 e 5;
Luana Castelo (5, Supervisora) chefia 6, 7 e 8. O estoquista (8) não atende pedidos.

### pedidos
| Coluna | Tipo | Observações |
|---|---|---|
| id | INTEGER | chave primária (1–90) |
| cliente_id | INTEGER | FK → clientes(id); só clientes 1–26 |
| funcionario_id | INTEGER | FK → funcionarios(id); valores 2–7 |
| data | TEXT | ISO, de `2024-01-05` a `2026-10-14` |
| entregue_em | TEXT | ISO ou **NULL** (não entregue) |
| frete | REAL | inclui `0.0` (frete grátis) e decimais variados |

### itens_pedido
| Coluna | Tipo | Observações |
|---|---|---|
| pedido_id | INTEGER | FK → pedidos(id); PK composta com produto_id |
| produto_id | INTEGER | FK → produtos(id) |
| quantidade | INTEGER | 1 a 3 |
| preco_unitario | REAL | preço de catálogo na data do pedido |

Pedidos 1–40 têm 3 itens; pedidos 41–90 têm 2 itens. Total do pedido =
`SUM(quantidade * preco_unitario) + frete`.

## Casos pedagógicos (ids garantidos)

| Caso | Aula típica | Ids |
|---|---|---|
| Clientes sem email (NULL) | IS NULL / IS NOT NULL | clientes **7, 15, 23** |
| Clientes sem nascimento (NULL) | IS NULL | clientes **9, 21** |
| Clientes que nunca pediram | LEFT JOIN | clientes **27, 28, 29, 30** |
| Produtos nunca vendidos | LEFT JOIN / NOT IN | produtos **43, 44, 45** |
| Produtos descontinuados | WHERE descontinuado = 1 | produtos **12, 27** (estoque 0; venderam até meados de 2025) |
| Cidades repetidas (clientes) | DISTINCT / GROUP BY | Teresina (10), São Paulo (7), Fortaleza (7), Recife (2) |
| Pedidos não entregues | entregue_em IS NULL | pedidos **86, 87, 88, 89, 90** (set–out/2026) |
| Nomes com acento | collation / LIKE | José Ribamar Silva (1), Conceição Prado (5), Antônio Carlos Neves (9)… |
| Apóstrofo no nome | escape de aspas (`''`) | fornecedor **2 — Loja D'Água** |
| Homônimas parciais | LIKE 'Ana %' | clientes **3 (Ana Beatriz Sousa)** e **18 (Ana Carvalho Lima)** |
| Somas com decimais "feias" | ROUND | ex.: total do pedido 1 = 30.94; médias de preço × quantidade geram caudas de ponto flutuante |
| Self-join | chefe_id | funcionarios (gerente id 1 com chefe_id NULL) |
| Fornecedores estrangeiros | WHERE pais <> 'Brasil' / IS NULL em estado | fornecedores **4 (Portugal)** e **5 (Argentina)** |
| Frete grátis | WHERE frete = 0 | pedidos 4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84 |
| Preço histórico ≠ catálogo | comparação com produtos.preco | promoções: pedido 7/produto 20 (29.9), pedido 22/produto 22 (38.0), pedido 50/produto 19 (19.9) |

## Distribuição temporal dos pedidos

- 2024: pedidos 1–32 · 2025: pedidos 33–64 · 2026 (jan–out): pedidos 65–90.
- `entregue_em` fica 4 a 8 dias após `data`, exceto nos 5 pedidos pendentes.

## Regenerar o banco

```bash
cd assets/sql
sqlite3 aurora.db < aurora.sql   # recria tudo (o seed tem DROP TABLE IF EXISTS)
```

O seed começa com `PRAGMA foreign_keys = ON;` e `PRAGMA foreign_key_check`
retorna vazio.
