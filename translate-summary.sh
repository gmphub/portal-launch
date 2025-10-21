#!/bin/bash
set -e
f="/home/ubuntu/gmp-portal/test-summary.html"

# Head e navegação
sed -i 's/lang="zh-CN"/lang="pt-BR"/g' "$f"
sed -i 's/GMP门户测试总结/Resumo dos Testes do gmp Portal/g' "$f"
sed -i 's/GMP门户系统/gmp Portal/g' "$f"
sed -i 's/首页/Início/g' "$f"
sed -i 's/测试仪表板/Painel de testes/g' "$f"
sed -i 's/自动测试/Teste automático/g' "$f"
sed -i 's/测试总结/Resumo de testes/g' "$f"

# Header
sed -i 's/完整的测试套件已创建完成，系统准备就绪/Suíte completa criada, sistema pronto/g' "$f"
sed -i 's/运行自动测试/Executar teste automático/g' "$f"
sed -i 's/查看测试仪表板/Abrir painel de testes/g' "$f"

# Seções e itens
sed -i 's/🎯 测试目标达成情况/🎯 Status dos objetivos de teste/g' "$f"
sed -i 's/✅ 安全管理器/✅ Gerenciador de segurança/g' "$f"
sed -i 's/认证授权功能就绪/Autenticação e autorização prontas/g' "$f"
sed -i 's/✅ 数据库管理器/✅ Gerenciador de banco de dados/g' "$f"
sed -i 's/数据操作功能正常/Operações de dados OK/g' "$f"
sed -i 's/✅ 集成测试/✅ Teste de integração/g' "$f"
sed -i 's/模块协同工作验证/Validação de colaboração de módulos/g' "$f"
sed -i 's/⚠️ Oracle集成/⚠️ Integração Oracle/g' "$f"
sed -i 's/需要实际服务器配置/Exige configuração de servidor real/g' "$f"
sed -i 's/✅ 自动化测试/✅ Teste automatizado/g' "$f"
sed -i 's/一键测试套件完成/Suíte de um clique pronta/g' "$f"

sed -i 's/🔧 核心功能模块/🔧 Módulos principais/g' "$f"
sed -i 's/提供完整的用户认证、权限管理、会话控制和安全审计功能/Autenticação, permissões, sessões e auditoria/g' "$f"
sed -i 's/实现数据库连接管理、CRUD操作、事务处理、批量操作等/Conexão, CRUD, transações e operações em lote/g' "$f"
sed -i 's/提供全面的自动化测试能力/Automação de testes abrangente/g' "$f"

sed -i 's/📋 测试页面清单/📋 Lista de páginas de teste/g' "$f"
sed -i 's/极简测试/Teste mínimo/g' "$f"
sed -i 's/安全管理器测试/Teste do gerenciador de segurança/g' "$f"
sed -i 's/数据库管理器测试/Teste do gerenciador de banco de dados/g' "$f"
sed -i 's/集成测试/Teste de integração/g' "$f"
sed -i 's/测试仪表板/Painel de testes/g' "$f"
sed -i 's/系统主页/Página inicial/g' "$f"

sed -i 's/🚀 系统特性/🚀 Características do sistema/g' "$f"
sed -i 's/响应式设计/Design responsivo/g' "$f"
sed -i 's/现代化界面/Interface moderna/g' "$f"
sed -i 's/模块化架构/Arquitetura modular/g' "$f"
sed -i 's/企业级安全/Segurança corporativa/g' "$f"
sed -i 's/数据完整性/Integridade de dados/g' "$f"
sed -i 's/可扩展性/Escalabilidade/g' "$f"

sed -i 's/📊 测试覆盖范围/📊 Cobertura de testes/g' "$f"
sed -i 's/基础环境/Ambiente básico/g' "$f"
sed -i 's/JavaScript功能/Funcionalidades JavaScript/g' "$f"
sed -i 's/DOM操作/Operações DOM/g' "$f"
sed -i 's/事件处理/Tratamento de eventos/g' "$f"
sed -i 's/安全功能/Funcionalidades de segurança/g' "$f"
sed -i 's/数据库功能/Funcionalidades de banco de dados/g' "$f"
sed -i 's/覆盖/Cobertura/g' "$f"

sed -i 's/🎉 成果总结/🎉 Resumo de resultados/g' "$f"
sed -i 's/主要成就/Principais conquistas/g' "$f"
sed -i 's/成功解决了JavaScript执行问题/JavaScript estável para testes/g' "$f"
sed -i 's/创建了完整的安全管理器模块/Módulo de segurança completo/g' "$f"
sed -i 's/实现了功能完善的数据库管理器/Gerenciador de banco funcional/g' "$f"
sed -i 's/建立了全面的测试套件/Suíte de testes completa/g' "$f"
sed -i 's/提供了直观易用的测试管理界面/Interface de gestão de testes intuitiva/g' "$f"
sed -i 's/构建了响应式的用户界面/UI responsiva/g' "$f"

sed -i 's/🔮 下一步计划/🔮 Próximos passos/g' "$f"
sed -i 's/Oracle数据库集成/Integração Oracle/g' "$f"
sed -i 's/配置Oracle数据库连接参数/Configurar parâmetros de conexão Oracle/g' "$f"
sed -i 's/测试Oracle数据库连接和基本操作/Testar conexão e operações Oracle/g' "$f"
sed -i 's/实现数据同步功能/Implementar sincronização de dados/g' "$f"
sed -i 's/验证跨数据库查询能力/Validar consultas entre bancos/g' "$f"
sed -i 's/进行性能优化和压力测试/Otimizar desempenho e estresse/g' "$f"

sed -i 's/生产环境部署/Implantação em produção/g' "$f"
sed -i 's/配置生产环境服务器/Configurar servidor de produção/g' "$f"
sed -i 's/设置安全策略和防火墙/Definir políticas de segurança e firewall/g' "$f"
sed -i 's/配置负载均衡和高可用性/Configurar balanceamento e alta disponibilidade/g' "$f"
sed -i 's/实施监控和日志系统/Implementar monitoramento e logs/g' "$f"
sed -i 's/进行用户验收测试/Fazer testes de aceitação/g' "$f"

sed -i 's/📞 技术支持/📞 Suporte técnico/g' "$f"
sed -i 's/如需技术支持或有任何问题，请参考以下资源:/Para suporte técnico, consulte:/g' "$f"
sed -i 's/📖 查看文档/📖 Ver documentação/g' "$f"
sed -i 's/🧪 运行测试/🧪 Executar teste/g' "$f"
sed -i 's/📊 测试仪表板/📊 Painel de testes/g' "$f"
sed -i 's/🏠 返回首页/🏠 Voltar à página inicial/g' "$f"

# Rodapé
sed -i 's/测试套件已准备就绪./Suíte de testes pronta./g' "$f"

# Console init
sed -i 's/🎉 GMP门户测试总结页面已加载/🎉 Página de resumo de testes do gmp Portal carregada/g' "$f"
sed -i 's/📊 测试套件创建完成，系统准备就绪/📊 Suíte de testes criada, sistema pronto/g' "$f"

echo "✅ test-summary.html traduzido."
