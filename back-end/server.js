const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const path = require("path");
const cors = require('cors');
const app = express();
app.use(cors());


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Amorim#2210",
    database: "saep_db_new"
});


connection.connect((err) => {
    if (err) {
        console.log("Erro ao conectar no banco:", err.message);
        return;
    }
    console.log("Banco conectado com sucesso!");
});

app.use(express.static(path.join(__dirname, "../front-end")));




app.post("/cadastroUsuario", (req, res) => {
    const { nome,email,senha } = req.body;

    const sql = "INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)";

    connection.query(sql, [nome, email,senha], (err) => {
        if (err) {
            console.error("Erro ao cadastrar tarefa:", err.message);
            return res.status(500).send("Erro ao salvar no banco.");
        }

        res.send("Tarefa cadastrada com sucesso!");
    });
});


app.post("/login", (req, res) => {
    const { email, senha } = req.body;
    const sql = "SELECT * FROM usuario WHERE email = ? AND senha = ?";

    connection.query(sql, [email, senha], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erro no servidor." });
        }

        if (results.length > 0) {
         
            const usuarioEncontrado = results[0];
            res.status(200).json({
                mensagem: "Login realizado com sucesso!",
                nome: usuarioEncontrado.nome 
            });
        } else {
            res.status(401).json({ error: "Email ou senha incorretos." });
        }
    });
});



app.post("/produtoCadastro", (req, res) => {
    // 1. Recebendo todos os novos campos do formulário
    const { 
        nome_prod, 
        marca, 
        modelo, 
        material, 
        tamanho, 
        tensao,  
        quantidade,
        estoque_minimo 
    } = req.body;

   
    const sql = `INSERT INTO produto 
                 (nome_prod, marca, modelo, material, tamanho, tensao,  quantidade, estoque_minimo) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(sql, [nome_prod, marca, modelo, material, tamanho, tensao,  quantidade, estoque_minimo], (err) => {
        if (err) {
            console.error("Erro ao cadastrar produto:", err.message);
            return res.status(500).send("Erro ao salvar no banco.");
        }

        res.send("produto cadastrado com sucesso!");
    });
});




    app.get("/mostrarProduto", (req,res) => {
    

        const sql = `SELECT * FROM produto `;

        connection.query(sql, (err, results) => {
            if (err) {
                console.error("Erro ao listar Produtos:", err.message);
                return res.status(500).send("Erro ao buscar dados.");
            }

            res.json(results);
        });
    });


   

    app.put("/editarProduto", (req, res) => {
    const { id, nome_prod, marca, modelo, material, tamanho, tensao, quantidade, estoque_minimo } = req.body;

    const sql = "UPDATE produto SET nome_prod = ?, marca = ?, modelo = ?, material = ?, tamanho = ?, tensao = ?, quantidade = ?, estoque_minimo = ? WHERE id = ?";

    connection.query(sql, [nome_prod, marca, modelo, material, tamanho, tensao, quantidade, estoque_minimo, id], (err) => {
        if (err) {
            console.error("Erro ao editar produto:", err.message);
            return res.status(500).send("Erro ao salvar no banco.");
        }
        res.send("Produto atualizado com sucesso!");
    });
});


    app.delete("/deletarProduto/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM produto WHERE id=?";

    connection.query(sql, [id], (err) => {
        if (err) {
            console.error("Erro ao excluir:", err.message);
            return res.status(500).send("Erro ao excluir.");
        }

        res.send("Tarefa excluída com sucesso.");
    });
});



app.post('/movimentacao', (req, res) => {
    const dados = Array.isArray(req.body) ? req.body : [req.body];

    const promessas = dados.map(item => {
        return new Promise((resolve, reject) => {
            const id_produto = item.id_produto; 
            const quantidade = item.quantidade;
            const tipo = item.tipo; 
            const observacao = item.observacao || 'Sem observação';
            const usuario = item.usuario || 'Desconhecido';
            
            //  Recebe a data do frontend ou usa a atual se não vier nada
            const data_mov = item.data_movimentacao ? item.data_movimentacao : new Date();

            const sqlBuscaNome = "SELECT nome_prod FROM produto WHERE id = ?";
            
            connection.query(sqlBuscaNome, [id_produto], (err, result) => {
                if (err) return reject(err);
                const nomeProduto = result.length > 0 ? result[0].nome_prod : "Produto removido";

                // INSERE COM A DATA ESCOLHIDA
                const sqlMov = `
                    INSERT INTO movimentacao (id_produto, nome_produto, tipo, quantidade, observacao, usuario, data_movimentacao)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

                connection.query(sqlMov, [id_produto, nomeProduto, tipo, quantidade, observacao, usuario, data_mov], (errInsert) => {
                    if (errInsert) return reject(errInsert);

                    let sqlUpdate = "";
                    if (tipo === 'ENTRADA') {
                        sqlUpdate = "UPDATE produto SET quantidade = quantidade + ? WHERE id = ?";
                    } else {
                        sqlUpdate = "UPDATE produto SET quantidade = quantidade - ? WHERE id = ?";
                    }

                    connection.query(sqlUpdate, [quantidade, id_produto], (errUpdate) => {
                        if (errUpdate) return reject(errUpdate);
                        resolve();
                    });
                });
            });
        });
    });

    Promise.all(promessas)
        .then(() => res.send("Movimentação registrada com sucesso."))
        .catch(err => {
            console.error("Erro:", err);
            res.status(500).send("Erro ao processar.");
        });
});



  app.get("/mostrarMovimentacao", (req,res) => {
    

        const sql = `  SELECT 
            movimentacao.*,
            produto.nome_prod
        FROM movimentacao
        LEFT JOIN produto ON movimentacao.id_produto = produto.id
        ORDER BY movimentacao.data_movimentacao DESC; `;

        connection.query(sql, (err, results) => {
            if (err) {
                console.error("Erro ao listar movimentacoes:", err.message);
                return res.status(500).send("Erro ao buscar dados.");
            }

            res.json(results);
        });
    });


app.listen(2005, () =>
    console.log("Servidor rodando em http://localhost:2005/login.html")
);
