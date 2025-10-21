#!/bin/bash
set -e
f="/home/ubuntu/gmp-portal/performance-test.html"

# Head e títulos
sed -i 's/lang="zh-CN"/lang="pt-BR"/g' "$f"
sed -i 's/性能测试 - GMP门户系统/Teste de Performance - gmp Portal/g' "$f"
sed -i 's/系统性能测试/Teste de desempenho do sistema/g' "$f"

# Seções e botões
sed -i 's/JavaScript性能测试/Teste de desempenho do JavaScript/g' "$f"
sed -i 's/测试JS执行性能/Testar desempenho de execução JS/g' "$f"
sed -i 's/测试内存使用/Testar uso de memória/g' "$f"
sed -i 's/测试DOM操作性能/Testar desempenho de operações DOM/g' "$f"

sed -i 's/数据库性能测试/Teste de desempenho do banco de dados/g' "$f"
sed -i 's/测试数据库操作/Testar operações de banco de dados/g' "$f"
sed -i 's/测试查询性能/Testar desempenho de consultas/g' "$f"
sed -i 's/测试事务性能/Testar desempenho de transações/g' "$f"

sed -i 's/安全性能测试/Teste de desempenho de segurança/g' "$f"
sed -i 's/测试认证性能/Testar desempenho de autenticação/g' "$f"
sed -i 's/测试加密性能/Testar desempenho de criptografia/g' "$f"
sed -i 's/测试会话性能/Testar desempenho de sessão/g' "$f"

sed -i 's/综合性能指标/Métricas de desempenho integradas/g' "$f"
sed -i 's/JavaScript性能 (ms)/Desempenho de JavaScript (ms)/g' "$f"
sed -i 's/数据库性能 (ms)/Desempenho do banco (ms)/g' "$f"
sed -i 's/安全性能 (ms)/Desempenho de segurança (ms)/g' "$f"
sed -i 's/内存使用 (MB)/Uso de memória (MB)/g' "$f"

sed -i 's/压力测试/Teste de estresse/g' "$f"
sed -i 's/运行压力测试/Executar teste de estresse/g' "$f"
sed -i 's/测试并发操作/Testar operações concorrentes/g' "$f"

# Logs
sed -i 's/开始JavaScript性能测试.../Iniciando teste de desempenho de JavaScript.../g' "$f"
sed -i 's/计算性能测试完成，耗时:/Teste de cálculo concluído, duração:/g' "$f"
sed -i 's/开始内存使用测试.../Iniciando teste de uso de memória.../g' "$f"
sed -i 's/内存使用:/Uso de memória:/g' "$f"
sed -i 's/浏览器不支持内存监控/O navegador não suporta monitoramento de memória/g' "$f"
sed -i 's/开始DOM操作性能测试.../Iniciando teste de desempenho de operações DOM.../g' "$f"
sed -i 's/DOM操作性能测试完成，耗时:/Teste de operações DOM concluído, duração:/g' "$f"

sed -i 's/开始数据库性能测试.../Iniciando teste de desempenho de banco de dados.../g' "$f"
sed -i 's/数据库操作性能测试完成，耗时:/Teste de operações de banco concluído, duração:/g' "$f"
sed -i 's/开始查询性能测试.../Iniciando teste de desempenho de consultas.../g' "$f"
sed -i 's/查询性能测试完成，耗时:/Teste de consultas concluído, duração:/g' "$f"
sed -i 's/返回/retornou/g' "$f"
sed -i 's/条记录/ registros/g' "$f"
sed -i 's/开始事务性能测试.../Iniciando teste de desempenho de transações.../g' "$f"
sed -i 's/事务性能测试完成，耗时:/Teste de transações concluído, duração:/g' "$f"

sed -i 's/开始认证性能测试.../Iniciando teste de desempenho de autenticação.../g' "$f"
sed -i 's/认证性能测试完成，耗时:/Teste de autenticação concluído, duração:/g' "$f"
sed -i 's/开始加密性能测试.../Iniciando teste de desempenho de criptografia.../g' "$f"
sed -i 's/加密性能测试完成，耗时:/Teste de criptografia concluído, duração:/g' "$f"
sed -i 's/开始会话性能测试.../Iniciando teste de desempenho de sessão.../g' "$f"
sed -i 's/会话性能测试完成，耗时:/Teste de sessão concluído, duração:/g' "$f"

sed -i 's/开始压力测试.../Iniciando teste de estresse.../g' "$f"
sed -i 's/压力测试完成，/Teste de estresse concluído, /g' "$f"
sed -i 's/个并发请求，耗时:/ solicitações concorrentes, duração:/g' "$f"
sed -i 's/平均每个请求耗时:/Tempo médio por solicitação:/g' "$f"

sed -i 's/开始并发操作测试.../Iniciando teste de operações concorrentes.../g' "$f"
sed -i 's/并发操作测试完成，耗时:/Teste de operações concorrentes concluído, duração:/g' "$f"
sed -i 's/用户认证成功率:/Taxa de sucesso de autenticação:/g' "$f"
sed -i 's/数据库查询成功率:/Taxa de sucesso de consultas:/g' "$f"

# Init
sed -i 's/性能测试页面已加载/Página de teste de desempenho carregada/g' "$f"
sed -i 's/数据库性能测试已准备就绪/Teste de desempenho de banco pronto/g' "$f"
sed -i 's/安全性能测试已准备就绪/Teste de desempenho de segurança pronto/g' "$f"
sed -i 's/压力测试已准备就绪/Teste de estresse pronto/g' "$f"

echo "✅ performance-test.html traduzido."
