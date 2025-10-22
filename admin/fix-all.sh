#!/usr/bin/env bash
set -euo pipefail

HTML="$HOME/gmp-portal/admin/students2.html"

timestamp="$(date +%Y%m%d-%H%M%S)"

backup_file() {
  local f="$1"
  if [ -f "$f" ]; then
    cp "$f" "$f.bak.$timestamp"
    echo "Backup criado: $f.bak.$timestamp"
  else
    echo "AVISO: arquivo não encontrado: $f"
  fi
}

patch_html() {
  echo "Patch HTML em: $HTML"
  backup_file "$HTML"

  # 1) Garantir Bootstrap JS bundle (necessário para bootstrap.Modal)
  if ! grep -q 'bootstrap.bundle.min.js' "$HTML"; then
    # Inserir antes de main.js para estar disponível a todos
    sed -i '/<script[[:space:]]\+defer[[:space:]]\+src="..\/assets\/js\/main\.js"[[:space:]]\+type="text\/javascript"><\/script>/i \
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0y+GQ7r9jQ5qK6g7" crossorigin="anonymous"></script>' "$HTML"
    echo "Bootstrap JS adicionado."
  else
    echo "Bootstrap JS já presente."
  fi

  # 2) Corrigir link de Sair para logout real
  # Mantém href e adiciona onclick (sem duplicar caso já exista)
  if grep -q '<a href="../login.html">Sair</a>' "$HTML"; then
    sed -i 's#<a href="\.\./login\.html">Sair</a>#<a href="../login.html" onclick="event.preventDefault(); securityManager.logout();">Sair</a>#g' "$HTML"
    echo "Logout ajustado no link 'Sair'."
  fi

  # 3) Garantir que blocos de script finais existem e na ordem correta
  # Se a seção existir, não duplicar; se não existir, inserir o bloco completo
  if ! grep -q '<script src="../assets/js/security.js"' "$HTML"; then
    sed -i '/<\/body>[[:space:]]*<\/html>/i \
<!-- Load order: security and database BEFORE main and students -->\n<script src="../assets/js/security.js" type="text/javascript"></script>\n<script src="../assets/js/database.js" type="text/javascript"></script>\n<script defer src="../assets/js/main.js" type="text/javascript"></script>\n<script defer src="../assets/js/students.js" type="text/javascript"></script>' "$HTML"
    echo "Bloco de scripts inserido no final do HTML."
  else
    echo "Bloco de scripts já presente no HTML."
  fi

  # 4) Remover quaisquer scripts de wiring duplicados anteriores (sanitização)
  # Remove blocos <script> inseridos manualmente que contenham 'students2 wiring error' (se existirem)
  sed -i '/<script>.*students2 wiring error/,/<\/script>/d' "$HTML"

  echo "Patch HTML concluído."
}

patch_html

echo "Correções aplicadas ao students2.html. Recarregue a página admin/students2.html."
