
const API_URL = "http://localhost:2005"; 

// Elementos do DOM
const modalSaida = document.getElementById("modalSaida");
const btnNovaSaida = document.getElementById("btnNovaSaida");
const btnConfirmar = document.getElementById("btnConfirmarSaida");
const spanClose = document.querySelector(".close-saida");
const listaContainer = document.getElementById("listaProdutosSaida");
const tabelaMovimentacoes = document.getElementById("tabela-movimentacoes");


const nomeUsuarioLogado = localStorage.getItem("usuarioLogado") || "Usuário não identificado";


window.onload = function() {
    
    // 1. Mostrar nome do usuário no topo (Cabeçalho)
    const pUsuario = document.querySelector(".paragrafo-para-usuario");
    if (pUsuario) {
        if (localStorage.getItem("usuarioLogado")) {
            pUsuario.innerHTML = `Olá, <strong>${nomeUsuarioLogado}</strong>`;
        } else {
            pUsuario.innerText = "Bem-vindo";
        }
    }

    // 2. Configurar botão de Logout (Limpar memória)
    const btnLogout = document.querySelector('a[href="login.html"]');
    if (btnLogout) {
        btnLogout.onclick = function() {
            localStorage.removeItem("usuarioLogado");
        };
    }

    // 3. Carregar a tabela
    if (tabelaMovimentacoes) {
        carregarTabelaMovimentacoes();
    }
};

/* --- FUNÇÃO: CARREGAR HISTÓRICO --- */
async function carregarTabelaMovimentacoes() {
    try {
        const response = await fetch(`${API_URL}/mostrarMovimentacao`);
        const dados = await response.json();

        tabelaMovimentacoes.innerHTML = "";

        if (dados.length === 0) {
            tabelaMovimentacoes.innerHTML = "<tr><td colspan='5' style='text-align:center'>Nenhuma movimentação encontrada.</td></tr>";
            return;
        }

        dados.forEach(mov => {
            const dataObj = new Date(mov.data_movimentacao);
            const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' ' + dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            const corTipo = mov.tipo === 'ENTRADA' ? 'green' : 'red'; // Se for SAIDA fica vermelho
            
            // Verifica se tem nome do produto, senão usa o ID
            const nomeFerramenta = mov.nome_produto || `ID: ${mov.id_produto}`;
            
            // Verifica se veio o nome do usuário do banco, senão mostra 'Sistema'
            const nomeUsuarioResponsavel = mov.usuario || 'Sistema';

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${dataFormatada}</td>
                <td style="color: ${corTipo}; font-weight: bold;">${mov.tipo}</td>
                <td>${nomeFerramenta}</td>
                <td>${mov.quantidade}</td>
                <td>${nomeUsuarioResponsavel}</td> 
            `;

            tabelaMovimentacoes.appendChild(row);
        });

    } catch (error) {
        console.error("Erro ao carregar tabela:", error);
        if(tabelaMovimentacoes) {
            tabelaMovimentacoes.innerHTML = "<tr><td colspan='5' style='text-align:center; color:red'>Erro ao carregar dados do servidor.</td></tr>";
        }
    }
}

/* --- LOGICA DO MODAL --- */
if (btnNovaSaida) {
    btnNovaSaida.onclick = function() {
        modalSaida.style.display = "flex";
        carregarProdutosNoModal(); 
    }
}

if (spanClose) {
    spanClose.onclick = function() {
        modalSaida.style.display = "none";
    }
}

window.onclick = function(event) {
    if (event.target == modalSaida) {
        modalSaida.style.display = "none";
    }
}

/* --- CARREGAR PRODUTOS NO MODAL --- */
async function carregarProdutosNoModal() {
    listaContainer.innerHTML = "<p>Carregando estoque...</p>";

    try {
        const response = await fetch(`${API_URL}/mostrarProduto`);
        const produtos = await response.json();

        listaContainer.innerHTML = ""; 

        if (produtos.length === 0) {
            listaContainer.innerHTML = "<p>Nenhum produto cadastrado.</p>";
            return;
        }

        produtos.forEach(prod => {
            const divRow = document.createElement("div");
            divRow.className = "lista-item-row";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = prod.id;
            checkbox.dataset.estoque = prod.quantidade; 
            checkbox.style.marginRight = "10px";

            const label = document.createElement("span");
            label.style.flexGrow = "1"; 
            label.innerText = `${prod.nome_prod} (Disponível: ${prod.quantidade})`;

            const inputQtd = document.createElement("input");
            inputQtd.type = "number";
            inputQtd.className = "input-qtd-modal";
            inputQtd.placeholder = "Qtd";
            inputQtd.min = "1";
            inputQtd.max = prod.quantidade; 
            inputQtd.disabled = true; 

            checkbox.addEventListener("change", function() {
                inputQtd.disabled = !this.checked;
                if (this.checked) {
                    inputQtd.focus();
                } else {
                    inputQtd.value = ""; 
                }
            });

            divRow.appendChild(checkbox);
            divRow.appendChild(label);
            divRow.appendChild(inputQtd);
            listaContainer.appendChild(divRow);
        });

    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        listaContainer.innerHTML = "<p style='color:red'>Erro ao carregar produtos.</p>";
    }
}

/* --- BOTÃO CONFIRMAR SAÍDA --- */
btnConfirmar.onclick = async function() {
    const checkboxes = document.querySelectorAll("#listaProdutosSaida input[type='checkbox']:checked");
    
    if (checkboxes.length === 0) {
        alert("Selecione pelo menos um item para dar baixa.");
        return;
    }

    const itensParaBaixa = [];
    let erroValidacao = false;

    checkboxes.forEach(chk => {
        const row = chk.parentElement; 
        const input = row.querySelector(".input-qtd-modal");
        const qtd = parseInt(input.value);
        const estoqueAtual = parseInt(chk.dataset.estoque);

        if (!qtd || qtd <= 0) {
            alert("A quantidade deve ser maior que zero.");
            erroValidacao = true;
            return;
        }
        if (qtd > estoqueAtual) {
            alert(`Erro: Você tentou retirar ${qtd}, mas só tem ${estoqueAtual} no estoque.`);
            erroValidacao = true;
            return;
        }

        // --- PREPARA O PACOTE PARA O SERVIDOR ---
        itensParaBaixa.push({
            id_produto: chk.value,
            tipo: "SAIDA DO ESTOQUE", 
            quantidade: qtd,
            observacao: "Saída via Painel Web",
            usuario: nomeUsuarioLogado // <--- ENVIA O NOME DO LOGADO PARA O BANCO SALVAR
        });
    });

    if (erroValidacao) return; 

    try {
        const response = await fetch(`${API_URL}/movimentacao`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(itensParaBaixa) 
        });

        if (response.ok) {
            alert(`Sucesso! Saída registrada por: ${nomeUsuarioLogado}`);
            modalSaida.style.display = "none";
            window.location.reload(); 
        } else {
            const msg = await response.text();
            alert("Erro no servidor: " + msg);
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor.");
    }
};