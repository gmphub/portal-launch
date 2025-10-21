/**
 * Security Layer
 * Handles authentication and authorization
 * Currently uses local storage, will integrate with Oracle later
 */

class SecurityManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.initializeAuth();
    }

    // Initialize authentication
    initializeAuth() {
        // Check for existing session
        const session = this.getSession();
        if (session && this.isSessionValid(session)) {
            this.currentUser = session.user;
            this.isAdmin = session.user.role === 'admin';
            this.updateLastActivity();
        } else {
            this.clearSession();
        }
    }

    // Get current session
    getSession() {
        try {
            const sessionData = localStorage.getItem('gmp_session');
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }

    // Check if session is valid
    isSessionValid(session) {
        if (!session || !session.expiresAt) return false;
        return new Date().getTime() < session.expiresAt;
    }

    // Create session (for demo purposes)
    createSession(userData) {
        try {
            const session = {
                user: {
                    id: userData.id || 'student_001',
                    name: userData.name || 'João Silva',
                    email: userData.email || 'joao.silva@email.com',
                    role: userData.role || 'student'
                },
                createdAt: new Date().toISOString(),
                expiresAt: new Date().getTime() + this.sessionTimeout,
                lastActivity: new Date().getTime()
            };

            localStorage.setItem('gmp_session', JSON.stringify(session));
            this.currentUser = session.user;
            this.isAdmin = session.user.role === 'admin';
            
            return true;
        } catch (error) {
            console.error('Error creating session:', error);
            return false;
        }
    }

    // Clear session
    clearSession() {
        try {
            localStorage.removeItem('gmp_session');
            this.currentUser = null;
            this.isAdmin = false;
            return true;
        } catch (error) {
            console.error('Error clearing session:', error);
            return false;
        }
    }

    // Update last activity
    updateLastActivity() {
        try {
            const session = this.getSession();
            if (session) {
                session.lastActivity = new Date().getTime();
                session.expiresAt = new Date().getTime() + this.sessionTimeout;
                localStorage.setItem('gmp_session', JSON.stringify(session));
            }
        } catch (error) {
            console.error('Error updating activity:', error);
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check if user is admin
    isUserAdmin() {
        return this.isAdmin;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Protect admin routes
    protectAdminRoutes() {
        const currentPath = window.location.pathname;
        
        // Check if trying to access admin folder
        if (currentPath.includes('/admin/')) {
            if (!this.isUserAdmin()) {
                // Redirect to access denied or home
                window.location.href = '/gmp-portal/access-denied.html';
                return false;
            }
        }
        return true;
    }

    // Validate user input
    validateInput(input, type = 'text') {
        if (!input || typeof input !== 'string') return false;
        
        switch (type) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
            case 'number':
                return !isNaN(input) && input >= 0;
            case 'text':
                return input.trim().length > 0 && input.length <= 255;
            default:
                return true;
        }
    }

    // Sanitize input
    sanitizeInput(input) {
        if (!input || typeof input !== 'string') return '';
        
        // Basic HTML sanitization
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .trim();
    }

    // Check session timeout
    checkSessionTimeout() {
        const session = this.getSession();
        if (!session || !this.isSessionValid(session)) {
            this.clearSession();
            return false;
        }
        return true;
    }

    // Logout user
    logout() {
        this.clearSession();
        window.location.href = '/gmp-portal/index.html';
    }

    // Initialize security checks
    initializeSecurity() {
        // Check session timeout every minute
        setInterval(() => {
            if (!this.checkSessionTimeout()) {
                console.log('Session expired');
                this.logout();
            }
        }, 60000);

        // Update activity on user interaction
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            });
        });

        // Protect admin routes
        this.protectAdminRoutes();
    }

    // Get authentication headers for API calls
    getAuthHeaders() {
        const session = this.getSession();
        return {
            'Content-Type': 'application/json',
            'Authorization': session ? `Bearer ${session.user.id}` : '',
            'X-User-Role': session ? session.user.role : 'guest'
        };
    }

    // Check password strength
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
        
        if (score < 3) {
            return { strong: false, message: 'Password is too weak', checks };
        } else if (score < 5) {
            return { strong: true, message: 'Password is medium strength', checks };
        } else {
            return { strong: true, message: 'Password is strong', checks };
        }
    }

    // Validate email
    validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Authenticate user
    async authenticateUser(username, password) {
        try {
            // Simulate authentication (in real app, this would call API)
            if (username && password) {
                const userData = {
                    id: 'user_' + Date.now(),
                    username: username,
                    role: username.includes('admin') ? 'admin' : 'user'
                };
                
                const sessionCreated = this.createSession(userData);
                return {
                    success: sessionCreated,
                    userId: userData.id,
                    username: userData.username,
                    role: userData.role
                };
            }
            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Validate password
    async validatePassword(password, hashedPassword) {
        try {
            // Simulate password validation (in real app, this would use bcrypt)
            return password && password.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Generate token
    async generateToken(payload) {
        try {
            // Simulate JWT token generation (in real app, this would use JWT library)
            const token = btoa(JSON.stringify({
                ...payload,
                exp: Date.now() + 3600000, // 1 hour
                iat: Date.now()
            }));
            
            return {
                success: true,
                token: token,
                expiresIn: 3600
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Create session with return object
    async createSession(userData) {
        try {
            const session = {
                user: {
                    userId: userData.userId || userData.id || 'user_' + Date.now(),
                    username: userData.username || 'user',
                    role: userData.role || 'user'
                },
                sessionId: 'session_' + Date.now(),
                createdAt: new Date().toISOString(),
                expiresAt: new Date().getTime() + this.sessionTimeout
            };

            localStorage.setItem('gmp_session', JSON.stringify(session));
            this.currentUser = session.user;
            this.isAdmin = session.user.role === 'admin';
            
            return {
                success: true,
                sessionId: session.sessionId,
                user: session.user
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Validate session
    async validateSession(sessionId) {
        try {
            const session = this.getSession();
            if (session && session.sessionId === sessionId && this.isSessionValid(session)) {
                return {
                    success: true,
                    valid: true,
                    user: session.user
                };
            }
            return { success: false, valid: false };
        } catch (error) {
            return { success: false, valid: false, error: error.message };
        }
    }

    // Destroy session
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

    // Check permission
    async hasPermission(userId, permission) {
        try {
            const session = this.getSession();
            if (!session || !session.user) return false;
            
            const userRole = session.user.role;
            const permissions = {
                admin: ['read', 'write', 'delete', 'admin'],
                manager: ['read', 'write'],
                user: ['read'],
                guest: []
            };
            
            return permissions[userRole] && permissions[userRole].includes(permission);
        } catch (error) {
            return false;
        }
    }

    // Assign role
    async assignRole(userId, role) {
        try {
            // Simulate role assignment (in real app, this would call API)
            return {
                success: true,
                userId: userId,
                role: role,
                assignedAt: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get user role
    async getUserRole(userId) {
        try {
            const session = this.getSession();
            if (session && session.user && session.user.userId === userId) {
                return session.user.role;
            }
            return 'guest';
        } catch (error) {
            return 'guest';
        }
    }

    // Register user
    async registerUser(userData) {
        try {
            // Validate input
            if (!userData.username || !userData.email || !userData.password) {
                return { success: false, error: 'Missing required fields' };
            }

            // Validate email
            if (!this.validateEmail(userData.email)) {
                return { success: false, error: 'Invalid email format' };
            }

            // Check password strength
            const passwordCheck = this.checkPasswordStrength(userData.password);
            if (!passwordCheck.strong) {
                return { success: false, error: 'Password too weak' };
            }

            // Simulate user registration (in real app, this would call API)
            const newUser = {
                id: 'user_' + Date.now(),
                username: userData.username,
                email: userData.email,
                role: userData.role || 'user',
                createdAt: new Date().toISOString()
            };

            return {
                success: true,
                user: newUser,
                message: 'User registered successfully'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Check username availability
    async checkUsernameAvailability(username) {
        try {
            // Simulate username check (in real app, this would call API)
            // For demo, assume common usernames are taken
            const takenUsernames = ['admin', 'test', 'user', 'root'];
            const available = !takenUsernames.includes(username.toLowerCase());
            
            return { available };
        } catch (error) {
            return { available: false };
        }
    }

    // Request password reset
    async requestPasswordReset(email) {
        try {
            // Simulate password reset request (in real app, this would send email)
            if (this.validateEmail(email)) {
                return {
                    success: true,
                    message: 'Password reset email sent',
                    token: 'reset_' + Date.now()
                };
            }
            return { success: false, error: 'Invalid email' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Validate reset token
    async validateResetToken(token) {
        try {
            // Simulate token validation (in real app, this would check database)
            return {
                valid: token && token.startsWith('reset_'),
                email: 'user@example.com'
            };
        } catch (error) {
            return { valid: false };
        }
    }

    // Get role permissions
    async getRolePermissions(role) {
        try {
            const permissions = {
                admin: ['read', 'write', 'delete', 'admin', 'manage_users'],
                manager: ['read', 'write', 'manage_team'],
                user: ['read', 'profile'],
                guest: ['read']
            };
            
            return permissions[role] || [];
        } catch (error) {
            return [];
        }
    }

    // Get security status
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

// Initialize security manager
const securityManager = new SecurityManager();

// Make available globally
window.securityManager = securityManager;
window.GMP_Security = securityManager;

// Initialize security when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    securityManager.initializeSecurity();
});

// Global authentication functions for login.html
async function loginUser(email, password) {
    try {
        // Validate input
        if (!email || !password) {
            return { success: false, error: 'Email and password are required' };
        }

        if (!securityManager.validateEmail(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        // Simulate API call (replace with real API call)
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Create session using security manager
            const sessionResult = await securityManager.createSession({
                userId: data.user.id,
                username: data.user.name,
                email: data.user.email,
                role: data.user.role
            });

            if (sessionResult.success) {
                return {
                    success: true,
                    token: data.token,
                    user: data.user
                };
            } else {
                return { success: false, error: 'Failed to create session' };
            }
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
        // Validate input
        if (!name || !email || !password) {
            return { success: false, error: 'All fields are required' };
        }

        if (!securityManager.validateEmail(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        const passwordCheck = securityManager.checkPasswordStrength(password);
        if (!passwordCheck.strong) {
            return { success: false, error: 'Password is too weak' };
        }

        // Simulate API call (replace with real API call)
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.error || 'Signup failed' };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

// Make functions globally available
window.loginUser = loginUser;
window.signupUser = signupUser;