document.getElementById('meuFormulario').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const nomeInput = document.getElementById('nome');
    const numeroInput = document.getElementById('numero');
    const erroNumero = document.getElementById('erroNumero');
    const mensagemResposta = document.getElementById('mensagemResposta');

    const nome = nomeInput.value.trim();
    const numero = numeroInput.value.trim();

    erroNumero.textContent = '';
    mensagemResposta.textContent = '';
    mensagemResposta.className = 'message';

    if (!nome) {
        nomeInput.focus();
        return;
    }

    if (!/^\d{10}$/.test(numero)) {
        erroNumero.textContent = 'O número deve conter exatamente 10 dígitos numéricos.';
        numeroInput.focus();
        return;
    }

    const dados = {
        nome: nome,
        numero: numero
    };

    try {
        const response = await fetch('/api/dados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (response.ok) {
            mensagemResposta.textContent = resultado.mensagem || 'Dados enviados com sucesso!';
            mensagemResposta.classList.add('success');
            document.getElementById('meuFormulario').reset();
        } else {
            mensagemResposta.textContent = resultado.erro || 'Erro ao enviar os dados.';
            mensagemResposta.classList.add('error');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        mensagemResposta.textContent = 'Ocorreu um erro de conexão. Tente novamente.';
        mensagemResposta.classList.add('error');
    }
});
