// --- VARIÁVEIS DO MODAL (Mantido) ---
var modal = document.getElementById("myModal");
var btn = document.getElementById("myBtn");
var span = document.getElementsByClassName("close")[0];

if(btn) btn.onclick = function() { modal.style.display = "flex"; }
if(span) span.onclick = function() { modal.style.display = "none"; }
window.onclick = function(event) {
  if (event.target == modal) { modal.style.display = "none"; }
}

const formulario = document.querySelector(".formulario-modal");
const tbodyTabela = document.querySelector(".tabela-pagina-estoque tbody");

// --- FUNÇÃO CARREGAR PRODUTOS (CORRIGIDA) ---
async function carregarProdutos() {
    try {
        const response = await fetch('http://localhost:2005/mostrarProduto');
        const produtos = await response.json();

        tbodyTabela.innerHTML = "";

        produtos.forEach(produto => {
            const tr = document.createElement("tr");

            const caracteristicas = produto.caracteristicas || "-"; 
            const categoria = produto.categoria || "Geral";
            const minimo = produto.estoque_minimo || 5;
            
            let statusTexto = "OK";
            let statusCor = "green"; 
            
            if (produto.quantidade <= minimo) {
                statusTexto = "Baixo";
                statusCor = "red";
            } else if (produto.quantidade == 0) {
                statusTexto = "Indisponível";
                statusCor = "gray";
            }

           
            tr.innerHTML = `
                <td>${produto.nome_prod}</td>
                <td>${caracteristicas}</td>
                <td>${categoria}</td>
                <td>${produto.quantidade} un.</td>
                <td>${minimo}</td>
                <td style="color: ${statusCor}; font-weight: bold;">${statusTexto}</td>
                <td>
                    <button class="btn-editar" onclick="editarProduto(${produto.id}, '${produto.nome_prod}', ${produto.preco}, ${produto.quantidade})">✏️</button>
                    <button class="btn-excluir" onclick="excluirProduto(${produto.id})">🗑️</button>
                </td>
            `;

            tbodyTabela.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao carregar tabela:", error);
    }
}

// --- CADASTRO (Mantido) ---
formulario.addEventListener("submit", async (event) => {
    event.preventDefault(); 

    let nomeProd = document.querySelector(".input-nome-modal").value;
    let precoProd = document.querySelector(".input-preco").value; 
    let qtdProd = document.querySelector(".input-quantidade").value;

    const dadosProduto = {
        nome_prod: nomeProd, 
        preco: parseFloat(precoProd),
        quantidade: parseInt(qtdProd) 
    };

    try {
        const response = await fetch('http://localhost:2005/produtoCadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosProduto)
        });

        const respostaTexto = await response.text();

        if (response.ok) {
            alert("Sucesso: Produto cadastrado!"); 
            modal.style.display = "none";
            formulario.reset(); 
            carregarProdutos(); 
        } else {
            alert("Erro do servidor: " + respostaTexto);
        }

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar com o servidor.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();
});

// --- FUNÇÃO EDITAR (CORRIGIDA E CONECTADA AO BOTÃO) ---
async function editarProduto(id, nome_prod, preco, quantidade) {
    
    // Agora o prompt já vem preenchido com o valor atual (ex: "Coca Cola")
    const novoTitulo = prompt("Digite o novo titulo", nome_prod);
    
    if (novoTitulo === null) return; // Cancelou

    // Preenche os prompts de número com o valor atual
    const novoPreco = parseFloat(prompt("Digite o novo preco", preco));
    const novaQuantidade = parseInt(prompt("Nova quantidade", quantidade));

    if (isNaN(novoPreco) || isNaN(novaQuantidade)) {
        alert("Preço ou quantidade inválidos!");
        return;
    }

    try {
        const response = await fetch("http://localhost:2005/editarProduto", {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                nome_prod: novoTitulo,
                preco: novoPreco,
                quantidade: novaQuantidade
            })
        });

        if (!response.ok) throw new Error(await response.text());

        alert("Produto editado com sucesso!");
        carregarProdutos(); // Atualiza a tela automaticamente

    } catch (err) {
        console.error(err);
        alert("Erro ao editar o produto: " + err.message);
    }
}

async function excluirProduto(id) {
    // 1. Pergunta de confirmação
    if (confirm("Tem certeza que deseja excluir o ID " + id + "?")) {
        
        try {
           
            const response = await fetch(`/deletarProduto/${id}`, {
                method: 'DELETE'
            });

          
            if (response.ok) {
                alert("Produto excluído com sucesso!");
                
                // Recarrega a página para atualizar a tabela
                window.location.reload(); 
            } else {
                alert("Erro ao excluir no servidor.");
            }

        } catch (error) {
            console.error("Erro de rede:", error);
            alert("Não foi possível conectar ao servidor.");
        }
    }
}

