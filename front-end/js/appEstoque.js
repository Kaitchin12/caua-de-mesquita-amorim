// --- CONFIGURAÇÃO ---
const API_URL = "http://localhost:2005";

// --- VARIÁVEIS GLOBAIS ---
let listaProdutosGlobal = []; // Armazena todos os produtos para a pesquisa funcionar localmente
const formulario = document.querySelector(".formulario-modal");
const tbodyTabela = document.querySelector(".tabela-pagina-estoque tbody");
const searchInput = document.querySelector(".search-input"); // Captura o input de busca

// --- VARIÁVEIS DO MODAL ---
var modal = document.getElementById("myModal");
var btn = document.getElementById("myBtn");
var span = document.getElementsByClassName("close")[0];

if(btn) btn.onclick = function() { modal.style.display = "flex"; }
if(span) span.onclick = function() { modal.style.display = "none"; }
window.onclick = function(event) {
  if (event.target == modal) { modal.style.display = "none"; }
}

// --- LÓGICA DE USUÁRIO (HEADER) ---
const nomeUsuarioLogado = localStorage.getItem("usuarioLogado");
const pUsuario = document.querySelector(".paragrafo-para-usuario");
if (pUsuario) {
    if (nomeUsuarioLogado) {
        pUsuario.innerHTML = `Olá, <strong>${nomeUsuarioLogado}</strong>`;
    } else {
        pUsuario.innerText = "Bem-vindo";
    }
}
// Logout
const btnLogout = document.querySelector('a[href="login.html"]');
if (btnLogout) {
    btnLogout.onclick = function() { localStorage.removeItem("usuarioLogado"); };
}


// --- 1. FUNÇÃO CARREGAR DADOS DO SERVIDOR (GET) ---
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/mostrarProduto`);
        const produtos = await response.json();

        // 1. Salva na variável global para a pesquisa usar depois
        listaProdutosGlobal = produtos;

        // 2. Renderiza a tabela com todos os produtos iniciais
        renderizarTabela(listaProdutosGlobal);

    } catch (error) {
        console.error("Erro ao carregar tabela:", error);
        tbodyTabela.innerHTML = "<tr><td colspan='6'>Erro ao conectar com servidor.</td></tr>";
    }
}

// --- 2. FUNÇÃO PARA DESENHAR A TABELA (USADA PELA CARGA E PELA PESQUISA) ---
function renderizarTabela(lista) {
    tbodyTabela.innerHTML = "";

    if (lista.length === 0) {
        tbodyTabela.innerHTML = "<tr><td colspan='6' style='text-align:center'>Nenhum produto encontrado.</td></tr>";
        return;
    }

    lista.forEach(prod => {
        const tr = document.createElement("tr");

        // Tratamento de nulos
        const marca = prod.marca || "";
        const modelo = prod.modelo || "";
        const material = prod.material || "";
        const tamanho = prod.tamanho || "";
        const tensao = prod.tensao || ""; 
        const minimo = prod.estoque_minimo || 5;

        // Visualização concatenada
        const ferramentaCompleta = `<strong>${prod.nome_prod}</strong> <br> <small style="color:#666">${marca} ${modelo}</small>`;
        const especificacoes = `${material} | ${tamanho} ${tensao ? '| ' + tensao : ''}`;
        
        // Lógica de Status
        let statusBadge = "<span style='color:green; font-weight:bold;'>OK</span>";
        let opacity = "1";

        if (prod.quantidade == 0) {
            statusBadge = "<span style='color:gray; font-weight:bold;'>INDISPONÍVEL</span>";
            opacity = "0.6";
        } else if (prod.quantidade <= minimo) {
            statusBadge = "<span style='color:red; font-weight:bold;'>BAIXO ⚠️</span>";
        }

        tr.innerHTML = `
            <td style="opacity:${opacity}">${ferramentaCompleta}</td>
            <td style="opacity:${opacity}">${especificacoes}</td>
            <td style="opacity:${opacity}; text-align:center;">${prod.quantidade}</td>
            <td style="opacity:${opacity}; text-align:center;">${minimo}</td>
            <td style="opacity:${opacity}; text-align:center;">${statusBadge}</td>
            <td style="text-align:center;">
                <button class="btn-editar" 
                    onclick="editarProduto(
                        ${prod.id}, 
                        '${prod.nome_prod}', 
                        '${marca}', 
                        '${modelo}', 
                        '${material}', 
                        '${tamanho}', 
                        '${tensao}', 
                        ${prod.quantidade}, 
                        ${minimo}
                    )">
                    ✏️
                </button>
                <button class="btn-excluir" onclick="excluirProduto(${prod.id})">🗑️</button>
            </td>
        `;

        tbodyTabela.appendChild(tr);
    });
}

// --- 3. LÓGICA DE PESQUISA (EVENTO INPUT) ---
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();

        // Filtra a lista global verificando nome, marca ou modelo
        const listaFiltrada = listaProdutosGlobal.filter(prod => {
            const nome = prod.nome_prod ? prod.nome_prod.toLowerCase() : "";
            const marca = prod.marca ? prod.marca.toLowerCase() : "";
            const modelo = prod.modelo ? prod.modelo.toLowerCase() : "";

            return nome.includes(termo) || marca.includes(termo) || modelo.includes(termo);
        });

        // Redesenha a tabela apenas com os filtrados
        renderizarTabela(listaFiltrada);
    });
}


// --- 4. CADASTRO DE PRODUTO (POST) ---
formulario.addEventListener("submit", async (event) => {
    event.preventDefault(); 

    const dadosProduto = {
        nome_prod: document.querySelector(".input-nome-modal").value,
        marca: document.querySelector(".input-marca").value,
        modelo: document.querySelector(".input-modelo").value,
        material: document.querySelector(".input-material").value,
        tamanho: document.querySelector(".input-tamanho").value,
        tensao: document.querySelector(".input-tensao").value,
        quantidade: parseInt(document.querySelector(".input-quantidade").value),
        estoque_minimo: parseInt(document.querySelector(".input-minimo").value)
    };

    if (!dadosProduto.nome_prod || isNaN(dadosProduto.quantidade)) {
        alert("Preencha o nome e a quantidade corretamente.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/produtoCadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosProduto)
        });

        const respostaTexto = await response.text();

        if (response.ok) {
            alert("Sucesso: Produto cadastrado!"); 
            modal.style.display = "none";
            formulario.reset(); 
            carregarProdutos(); // Atualiza a lista global e a tabela
        } else {
            alert("Erro do servidor: " + respostaTexto);
        }

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar com o servidor.");
    }
});


// --- 5. EDITAR PRODUTO (PUT) ---
async function editarProduto(id, nomeAtual, marcaAtual, modeloAtual, matAtual, tamAtual, tensaoAtual, qtdAtual, minAtual) {
    
    const novoNome = prompt("Nome do Produto:", nomeAtual);
    if (novoNome === null) return; 

    const novaMarca = prompt("Marca:", marcaAtual);
    if (novaMarca === null) return;

    const novoModelo = prompt("Modelo:", modeloAtual);
    if (novoModelo === null) return;

    const novoMaterial = prompt("Material:", matAtual);
    if (novoMaterial === null) return;

    const novoTamanho = prompt("Tamanho/Peso:", tamAtual);
    if (novoTamanho === null) return;

    const novaTensao = prompt("Tensão (ex: 220v, N/A):", tensaoAtual);
    if (novaTensao === null) return;

    const novaQtd = parseInt(prompt("Quantidade em Estoque:", qtdAtual));
    if (isNaN(novaQtd)) return;

    const novoMinimo = parseInt(prompt("Estoque Mínimo (Alerta):", minAtual));
    if (isNaN(novoMinimo)) return;

    try {
        const response = await fetch(`${API_URL}/editarProduto`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                nome_prod: novoNome,
                marca: novaMarca,
                modelo: novoModelo,
                material: novoMaterial,
                tamanho: novoTamanho,
                tensao: novaTensao,
                quantidade: novaQtd,
                estoque_minimo: novoMinimo
            })
        });

        if (!response.ok) throw new Error(await response.text());

        alert("Produto editado com sucesso!");
        carregarProdutos();

    } catch (err) {
        console.error(err);
        alert("Erro ao editar o produto: " + err.message);
    }
}

// --- 6. EXCLUIR PRODUTO (DELETE) ---
async function excluirProduto(id) {
    if (confirm("Tem certeza que deseja excluir o ID " + id + "?")) {
        try {
            const response = await fetch(`${API_URL}/deletarProduto/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert("Produto excluído com sucesso!");
                carregarProdutos(); 
            } else {
                alert("Erro ao excluir no servidor.");
            }
        } catch (error) {
            console.error("Erro de rede:", error);
            alert("Não foi possível conectar ao servidor.");
        }
    }
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();
});