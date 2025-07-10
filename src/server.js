const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 80;
const CSV_FILE_PATH = path.join(__dirname, 'dados_coletados.csv');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);

function getLocalISOStringWithOffset() {
    const now = new Date();
    const pad = (num, width = 2) => String(num).padStart(width, '0');

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const tzOffsetMinutes = now.getTimezoneOffset();
    let offsetString;
    if (tzOffsetMinutes === 0) {
        offsetString = 'Z';
    } else {
        const sign = tzOffsetMinutes > 0 ? '-' : '+';
        const absOffsetMinutes = Math.abs(tzOffsetMinutes);
        const offsetHours = pad(Math.floor(absOffsetMinutes / 60));
        const offsetMins = pad(absOffsetMinutes % 60);
        offsetString = `${sign}${offsetHours}:${offsetMins}`;
    }

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
}

app.post('/api/dados', (req, res) => {
    const { nome, numero } = req.body;

    const clientIp = req.ip;
    
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ erro: 'Nome é obrigatório e deve ser um texto.' });
    }
    if (!numero || typeof numero !== 'string' || !/^\d{10}$/.test(numero.trim())) {
        return res.status(400).json({ erro: 'Número é obrigatório e deve conter 10 dígitos numéricos.' });
    }

    const nomeSanitizado = nome.trim().replace(/\r?\n|\r/g, ' ').replace(/"/g, '""');
    const numeroSanitizado = numero.trim();
    const timestamp = getLocalISOStringWithOffset();
    const novaLinha = `"${timestamp}","${nomeSanitizado}","${numeroSanitizado}","${clientIp}"`;
    const csvCabecalho = 'Timestamp,Nome,Numero,ip';
    
    try {
        const DEZ_MINUTOS_EM_MS = 10 * 60 * 1000;
        const agora = new Date();

        if (fs.existsSync(CSV_FILE_PATH)) {
            const conteudo = fs.readFileSync(CSV_FILE_PATH, 'utf8');
            const linhasAnteriores = conteudo.split('\n').filter(Boolean);

            for (let i = linhasAnteriores.length - 1; i > 0; i--) { 
                const linha = linhasAnteriores[i];
                const campos = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(campo => campo.replace(/"/g, ''));

                const [timestampRegistroStr, , numeroExistente, ipExistente] = campos;

                if (ipExistente === clientIp) {
                    const timestampRegistro = new Date(timestampRegistroStr);
                    const diferencaTempo = agora - timestampRegistro;

                    if (diferencaTempo < DEZ_MINUTOS_EM_MS) {
                        if (numeroExistente !== numeroSanitizado) {
                            return res.status(429).json({ erro: 'Você já se registrou com outra matricula nos últimos 10 minutos.' });
                        }
                    }
                }
            }
        }

        let linhasParaSalvar = [csvCabecalho];
        const mapaPorNumero = new Map();

        if (fs.existsSync(CSV_FILE_PATH)) {
            const conteudo = fs.readFileSync(CSV_FILE_PATH, 'utf8');
            const todasLinhas = conteudo.split('\n').filter(Boolean);

            for (let i = 1; i < todasLinhas.length; i++) {
                const linha = todasLinhas[i];
                const campos = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                const numeroExistente = campos[2]?.replace(/"/g, '');
                if (numeroExistente) {
                    mapaPorNumero.set(numeroExistente, linha);
                }
            }
        }

        mapaPorNumero.set(numeroSanitizado, novaLinha);
        linhasParaSalvar = [csvCabecalho, ...[...mapaPorNumero.values()]];

        fs.writeFileSync(CSV_FILE_PATH, linhasParaSalvar.join('\n') + '\n', 'utf8');
        
        res.status(200).json({
            mensagem: `Olá ${nome.trim()}, seus dados foram atualizados! Seu IP registrado é ${clientIp}.`
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro interno ao salvar os dados.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
