#!/bin/bash
set -e
f="/home/ubuntu/gmp-portal/database-test.html"

# Head
sed -i 's/lang="zh-CN"/lang="pt-BR"/g' "$f"
sed -i 's/数据库管理器测试/Teste do Gerenciador de Banco de Dados/g' "$f"

# Títulos de seção
sed -i 's/连接测试/Teste de conexão/g' "$f"
sed -i 's/基础操作测试/Teste de operações básicas/g' "$f"
sed -i 's/高级功能测试/Teste de recursos avançados/g' "$f"
sed -i 's/Oracle集成测试/Teste de integração Oracle/g' "$f"

# Botões
sed -i 's/测试数据库连接/Testar conexão com banco de dados/g' "$f"
sed -i 's/检查连接状态/Verificar status da conexão/g' "$f"
sed -i 's/创建测试表/Criar tabela de teste/g' "$f"
sed -i 's/插入测试数据/Inserir dados de teste/g' "$f"
sed -i 's/查询测试数据/Consultar dados de teste/g' "$f"
sed -i 's/更新测试数据/Atualizar dados de teste/g' "$f"
sed -i 's/删除测试数据/Excluir dados de teste/g' "$f"
sed -i 's/事务测试/Teste de transação/g' "$f"
sed -i 's/批量操作测试/Teste de operações em lote/g' "$f"
sed -i 's/存储过程测试/Teste de procedimento armazenado/g' "$f"
sed -i 's/测试Oracle连接/Testar conexão Oracle/g' "$f"
sed -i 's/测试Oracle查询/Testar consulta Oracle/g' "$f"
sed -i 's/测试数据同步/Testar sincronização de dados/g' "$f"

# Logs e mensagens
sed -i 's/开始数据库连接测试.../Iniciando teste de conexão com banco de dados.../g' "$f"
sed -i 's/连接结果:/Resultado da conexão:/g' "$f"
sed -i 's/数据库连接成功建立/Conexão estabelecida com sucesso/g' "$f"
sed -i 's/连接失败:/Falha na conexão:/g' "$f"
sed -i 's/连接测试异常:/Exceção no teste de conexão:/g' "$f"

sed -i 's/检查连接状态.../Verificando status da conexão.../g' "$f"
sed -i 's/连接状态:/Status da conexão:/g' "$f"
sed -i 's/连接活跃，数据库类型:/Conexão ativa, tipo de banco:/g' "$f"
sed -i 's/连接未建立或已断开/Conexão não estabelecida ou desconectada/g' "$f"
sed -i 's/状态检查异常:/Exceção na verificação de status:/g' "$f"

sed -i 's/开始创建测试表.../Iniciando criação de tabela de teste.../g' "$f"
sed -i 's/表创建结果:/Resultado da criação da tabela:/g' "$f"
sed -i 's/创建表失败:/Falha na criação da tabela:/g' "$f"

sed -i 's/开始插入测试数据.../Iniciando inserção de dados de teste.../g' "$f"
sed -i 's/数据插入结果:/Resultado da inserção de dados:/g' "$f"
sed -i 's/插入的行数:/Linhas inseridas:/g' "$f"
sed -i 's/插入数据失败:/Falha na inserção de dados:/g' "$f"

sed -i 's/开始查询测试数据.../Iniciando consulta de dados de teste.../g' "$f"
sed -i 's/查询结果:/Resultado da consulta:/g' "$f"
sed -i 's/查询到 /Consultados /g' "$f"
sed -i 's/ 条记录/ registros/g' "$f"
sed -i 's/记录 /Registro /g' "$f"
sed -i 's/查询数据失败:/Falha na consulta de dados:/g' "$f"

sed -i 's/开始更新测试数据.../Iniciando atualização de dados de teste.../g' "$f"
sed -i 's/数据更新结果:/Resultado da atualização:/g' "$f"
sed -i 's/更新的行数:/Linhas atualizadas:/g' "$f"
sed -i 's/更新数据失败:/Falha na atualização:/g' "$f"

sed -i 's/开始删除测试数据.../Iniciando exclusão de dados de teste.../g' "$f"
sed -i 's/数据删除结果:/Resultado da exclusão:/g' "$f"
sed -i 's/删除的行数:/Linhas excluídas:/g' "$f"
sed -i 's/删除数据失败:/Falha na exclusão:/g' "$f"

sed -i 's/开始事务测试.../Iniciando teste de transação.../g' "$f"
sed -i 's/事务执行成功/Transação executada com sucesso/g' "$f"
sed -i 's/事务结果:/Resultado da transação:/g' "$f"
sed -i 's/事务测试失败:/Falha no teste de transação:/g' "$f"

sed -i 's/开始批量操作测试.../Iniciando teste de operações em lote.../g' "$f"
sed -i 's/批量操作结果:/Resultado das operações em lote:/g' "$f"
sed -i 's/批量操作测试失败:/Falha no teste de operações em lote:/g' "$f"

sed -i 's/开始存储过程测试.../Iniciando teste de procedimento armazenado.../g' "$f"
sed -i 's/存储过程创建结果:/Resultado da criação do procedimento:/g' "$f"
sed -i 's/存储过程调用结果:/Resultado da chamada do procedimento:/g' "$f"
sed -i 's/存储过程测试失败:/Falha no teste de procedimento armazenado:/g' "$f"

sed -i 's/开始Oracle连接测试.../Iniciando teste de conexão Oracle.../g' "$f"
sed -i 's/Oracle连接结果:/Resultado da conexão Oracle:/g' "$f"
sed -i 's/Oracle连接测试失败:/Falha no teste de conexão Oracle:/g' "$f"

sed -i 's/开始Oracle查询测试.../Iniciando teste de consulta Oracle.../g' "$f"
sed -i 's/Oracle查询结果:/Resultado da consulta Oracle:/g' "$f"
sed -i 's/查询到 /Consultados /g' "$f"
sed -i 's/ 个表/ tabelas/g' "$f"
sed -i 's/Oracle查询测试失败:/Falha no teste de consulta Oracle:/g' "$f"

sed -i 's/开始Oracle数据同步测试.../Iniciando teste de sincronização de dados Oracle.../g' "$f"
sed -i 's/数据同步结果:/Resultado da sincronização:/g' "$f"
sed -i 's/数据同步测试失败:/Falha no teste de sincronização de dados:/g' "$f"

# Mensagens de inicialização
sed -i 's/数据库管理器测试页面已加载/Página de teste do gerenciador de banco de dados carregada/g' "$f"
sed -i 's/基础操作测试已准备就绪/Teste de operações básicas pronto/g' "$f"
sed -i 's/高级功能测试已准备就绪/Teste de recursos avançados pronto/g' "$f"
sed -i 's/Oracle集成测试已准备就绪/Teste de integração Oracle pronto/g' "$f"

echo "✅ database-test.html traduzido."
