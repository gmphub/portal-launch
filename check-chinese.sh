#!/bin/bash
set -e
TARGET_DIR="/home/ubuntu/gmp-portal"
echo "🔍 Procurando caracteres chineses nos .html..."
grep -Prn --include="*.html" '[\x{3400}-\x{9FFF}\x{F900}-\x{FAFF}]' "$TARGET_DIR" || echo "✅ Nenhuma ocorrência encontrada."
