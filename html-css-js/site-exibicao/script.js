document.addEventListener("DOMContentLoaded", () => {
  const usuariosList = document.getElementById("usuarios-list");
  const toggleConfigBtn = document.getElementById("toggle-config-btn");
  const configPanel = document.getElementById("config-panel");
  const toggleDetalhesSwitch = document.getElementById("toggle-detalhes-switch");

  const numAulasInput = document.getElementById('num-aulas');
  const duracaoAulaInput = document.getElementById('duracao-aula');
  const minPresencaInput = document.getElementById('min-presenca');
  const configInputs = [numAulasInput, duracaoAulaInput, minPresencaInput];

  let mostrarDadosConexao = false;

  toggleConfigBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    configPanel.classList.toggle("active");
  });

  document.addEventListener("click", (event) => {
    if (configPanel.classList.contains('active') && !configPanel.contains(event.target)) {
      configPanel.classList.remove('active');
    }
  });

  toggleDetalhesSwitch.addEventListener("change", () => {
    mostrarDadosConexao = toggleDetalhesSwitch.checked;
    document.querySelectorAll(".mac-ip").forEach(el => {
      el.style.display = mostrarDadosConexao ? "block" : "none";
    });
  });

  configInputs.forEach(input => {
    input.addEventListener('change', fetchErenderizarUsuarios);
  });

  function getStatusPresenca(usuario, minutosNecessarios) {
    const tempoAtivo = usuario.tempo_ativo;
    const estaOnline = usuario.ultimo_status === 1;

    if (tempoAtivo >= minutosNecessarios) {
      return { texto: "Presente", classe: "status-presente" };
    }
    if (estaOnline && tempoAtivo < minutosNecessarios) {
      return { texto: "Avaliar/Em Aula", classe: "status-avaliar" };
    }
    if (!estaOnline && tempoAtivo < minutosNecessarios) {
      return { texto: "Ausente", classe: "status-ausente" };
    }
    return { texto: "Indefinido", classe: "" };
  }

  function renderUsuarios(data) {
    usuariosList.innerHTML = "";

    const numAulas = parseInt(numAulasInput.value, 10);
    const duracaoAula = parseInt(duracaoAulaInput.value, 10);
    const minPresenca = parseInt(minPresencaInput.value, 10);

    const totalMinutosAula = numAulas * duracaoAula;
    const minutosNecessarios = totalMinutosAula * (minPresenca / 100);

    data.forEach(usuario => {
      const div = document.createElement("div");
      const statusPresenca = getStatusPresenca(usuario, minutosNecessarios);
      div.className = `usuario`;

      const sessoesHtml = usuario.sessoes.map(sessao => {
        const chave = Object.keys(sessao)[0];
        return `<li><strong>${chave}:</strong> ${sessao[chave]}</li>`;
      }).join("");

      div.innerHTML = `
        <div class="header">
          <span class="caret"></span>
          <div class="user-info">
            <strong>${usuario.Nome}</strong>
            <span>Matrícula: ${usuario.Numero}</span>
            <span class="status ${statusPresenca.classe}">${statusPresenca.texto}</span>
          </div>
        </div>
        <div class="detalhes">
          <ul>
            <li><strong>Tempo Ativo Total:</strong> ${usuario.tempo_ativo} min</li>
            ${sessoesHtml}
          </ul>
          <div class="mac-ip" style="display: ${mostrarDadosConexao ? "block" : "none"};">
            <strong>MAC:</strong> ${usuario.Mac} &nbsp; <strong>IP:</strong> ${usuario.ip}
          </div>
        </div>
      `;

      div.style.borderLeftColor = window.getComputedStyle(div.querySelector(`.${statusPresenca.classe}`)).backgroundColor;

      const header = div.querySelector(".header");
      const detalhesEl = div.querySelector(".detalhes");
      const caret = div.querySelector(".caret");

      header.addEventListener("click", () => {
        const isVisible = detalhesEl.style.display === "block";
        detalhesEl.style.display = isVisible ? "none" : "block";
        caret.classList.toggle("open", !isVisible);
      });

      usuariosList.appendChild(div);
    });
  }

  async function fetchErenderizarUsuarios() {
    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      renderUsuarios(data);
    } catch (error) {
      console.error("Falha ao buscar dados dos usuários:", error);
      usuariosList.innerHTML = "<p>Erro ao carregar os dados. Tente novamente mais tarde.</p>";
    }
  }

  fetchErenderizarUsuarios();
  setInterval(fetchErenderizarUsuarios, 30000);
});
