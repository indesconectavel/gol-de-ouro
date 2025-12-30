#!/bin/bash

# Script para gerar certificados SSL
# Uso: ./scripts/generate-ssl.sh

set -e

SSL_DIR="nginx/ssl"
DOMAIN="goldeouro.lol"

echo "🔐 Gerando certificados SSL para $DOMAIN..."

# Criar diretório SSL se não existir
mkdir -p $SSL_DIR

# Gerar chave privada
echo "🔑 Gerando chave privada..."
openssl genrsa -out $SSL_DIR/$DOMAIN.key 2048

# Gerar certificado auto-assinado
echo "📜 Gerando certificado auto-assinado..."
openssl req -new -x509 -key $SSL_DIR/$DOMAIN.key -out $SSL_DIR/$DOMAIN.crt -days 365 \
  -subj "/C=BR/ST=SP/L=SaoPaulo/O=GolDeOuro/OU=IT/CN=$DOMAIN"

# Gerar certificado para admin subdomain
echo "🔐 Gerando certificado para admin.$DOMAIN..."
openssl req -new -x509 -key $SSL_DIR/$DOMAIN.key -out $SSL_DIR/admin.$DOMAIN.crt -days 365 \
  -subj "/C=BR/ST=SP/L=SaoPaulo/O=GolDeOuro/OU=IT/CN=admin.$DOMAIN"

# Configurar permissões
chmod 600 $SSL_DIR/*.key
chmod 644 $SSL_DIR/*.crt

echo "✅ Certificados SSL gerados com sucesso!"
echo "📁 Localização: $SSL_DIR/"
echo "⚠️  Para produção, use certificados de uma CA confiável (Let's Encrypt, etc.)"
