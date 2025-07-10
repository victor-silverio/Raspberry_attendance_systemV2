# 📡 ECOP11A_Rasp-Attend-2

> **Sistema de presença v2 utilizando Raspberry Pi 3 B+**  
> _Repositório apenas para fins de arquivo. Replique por sua conta e risco._

---

## 📑 Sumário

- [Demonstração](#-demonstração)
- [Como Funciona](#-como-funciona)
- [Resumo Técnico](#-resumo-técnico)
- [Contato](#-contato)

---

## 🎬 Demonstração

### 1️⃣ Acesso Inicial

Usuário acessa `chamada.local` (porta **80**) e preenche nome e matrícula:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/coleta-1.png" width="500">
</p>

---

### 2️⃣ Validação dos Dados

Se houver erro, uma mensagem é exibida:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/coleta_erro-2.png" width="500">
</p>

---

### 3️⃣ Dados Corretos

Dados enviados junto ao IP do usuário:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/coleta_sucesso-3.png" width="500">
</p>

---

### 4️⃣ Processamento Interno

A lógica interna do sistema é executada (detalhes abaixo).

---

### 5️⃣ Exibição dos Dados

Página na porta **81** mostra os dados:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/exibicao-1.png" width="500">
</p>

---

### 6️⃣ Erro ao Exibir Dados

Se não houver dados ou ocorrer erro interno:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/exibicao_erro-2.png" width="500">
</p>

> _Pode ocorrer se nenhum usuário se registrou ou por erro interno._

---

### 7️⃣ Menu de Configurações

Defina critérios de presença e exibição:

- Número de aulas
- Duração de cada aula
- % mínima de tempo conectado
- Mostrar dados de conexão (IP/MAC)

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/exibicao_config-3.png" width="500">
</p>

---

### 8️⃣ Status: "Em aula / Avaliar"

Usuário conectado, mas ainda sem tempo mínimo:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/exibicao-1.png" width="500">
</p>

---

### 9️⃣ Status: Presente

Usuário atingiu o tempo mínimo de presença:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/exibicao-4.png" width="500">
</p>

---

### 🔟 Status: Ausente

Usuário desconectado antes do tempo mínimo:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/exibicao-5.png" width="500">
</p>

---

### 1️⃣1️⃣ Detalhes do Aluno

Expandindo o menu, veja dados de conexão e timestamps:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/exibicao-6.png" width="500">
</p>

---

### 1️⃣2️⃣ Histórico de Conexões

Veja cada desconexão/reconexão detectada:

<p align="center">
  <img src="https://github.com/Victor-Augusto-2025016677/ECOP11A_Rasp-Attend-2/blob/main/img/exibicao-7.png" width="500">
</p>

---

## ⚙️ Como Funciona

O sistema ECOP11A_Rasp-Attend-2 utiliza um Raspberry Pi para automatizar a coleta e exibição de presença em ambiente local.

### Fluxo Principal

1. **Coleta de Dados:**  
   Usuários acessam a página na porta 80 (`chamada.local`), preenchem nome e matrícula. O backend Node.js (`server.js`) valida e registra os dados junto ao IP em um arquivo CSV.

2. **Processamento Periódico:**  
   Scripts Python (`parser_nmap.py` e `timestamps.py`) são executados em loop via systemd e shell script.  
   - `parser_nmap.py`: Varre a rede, identifica dispositivos conectados (por MAC/IP) e atualiza o inventário.
   - `timestamps.py`: Cruza os dados de presença (CSV) com o inventário de rede, gerando um arquivo JSON com sessões de conexão/desconexão por usuário.

3. **Exibição dos Dados:**  
   Um servidor Flask (porta 81) lê o JSON gerado e exibe, via página web, o status de presença dos usuários, tempo conectado, histórico de sessões e permite configuração de critérios de presença.

4. **Automação:**  
   Serviços systemd garantem que todos os scripts e servidores iniciem automaticamente e mantenham o sistema funcionando sem intervenção manual.

> **Nota:**  
> O sistema é totalmente local, não depende de internet, e utiliza apenas dados da rede interna para validar a presença dos usuários.

---

## 🛠️ Resumo Técnico

| Componente         | Função                                                                 |
|--------------------|------------------------------------------------------------------------|
| **Node.js (server.js)** | Recebe e valida dados dos usuários, salva em CSV                   |
| **Python (parser_nmap.py)** | Varre a rede, identifica dispositivos e atualiza inventário    |
| **Python (timestamps.py)** | Gera sessões de conexão/desconexão por usuário em JSON         |
| **Flask**          | Exibe dados de presença e histórico via web (porta 81)                  |
| **systemd**        | Automatiza execução dos scripts e servidores                            |

---

## 📬 Contato

Para mais informações, entre em contato:  
**d2025016677@unifei.edu.br**