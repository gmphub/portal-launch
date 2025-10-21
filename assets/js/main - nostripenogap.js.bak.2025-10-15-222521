console.log('main.js loaded - comprehensive fix version');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Set dark mode as default if no theme is saved
    if (!localStorage.getItem('dark-theme')) {
        localStorage.setItem('dark-theme', 'true');
    }
    
    initSidebar();
    initThemeToggle();
    initGMDropdown();
    initSubmenuToggles();
    initSmartNavigation();
});

function initSidebar() {
    console.log('Initializing sidebar...');
    
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const header = document.getElementById('header');
    const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');

    console.log('Sidebar elements:', {
        menuToggle: !!menuToggle,
        sidebar: !!sidebar,
        header: !!header,
        mainContent: !!mainContent
    });

    if (!menuToggle || !sidebar || !header || !mainContent) {
        console.error('Missing sidebar elements');
        return;
    }

    // Remove any existing event listeners by cloning
    const newMenuToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);
    
    // Update references to use the new element
    const updatedMenuToggle = document.getElementById('menuToggle');

    updatedMenuToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Menu toggle clicked');
        
        sidebar.classList.toggle('collapsed');
        header.classList.toggle('sidebar-collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
        
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed);
        
        console.log('Sidebar toggled, collapsed:', isCollapsed);
    });

    // Load saved state
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
        header.classList.add('sidebar-collapsed');
        mainContent.classList.add('sidebar-collapsed');
        console.log('Restored collapsed sidebar state');
    }
}

function initThemeToggle() {
    console.log('Initializing theme toggle...');
    
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    console.log('Theme elements:', {
        themeToggle: !!themeToggle,
        themeIcon: !!themeIcon
    });

    if (!themeToggle || !themeIcon) {
        console.error('Missing theme elements');
        return;
    }

    // Remove any existing event listeners
    const newThemeToggle = themeToggle.cloneNode(true);
    themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);

    const newThemeIcon = themeIcon.cloneNode(true);
    themeIcon.parentNode.replaceChild(newThemeIcon, themeIcon);
    
    // Get updated references
    const updatedThemeToggle = document.getElementById('themeToggle');
    const updatedThemeIcon = document.getElementById('themeIcon');

    updatedThemeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Theme toggle clicked');
        
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            updatedThemeIcon.classList.remove('fa-sun');
            updatedThemeIcon.classList.add('fa-moon');
        } else {
            updatedThemeIcon.classList.remove('fa-moon');
            updatedThemeIcon.classList.add('fa-sun');
        }
        
        const isDarkTheme = document.body.classList.contains('dark-theme');
        localStorage.setItem('dark-theme', isDarkTheme);
        
        console.log('Theme toggled, dark mode:', isDarkTheme);
    });

    // Load saved theme (default to dark)
    const savedTheme = localStorage.getItem('dark-theme');
    if (savedTheme === 'true' || savedTheme === null) {
        document.body.classList.add('dark-theme');
        updatedThemeIcon.classList.remove('fa-sun');
        updatedThemeIcon.classList.add('fa-moon');
        console.log('Set dark theme (default)');
    } else {
        // Light theme only if explicitly set
        document.body.classList.remove('dark-theme');
        updatedThemeIcon.classList.remove('fa-moon');
        updatedThemeIcon.classList.add('fa-sun');
        console.log('Set light theme');
    }
}

function initGMDropdown() {
    console.log('Initializing GM dropdown...');
    
    const gmIcon = document.getElementById('gmIcon');
    const gmDropdown = document.querySelector('.gm-dropdown');

    console.log('GM elements:', {
        gmIcon: !!gmIcon,
        gmDropdown: !!gmDropdown
    });

    if (!gmIcon || !gmDropdown) {
        console.error('Missing GM dropdown elements');
        return;
    }

    // Remove any existing event listeners
    const newGmIcon = gmIcon.cloneNode(true);
    gmIcon.parentNode.replaceChild(newGmIcon, gmIcon);

    newGmIcon.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('GM icon clicked');
        
        gmDropdown.classList.toggle('show');
        
        console.log('GM dropdown toggled, visible:', gmDropdown.classList.contains('show'));
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!newGmIcon.contains(e.target) && !gmDropdown.contains(e.target)) {
            gmDropdown.classList.remove('show');
        }
    });
}

function initSmartNavigation() {
    console.log('Initializing smart navigation...');
    
    // Wait for DOM to be fully loaded
    setTimeout(function() {
        const containers = document.querySelectorAll('.nav-tabs-container');
        
        containers.forEach(function(container) {
            const tabs = Array.from(container.querySelectorAll('.nav-tab'));
            console.log(`Found ${tabs.length} tabs in navigation`);
            
            if (tabs.length <= 5) {
                console.log('5 or fewer tabs, showing all normally');
                return;
            }
            
            console.log('More than 5 tabs, creating dropdown');
            
            // Clear container
            container.innerHTML = '';
            
            // Add first 5 tabs
            for (let i = 0; i < 5; i++) {
                container.appendChild(tabs[i].cloneNode(true));
            }
            
            // Create More dropdown
            const moreWrapper = document.createElement('div');
            moreWrapper.style.cssText = 'position: relative; display: inline-block;';
            
            const moreBtn = document.createElement('button');
            moreBtn.className = 'nav-tab';
            moreBtn.style.cssText = 'background: none; border: none; cursor: pointer; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 8px;';
            moreBtn.innerHTML = 'Mais <i class="fas fa-chevron-down"></i>';
            
            const dropdown = document.createElement('div');
            const isDarkTheme = document.body.classList.contains('dark-theme');
            dropdown.className = 'nav-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                background: ${isDarkTheme ? '#2c3e50' : 'white'};
                border: 1px solid ${isDarkTheme ? '#34495e' : '#e2e6ea'};
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.25);
                min-width: 220px;
                z-index: 99999;
                display: none;
                padding: 12px 0;
                color: ${isDarkTheme ? '#ecf0f1' : '#2c3e50'};
                transform: translateY(-8px);
                opacity: 0;
                transition: all 0.2s ease;
                margin-top: 8px;
            `;
            
            console.log('Dropdown created with positioning: left: 0, top: calc(100% + 4px)');
            
            // Add remaining tabs to dropdown
            for (let i = 5; i < tabs.length; i++) {
                const dropdownTab = tabs[i].cloneNode(true);
                dropdownTab.className = 'dropdown-nav-item';
                dropdownTab.style.cssText = `
                    display: block; 
                    padding: 12px 20px; 
                    text-decoration: none; 
                    color: inherit; 
                    border-radius: 8px;
                    margin: 4px 8px;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                    font-weight: 500;
                    border-bottom: none;
                `;
                
                // Add hover effect
                dropdownTab.addEventListener('mouseover', function() {
                    this.style.backgroundColor = isDarkTheme ? '#3a526b' : '#f8f9fa';
                });
                dropdownTab.addEventListener('mouseout', function() {
                    this.style.backgroundColor = 'transparent';
                });
                
                dropdown.appendChild(dropdownTab);
            }
            
            // Add event listeners
            moreBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const isVisible = dropdown.style.display === 'block';
                
                if (isVisible) {
                    // Hide dropdown with animation
                    dropdown.style.transform = 'translateY(-8px)';
                    dropdown.style.opacity = '0';
                    setTimeout(() => {
                        dropdown.style.display = 'none';
                    }, 200);
                } else {
                    // Show dropdown with animation (position is handled by CSS)
                    dropdown.style.display = 'block';
                    setTimeout(() => {
                        dropdown.style.transform = 'translateY(0)';
                        dropdown.style.opacity = '1';
                    }, 10);
                }
                
                console.log('Dropdown toggled:', !isVisible, 'Position calculated from button');
            });
            
            // Close on outside click
            document.addEventListener('click', function(e) {
                if (!moreWrapper.contains(e.target)) {
                    dropdown.style.transform = 'translateY(-8px)';
                    dropdown.style.opacity = '0';
                    setTimeout(() => {
                        dropdown.style.display = 'none';
                    }, 200);
                }
            });
            
            // Assemble
            moreWrapper.appendChild(moreBtn);
            moreWrapper.appendChild(dropdown);
            container.appendChild(moreWrapper);
            
            console.log(`Smart navigation created: 5 visible + ${tabs.length - 5} in dropdown`);
        });
    }, 100);
}

function initSubmenuToggles() {
    console.log('Initializing submenu toggles...');
    
    const submenuToggles = document.querySelectorAll('.nav-item.has-submenu');
    const sidebar = document.getElementById('sidebar');
    
    console.log('Found submenu toggles:', submenuToggles.length);

    submenuToggles.forEach(function(toggle, index) {
        console.log(`Setting up submenu toggle ${index + 1}`);
        
        // Remove existing event listeners
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Submenu toggle clicked:', newToggle.textContent.trim());
            
            const isCollapsed = sidebar && sidebar.classList.contains('collapsed');
            const submenu = newToggle.nextElementSibling;
            
            if (isCollapsed) {
                // In collapsed mode, toggle the active class for flyout display
                newToggle.classList.toggle('active');
                
                // Close other submenus in collapsed mode
                const parent = newToggle.parentElement;
                const siblings = parent.querySelectorAll('.nav-item.has-submenu');
                
                siblings.forEach(function(sibling) {
                    if (sibling !== newToggle) {
                        sibling.classList.remove('active');
                    }
                });
                
                console.log('Collapsed submenu toggled, active:', newToggle.classList.contains('active'));
            } else {
                // In expanded mode, use normal submenu behavior
                newToggle.classList.toggle('active');
                
                if (submenu && submenu.classList.contains('submenu')) {
                    if (newToggle.classList.contains('active')) {
                        submenu.style.display = 'block';
                        submenu.classList.add('active');
                    } else {
                        submenu.style.display = 'none';
                        submenu.classList.remove('active');
                    }
                    
                    console.log('Expanded submenu toggled, active:', newToggle.classList.contains('active'));
                }
                
                // Close other submenus in expanded mode
                const parent = newToggle.parentElement;
                const siblings = parent.querySelectorAll('.nav-item.has-submenu');
                
                siblings.forEach(function(sibling) {
                    if (sibling !== newToggle) {
                        sibling.classList.remove('active');
                        const siblingSubmenu = sibling.nextElementSibling;
                        if (siblingSubmenu && siblingSubmenu.classList.contains('submenu')) {
                            siblingSubmenu.style.display = 'none';
                            siblingSubmenu.classList.remove('active');
                        }
                    }
                });
            }
        });
        
        // Add hover behavior for collapsed sidebar
        newToggle.addEventListener('mouseenter', function() {
            if (sidebar && sidebar.classList.contains('collapsed')) {
                // Position flyout submenu properly
                const submenu = newToggle.nextElementSibling;
                if (submenu && submenu.classList.contains('submenu')) {
                    const rect = newToggle.getBoundingClientRect();
                    submenu.style.top = (rect.top - 60) + 'px'; // Adjust for header height
                }
            }
        });
    });

    // Close all submenus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.sidebar-nav') && !e.target.closest('.submenu')) {
            const sidebar = document.getElementById('sidebar');
            const isCollapsed = sidebar && sidebar.classList.contains('collapsed');
            
            submenuToggles.forEach(function(toggle) {
                if (isCollapsed) {
                    // In collapsed mode, just remove active class
                    toggle.classList.remove('active');
                } else {
                    // In expanded mode, hide submenu properly
                    toggle.classList.remove('active');
                    const submenu = toggle.nextElementSibling;
                    if (submenu && submenu.classList.contains('submenu')) {
                        submenu.style.display = 'none';
                        submenu.classList.remove('active');
                    }
                }
            });
        }
    });
}