#!/bin/bash

# Caminho raiz do projeto
ROOT=~/gmp-portal

# Caminho do favicon
FAVICON='<link rel="icon" href="/assets/images/favicon.ico" type="image/x-icon">'

# Lista de arquivos alvo
FILES=("$ROOT/login.html")
FILES+=($(find "$ROOT/admin" "$ROOT/student" -type f -name "*.html"))

# Inserir favicon em cada arquivo
for FILE in "${FILES[@]}"; do
    echo "Processando $FILE..."
    
    # Verifica se já existe referência ao favicon
    if grep -q "favicon.ico" "$FILE"; then
        echo "Já possui favicon: $FILE"
    else
        # Insere após a primeira <head>
        sed -i "0,/<head>/s|<head>|<head>\n  $FAVICON|" "$FILE"
        echo "Favicon inserido em $FILE"
    fi
done

echo
echo "✅ Favicon atualizado em todos os arquivos."
