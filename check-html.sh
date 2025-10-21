#!/bin/bash
DIR="/home/ubuntu/gmp-portal"

echo "=== Verificação de HTML em $DIR ==="

for file in "$DIR"/*.html; do
  echo ">> Verificando $file"

  # 1. Verifica se termina corretamente
  if tail -n 2 "$file" | grep -q "</html>"; then
    echo "   ✔ Fecha com </html>"
  else
    echo "   ✘ NÃO fecha com </html>"
  fi

  if grep -q "</body>" "$file"; then
    echo "   ✔ Contém </body>"
  else
    echo "   ✘ NÃO contém </body>"
  fi

  # 2. Verifica se há sujeira tipo '/body>' ou '<<<'
  if grep -q "/body>" "$file"; then
    echo "   ⚠ Encontrado '/body>' incorreto"
  fi
  if grep -q "<<<" "$file"; then
    echo "   ⚠ Encontrado '<<<' incorreto"
  fi

  # 3. Verifica se scripts foram injetados
  if grep -q "admin-tabs.js" "$file"; then
    echo "   ✔ Script admin-tabs.js presente"
  else
    echo "   ✘ Falta admin-tabs.js"
  fi

  if grep -q "admin-dropdown.js" "$file"; then
    echo "   ✔ Script admin-dropdown.js presente"
  else
    echo "   ✘ Falta admin-dropdown.js"
  fi

  # 4. Verifica acessibilidade básica
  if grep -q "aria-label" "$file"; then
    echo "   ✔ Possui aria-label"
  else
    echo "   ⚠ Nenhum aria-label encontrado"
  fi

  echo
done
