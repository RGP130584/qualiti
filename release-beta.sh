#!/bin/bash

# Enable strict mode
set -e

# Disable path conversion in Git Bash to support docker mounts properly
export MSYS_NO_PATHCONV=1

echo "====================================="
echo " QUALITIOS - BETA RELEASE PIPELINE "
echo "====================================="

echo ""
echo "[1/8] Limpando artefatos temporários..."

find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "coverage" -exec rm -rf {} + 2>/dev/null || true

echo ""
echo "[2/8] Removendo dependências antigas..."

find . -type d -name "node_modules" -prune -exec rm -rf {} + 2>/dev/null || true

echo ""
echo "[3/8] Reinstalando dependências..."

echo "Backend Build..."
docker run --rm -v "$(pwd):/usr/src/app" -w /usr/src/app/app/backend node:20-alpine sh -c "npm install && npm audit fix || true && npm run build"

echo "Frontend Build..."
docker run --rm -v "$(pwd):/usr/src/app" -w /usr/src/app/app/frontend node:20-alpine sh -c "npm install && npm audit fix || true && npm run build"

echo ""
echo "[4/8] Executando testes..."

if [ -f run-tests.ts ]; then
echo "Executando suíte de testes..."
docker run --rm --network shared_net -v "$(pwd):/usr/src/app" -w /usr/src/app --env-file .env node:20-alpine npx tsx run-tests.ts
fi

echo ""
echo "[5/8] Verificando segredos expostos..."

grep -R "JWT_SECRET.*=" . --exclude-dir=node_modules --exclude-dir=.git || true

grep -R "password" . --exclude-dir=node_modules --exclude-dir=.git || true

echo ""
echo "[6/8] Executando TPM..."

if [ -f tpm/index.js ]; then
echo "Executando governança e segurança do TPM..."
# Instala o git temporário para que o TPM consiga rodar git diff e executa o scanner
docker run --rm -v "$(pwd):/usr/src/app" -w /usr/src/app --env-file .env node:20-alpine sh -c "apk add --no-cache git && node tpm/index.js"
fi

echo ""
echo "[7/8] Commitando release beta..."

git add .

git commit -m "release(beta): security validated and beta ready" || true

echo ""
echo "[8/8] Criando branch beta..."

git checkout -B beta/v1

git push origin beta/v1

echo ""
echo "====================================="
echo " RELEASE BETA GERADA COM SUCESSO "
echo "====================================="
echo ""
echo "Próximo passo:"
echo "Abrir Pull Request beta/v1 -> master"
echo ""
