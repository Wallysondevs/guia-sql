-- ============================================================
-- Loja Aurora — banco de exemplo do Guia SQL (pt-BR)
-- Seed determinístico: dados fixos, escritos à mão.
-- Uso: sqlite3 aurora.db < aurora.sql
-- Todos os nomes, telefones e emails são fictícios.
-- ============================================================

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS funcionarios;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS fornecedores;
DROP TABLE IF EXISTS categorias;

-- ------------------------------------------------------------
-- Esquema
-- ------------------------------------------------------------

CREATE TABLE categorias (
    id        INTEGER PRIMARY KEY,
    nome      TEXT NOT NULL,
    descricao TEXT
);

CREATE TABLE fornecedores (
    id       INTEGER PRIMARY KEY,
    nome     TEXT NOT NULL,
    cidade   TEXT,
    estado   TEXT,
    pais     TEXT NOT NULL,
    telefone TEXT
);

CREATE TABLE produtos (
    id            INTEGER PRIMARY KEY,
    nome          TEXT NOT NULL,
    categoria_id  INTEGER NOT NULL REFERENCES categorias(id),
    fornecedor_id INTEGER NOT NULL REFERENCES fornecedores(id),
    preco         REAL NOT NULL,
    estoque       INTEGER NOT NULL DEFAULT 0,
    descontinuado INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE clientes (
    id         INTEGER PRIMARY KEY,
    nome       TEXT NOT NULL,
    email      TEXT,
    cidade     TEXT,
    estado     TEXT,
    nascimento TEXT,
    vip        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE funcionarios (
    id       INTEGER PRIMARY KEY,
    nome     TEXT NOT NULL,
    cargo    TEXT NOT NULL,
    salario  REAL NOT NULL,
    chefe_id INTEGER REFERENCES funcionarios(id)
);

CREATE TABLE pedidos (
    id             INTEGER PRIMARY KEY,
    cliente_id     INTEGER NOT NULL REFERENCES clientes(id),
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id),
    data           TEXT NOT NULL,
    entregue_em    TEXT,
    frete          REAL NOT NULL DEFAULT 0
);

CREATE TABLE itens_pedido (
    pedido_id      INTEGER NOT NULL REFERENCES pedidos(id),
    produto_id     INTEGER NOT NULL REFERENCES produtos(id),
    quantidade     INTEGER NOT NULL,
    preco_unitario REAL NOT NULL,
    PRIMARY KEY (pedido_id, produto_id)
);

-- ------------------------------------------------------------
-- categorias (8)
-- ------------------------------------------------------------

INSERT INTO categorias (id, nome, descricao) VALUES
(1, 'Papelaria',       'Material escolar e de escritório'),
(2, 'Eletrônicos',     'Acessórios e dispositivos eletrônicos'),
(3, 'Casa e Cozinha',  'Utensílios para o lar'),
(4, 'Livros',          'Livros, dicionários e guias'),
(5, 'Brinquedos',      'Brinquedos e jogos para todas as idades'),
(6, 'Esporte e Lazer', 'Artigos esportivos e de lazer'),
(7, 'Alimentos',       'Alimentos não perecíveis e regionais'),
(8, 'Jardim',          'Ferramentas e artigos de jardinagem');

-- ------------------------------------------------------------
-- fornecedores (6) — 2 estrangeiros; um nome com apóstrofo
-- ------------------------------------------------------------

INSERT INTO fornecedores (id, nome, cidade, estado, pais, telefone) VALUES
(1, 'Distribuidora Piauí Center', 'Teresina',     'PI', 'Brasil',    '(86) 99821-4455'),
(2, 'Loja D''Água',               'Fortaleza',    'CE', 'Brasil',    '(85) 98712-3344'),
(3, 'Atlântico Importados',       'São Paulo',    'SP', 'Brasil',    '(11) 97654-8899'),
(4, 'Lusitana Comércio',          'Porto',        NULL, 'Portugal',  '+351 22 123 4567'),
(5, 'Pampa Sur',                  'Buenos Aires', NULL, 'Argentina', '+54 11 4321 8765'),
(6, 'Norte Suprimentos',          'Teresina',     'PI', 'Brasil',    '(86) 99344-2211');

-- ------------------------------------------------------------
-- produtos (45) — 12 e 27 descontinuados; 43, 44 e 45 nunca vendidos
-- ------------------------------------------------------------

INSERT INTO produtos (id, nome, categoria_id, fornecedor_id, preco, estoque, descontinuado) VALUES
(1,  'Caderno Pautado 96 folhas',        1, 1, 12.35,  120, 0),
(2,  'Caneta Esferográfica Azul',        1, 1, 2.79,   500, 0),
(3,  'Lápis Grafite HB',                 1, 6, 1.15,   430, 0),
(4,  'Marca-texto Amarelo',              1, 6, 4.9,    210, 0),
(5,  'Mochila Escolar Azul',             1, 3, 89.99,  35,  0),
(6,  'Estojo Duplo',                     1, 1, 19.5,   80,  0),
(7,  'Fone de Ouvido Bluetooth',         2, 3, 129.9,  44,  0),
(8,  'Mouse Sem Fio',                    2, 3, 59.95,  60,  0),
(9,  'Teclado Compacto',                 2, 3, 99.0,   25,  0),
(10, 'Carregador USB-C 20W',             2, 5, 45.5,   150, 0),
(11, 'Caixa de Som Portátil',            2, 3, 189.99, 18,  0),
(12, 'Pen Drive 32GB',                   2, 3, 29.9,   0,   1),
(13, 'Cabo HDMI 2 metros',               2, 5, 24.75,  95,  0),
(14, 'Jogo de Panelas 5 peças',          3, 2, 249.9,  12,  0),
(15, 'Garrafa Térmica 1L',               3, 2, 54.3,   70,  0),
(16, 'Conjunto de Copos 6 unidades',     3, 4, 39.99,  48,  0),
(17, 'Faqueiro Inox 24 peças',           3, 4, 119.4,  22,  0),
(18, 'Tábua de Corte de Bambu',          3, 2, 27.85,  66,  0),
(19, 'Avental de Cozinha',               3, 2, 22.9,   54,  0),
(20, 'Dicionário Escolar',               4, 1, 34.6,   40,  0),
(21, 'Atlas Geográfico',                 4, 1, 58.0,   26,  0),
(22, 'Romance O Rio e a Serra',          4, 4, 42.35,  33,  0),
(23, 'Guia de Receitas do Nordeste',     4, 4, 49.9,   29,  0),
(24, 'Livro Infantil A Jabutina',        4, 1, 25.45,  61,  0),
(25, 'Quebra-cabeça 500 peças',          5, 5, 36.9,   38,  0),
(26, 'Boneca de Pano Maria Flor',        5, 2, 44.25,  27,  0),
(27, 'Carrinho de Fricção',              5, 5, 18.6,   0,   1),
(28, 'Jogo de Tabuleiro Trilha Mística', 5, 5, 79.99,  21,  0),
(29, 'Bola de Vinil Colorida',           5, 6, 14.3,   88,  0),
(30, 'Garrafa Squeeze 700ml',            6, 6, 21.75,  95,  0),
(31, 'Corda de Pular',                   6, 6, 16.4,   73,  0),
(32, 'Tapete de Yoga',                   6, 3, 84.9,   19,  0),
(33, 'Par de Halteres 2kg',              6, 3, 69.99,  24,  0),
(34, 'Boné Esportivo',                   6, 6, 32.5,   57,  0),
(35, 'Café Torrado 500g',                7, 1, 23.85,  140, 0),
(36, 'Mel Silvestre 300g',               7, 6, 28.6,   52,  0),
(37, 'Azeite Extra Virgem 500ml',        7, 4, 47.95,  64,  0),
(38, 'Doce de Leite 400g',               7, 5, 19.35,  76,  0),
(39, 'Castanha de Caju 200g',            7, 1, 31.2,   58,  0),
(40, 'Geleia de Uva 250g',               7, 5, 17.65,  49,  0),
(41, 'Regador Plástico 5L',              8, 2, 26.45,  31,  0),
(42, 'Kit Sementes de Horta',            8, 6, 15.9,   83,  0),
(43, 'Vaso de Cerâmica Médio',           8, 2, 38.75,  20,  0),
(44, 'Tesoura de Poda',                  8, 6, 52.2,   17,  0),
(45, 'Luvas de Jardinagem',              8, 2, 13.45,  41,  0);

-- ------------------------------------------------------------
-- clientes (30) — 7, 15 e 23 sem email; 9 e 21 sem nascimento;
-- 27 a 30 nunca fizeram pedido; duas "Ana" (3 e 18)
-- ------------------------------------------------------------

INSERT INTO clientes (id, nome, email, cidade, estado, nascimento, vip) VALUES
(1,  'José Ribamar Silva',    'jose.ribamar@exemplo.com.br',      'Teresina',  'PI', '1985-03-12', 1),
(2,  'Maria Clara Mendes',    'maria.clara@exemplo.com.br',       'Teresina',  'PI', '1992-07-25', 0),
(3,  'Ana Beatriz Sousa',     'ana.beatriz@exemplo.com.br',       'São Paulo', 'SP', '1998-11-03', 1),
(4,  'Carlos Eduardo Lima',   'carlos.lima@exemplo.com.br',       'Fortaleza', 'CE', '1979-01-18', 0),
(5,  'Conceição Prado',       'conceicao.prado@exemplo.com.br',   'Teresina',  'PI', '1965-09-30', 0),
(6,  'Rafael Monteiro',       'rafael.monteiro@exemplo.com.br',   'São Paulo', 'SP', '1990-05-14', 0),
(7,  'Luís Otávio Brito',     NULL,                               'Parnaíba',  'PI', '1988-12-02', 0),
(8,  'Fernanda Carvalho',     'fernanda.carvalho@exemplo.com.br', 'Fortaleza', 'CE', '1995-04-21', 1),
(9,  'Antônio Carlos Neves',  'antonio.neves@exemplo.com.br',     'Teresina',  'PI', NULL,         0),
(10, 'Juliana Paes Barbosa',  'juliana.barbosa@exemplo.com.br',   'Recife',    'PE', '1993-08-09', 0),
(11, 'Marcos Vinícius Rocha', 'marcos.rocha@exemplo.com.br',      'São Paulo', 'SP', '1982-02-27', 0),
(12, 'Patrícia Gusmão',       'patricia.gusmao@exemplo.com.br',   'Fortaleza', 'CE', '1987-06-16', 0),
(13, 'Tiago Fontes',          'tiago.fontes@exemplo.com.br',      'Teresina',  'PI', '2000-10-05', 0),
(14, 'Camila Duarte',         'camila.duarte@exemplo.com.br',     'Picos',     'PI', '1996-03-19', 0),
(15, 'Roberto Falcão',        NULL,                               'São Paulo', 'SP', '1975-07-07', 0),
(16, 'Larissa Macêdo',        'larissa.macedo@exemplo.com.br',    'Teresina',  'PI', '1999-01-23', 1),
(17, 'Gustavo Henrique Prado','gustavo.prado@exemplo.com.br',     'Fortaleza', 'CE', '1984-11-11', 0),
(18, 'Ana Carvalho Lima',     'ana.carvalho@exemplo.com.br',      'Teresina',  'PI', '1991-05-28', 0),
(19, 'Bruno Cavalcante',      'bruno.cavalcante@exemplo.com.br',  'Recife',    'PE', '1989-09-15', 0),
(20, 'Vitória Régia Campos',  'vitoria.campos@exemplo.com.br',    'São Paulo', 'SP', '1997-12-24', 0),
(21, 'Sebastião Moura',       'sebastiao.moura@exemplo.com.br',   'Oeiras',    'PI', NULL,         0),
(22, 'Débora Cristina Alves', 'debora.alves@exemplo.com.br',      'Fortaleza', 'CE', '1994-02-08', 0),
(23, 'Henrique Sales',        NULL,                               'Teresina',  'PI', '1981-04-30', 0),
(24, 'Isabela Franco',        'isabela.franco@exemplo.com.br',    'São Paulo', 'SP', '2001-06-17', 0),
(25, 'Otávio Bezerra',        'otavio.bezerra@exemplo.com.br',    'Teresina',  'PI', '1978-08-22', 0),
(26, 'Mirela Pontes',         'mirela.pontes@exemplo.com.br',     'Fortaleza', 'CE', '1993-10-10', 1),
(27, 'Paulo Sérgio Andrade',  'paulo.andrade@exemplo.com.br',     'Floriano',  'PI', '1986-01-05', 0),
(28, 'Tainá Soares',          'taina.soares@exemplo.com.br',      'São Paulo', 'SP', '1998-07-13', 0),
(29, 'Elias Furtado',         'elias.furtado@exemplo.com.br',     'Teresina',  'PI', '1972-11-29', 0),
(30, 'Rosângela Dias',        'rosangela.dias@exemplo.com.br',    'Fortaleza', 'CE', '1969-05-02', 0);

-- ------------------------------------------------------------
-- funcionarios (8) — gerente (1) sem chefe; self-join via chefe_id
-- ------------------------------------------------------------

INSERT INTO funcionarios (id, nome, cargo, salario, chefe_id) VALUES
(1, 'Marta Lustosa', 'Gerente',     9800.0,  NULL),
(2, 'Caio Teles',    'Vendedor',    3200.5,  1),
(3, 'Renata Borges', 'Vendedora',   3350.75, 1),
(4, 'Pedro Araújo',  'Vendedor',    3100.0,  1),
(5, 'Luana Castelo', 'Supervisora', 5400.25, 1),
(6, 'Igor Mendes',   'Vendedor',    2980.9,  5),
(7, 'Sofia Rocha',   'Vendedora',   3025.4,  5),
(8, 'Davi Nunes',    'Estoquista',  2650.0,  5);

-- ------------------------------------------------------------
-- pedidos (90) — datas de 2024-01 a 2026-10;
-- 86 a 90 ainda não entregues (entregue_em NULL)
-- ------------------------------------------------------------

INSERT INTO pedidos (id, cliente_id, funcionario_id, data, entregue_em, frete) VALUES
(1,  1,  2, '2024-01-05', '2024-01-10', 9.9),
(2,  2,  3, '2024-01-14', '2024-01-21', 15.5),
(3,  3,  4, '2024-01-27', '2024-01-31', 12.35),
(4,  4,  6, '2024-02-03', '2024-02-09', 0.0),
(5,  5,  7, '2024-02-17', '2024-02-25', 22.8),
(6,  6,  5, '2024-02-26', '2024-03-02', 18.45),
(7,  7,  2, '2024-03-08', '2024-03-15', 7.25),
(8,  8,  3, '2024-03-15', '2024-03-19', 30.0),
(9,  9,  4, '2024-03-29', '2024-04-04', 9.9),
(10, 10, 6, '2024-04-10', '2024-04-18', 15.5),
(11, 11, 7, '2024-04-23', '2024-04-28', 12.35),
(12, 12, 5, '2024-05-04', '2024-05-11', 0.0),
(13, 13, 2, '2024-05-16', '2024-05-20', 22.8),
(14, 14, 3, '2024-05-30', '2024-06-05', 18.45),
(15, 15, 4, '2024-06-11', '2024-06-19', 7.25),
(16, 16, 6, '2024-06-25', '2024-06-30', 30.0),
(17, 17, 7, '2024-07-02', '2024-07-09', 9.9),
(18, 18, 5, '2024-07-18', '2024-07-22', 15.5),
(19, 19, 2, '2024-07-31', '2024-08-06', 12.35),
(20, 20, 3, '2024-08-09', '2024-08-17', 0.0),
(21, 21, 4, '2024-08-20', '2024-08-25', 22.8),
(22, 22, 6, '2024-08-28', '2024-09-04', 18.45),
(23, 23, 7, '2024-09-06', '2024-09-10', 7.25),
(24, 24, 5, '2024-09-24', '2024-09-30', 30.0),
(25, 25, 2, '2024-10-07', '2024-10-15', 9.9),
(26, 26, 3, '2024-10-15', '2024-10-20', 15.5),
(27, 1,  4, '2024-10-29', '2024-11-05', 12.35),
(28, 2,  6, '2024-11-08', '2024-11-12', 0.0),
(29, 3,  7, '2024-11-21', '2024-11-27', 22.8),
(30, 4,  5, '2024-12-02', '2024-12-10', 18.45),
(31, 5,  2, '2024-12-13', '2024-12-18', 7.25),
(32, 6,  3, '2024-12-20', '2024-12-27', 30.0),
(33, 7,  4, '2025-01-06', '2025-01-10', 9.9),
(34, 8,  6, '2025-01-17', '2025-01-23', 15.5),
(35, 9,  7, '2025-01-28', '2025-02-05', 12.35),
(36, 10, 5, '2025-02-05', '2025-02-10', 0.0),
(37, 11, 2, '2025-02-19', '2025-02-26', 22.8),
(38, 12, 3, '2025-03-03', '2025-03-07', 18.45),
(39, 13, 4, '2025-03-14', '2025-03-20', 7.25),
(40, 14, 6, '2025-03-27', '2025-04-04', 30.0),
(41, 15, 7, '2025-04-08', '2025-04-13', 9.9),
(42, 16, 5, '2025-04-22', '2025-04-29', 15.5),
(43, 17, 2, '2025-05-05', '2025-05-09', 12.35),
(44, 18, 3, '2025-05-15', '2025-05-21', 0.0),
(45, 19, 4, '2025-05-29', '2025-06-06', 22.8),
(46, 20, 6, '2025-06-10', '2025-06-15', 18.45),
(47, 21, 7, '2025-06-24', '2025-07-01', 7.25),
(48, 22, 5, '2025-07-07', '2025-07-11', 30.0),
(49, 23, 2, '2025-07-16', '2025-07-22', 9.9),
(50, 24, 3, '2025-07-30', '2025-08-07', 15.5),
(51, 25, 4, '2025-08-11', '2025-08-16', 12.35),
(52, 26, 6, '2025-08-25', '2025-09-01', 0.0),
(53, 1,  7, '2025-09-03', '2025-09-07', 22.8),
(54, 2,  5, '2025-09-17', '2025-09-23', 18.45),
(55, 3,  2, '2025-09-26', '2025-10-04', 7.25),
(56, 4,  3, '2025-10-08', '2025-10-13', 30.0),
(57, 5,  4, '2025-10-21', '2025-10-28', 9.9),
(58, 6,  6, '2025-11-04', '2025-11-08', 15.5),
(59, 7,  7, '2025-11-18', '2025-11-24', 12.35),
(60, 8,  5, '2025-11-27', '2025-12-05', 0.0),
(61, 9,  2, '2025-12-05', '2025-12-10', 22.8),
(62, 10, 3, '2025-12-12', '2025-12-19', 18.45),
(63, 11, 4, '2025-12-19', '2025-12-23', 7.25),
(64, 12, 6, '2025-12-30', '2026-01-05', 30.0),
(65, 13, 7, '2026-01-08', '2026-01-16', 9.9),
(66, 14, 5, '2026-01-20', '2026-01-25', 15.5),
(67, 15, 2, '2026-02-02', '2026-02-09', 12.35),
(68, 16, 3, '2026-02-13', '2026-02-17', 0.0),
(69, 17, 4, '2026-02-25', '2026-03-03', 22.8),
(70, 18, 6, '2026-03-09', '2026-03-17', 18.45),
(71, 19, 7, '2026-03-20', '2026-03-25', 7.25),
(72, 20, 5, '2026-04-01', '2026-04-08', 30.0),
(73, 21, 2, '2026-04-14', '2026-04-18', 9.9),
(74, 22, 3, '2026-04-28', '2026-05-04', 15.5),
(75, 23, 4, '2026-05-07', '2026-05-15', 12.35),
(76, 24, 6, '2026-05-19', '2026-05-24', 0.0),
(77, 25, 7, '2026-06-01', '2026-06-08', 22.8),
(78, 26, 5, '2026-06-15', '2026-06-19', 18.45),
(79, 1,  2, '2026-06-29', '2026-07-05', 7.25),
(80, 2,  3, '2026-07-10', '2026-07-18', 30.0),
(81, 3,  4, '2026-07-22', '2026-07-27', 9.9),
(82, 4,  6, '2026-08-04', '2026-08-11', 15.5),
(83, 5,  7, '2026-08-17', '2026-08-21', 12.35),
(84, 6,  5, '2026-08-27', '2026-09-02', 0.0),
(85, 7,  2, '2026-09-08', '2026-09-16', 22.8),
(86, 8,  3, '2026-09-18', NULL,         18.45),
(87, 9,  4, '2026-09-28', NULL,         7.25),
(88, 10, 6, '2026-10-05', NULL,         30.0),
(89, 11, 7, '2026-10-09', NULL,         9.9),
(90, 12, 5, '2026-10-14', NULL,         15.5);

-- ------------------------------------------------------------
-- itens_pedido (220) — pedidos 1 a 40 com 3 itens, 41 a 90 com 2.
-- preco_unitario = preço de catálogo na data (3 promoções:
-- pedido 7/produto 20, pedido 22/produto 22, pedido 50/produto 19).
-- Produtos 43, 44 e 45 nunca aparecem aqui.
-- ------------------------------------------------------------

INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES
(1, 1, 2, 12.35),   (1, 2, 1, 2.79),    (1, 3, 3, 1.15),
(2, 4, 1, 4.9),     (2, 5, 2, 89.99),   (2, 6, 1, 19.5),
(3, 7, 3, 129.9),   (3, 8, 1, 59.95),   (3, 9, 2, 99.0),
(4, 10, 2, 45.5),   (4, 11, 1, 189.99), (4, 12, 3, 29.9),
(5, 13, 1, 24.75),  (5, 14, 2, 249.9),  (5, 15, 1, 54.3),
(6, 16, 3, 39.99),  (6, 17, 1, 119.4),  (6, 18, 2, 27.85),
(7, 19, 2, 22.9),   (7, 20, 1, 29.9),   (7, 21, 3, 58.0),
(8, 22, 1, 42.35),  (8, 23, 2, 49.9),   (8, 24, 1, 25.45),
(9, 25, 3, 36.9),   (9, 26, 1, 44.25),  (9, 27, 2, 18.6),
(10, 28, 2, 79.99), (10, 29, 1, 14.3),  (10, 30, 3, 21.75),
(11, 31, 1, 16.4),  (11, 32, 2, 84.9),  (11, 33, 1, 69.99),
(12, 34, 3, 32.5),  (12, 35, 1, 23.85), (12, 36, 2, 28.6),
(13, 37, 2, 47.95), (13, 38, 1, 19.35), (13, 39, 3, 31.2),
(14, 40, 1, 17.65), (14, 41, 2, 26.45), (14, 42, 1, 15.9),
(15, 1, 3, 12.35),  (15, 2, 1, 2.79),   (15, 3, 2, 1.15),
(16, 4, 2, 4.9),    (16, 5, 1, 89.99),  (16, 6, 3, 19.5),
(17, 7, 1, 129.9),  (17, 8, 2, 59.95),  (17, 9, 1, 99.0),
(18, 10, 3, 45.5),  (18, 11, 1, 189.99),(18, 12, 2, 29.9),
(19, 13, 2, 24.75), (19, 14, 1, 249.9), (19, 15, 3, 54.3),
(20, 16, 1, 39.99), (20, 17, 2, 119.4), (20, 18, 1, 27.85),
(21, 19, 3, 22.9),  (21, 20, 1, 34.6),  (21, 21, 2, 58.0),
(22, 22, 2, 38.0),  (22, 23, 1, 49.9),  (22, 24, 3, 25.45),
(23, 25, 1, 36.9),  (23, 26, 2, 44.25), (23, 27, 1, 18.6),
(24, 28, 3, 79.99), (24, 29, 1, 14.3),  (24, 30, 2, 21.75),
(25, 31, 2, 16.4),  (25, 32, 1, 84.9),  (25, 33, 3, 69.99),
(26, 34, 1, 32.5),  (26, 35, 2, 23.85), (26, 36, 1, 28.6),
(27, 37, 3, 47.95), (27, 38, 1, 19.35), (27, 39, 2, 31.2),
(28, 40, 2, 17.65), (28, 41, 1, 26.45), (28, 42, 3, 15.9),
(29, 1, 1, 12.35),  (29, 2, 2, 2.79),   (29, 3, 1, 1.15),
(30, 4, 3, 4.9),    (30, 5, 1, 89.99),  (30, 6, 2, 19.5),
(31, 7, 2, 129.9),  (31, 8, 1, 59.95),  (31, 9, 3, 99.0),
(32, 10, 1, 45.5),  (32, 11, 2, 189.99),(32, 12, 1, 29.9),
(33, 13, 3, 24.75), (33, 14, 1, 249.9), (33, 15, 2, 54.3),
(34, 16, 2, 39.99), (34, 17, 1, 119.4), (34, 18, 3, 27.85),
(35, 19, 1, 22.9),  (35, 20, 2, 34.6),  (35, 21, 1, 58.0),
(36, 22, 3, 42.35), (36, 23, 1, 49.9),  (36, 24, 2, 25.45),
(37, 25, 2, 36.9),  (37, 26, 1, 44.25), (37, 27, 3, 18.6),
(38, 28, 1, 79.99), (38, 29, 2, 14.3),  (38, 30, 1, 21.75),
(39, 31, 3, 16.4),  (39, 32, 1, 84.9),  (39, 33, 2, 69.99),
(40, 34, 2, 32.5),  (40, 35, 1, 23.85), (40, 36, 3, 28.6),
(41, 1, 1, 12.35),  (41, 2, 2, 2.79),
(42, 3, 2, 1.15),   (42, 4, 1, 4.9),
(43, 5, 1, 89.99),  (43, 6, 1, 19.5),
(44, 7, 3, 129.9),  (44, 8, 2, 59.95),
(45, 9, 1, 99.0),   (45, 10, 2, 45.5),
(46, 11, 2, 189.99),(46, 12, 1, 29.9),
(47, 13, 1, 24.75), (47, 14, 1, 249.9),
(48, 15, 3, 54.3),  (48, 16, 2, 39.99),
(49, 17, 1, 119.4), (49, 18, 2, 27.85),
(50, 19, 2, 19.9),  (50, 20, 1, 34.6),
(51, 21, 1, 58.0),  (51, 22, 1, 42.35),
(52, 23, 3, 49.9),  (52, 24, 2, 25.45),
(53, 25, 1, 36.9),  (53, 26, 2, 44.25),
(54, 27, 2, 18.6),  (54, 28, 1, 79.99),
(55, 29, 1, 14.3),  (55, 30, 1, 21.75),
(56, 31, 3, 16.4),  (56, 32, 2, 84.9),
(57, 33, 1, 69.99), (57, 34, 2, 32.5),
(58, 35, 2, 23.85), (58, 36, 1, 28.6),
(59, 37, 1, 47.95), (59, 38, 1, 19.35),
(60, 39, 3, 31.2),  (60, 40, 2, 17.65),
(61, 41, 1, 26.45), (61, 42, 2, 15.9),
(62, 1, 2, 12.35),  (62, 2, 1, 2.79),
(63, 3, 1, 1.15),   (63, 4, 1, 4.9),
(64, 5, 3, 89.99),  (64, 6, 2, 19.5),
(65, 7, 1, 129.9),  (65, 8, 2, 59.95),
(66, 9, 2, 99.0),   (66, 10, 1, 45.5),
(67, 11, 1, 189.99),(67, 13, 1, 24.75),
(68, 13, 3, 24.75), (68, 14, 2, 249.9),
(69, 15, 1, 54.3),  (69, 16, 2, 39.99),
(70, 17, 2, 119.4), (70, 18, 1, 27.85),
(71, 19, 1, 22.9),  (71, 20, 1, 34.6),
(72, 21, 3, 58.0),  (72, 22, 2, 42.35),
(73, 23, 1, 49.9),  (73, 24, 2, 25.45),
(74, 25, 2, 36.9),  (74, 26, 1, 44.25),
(75, 28, 1, 79.99), (75, 29, 1, 14.3),
(76, 29, 3, 14.3),  (76, 30, 2, 21.75),
(77, 31, 1, 16.4),  (77, 32, 2, 84.9),
(78, 33, 2, 69.99), (78, 34, 1, 32.5),
(79, 35, 1, 23.85), (79, 36, 1, 28.6),
(80, 37, 3, 47.95), (80, 38, 2, 19.35),
(81, 39, 1, 31.2),  (81, 40, 2, 17.65),
(82, 41, 2, 26.45), (82, 42, 1, 15.9),
(83, 1, 1, 12.35),  (83, 2, 1, 2.79),
(84, 3, 3, 1.15),   (84, 4, 2, 4.9),
(85, 5, 1, 89.99),  (85, 6, 2, 19.5),
(86, 7, 2, 129.9),  (86, 8, 1, 59.95),
(87, 9, 1, 99.0),   (87, 10, 1, 45.5),
(88, 11, 3, 189.99),(88, 13, 2, 24.75),
(89, 13, 1, 24.75), (89, 14, 1, 249.9),
(90, 15, 2, 54.3),  (90, 16, 1, 39.99);

COMMIT;
