import csv
import json
import os
from datetime import datetime

coletas_csv = "/home/victo/chamada-app/dados_coletados.csv"
scan_file = "/home/victo/inventario_hosts_completo.csv"
json_saida = "/home/victo/sessoes_usuarios.json"

if os.path.exists(json_saida):
    with open(json_saida, "r") as f:
        resultado = json.load(f)
        usuarios = {u["ip"]: u for u in resultado}
else:
    usuarios = {}

with open(coletas_csv, newline='') as f:
    reader = csv.DictReader(f)
    for row in reader:
        ip = row["ip"]
        if ip not in usuarios:
            try:
                timestamp = datetime.fromisoformat(row["Timestamp"])
                hora = timestamp.strftime("%H:%M:%S")
            except:
                hora = "??:??:??"
            usuarios[ip] = {
                "Nome": row["Nome"],
                "Numero": row["Numero"],
                "Mac": None,
                "ip": ip,
                "sessoes": [{"conexao": hora}],
                "ultimo_status": 1
            }

with open(scan_file, "r") as f:
    linhas = f.readlines()

if not linhas:
    exit()

ultima_linha = linhas[-1].strip()
if not ultima_linha.startswith("# Última execução:"):
    exit()

timestamp_str = ultima_linha.replace("# Última execução:", "").strip()
try:
    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
    hora = timestamp.strftime("%H:%M:%S")
except ValueError:
    exit()

reader = csv.DictReader(linhas[:-1])
ips_scan = set()
for row in reader:
    ip = row["ip"]
    mac = row["mac"]
    status = int(row["status"])

    ips_scan.add(ip)

    if ip not in usuarios:
        continue

    user = usuarios[ip]

    if user["Mac"] is None:
        user["Mac"] = mac

    anterior = user.get("ultimo_status")

    if anterior is None:
        if status == 1:
            user["sessoes"].append({"conexao": hora})
    elif anterior == 1 and status == 0:
        user["sessoes"].append({"desconexao": hora})
    elif anterior == 0 and status == 1:
        user["sessoes"].append({"reconexao": hora})

    user["ultimo_status"] = status

for ip, user in usuarios.items():
    if ip not in ips_scan:
        if user.get("ultimo_status") == 1:
            user["sessoes"].append({"desconexao": hora})
            user["ultimo_status"] = 0

with open(json_saida, "w") as f:
    json.dump(list(usuarios.values()), f, indent=4, ensure_ascii=False)
