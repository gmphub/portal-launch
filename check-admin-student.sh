#!/bin/bash
set -euo pipefail

BASE="/home/ubuntu/gmp-portal"
DIRS=(
  "$BASE/admin"
  "$BASE/student"
)

echo "=== Verificação recursiva em admin/ e student/ ==="

for dir in "${DIRS[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo ">> AVISO: pasta não encontrada: $dir"
    continue
  fi

  echo ">> Pasta: $dir"
  find "$dir" -type f -name "*.html" | while read -r file; do
    echo "   - Verificando $file"

    # 1. Fecha corretamente
    if tail -n 1 "$file" | grep -qE '</html>\s*$'; then
      echo "     ✔ Fecha com </html>"
    else
      echo "     ✘ NÃO fecha com </html>"
    fi

    if grep -qE '</body>' "$file"; then
      echo "     ✔ Contém </body>"
    else
      echo "     ✘ NÃO contém </body>"
    fi

    # 2. Sujeiras comuns
    if grep -qE '(^|[^<])\/body>' "$file"; then
      echo "     ⚠ Encontrado '/body>' incorreto (texto solto sem '<')"
    fi
    if grep -q '<<<' "$file"; then
      echo "     ⚠ Encontrado '<<<' incorreto"
    fi

    # 3. Scripts injetados
    if grep -q 'assets/js/admin-tabs.js' "$file"; then
      echo "     ✔ Script admin-tabs.js presente"
    else
      echo "     ✘ Falta admin-tabs.js"
    fi

    if grep -q 'assets/js/admin-dropdown.js' "$file"; then
      echo "     ✔ Script admin-dropdown.js presente"
    else
      echo "     ✘ Falta admin-dropdown.js"
    fi

    # 4. Acessibilidade básica
    ARIA_COUNT=$(grep -o 'aria-label=' "$file" | wc -l | tr -d ' ')
    if [[ "$ARIA_COUNT" -gt 0 ]]; then
      echo "     ✔ Possui aria-label (total: $ARIA_COUNT)"
    else
      echo "     ⚠ Nenhum aria-label encontrado"
    fi
  done
  echo
done
