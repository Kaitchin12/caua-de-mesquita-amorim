const form = document.querySelector('form');
const submitBtn = document.querySelector('.btn-login');

form.addEventListener('submit', async (event) => {
    event.preventDefault(); 

    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Verificando...";
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";

    const dadosLogin = {
        email: emailInput,
        senha: passwordInput
    };

    try {
        const response = await fetch('http://localhost:2005/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLogin)
        });

       
        const dados = await response.json();

        if (response.ok) {
          
            localStorage.setItem("usuarioLogado", dados.nome);
            
            window.location.href = "home.html"; 
        } else {
          
            alert("Acesso negado: " + (dados.error || "Verifique suas credenciais"));
            document.getElementById('password').value = ""; 
        }

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar com o servidor.");
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
    }
});