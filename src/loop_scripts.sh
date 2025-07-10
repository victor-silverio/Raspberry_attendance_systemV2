#!/bin/bash

LOCKFILE="/tmp/parser_nmap.lockfile"

flock -n "$LOCKFILE" -c '
while true; do
    sudo python3 /home/victo/parser_nmap.py && sudo python3 /home/victo/timestamps.py
    sleep 30
done
'