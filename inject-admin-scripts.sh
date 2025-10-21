#!/bin/bash
ADMIN_DIR="/home/ubuntu/gmp-portal"

# percorre recursivamente todos os .html
find "$ADMIN_DIR" -type f -name "*.html" | while read -r file; do
  echo "Processando $file"

  # injeta os scripts antes de </body> se ainda não existirem
  if ! grep -q "admin-tabs.js" "$file"; then
    sed -i '/<\/body>/i <script src="assets/js/admin-tabs.js"></script>' "$file"
  fi
  if ! grep -q "admin-dropdown.js" "$file"; then
    sed -i '/<\/body>/i <script src="assets/js/admin-dropdown.js"></script>' "$file"
  fi


  # adiciona aria-labels em botões principais (mais tolerante)
  sed -i 's/<button\([^>]*\)>\s*<i class="fas fa-download"/<button aria-label="Exportar"\1><i class="fas fa-download"/' "$file"
  sed -i 's/<button\([^>]*\)>\s*<i class="fas fa-save"/<button aria-label="Salvar"\1><i class="fas fa-save"/' "$file"
  sed -i 's/<button\([^>]*\)>\s*<i class="fas fa-upload"/<button aria-label="Upload"\1><i class="fas fa-upload"/' "$file"
done
