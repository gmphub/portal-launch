#!/bin/bash
ADMIN_DIR="/home/ubuntu/gmp-portal"

find "$ADMIN_DIR" -type f \( -name "*.html" -o -name "*.htm" \) | while read -r file; do
  echo "Corrigindo $file"
  perl -0777 -pe '
    # Garante que </body> esteja sozinho em uma linha
    s#\s*</body>#\n</body>#gi;

    # Força quebra de linha antes dos scripts, se não houver
    s#(?<!\n)(<script src="assets/js/admin-tabs\.js"></script>)#\n$1#gi;
    s#(?<!\n)(<script src="assets/js/admin-dropdown\.js"></script>)#\n$1#gi;
  ' -i "$file"
done
