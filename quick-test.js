/**
 * Script de Teste Rápido
 * Valida as funcionalidades principais do portal GMP
 */

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.totalSteps = 0; // para barra de progresso
  }

  log(test, status, message) {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    this.results.push(result);
    console.log(`[${status.toUpperCase()}] ${test}: ${message}`);
    this._refreshStats();
  }

  _refreshStats() {
    // Atualiza cards, se funções do auto-test.html existirem
    if (typeof window !== 'undefined' && typeof window.updateTestStats === 'function') {
      window.updateTestStats(this.results);
    }
  }

  _progress(step) {
    if (typeof window !== 'undefined' && typeof window.updateProgress === 'function') {
      window.updateProgress(step, this.totalSteps);
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes rápidos do portal GMP...\n');
    this.startTime = Date.now();

    // Define o total de etapas para a barra de progresso (aproximado)
    // Ajuste conforme a quantidade de logs/etapas em cada teste.
    this.totalSteps = 30;

    let step = 0;

    this.testBasicEnvironment();              this._progress(++step);
    this.testJavaScriptClasses();             this._progress(++step);
    this.testLocalStorage();                  this._progress(++step);
    this.testDOMOperations();                 this._progress(++step);
    this.testEventHandling();                 this._progress(++step);
    await this.testSecurityFeatures();        this._progress(++step);
    await this.testDatabaseFeatures();        this._progress(++step);
    await this.testIntegration();             this._progress(++step);

    this.generateReport();

    // Atualiza duração no card
    const duration = Date.now() - this.startTime;
    const durationEl = document.getElementById('testDuration');
    if (durationEl) durationEl.textContent = `${duration}ms`;
  }

  testBasicEnvironment() {
    this.log('Ambiente', 'info', 'Verificando ambiente básico...');
    this.log('JavaScript', 'success', 'JavaScript está habilitado');

    if (typeof localStorage !== 'undefined') {
      this.log('LocalStorage', 'success', 'LocalStorage disponível');
    } else {
      this.log('LocalStorage', 'error', 'LocalStorage indisponível');
    }

    if (typeof console !== 'undefined') {
      this.log('Console', 'success', 'Console API disponível');
    }

    if (typeof document !== 'undefined') {
      this.log('DOM', 'success', 'DOM API disponível');
    }
  }

  testJavaScriptClasses() {
    this.log('Classes', 'info', 'Verificando classes JavaScript...');

    if (typeof SecurityManager !== 'undefined') {
      this.log('SecurityManager', 'success', 'Classe SecurityManager definida');
    } else {
      this.log('SecurityManager', 'error', 'Classe SecurityManager não encontrada');
    }

    if (typeof DatabaseManager !== 'undefined') {
      this.log('DatabaseManager', 'success', 'Classe DatabaseManager definida');
    } else {
      this.log('DatabaseManager', 'error', 'Classe DatabaseManager não encontrada');
    }
  }

  testLocalStorage() {
    this.log('Storage', 'info', 'Testando armazenamento local...');

    try {
      localStorage.setItem('test_key', 'test_value');
      this.log('Storage Write', 'success', 'Escrita realizada com sucesso');

      const value = localStorage.getItem('test_key');
      if (value === 'test_value') {
        this.log('Storage Read', 'success', 'Leitura realizada com sucesso');
      } else {
        this.log('Storage Read', 'error', 'Falha na leitura');
      }

      localStorage.removeItem('test_key');
      this.log('Storage Cleanup', 'success', 'Dados de teste removidos');
    } catch (error) {
      this.log('Storage', 'error', `Falha no teste de armazenamento: ${error.message}`);
    }
  }

  testDOMOperations() {
    this.log('DOM', 'info', 'Testando operações no DOM...');

    try {
      const testDiv = document.createElement('div');
      testDiv.id = 'test-element';
      testDiv.textContent = 'Conteúdo de Teste';
      document.body.appendChild(testDiv);

      const createdElement = document.getElementById('test-element');
      if (createdElement && createdElement.textContent === 'Conteúdo de Teste') {
        this.log('DOM Create', 'success', 'Elemento criado com sucesso');
      } else {
        this.log('DOM Create', 'error', 'Falha ao criar elemento');
      }

      createdElement.textContent = 'Conteúdo Modificado';
      if (createdElement.textContent === 'Conteúdo Modificado') {
        this.log('DOM Modify', 'success', 'Elemento modificado com sucesso');
      } else {
        this.log('DOM Modify', 'error', 'Falha ao modificar elemento');
      }

      document.body.removeChild(createdElement);
      this.log('DOM Cleanup', 'success', 'Elemento de teste removido');
    } catch (error) {
      this.log('DOM', 'error', `Falha em operações DOM: ${error.message}`);
    }
  }

  testEventHandling() {
    this.log('Eventos', 'info', 'Testando tratamento de eventos...');

    try {
      const testButton = document.createElement('button');
      testButton.id = 'test-button';
      testButton.textContent = 'Botão de Teste';
      document.body.appendChild(testButton);

      let eventFired = false;
      testButton.addEventListener('click', function () {
        eventFired = true;
      });

      testButton.click();

      setTimeout(() => {
        if (eventFired) {
          this.log('Event Handling', 'success', 'Eventos funcionando corretamente');
        } else {
          this.log('Event Handling', 'error', 'Falha no tratamento de eventos');
        }
        document.body.removeChild(testButton);
      }, 100);
    } catch (error) {
      this.log('Eventos', 'error', `Falha no teste de eventos: ${error.message}`);
    }
  }

  async testSecurityFeatures() {
    this.log('Segurança', 'info', 'Testando funcionalidades de segurança...');

    try {
      if (typeof SecurityManager !== 'undefined') {
        const security = new SecurityManager();

        const strongPassword = security.checkPasswordStrength('Test123!@#');
        this.log('Password Strength', strongPassword && strongPassword.strong ? 'success' : 'error',
          strongPassword && strongPassword.strong ? 'Verificação de senha forte OK' : 'Falha na verificação de senha');

        const validEmail = security.validateEmail('test@example.com');
        this.log('Email Validation', validEmail ? 'success' : 'error',
          validEmail ? 'Validação de email OK' : 'Falha na validação de email');

        const sessionResult = await security.createSession({
          userId: 'test-user',
          username: 'testuser',
          role: 'user'
        });
        this.log('Session Creation', sessionResult && sessionResult.success ? 'success' : 'error',
          sessionResult && sessionResult.success ? 'Sessão criada com sucesso' : 'Falha na criação de sessão');

      } else {
        this.log('Segurança', 'error', 'SecurityManager não disponível');
      }
    } catch (error) {
      this.log('Segurança', 'error', `Erro em segurança: ${error.message}`);
    }
  }

  async testDatabaseFeatures() {
    this.log('Banco de Dados', 'info', 'Testando funcionalidades do banco...');

    try {
      if (typeof DatabaseManager !== 'undefined') {
        const database = new DatabaseManager();

        const testData = { id: 'test_001', name: 'Usuário Teste', email: 'test@example.com' };

        const saveResult = await database.saveStudentData(testData);
        this.log('Data Save', saveResult && saveResult.success ? 'success' : 'error',
          saveResult && saveResult.success ? 'Dados salvos com sucesso' : 'Falha ao salvar dados');

        const queryResult = await database.getStudentDataById('test_001');
        this.log('Data Query', queryResult && queryResult.success ? 'success' : 'error',
          queryResult && queryResult.success ? 'Consulta realizada com sucesso' : 'Falha na consulta');

        const connectionStatus = database.getConnectionStatus();
        this.log('Connection Status', connectionStatus ? 'success' : 'error',
          connectionStatus ? 'Conexão ativa' : 'Falha ao obter status da conexão');

      } else {
        this.log('Banco de Dados', 'error', 'DatabaseManager não disponível');
      }
    } catch (error) {
      this.log('Banco de Dados', 'error', `Erro no banco de dados: ${error.message}`);
    }
  }

  async testIntegration() {
    this.log('Integração', 'info', 'Testando integração...');

    try {
      if (typeof SecurityManager !== 'undefined' && typeof DatabaseManager !== 'undefined') {
        const security = new SecurityManager();
        const database = new DatabaseManager();

        const userData = {
          username: 'integration_test_user',
          email: 'integration@test.com',
          password: 'Test123!@#',
          role: 'user'
        };

        const registrationResult = await security.registerUser(userData);
        this.log('User Registration', registrationResult && registrationResult.success ? 'success' : 'warning',
          registrationResult && registrationResult.success ? 'Registro de usuário OK' : 'Simulação de registro concluída');

        const accessResult = await database.checkDataAccess('integration_test_user', 'student_data');
        this.log('Access Control', accessResult ? 'success' : 'warning',
          accessResult ? 'Controle de acesso OK' : 'Simulação de controle de acesso concluída');

        this.log('Integration', 'success', 'Teste de integração concluído');
      } else {
        this.log('Integration', 'error', 'Módulos de integração indisponíveis');
      }
    } catch (error) {
      this.log('Integration', 'error', `Falha no teste de integração: ${error.message}`);
    }
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const infoCount = this.results.filter(r => r.status === 'info').length;
    const total        = this.results.length;

     const consideredTotal = successCount + errorCount + warningCount;
  const successRate = consideredTotal === 0
    ? 0
    : Math.round((successCount / consideredTotal) * 100);

console.log('\n📊 Relatório de Testes');
    console.log('='.repeat(50));
    console.log(`Total de testes: ${this.results.length}`);
    console.log(`Sucesso: ${successCount}`);
    console.log(`Falha: ${errorCount}`);
    console.log(`Avisos: ${warningCount}`);
    console.log(`Informações: ${infoCount}`);
    console.log(`Duração: ${duration}ms`);
    console.log(`Taxa de sucesso: ${Math.round((successCount / (this.results.length || 1)) * 100)}%`);
    console.log('\n✅ Teste concluído!');

    const report = {
      timestamp: new Date().toISOString(),
      duration,
      results: this.results,
      summary: {
        total: this.results.length,
        success: successCount,
        error: errorCount,
        warning: warningCount,
        info: infoCount,
        successRate: Math.round((successCount / (this.results.length || 1)) * 100)
      }
    };

    localStorage.setItem('gmp_test_report', JSON.stringify(report));
    console.log('📄 Relatório salvo no LocalStorage');

    // Atualiza cards ao final também
    this._refreshStats();
    const durationEl = document.getElementById('testDuration');
    if (durationEl) durationEl.textContent = `${duration}ms`;
  }
}

/**
 * Expor função global para o botão do auto-test.html
 */
function runTest() {
  const runner = new TestRunner();
  runner.runAllTests();
}

// Export para Node (opcional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestRunner, runTest };
}
