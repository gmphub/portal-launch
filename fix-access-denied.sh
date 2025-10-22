#!/bin/bash

echo "🔧 Corrigindo referências a access-denied.html..."

# Substitui todas as ocorrências por login.html
sed -i "s/access-denied\.html/login.html/g" \
  assets/js/js.security.js \
  assets/js/security.js \
  assets/js/students.js \
  server.js \
  admin/analytics.html

# Remove o arquivo antigo se ainda existir
if [ -f access-denied.html ]; then
  rm access-denied.html
  echo "🗑️ access-denied.html removido"
fi

echo "✅ Substituição concluída com sucesso!"
