#!/usr/bin/env bash
# deploy-nginx-fix.sh
# Run this once VPN is connected to fix port 3000 / HTTPS 443 routing

set -e
SERVER="root@192.168.1.177"
PASS="R0!net@12345"
SSH="sshpass -p $PASS ssh -o StrictHostKeyChecking=no $SERVER"

echo "=== Checking connectivity ==="
$SSH "echo connected"

echo ""
echo "=== Current nginx conf ==="
$SSH "cat /etc/nginx/conf.d/*.conf 2>/dev/null; ls /etc/nginx/conf.d/"

echo ""
echo "=== Current app .env.local ==="
$SSH "cat /home/Tracker/app/.env.local"

echo ""
echo "=== Current server .env (PORT / FRONTEND_URL) ==="
$SSH "grep -E '^PORT|^FRONTEND_URL|^DATABASE_URL' /home/Tracker/server/.env"

echo ""
echo "=== API process port ==="
$SSH "pm2 info tracker-api --no-color | grep 'exec cwd'"
