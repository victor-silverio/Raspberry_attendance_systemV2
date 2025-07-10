import csv
import os
from copy import deepcopy
from typing import List, Dict, Any
import subprocess
import nmap
from datetime import datetime

#def get_current_ssid(interface='wlan0') -> str:
#    try:
#        return subprocess.check_output(['/usr/sbin/iwgetid', interface, '--raw'], encoding='utf-8').strip()
#    except subprocess.CalledProcessError:
#        return ''

#ssid = get_current_ssid()
#if ssid == "eduroam":
#    CONFIG_NMAP_TARGET = "200.235.80.0/20"
#elif ssid == "SG CLARO":
#    CONFIG_NMAP_TARGET = "192.168.1.0/24"
#else:
#    CONFIG_NMAP_TARGET = "192.168.0.0/24"
CONFIG_NMAP_TARGET = "192.168.1.0/24"

CONFIG_NMAP_ARGS = "-e wlan0 -sn -PE -PS443 -PA80 -n -T3 --max-retries 2"
CONFIG_CSV_FILENAME = "/home/victo/inventario_hosts_completo.csv"

def scan_network(target: str, arguments: str) -> List[Dict[str, Any]]:
    print(f"Iniciando scan Nmap no alvo: {target} com argumentos: '{arguments}'")
    nm = nmap.PortScanner()
    active_hosts = []

    try:
        nm.scan(hosts=target, arguments=arguments, sudo=True)
    except nmap.nmap.PortScannerError as e:
        print(f"Erro ao executar o Nmap: {e}. Verifique se está instalado e permissões sudo.")
        return active_hosts
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")
        return active_hosts

    for host_ip in nm.all_hosts():
        if nm[host_ip].state() == 'up':
            mac_address = nm[host_ip]['addresses'].get('mac', 'N/A')
            if mac_address != 'N/A':
                active_hosts.append({
                    'ip': host_ip,
                    'mac': mac_address.upper(),
                    'status': 1
                })

    print(f"Scan Nmap concluído. Encontrados {len(active_hosts)} hosts ativos com MAC.")
    return active_hosts

def load_existing_hosts(csv_filename: str) -> Dict[str, Dict[str, Any]]:
    existing_hosts: Dict[str, Dict[str, Any]] = {}
    if not os.path.exists(csv_filename):
        print(f"Arquivo CSV '{csv_filename}' não encontrado. Será criado um novo.")
        return existing_hosts

    try:
        with open(csv_filename, 'r', newline='', encoding='utf-8') as csvfile:
            linhas_validas = []
            for linha in csvfile:
                if linha.strip().startswith('#'):
                    continue
                linhas_validas.append(linha)

        if not linhas_validas:
            print("Nenhuma linha válida encontrada no CSV.")
            return existing_hosts

        reader = csv.DictReader(linhas_validas)
        if 'mac' not in reader.fieldnames:
            print(f"Aviso: Coluna 'mac' não encontrada no CSV. Tratando como vazio.")
            return existing_hosts

        for row in reader:
            mac = row.get('mac')
            status = row.get('status')
            ip = row.get('ip', 'N/A')
            if mac and status is not None:
                try:
                    existing_hosts[mac.upper()] = {
                        'ip': ip,
                        'status': int(status)
                    }
                except ValueError:
                    print(f"Aviso: status inválido para MAC {mac}, ignorando linha.")
    except Exception as e:
        print(f"Erro ao carregar o arquivo CSV '{csv_filename}': {e}. Começando com lista vazia.")
        return {}

    print(f"Carregados {len(existing_hosts)} hosts do CSV.")
    return existing_hosts

def merge_scan_results(all_known_hosts: Dict, current_active_hosts: List) -> Dict:
    updated_hosts = deepcopy(all_known_hosts)
    for mac in updated_hosts:
        updated_hosts[mac]['status'] = 0

    for active_host in current_active_hosts:
        mac_addr = active_host['mac']
        if mac_addr in updated_hosts:
            updated_hosts[mac_addr]['ip'] = active_host['ip']
            updated_hosts[mac_addr]['status'] = 1
        else:
            updated_hosts[mac_addr] = {
                'ip': active_host['ip'],
                'status': 1
            }
            print(f"Novo host detectado: MAC {mac_addr}, IP {active_host['ip']}")
    return updated_hosts

def save_to_csv(hosts_data_dict: Dict, filename: str):
    if not hosts_data_dict:
        print("Nenhum dado para salvar.")
        return

    output_list = [{'mac': mac, **data} for mac, data in hosts_data_dict.items()]
    output_list.sort(key=lambda x: x['mac'])

    timestamp_execucao = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    linha_timestamp = f"# Última execução: {timestamp_execucao}"

    try:
        linhas_anteriores = []
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                linhas_anteriores = f.readlines()
            linhas_anteriores = [linha for linha in linhas_anteriores if not linha.startswith('# Última execução:')]

        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=['mac', 'ip', 'status'])
            writer.writeheader()
            writer.writerows(output_list)

        with open(filename, 'a', encoding='utf-8') as f:
            f.write(f"{linha_timestamp}\n")

        print(f"Inventário de hosts salvo com sucesso em '{filename}'")
        print(f"Timestamp de execução registrada: {timestamp_execucao}")

    except IOError as e:
        print(f"Erro ao escrever no arquivo '{filename}': {e}")

if __name__ == "__main__":
    all_known_hosts = load_existing_hosts(CONFIG_CSV_FILENAME)
    current_active_hosts = scan_network(target=CONFIG_NMAP_TARGET, arguments=CONFIG_NMAP_ARGS)
    if current_active_hosts:
        updated_inventory = merge_scan_results(all_known_hosts, current_active_hosts)
        save_to_csv(updated_inventory, CONFIG_CSV_FILENAME)
    else:
        print("Scan não encontrou hosts ou falhou. O inventário CSV não será alterado com novos dados.")
