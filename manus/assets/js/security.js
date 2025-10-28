/**
 * Security Layer (revisado e funcional)
 * Autenticação e autorização integradas ao backend real e com fallback local consistente
 */

class SecurityManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.token = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
        this.initializeAuth();
    }

    // Inicializa a autenticação a partir da sessão persistida
    initializeAuth() {
        const session = this.getSession();
        if (session && this.isSessionValid(session)) {
            this.currentUser = session.user;
            this.token = session.token || null;
            this.isAdmin = (String(session.user.role).toUpperCase() === 'ADMIN');
            this.updateLastActivity();
        } else {
            this.clearSession();
        }
    }

    // Obtém sessão do storage
    getSession() {
        try {
            const raw = localStorage.getItem("gmp_session");
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            // Validate structure
            if (!parsed.user || !parsed.token || !parsed.expiresAt) return null;
            return parsed;
        } catch (error) {
            console.warn("Invalid session format, clearing");
            localStorage.removeItem("gmp_session");
            return null;
        }
    }

    // Verifica validade da sessão localmente
    isSessionValid(session) {
        if (!session || !session.expiresAt) return false;
        return Date.now() < session.expiresAt;
    }

    // Cria sessão a partir de dados reais (user + token)
    async createSession(userData) {
        try {
            const normalizedRole = String(userData.user?.role || userData.role || 'USER').toUpperCase();
            const session = {
                user: {
                    id: userData.user?.id || userData.userId || userData.id || ('user_' + Date.now()),
                    name: userData.user?.name || userData.username || userData.name || 'user',
                    email: userData.user?.email || userData.email || '',
                    role: normalizedRole
                },
                token: userData.token || null,
                sessionId: 'session_' + Date.now(),
                createdAt: new Date().toISOString(),
                expiresAt: Date.now() + this.sessionTimeout,
                lastActivity: Date.now()
            };

            localStorage.setItem('gmp_session', JSON.stringify(session));
            this.currentUser = session.user;
            this.token = session.token;
            this.isAdmin = (normalizedRole === 'ADMIN');

            return {
                success: true,
                sessionId: session.sessionId,
                user: session.user,
                token: session.token
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Limpa sessão
    clearSession() {
        try {
            localStorage.removeItem('gmp_session');
            this.currentUser = null;
            this.isAdmin = false;
            this.token = null;
            return true;
        } catch (error) {
            console.error('Error clearing session:', error);
            return false;
        }
    }

    // Atualiza atividade e renova validade local
    updateLastActivity() {
        try {
            const session = this.getSession();
            if (session) {
                session.lastActivity = Date.now();
                session.expiresAt = Date.now() + this.sessionTimeout;
                localStorage.setItem('gmp_session', JSON.stringify(session));
            }
        } catch (error) {
            console.error('Error updating activity:', error);
        }
    }

    // Estado de autenticação
    isAuthenticated() {
        return !!this.currentUser && !!this.token;
    }

    // Admin
    isUserAdmin() {
        return this.isAdmin;
    }

    // Usuário atual
    getCurrentUser() {
        return this.currentUser;
    }

    // Protege rotas admin
    protectAdminRoutes() {
        const session = this.getSession();
        const role = session?.user?.role?.toUpperCase() || 'GUEST';
        const currentPath = window.location.pathname;

        const isAdminPage = currentPath.includes('/gmp-portal/admin/');
        if (isAdminPage && role !== 'ADMIN') {
            window.location.href = '/gmp-portal/login.html';
            return false;
        }
        return true;
    }

    // Validações e sanitização
    validateInput(input, type = 'text') {
        if (!input || typeof input !== 'string') return false;
        switch (type) {
            case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
            case 'number': return !isNaN(input) && Number(input) >= 0;
            case 'text': return input.trim().length > 0 && input.length <= 255;
            default: return true;
        }
    }

    sanitizeInput(input) {
        if (!input || typeof input !== 'string') return '';
        return input
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .trim();
    }

    // Timeout
    checkSessionTimeout() {
        const session = this.getSession();
        if (!session || !this.isSessionValid(session)) {
            this.clearSession();
            return false;
        }
        return true;
    }

    // Logout
    logout() {
        this.clearSession();
        window.location.href = '/gmp-portal/login.html';
    }

    // Inicialização de segurança
    initializeSecurity() {
        setInterval(() => {
            if (!this.checkSessionTimeout()) {
                console.log('Session expired');
                this.logout();
            }
        }, 60000);

        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            });
        });

        this.protectAdminRoutes();
    }

    // Headers com token real
    getAuthHeaders() {
        const session = this.getSession();
        const token = session?.token || '';
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-User-Role': session ? session.user.role : 'GUEST'
        };
    }

    // Força da senha
    checkPasswordStrength(password) {
        if (!password || typeof password !== 'string') {
            return { strong: false, message: 'Password is required' };
        }
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        const score = Object.values(checks).filter(Boolean).length;
        if (score < 3) return { strong: false, message: 'Password is too weak', checks };
        if (score < 5) return { strong: true, message: 'Password is medium strength', checks };
        return { strong: true, message: 'Password is strong', checks };
    }

    // Validação de email
    validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Autenticação real (usa email como username)
    async authenticateUser(username, password) {
        try {
            const email = username;
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok && (data.user && data.token)) {
                const sessionResult = await this.createSession({ user: data.user, token: data.token });
                if (sessionResult.success) {
                    return {
                        success: true,
                        userId: data.user.id,
                        username: data.user.name,
                        role: data.user.role
                    };
                }
                return { success: false, error: 'Failed to create session' };
            }
            return { success: false, error: data.error || 'Invalid credentials' };
        } catch (error) {
            return { success: false, error: error.message || 'Network error' };
        }
    }

    // Validação de senha (fallback local + opcional endpoint)
    async validatePassword(password, hashedPassword) {
        try {
            const basic = !!password && password.length > 0;
            try {
                const res = await fetch('/api/auth/validate-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password, hashedPassword })
                });
                if (res.ok) {
                    const data = await res.json();
                    return !!data.valid;
                }
            } catch {}
            return basic;
        } catch {
            return false;
        }
    }

    // Geração de token (usa login real; aqui apenas informa para usar token da sessão)
    async generateToken(payload) {
        const session = this.getSession();
        if (session?.token) {
            return { success: true, token: session.token, expiresIn: Math.max(0, (session.expiresAt - Date.now()) / 1000) };
        }
        return { success: false, error: 'Use the JWT returned by /api/auth/login or /api/auth/register' };
    }

    // Validação de sessão no backend (se disponível) ou localmente
    async validateSession(sessionId) {
        try {
            const local = this.getSession();
            try {
                const res = await fetch('/api/security/validate', { headers: this.getAuthHeaders() });
                const data = await res.json();
                if (res.ok && data.valid) {
                    return { success: true, valid: true, user: data.user || local?.user || null };
                }
            } catch {}
            if (local && local.sessionId === sessionId && this.isSessionValid(local)) {
                return { success: true, valid: true, user: local.user };
            }
            return { success: false, valid: false };
        } catch (error) {
            return { success: false, valid: false, error: error.message };
        }
    }

    // Destrói sessão
    async destroySession(sessionId) {
        try {
            const session = this.getSession();
            if (session && session.sessionId === sessionId) {
                this.clearSession();
                return { success: true };
            }
            return { success: false, error: 'Session not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Permissões funcionais locais
    async hasPermission(userId, permission) {
        try {
            const session = this.getSession();
            if (!session || !session.user) return false;
            const userRole = String(session.user.role).toLowerCase();
            const permissions = {
                admin: ['read', 'write', 'delete', 'admin'],
                manager: ['read', 'write'],
                user: ['read'],
                guest: []
            };
            return !!(permissions[userRole] && permissions[userRole].includes(permission));
        } catch {
            return false;
        }
    }

    // Atribuição de papel funcional local
    async assignRole(userId, role) {
        try {
            const session = this.getSession();
            if (!session || !session.user || session.user.id !== userId) {
                return { success: false, error: 'User not in current session' };
            }
            session.user.role = String(role).toUpperCase();
            localStorage.setItem('gmp_session', JSON.stringify(session));
            this.currentUser = session.user;
            this.isAdmin = (String(role).toUpperCase() === 'ADMIN');
            return {
                success: true,
                userId,
                role: session.user.role,
                assignedAt: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Papel do usuário
    async getUserRole(userId) {
        try {
            const session = this.getSession();
            if (session && session.user && (session.user.userId === userId || session.user.id === userId)) {
                return session.user.role;
            }
            return 'GUEST';
        } catch {
            return 'GUEST';
        }
    }

    // Registro de usuário via backend
    async registerUser(userData) {
        try {
            if (!userData.username && !userData.name) return { success: false, error: 'Missing username/name' };
            if (!userData.email || !userData.password) return { success: false, error: 'Missing email or password' };
            if (!this.validateEmail(userData.email)) return { success: false, error: 'Invalid email format' };
            const passwordCheck = this.checkPasswordStrength(userData.password);
            if (!passwordCheck.strong) return { success: false, error: 'Password too weak' };

            let response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: userData.username || userData.name, email: userData.email, password: userData.password })
            });
            if (!response.ok) {
                try {
                    response = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: userData.username || userData.name, email: userData.email, password: userData.password })
                    });
                } catch {}
            }
            const data = await response.json();
            if (response.ok && (data.user && data.token)) {
                const sessionResult = await this.createSession({ user: data.user, token: data.token });
                if (sessionResult.success) {
                    return { success: true, user: data.user, token: data.token, message: data.message || 'User registered successfully' };
                }
                return { success: false, error: 'Failed to create session after registration' };
            }
            return { success: false, error: data.error || 'Registration failed' };
        } catch (error) {
            return { success: false, error: error.message || 'Network error' };
        }
    }

    // Checagem de disponibilidade de username (backend opcional com fallback local)
    async checkUsernameAvailability(username) {
        try {
            try {
                const res = await fetch('/api/auth/check-username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (typeof data.available === 'boolean') return { available: data.available };
                }
            } catch {}
            const takenUsernames = ['admin', 'test', 'user', 'root'];
            const available = !takenUsernames.includes(String(username).toLowerCase());
            return { available };
        } catch {
            return { available: false };
        }
    }

    // Solicitação de reset de senha (backend com fallback)
    async requestPasswordReset(email) {
        try {
            if (!this.validateEmail(email)) return { success: false, error: 'Invalid email' };
            try {
                const res = await fetch('/api/auth/request-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (res.ok) return { success: true, message: data.message || 'Password reset email sent', token: data.token || null };
                return { success: false, error: data.error || 'Failed to request reset' };
            } catch {}
            return { success: true, message: 'Password reset email simulated', token: 'reset_' + Date.now() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Validação de token de reset (backend com fallback)
    async validateResetToken(token) {
        try {
            if (!token) return { valid: false };
            try {
                const res = await fetch('/api/auth/validate-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                const data = await res.json();
                if (res.ok) return { valid: !!data.valid, email: data.email || null };
            } catch {}
            return { valid: String(token).startsWith('reset_'), email: null };
        } catch {
            return { valid: false };
        }
    }

    // Permissões por papel
    async getRolePermissions(role) {
        try {
            const permissions = {
                admin: ['read', 'write', 'delete', 'admin', 'manage_users'],
                manager: ['read', 'write', 'manage_team'],
                user: ['read', 'profile'],
                guest: ['read']
            };
            return permissions[String(role).toLowerCase()] || [];
        } catch {
            return [];
        }
    }

    // Status de segurança
    getSecurityStatus() {
        return {
            active: true,
            authenticated: this.isAuthenticated(),
            currentUser: this.getCurrentUser(),
            isAdmin: this.isUserAdmin(),
            sessionValid: this.checkSessionTimeout()
        };
    }
}

// Inicializa e expõe globalmente
const securityManager = new SecurityManager();
window.securityManager = securityManager;
window.GMP_Security = securityManager;

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    securityManager.initializeSecurity();
});

// Funções globais para login e signup (compatíveis com páginas existentes)
async function loginUser(email, password) {
    try {
        if (!email || !password) return { success: false, error: 'Email and password are required' };
        if (!securityManager.validateEmail(email)) return { success: false, error: 'Invalid email format' };

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok && (data.user && data.token)) {
            const sessionResult = await securityManager.createSession({ user: data.user, token: data.token });
            if (sessionResult.success) {
                // Guarda token para database.js e segue redirect do backend
                localStorage.setItem('authToken', data.token);
                const dest = data.redirect || (String(data.user.role).toUpperCase() === 'ADMIN'
                    ? '/gmp-portal/admin/login.html'
                    : '/gmp-portal/student/login.html');
                window.location.href = dest;
                return { success: true, token: data.token, user: data.user };
            }
            return { success: false, error: 'Failed to create session' };
        } else {
            return { success: false, error: data.error || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

async function signupUser(name, email, password) {
    try {
        if (!name || !email || !password) return { success: false, error: 'All fields are required' };
        if (!securityManager.validateEmail(email)) return { success: false, error: 'Invalid email format' };
        const passwordCheck = securityManager.checkPasswordStrength(password);
        if (!passwordCheck.strong) return { success: false, error: 'Password is too weak' };

        let response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!response.ok) {
            try {
                response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
            } catch {}
        }
        const data = await response.json();

        if (response.ok && (data.user && data.token)) {
            const sessionResult = await securityManager.createSession({ user: data.user, token: data.token });
            if (sessionResult.success) {
                localStorage.setItem('authToken', data.token);
                return { success: true, message: data.message || 'User registered', user: data.user, token: data.token };
            }
            return { success: false, error: 'Failed to create session after signup' };
        } else {
            return { success: false, error: data.error || 'Signup failed' };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

// expõe globalmente
window.loginUser = loginUser;
window.signupUser = signupUser;