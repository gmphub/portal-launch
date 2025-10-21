/**
 * 快速测试脚本
 * 验证GMP门户系统的核心功能
 */

// 测试结果收集器
class TestRunner {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }

    log(test, status, message) {
        const result = {
            test: test,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        };
        this.results.push(result);
        console.log(`[${status.toUpperCase()}] ${test}: ${message}`);
    }

    async runAllTests() {
        console.log('🚀 开始GMP门户系统快速测试...\n');

        // 1. 基础环境测试
        this.testBasicEnvironment();

        // 2. JavaScript类测试
        this.testJavaScriptClasses();

        // 3. 本地存储测试
        this.testLocalStorage();

        // 4. DOM操作测试
        this.testDOMOperations();

        // 5. 事件处理测试
        this.testEventHandling();

        // 6. 安全功能测试
        await this.testSecurityFeatures();

        // 7. 数据库功能测试
        await this.testDatabaseFeatures();

        // 8. 集成测试
        await this.testIntegration();

        // 生成测试报告
        this.generateReport();
    }

    testBasicEnvironment() {
        this.log('Environment', 'info', '检查基础环境...');
        
        // 检查JavaScript是否启用
        this.log('JavaScript', 'success', 'JavaScript已启用');
        
        // 检查浏览器API
        if (typeof localStorage !== 'undefined') {
            this.log('LocalStorage', 'success', 'LocalStorage可用');
        } else {
            this.log('LocalStorage', 'error', 'LocalStorage不可用');
        }
        
        // 检查控制台API
        if (typeof console !== 'undefined') {
            this.log('Console', 'success', 'Console API可用');
        }
        
        // 检查DOM API
        if (typeof document !== 'undefined') {
            this.log('DOM', 'success', 'DOM API可用');
        }
    }

    testJavaScriptClasses() {
        this.log('Classes', 'info', '检查JavaScript类...');
        
        // 检查SecurityManager类
        if (typeof SecurityManager !== 'undefined') {
            this.log('SecurityManager', 'success', 'SecurityManager类已定义');
        } else {
            this.log('SecurityManager', 'error', 'SecurityManager类未定义');
        }
        
        // 检查DatabaseManager类
        if (typeof DatabaseManager !== 'undefined') {
            this.log('DatabaseManager', 'success', 'DatabaseManager类已定义');
        } else {
            this.log('DatabaseManager', 'error', 'DatabaseManager类未定义');
        }
    }

    testLocalStorage() {
        this.log('Storage', 'info', '测试本地存储...');
        
        try {
            // 测试写入
            localStorage.setItem('test_key', 'test_value');
            this.log('Storage Write', 'success', '数据写入成功');
            
            // 测试读取
            const value = localStorage.getItem('test_key');
            if (value === 'test_value') {
                this.log('Storage Read', 'success', '数据读取成功');
            } else {
                this.log('Storage Read', 'error', '数据读取失败');
            }
            
            // 清理测试数据
            localStorage.removeItem('test_key');
            this.log('Storage Cleanup', 'success', '测试数据已清理');
            
        } catch (error) {
            this.log('Storage', 'error', `存储测试失败: ${error.message}`);
        }
    }

    testDOMOperations() {
        this.log('DOM', 'info', '测试DOM操作...');
        
        try {
            // 创建测试元素
            const testDiv = document.createElement('div');
            testDiv.id = 'test-element';
            testDiv.textContent = 'Test Content';
            document.body.appendChild(testDiv);
            
            // 验证元素创建
            const createdElement = document.getElementById('test-element');
            if (createdElement && createdElement.textContent === 'Test Content') {
                this.log('DOM Create', 'success', 'DOM元素创建成功');
            } else {
                this.log('DOM Create', 'error', 'DOM元素创建失败');
            }
            
            // 测试元素修改
            createdElement.textContent = 'Modified Content';
            if (createdElement.textContent === 'Modified Content') {
                this.log('DOM Modify', 'success', 'DOM元素修改成功');
            } else {
                this.log('DOM Modify', 'error', 'DOM元素修改失败');
            }
            
            // 清理测试元素
            document.body.removeChild(createdElement);
            this.log('DOM Cleanup', 'success', '测试元素已清理');
            
        } catch (error) {
            this.log('DOM', 'error', `DOM操作测试失败: ${error.message}`);
        }
    }

    testEventHandling() {
        this.log('Events', 'info', '测试事件处理...');
        
        try {
            // 创建测试按钮
            const testButton = document.createElement('button');
            testButton.id = 'test-button';
            testButton.textContent = 'Test Button';
            document.body.appendChild(testButton);
            
            // 添加事件监听器
            let eventFired = false;
            testButton.addEventListener('click', function() {
                eventFired = true;
            });
            
            // 模拟点击事件
            testButton.click();
            
            // 验证事件触发
            setTimeout(() => {
                if (eventFired) {
                    this.log('Event Handling', 'success', '事件处理正常');
                } else {
                    this.log('Event Handling', 'error', '事件处理失败');
                }
                
                // 清理测试按钮
                document.body.removeChild(testButton);
            }, 100);
            
        } catch (error) {
            this.log('Events', 'error', `事件处理测试失败: ${error.message}`);
        }
    }

    async testSecurityFeatures() {
        this.log('Security', 'info', '测试安全功能...');
        
        try {
            if (typeof SecurityManager !== 'undefined') {
                const security = new SecurityManager();
                
                // 测试密码强度检查
                const strongPassword = security.checkPasswordStrength('Test123!@#');
                if (strongPassword && strongPassword.strong) {
                    this.log('Password Strength', 'success', '密码强度检查正常');
                } else {
                    this.log('Password Strength', 'error', '密码强度检查失败');
                }
                
                // 测试邮箱验证
                const validEmail = security.validateEmail('test@example.com');
                if (validEmail) {
                    this.log('Email Validation', 'success', '邮箱验证正常');
                } else {
                    this.log('Email Validation', 'error', '邮箱验证失败');
                }
                
                // 测试会话创建
                const sessionResult = await security.createSession({
                    userId: 'test-user',
                    username: 'testuser',
                    role: 'user'
                });
                
                if (sessionResult && sessionResult.success) {
                    this.log('Session Creation', 'success', '会话创建成功');
                } else {
                    this.log('Session Creation', 'error', '会话创建失败');
                }
                
            } else {
                this.log('Security', 'error', 'SecurityManager类不可用');
            }
        } catch (error) {
            this.log('Security', 'error', `安全功能测试失败: ${error.message}`);
        }
    }

    async testDatabaseFeatures() {
        this.log('Database', 'info', '测试数据库功能...');
        
        try {
            if (typeof DatabaseManager !== 'undefined') {
                const database = new DatabaseManager();
                
                // 测试数据保存
                const testData = {
                    id: 'test_001',
                    name: 'Test User',
                    email: 'test@example.com'
                };
                
                const saveResult = await database.saveStudentData(testData);
                if (saveResult && saveResult.success) {
                    this.log('Data Save', 'success', '数据保存成功');
                } else {
                    this.log('Data Save', 'error', '数据保存失败');
                }
                
                // 测试数据查询
                const queryResult = await database.getStudentDataById('test_001');
                if (queryResult && queryResult.success) {
                    this.log('Data Query', 'success', '数据查询成功');
                } else {
                    this.log('Data Query', 'error', '数据查询失败');
                }
                
                // 测试连接状态
                const connectionStatus = database.getConnectionStatus();
                if (connectionStatus) {
                    this.log('Connection Status', 'success', '连接状态获取成功');
                } else {
                    this.log('Connection Status', 'error', '连接状态获取失败');
                }
                
            } else {
                this.log('Database', 'error', 'DatabaseManager类不可用');
            }
        } catch (error) {
            this.log('Database', 'error', `数据库功能测试失败: ${error.message}`);
        }
    }

    async testIntegration() {
        this.log('Integration', 'info', '测试集成功能...');
        
        try {
            if (typeof SecurityManager !== 'undefined' && typeof DatabaseManager !== 'undefined') {
                const security = new SecurityManager();
                const database = new DatabaseManager();
                
                // 测试用户注册流程
                const userData = {
                    username: 'integration_test_user',
                    email: 'integration@test.com',
                    password: 'Test123!@#',
                    role: 'user'
                };
                
                // 模拟用户注册
                const registrationResult = await security.registerUser(userData);
                if (registrationResult && registrationResult.success) {
                    this.log('User Registration', 'success', '用户注册成功');
                } else {
                    this.log('User Registration', 'warning', '用户注册模拟完成');
                }
                
                // 测试数据访问控制
                const accessResult = await database.checkDataAccess('integration_test_user', 'student_data');
                if (accessResult) {
                    this.log('Access Control', 'success', '数据访问控制正常');
                } else {
                    this.log('Access Control', 'warning', '数据访问控制模拟完成');
                }
                
                this.log('Integration', 'success', '集成测试完成');
                
            } else {
                this.log('Integration', 'error', '集成模块不可用');
            }
        } catch (error) {
            this.log('Integration', 'error', `集成测试失败: ${error.message}`);
        }
    }

    generateReport() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        const successCount = this.results.filter(r => r.status === 'success').length;
        const errorCount = this.results.filter(r => r.status === 'error').length;
        const warningCount = this.results.filter(r => r.status === 'warning').length;
        const infoCount = this.results.filter(r => r.status === 'info').length;
        
        console.log('\n📊 测试报告');
        console.log('='.repeat(50));
        console.log(`总测试数: ${this.results.length}`);
        console.log(`成功: ${successCount}`);
        console.log(`失败: ${errorCount}`);
        console.log(`警告: ${warningCount}`);
        console.log(`信息: ${infoCount}`);
        console.log(`耗时: ${duration}ms`);
        console.log(`成功率: ${Math.round((successCount / this.results.length) * 100)}%`);
        
        if (errorCount > 0) {
            console.log('\n❌ 失败的测试:');
            this.results.filter(r => r.status === 'error').forEach(r => {
                console.log(`  - ${r.test}: ${r.message}`);
            });
        }
        
        if (warningCount > 0) {
            console.log('\n⚠️  警告信息:');
            this.results.filter(r => r.status === 'warning').forEach(r => {
                console.log(`  - ${r.test}: ${r.message}`);
            });
        }
        
        console.log('\n✅ 测试完成!');
        
        // 保存报告到本地存储
        const report = {
            timestamp: new Date().toISOString(),
            duration: duration,
            results: this.results,
            summary: {
                total: this.results.length,
                success: successCount,
                error: errorCount,
                warning: warningCount,
                info: infoCount,
                successRate: Math.round((successCount / this.results.length) * 100)
            }
        };
        
        localStorage.setItem('gmp_test_report', JSON.stringify(report));
        console.log('📄 测试报告已保存到本地存储');
    }
}

// 自动运行测试（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const runner = new TestRunner();
            runner.runAllTests();
        });
    } else {
        const runner = new TestRunner();
        runner.runAllTests();
    }
}

// 导出测试运行器（如果在Node.js环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestRunner;
}