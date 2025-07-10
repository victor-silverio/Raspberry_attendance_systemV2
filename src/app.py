from flask import Flask, jsonify, render_template
from datetime import datetime
import json

app = Flask(__name__, template_folder="templates", static_folder="static")

DATA_PATH = "/home/victo/sessoes_usuarios.json"

def calcular_tempo_ativo(sessoes):
    total_segundos = 0
    inicio = None

    for sessao in sessoes:
        if 'conexao' in sessao:
            inicio = datetime.strptime(sessao['conexao'], "%H:%M:%S")
        elif 'desconexao' in sessao and inicio:
            fim = datetime.strptime(sessao['desconexao'], "%H:%M:%S")
            total_segundos += (fim - inicio).total_seconds()
            inicio = None
        elif 'reconexao' in sessao:
            inicio = datetime.strptime(sessao['reconexao'], "%H:%M:%S")

    if inicio:
        agora = datetime.now()
        agora = agora.replace(year=1900, month=1, day=1)
        total_segundos += (agora - inicio).total_seconds()

    return round(total_segundos / 60)

@app.route("/api/usuarios")
def get_usuarios():
    with open(DATA_PATH) as f:
        data = json.load(f)

    for usuario in data:
        usuario['tempo_ativo'] = calcular_tempo_ativo(usuario['sessoes'])
    return jsonify(data)

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=81, debug=False)
