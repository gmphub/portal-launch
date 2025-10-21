#!/bin/bash
TARGET_DIR="/home/ubuntu/gmp-portal"

echo "🔧 Traduzindo strings para pt-BR..."

# Corrige atributo lang
find "$TARGET_DIR" -type f -name "*.html" -exec sed -i 's/lang="zh-CN"/lang="pt-BR"/g' {} \;

# Traduções comuns
sed -i 's/测试/Teste/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/成功/Sucesso/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/失败/Falha/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/警告/Aviso/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/信息/Informação/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/耗时/Duração/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/成功率/Taxa de Sucesso/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/已加载/Página carregada/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/已准备就绪/Pronto/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/完成/Concluído/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/报告/Relatório/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/页面加载完成/Página carregada/g' $(find $TARGET_DIR -type f -name "*.html")
sed -i 's/提示：点击/💡 Dica: clique em/g' $(find $TARGET_DIR -type f -name "*.html")

echo "✅ Tradução concluída!"
