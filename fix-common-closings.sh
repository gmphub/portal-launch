#!/bin/bash
set -euo pipefail

BASE="/home/ubuntu/gmp-portal"

echo "=== Correção rápida em admin/ e student/ ==="
find "$BASE/admin" "$BASE/student" -type f -name "*.html" | while read -r file; do
  echo ">> Corrigindo $file"
  # Corrige '/body>' solto para '</body>'
  sed -i 's/[^<]\/body>/<\/body>/g' "$file"

  # Garante que </html> exista na última linha
  if ! tail -n 1 "$file" | grep -qE '</html>\s*$'; then
    echo "</html>" >> "$file"
  fi
done
echo "=== Pronto ==="
