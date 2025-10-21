#!/bin/bash
set -e
INDEX="/home/ubuntu/gmp-portal/index.html"

echo "🔧 Corrigindo index.html..."

# Idioma e título
sed -i 's/lang="zh-CN"/lang="pt-BR"/g' "$INDEX"
sed -i 's/gmp门户系统/gmp Portal/g' "$INDEX"
sed -i 's/gmp门户管理系统/gmp Portal Management System/g' "$INDEX"

# Menu
sed -i 's/Home/Home/g' "$INDEX"
sed -i 's/function/Funções/g' "$INDEX"
sed -i 's/Test/Testes/g' "$INDEX"
sed -i 's/summary/Resumo/g' "$INDEX"
sed -i 's/concerning/Sobre/g' "$INDEX"

# Hero
sed -i 's/An enterprise-grade management platform based on Oracle database/Plataforma corporativa baseada em Oracle/g' "$INDEX"
sed -i 's/Start testing/Iniciar testes/g' "$INDEX"

# Features
sed -i 's/Safety management/Gestão de segurança/g' "$INDEX"
sed -i 's/Database management/Gestão de banco de dados/g' "$INDEX"
sed -i 's/data analysis/Análise de dados/g' "$INDEX"
sed -i 's/Performance/Desempenho/g' "$INDEX"
sed -i 's/Web interface/Interface Web/g' "$INDEX"
sed -i 's/System integration/Integração de sistemas/g' "$INDEX"

# Test center
sed -i 's/System Test Center/Centro de Testes do Sistema/g' "$INDEX"
sed -i 's/Comprehensive test suite to ensure the proper functioning of the system'"'"'s modules/Suíte completa para validar todos os módulos do sistema/g' "$INDEX"

sed -i 's/ready/Pronto/g' "$INDEX"
sed -i 's/To be configured/A configurar/g' "$INDEX"

sed -i 's/Test dashboard/Painel de testes/g' "$INDEX"
sed -i 's/Go to the dashboard/Abrir painel/g' "$INDEX"

sed -i 's/Minimalist testing/Teste mínimo/g' "$INDEX"
sed -i 's/Basic JavaScript function validation/Validação básica de JavaScript/g' "$INDEX"

sed -i 's/Security management test/Teste de segurança/g' "$INDEX"
sed -i 's/Authentication, authorization, and session management testing/Testes de autenticação, autorização e sessões/g' "$INDEX"

sed -i 's/Database testing/Teste de banco de dados/g' "$INDEX"
sed -i 's/Database connection and CRUD operation testing/Testes de conexão e operações CRUD/g' "$INDEX"

sed -i 's/Integration testing/Teste de integração/g' "$INDEX"
sed -i 's/Full business process testing/Testes de fluxo de negócio completo/g' "$INDEX"

sed -i 's/Automated testing/Teste automático/g' "$INDEX"
sed -i 's/Run the full test suite with one click and automatically generate reports/Executa toda a suíte de testes e gera relatório automático/g' "$INDEX"
sed -i 's/Start automated testing/Iniciar teste automático/g' "$INDEX"

sed -i 's/Oracle integration/Integração Oracle/g' "$INDEX"
sed -i 's/Oracle database connection and synchronization testing/Testes de conexão e sincronização Oracle/g' "$INDEX"

# Rodapé
sed -i 's/版权所有./Todos os direitos reservados./g' "$INDEX"

# Links corretos
sed -i 's|href=".*test-dashboard.*"|href="test-dashboard.html"|g' "$INDEX"
sed -i 's|href=".*minimal-test.*"|href="minimal-test.html"|g' "$INDEX"
sed -i 's|href=".*security-test.*"|href="security-test.html"|g' "$INDEX"
sed -i 's|href=".*database-test.*"|href="database-test.html"|g' "$INDEX"
sed -i 's|href=".*integration-test.*"|href="integration-test.html"|g' "$INDEX"
sed -i 's|href=".*auto-test.*"|href="auto-test.html"|g' "$INDEX"
sed -i 's|href=".*test-summary.*"|href="test-summary.html"|g' "$INDEX"
sed -i 's|href=".*performance-test.*"|href="performance-test.html"|g' "$INDEX"
sed -i 's|href=".*oracle-test.*"|href="oracle-test.html"|g' "$INDEX"

echo "✅ index.html corrigido!"
