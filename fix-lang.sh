#!/bin/bash
# Script para padronizar idioma e termos nos arquivos de teste do gmp-portal

TARGET_DIR="/home/ubuntu/gmp-portal"

echo "🔧 Padronizando idioma para pt-BR em todos os arquivos HTML..."

# Corrige atributo lang
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/lang="zh-CN"/lang="pt-BR"/g' {} \;

# Corrige cabeçalhos e títulos principais
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/GMP/gmp/g' {} \;

# Traduções comuns
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/测试/TESTE/g' {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/门户/Portal/g' {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/系统/Sistema/g' {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/成功/Sucesso/g' {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/失败/Falha/g' {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/警告/Aviso/g' {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/信息/Informação/g' {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/耗时/Duração/g' {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/成功率/Taxa de Sucesso/g' {} \;

echo "✅ Padronização concluída!"
