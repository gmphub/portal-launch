#!/bin/bash
set -e

TARGET_DIR="/home/ubuntu/gmp-portal"

FILES=(
  "minimal-test.html"
  "security-test.html"
  "database-test.html"
  "integration-test.html"
  "performance-test.html"
  "test-dashboard.html"
  "auto-test.html"
  "test-summary.html"
  "index.html"
)

echo "🔧 Traduzindo arquivos de teste e index para pt-BR..."

for f in "${FILES[@]}"; do
  FILEPATH="$TARGET_DIR/$f"
  if [ -f "$FILEPATH" ]; then
    echo "➡️  Traduzindo $f"

    # Traduções principais
    sed -i 's/🚀 开始GMP门户系统快速测试.../🚀 Iniciando teste rápido do gmp Portal.../g' "$FILEPATH"
    sed -i 's/检查基础环境/Verificando ambiente básico/g' "$FILEPATH"
    sed -i 's/JavaScript已启用/JavaScript habilitado/g' "$FILEPATH"
    sed -i 's/LocalStorage可用/LocalStorage disponível/g' "$FILEPATH"
    sed -i 's/Console API可用/Console API disponível/g' "$FILEPATH"
    sed -i 's/DOM API可用/DOM API disponível/g' "$FILEPATH"
    sed -i 's/检查JavaScript类/Verificando classes JavaScript/g' "$FILEPATH"
    sed -i 's/类已定义/definida/g' "$FILEPATH"
    sed -i 's/测试本地存储/Testando armazenamento local/g' "$FILEPATH"
    sed -i 's/数据写入成功/Dados gravados com sucesso/g' "$FILEPATH"
    sed -i 's/数据读取成功/Dados lidos com sucesso/g' "$FILEPATH"
    sed -i 's/测试数据已清理/Dados de teste limpos/g' "$FILEPATH"
    sed -i 's/测试DOM操作/Testando operações de DOM/g' "$FILEPATH"
    sed -i 's/DOM元素创建成功/Elemento DOM criado com sucesso/g' "$FILEPATH"
    sed -i 's/DOM元素修改成功/Elemento DOM modificado com sucesso/g' "$FILEPATH"
    sed -i 's/测试元素已清理/Elemento de teste limpo/g' "$FILEPATH"
    sed -i 's/测试事件处理/Testando tratamento de eventos/g' "$FILEPATH"
    sed -i 's/事件处理正常/Tratamento de eventos OK/g' "$FILEPATH"
    sed -i 's/测试安全功能/Testando recursos de segurança/g' "$FILEPATH"
    sed -i 's/密码强度检查正常/Verificação de força de senha OK/g' "$FILEPATH"
    sed -i 's/邮箱验证正常/Validação de e-mail OK/g' "$FILEPATH"
    sed -i 's/会话创建成功/Sessão criada com sucesso/g' "$FILEPATH"
    sed -i 's/测试数据库功能/Testando recursos de banco de dados/g' "$FILEPATH"
    sed -i 's/数据保存成功/Dados salvos com sucesso/g' "$FILEPATH"
    sed -i 's/数据查询成功/Consulta de dados bem-sucedida/g' "$FILEPATH"
    sed -i 's/连接状态获取成功/Status de conexão obtido com sucesso/g' "$FILEPATH"
    sed -i 's/测试集成功能/Testando recursos de integração/g' "$FILEPATH"
    sed -i 's/用户注册成功/Registro de usuário bem-sucedido/g' "$FILEPATH"
    sed -i 's/数据访问控制正常/Controle de acesso a dados OK/g' "$FILEPATH"
    sed -i 's/集成测试完成/Teste de integração concluído/g' "$FILEPATH"
    sed -i 's/📊 测试报告/📊 Relatório de teste/g' "$FILEPATH"
    sed -i 's/总测试数/Total de testes/g' "$FILEPATH"
    sed -i 's/失败/Falha/g' "$FILEPATH"
    sed -i 's/警告/Aviso/g' "$FILEPATH"
    sed -i 's/信息/Informação/g' "$FILEPATH"
    sed -i 's/耗时/Duração/g' "$FILEPATH"
    sed -i 's/成功率/Taxa de sucesso/g' "$FILEPATH"
    sed -i 's/✅ 测试完成!/✅ Teste concluído!/g' "$FILEPATH"
    sed -i 's/📄 测试报告已保存到本地存储/📄 Relatório salvo no armazenamento local/g' "$FILEPATH"
    sed -i 's/🌟 页面加载Concluído，SistemaPronto/🌟 Página carregada, sistema pronto/g' "$FILEPATH"
    sed -i 's/运行完整TESTE/Executar teste completo/g' "$FILEPATH"
    sed -i 's/总结页面/Página de resumo/g' "$FILEPATH"
    sed -i 's/套件创建Concluído，系统准备就绪/Conjunto de testes criado, sistema pronto/g' "$FILEPATH"

    # Index específico
    if [ "$f" == "index.html" ]; then
      sed -i 's/function/Funções/g' "$FILEPATH"
      sed -i 's/summary/Resumo/g' "$FILEPATH"
      sed -i 's/concerning/Sobre/g' "$FILEPATH"
      sed -i 's/data analysis/Análise de dados/g' "$FILEPATH"
      sed -i 's/Performance/Desempenho/g' "$FILEPATH"
      sed -i 's/Safety management/Gestão de segurança/g' "$FILEPATH"
      sed -i 's/Database management/Gestão de banco de dados/g' "$FILEPATH"
      sed -i 's/System integration/Integração de sistemas/g' "$FILEPATH"
      sed -i 's/System Test Center/Centro de Testes do Sistema/g' "$FILEPATH"
      sed -i 's/ready/Pronto/g' "$FILEPATH"
      sed -i 's/To be configured/A configurar/g' "$FILEPATH"
      sed -i 's/Test dashboard/Painel de testes/g' "$FILEPATH"
      sed -i 's/Minimalist testing/Teste mínimo/g' "$FILEPATH"
      sed -i 's/Security management test/Teste de segurança/g' "$FILEPATH"
      sed -i 's/Database testing/Teste de banco de dados/g' "$FILEPATH"
      sed -i 's/Integration testing/Teste de integração/g' "$FILEPATH"
      sed -i 's/Automated testing/Teste automático/g' "$FILEPATH"
      sed -i 's/Oracle integration/Integração Oracle/g' "$FILEPATH"
      sed -i 's/Start testing/Iniciar teste/g' "$FILEPATH"
      sed -i 's/Start automated testing/Iniciar teste automático/g' "$FILEPATH"
      sed -i 's/Go to the dashboard/Abrir painel/g' "$FILEPATH"
      sed -i 's/&copy; 2024 GMP门户系统. 版权所有./© 2024 gmp Portal. Todos os direitos reservados./g' "$FILEPATH"
    fi
  fi
done

echo "✅ Tradução concluída!"
