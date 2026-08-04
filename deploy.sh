#!/bin/bash
set -e

echo "============================================="
echo "🚀 Iniciando Deploy Automatizado - Recife Por Elas"
echo "============================================="

# 1. Instalação automática do Docker (se não existir)
if ! command -v docker &> /dev/null; then
    echo "📦 Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado com sucesso."
else
    echo "✅ Docker já está instalado."
fi

# 2. Verificação do arquivo .env
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Crie o arquivo .env com base no .env.example antes de continuar."
    exit 1
fi

# 3. Build atômico (Multi-stage) e Orquestração (Banco + App)
echo "⚙️ Construindo a aplicação e subindo os serviços em rede isolada..."
sudo docker compose up -d --build

echo "============================================="
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "Aguarde alguns segundos para o banco de dados inicializar."
echo "Para verificar se está no ar, acesse: http://SEU_IP_OU_DOMINIO:8080/api/health"
echo "============================================="
