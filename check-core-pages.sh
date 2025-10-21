#!/bin/bash
set -euo pipefail

BASE="/home/ubuntu/gmp-portal"
FILES=(
  "$BASE/index.html"
  "$BASE/login.html"
  "$BASE/dashboard.html"
)

echo "=== Verificação de páginas núcleo (index, login, dashboard) ==="

for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo ">> ERRO: arquivo não encontrado: $file"
    continue
  fi

  echo ">> Verificando $file"

  # 1. Fecha corretamente
  if tail -n 1 "$file" | grep -qE '</html>\s*$'; then
    echo "   ✔ Fecha com </html>"
  else
    echo "   ✘ NÃO fecha com </html>"
  fi

  if grep -qE '</body>' "$file"; then
    echo "   ✔ Contém </body>"
  else
    echo "   ✘ NÃO contém </body>"
  fi

  # 2. Sujeiras comuns
  if grep -qE '(^|[^<])\/body>' "$file"; then
    echo "   ⚠ Encontrado '/body>' incorreto (texto solto sem '<')"
  fi
  if grep -q '<<<' "$file"; then
    echo "   ⚠ Encontrado '<<<' incorreto"
  fi

  # 3. Scripts injetados
  if grep -q 'assets/js/admin-tabs.js' "$file"; then
    echo "   ✔ Script admin-tabs.js presente"
  else
    echo "   ✘ Falta admin-tabs.js"
  fi

  if grep -q 'assets/js/admin-dropdown.js' "$file"; then
    echo "   ✔ Script admin-dropdown.js presente"
  else
    echo "   ✘ Falta admin-dropdown.js"
  fi

  # 4. Acessibilidade básica
  ARIA_COUNT=$(grep -o 'aria-label=' "$file" | wc -l | tr -d ' ')
  if [[ "$ARIA_COUNT" -gt 0 ]]; then
    echo "   ✔ Possui aria-label (total: $ARIA_COUNT)"
  else
    echo "   ⚠ Nenhum aria-label encontrado"
  fi

  # 5. Idioma no html
  LANG_ATTR=$(grep -oE '<html[^>]*lang="[^"]+"' "$file" || true)
  if [[ -n "$LANG_ATTR" ]]; then
    echo "   ✔ lang definido: ${LANG_ATTR#*lang=}"
  else
    echo "   ⚠ Atributo lang não encontrado em <html>"
  fi

  # 6. Detecção de caracteres chineses (index)
  if [[ "$file" == *"/index.html" ]]; then
    if grep -P '[\x{4e00}-\x{9fff}]' "$file" >/dev/null; then
      echo "   ⚠ Texto em chinês detectado"
    else
      echo "   ✔ Sem texto chinês"
    fi
  fi

  echo
done
