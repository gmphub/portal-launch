#!/bin/bash
set -e
f="/home/ubuntu/gmp-portal/security-test.html"

# Head e títulos
sed -i 's/lang="zh-CN"/lang="pt-BR"/g' "$f"
sed -i 's/安全管理器测试/Teste do Gerenciador de Segurança/g' "$f"
sed -i 's/基础功能测试/Teste de funcionalidades básicas/g' "$f"
sed -i 's/会话管理测试/Teste de gestão de sessão/g' "$f"
sed -i 's/权限管理测试/Teste de gestão de permissões/g' "$f"

# Botões
sed -i 's/测试基础认证/Testar autenticação básica/g' "$f"
sed -i 's/测试密码验证/Testar validação de senha/g' "$f"
sed -i 's/测试令牌生成/Testar geração de token/g' "$f"
sed -i 's/创建会话/Criar sessão/g' "$f"
sed -i 's/验证会话/Validar sessão/g' "$f"
sed -i 's/销毁会话/Destruir sessão/g' "$f"
sed -i 's/检查权限/Verificar permissões/g' "$f"
sed -i 's/角色分配/Atribuir papel/g' "$f"

# Logs
sed -i 's/开始基础认证测试.../Iniciando teste de autenticação básica.../g' "$f"
sed -i 's/用户认证结果:/Resultado da autenticação de usuário:/g' "$f"
sed -i 's/密码验证结果:/Resultado da validação de senha:/g' "$f"
sed -i 's/基础认证测试失败:/Falha no teste de autenticação básica:/g' "$f"

sed -i 's/开始密码验证测试.../Iniciando teste de validação de senha.../g' "$f"
sed -i 's/密码强度检查:/Verificação de força de senha:/g' "$f"
sed -i 's/弱密码检查:/Verificação de senha fraca:/g' "$f"
sed -i 's/密码验证测试失败:/Falha no teste de validação de senha:/g' "$f"

sed -i 's/开始令牌生成测试.../Iniciando teste de geração de token.../g' "$f"
sed -i 's/令牌生成结果:/Resultado da geração de token:/g' "$f"
sed -i 's/生成的令牌:/Token gerado:/g' "$f"
sed -i 's/令牌生成测试失败:/Falha no teste de geração de token:/g' "$f"

sed -i 's/开始会话创建测试.../Iniciando teste de criação de sessão.../g' "$f"
sed -i 's/会话创建结果:/Resultado da criação de sessão:/g' "$f"
sed -i 's/会话创建测试失败:/Falha no teste de criação de sessão:/g' "$f"

sed -i 's/开始会话验证测试.../Iniciando teste de validação de sessão.../g' "$f"
sed -i 's/会话验证结果:/Resultado da validação de sessão:/g' "$f"
sed -i 's/会话验证测试失败:/Falha no teste de validação de sessão:/g' "$f"
sed -i 's/无法创建会话进行验证/Não foi possível criar sessão para validação/g' "$f"

sed -i 's/开始会话销毁测试.../Iniciando teste de destruição de sessão.../g' "$f"
sed -i 's/会话销毁结果:/Resultado da destruição de sessão:/g' "$f"
sed -i 's/会话销毁测试失败:/Falha no teste de destruição de sessão:/g' "$f"
sed -i 's/无法创建会话进行销毁/Não foi possível criar sessão para destruição/g' "$f"

sed -i 's/开始权限检查测试.../Iniciando teste de verificação de permissões.../g' "$f"
sed -i 's/权限 '\''/Permissão '\''/g' "$f"
sed -i 's/'\'' 检查结果:/'\'' resultado da verificação:/g' "$f"
sed -i 's/权限检查测试失败:/Falha no teste de verificação de permissões:/g' "$f"

sed -i 's/开始角色分配测试.../Iniciando teste de atribuição de papel.../g' "$f"
sed -i 's/角色分配结果:/Resultado da atribuição de papel:/g' "$f"
sed -i 's/用户角色:/Papel do usuário:/g' "$f"
sed -i 's/角色分配测试失败:/Falha no teste de atribuição de papel:/g' "$f"

# Init
sed -i 's/安全管理器测试页面已加载/Página de teste do gerenciador de segurança carregada/g' "$f"
sed -i 's/会话管理测试已准备就绪/Teste de gestão de sessão pronto/g' "$f"
sed -i 's/权限管理测试已准备就绪/Teste de gestão de permissões pronto/g' "$f"

echo "✅ security-test.html traduzido."
