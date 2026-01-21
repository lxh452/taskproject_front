import { mix, setProperty } from '@/utils';
import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
    state: () => {
        return {
            primary: '',
            success: '',
            warning: '',
            danger: '',
            info: '',
            headerBgColor: '#242f42',
            headerTextColor: '#fff',
            isDark: false, // 暗黑模式状态
            isTransitioning: false, // 主题切换过渡状态
        };
    },
    getters: {
        // 获取当前主题名称
        themeName(): string {
            return this.isDark ? 'dark' : 'light';
        }
    },
    actions: {
        initTheme() {
            ['primary', 'success', 'warning', 'danger', 'info'].forEach((type) => {
                const color = localStorage.getItem(`theme-${type}`) || '';
                if (color) {
                    this.setPropertyColor(color, type); // 设置主题色
                }
            });
            const headerBgColor = localStorage.getItem('header-bg-color');
            headerBgColor && this.setHeaderBgColor(headerBgColor);
            const headerTextColor = localStorage.getItem('header-text-color');
            headerTextColor && this.setHeaderTextColor(headerTextColor);
            
            // 初始化暗黑模式（不带过渡动画）
            const savedDarkMode = localStorage.getItem('theme-dark-mode');
            if (savedDarkMode === 'true') {
                this.enableDarkMode(false);
            } else if (savedDarkMode === null) {
                // 如果没有保存的设置，检查系统偏好
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    this.enableDarkMode(false);
                }
            }
            
            // 监听系统主题变化
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (localStorage.getItem('theme-dark-mode') === null) {
                    if (e.matches) {
                        this.enableDarkMode(true);
                    } else {
                        this.disableDarkMode(true);
                    }
                }
            });
        },
        resetTheme() {
            ['primary', 'success', 'warning', 'danger', 'info'].forEach((type) => {
                this.setPropertyColor('', type); // 重置主题色
            });
        },
        setPropertyColor(color: string, type: string = 'primary') {
            this[type] = color;
            setProperty(`--el-color-${type}`, color);
            localStorage.setItem(`theme-${type}`, color);
            this.setThemeLight(type);
        },
        setThemeLight(type: string = 'primary') {
            [3, 5, 7, 8, 9].forEach((v) => {
                setProperty(`--el-color-${type}-light-${v}`, mix('#ffffff', this[type], v / 10));
            });
            setProperty(`--el-color-${type}-dark-2`, mix('#ffffff', this[type], 0.2));
        },
        setHeaderBgColor(color: string) {
            this.headerBgColor = color;
            setProperty('--header-bg-color', color);
            localStorage.setItem(`header-bg-color`, color);
        },
        setHeaderTextColor(color: string) {
            this.headerTextColor = color;
            setProperty('--header-text-color', color);
            localStorage.setItem(`header-text-color`, color);
        },
        // 暗黑模式切换
        toggleDarkMode() {
            if (this.isDark) {
                this.disableDarkMode(true);
            } else {
                this.enableDarkMode(true);
            }
        },
        enableDarkMode(withTransition: boolean = true) {
            if (withTransition) {
                this.isTransitioning = true;
                document.documentElement.classList.add('theme-transitioning');
            }
            
            this.isDark = true;
            document.documentElement.classList.add('dark');
            document.documentElement.classList.add('dark-mode');
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme-dark-mode', 'true');
            this.applyDarkModeColors();
            
            if (withTransition) {
                setTimeout(() => {
                    this.isTransitioning = false;
                    document.documentElement.classList.remove('theme-transitioning');
                }, 300);
            }
        },
        disableDarkMode(withTransition: boolean = true) {
            if (withTransition) {
                this.isTransitioning = true;
                document.documentElement.classList.add('theme-transitioning');
            }
            
            this.isDark = false;
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.remove('dark-mode');
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme-dark-mode', 'false');
            this.applyLightModeColors();
            
            if (withTransition) {
                setTimeout(() => {
                    this.isTransitioning = false;
                    document.documentElement.classList.remove('theme-transitioning');
                }, 300);
            }
        },
        applyDarkModeColors() {
            // Swiss Minimalism 深色模式 CSS 变量
            setProperty('--bg-color', '#0F172A');           // Slate 900
            setProperty('--bg-color-secondary', '#1E293B'); // Slate 800
            setProperty('--bg-color-card', '#1E293B');      // Slate 800
            setProperty('--text-color', '#F1F5F9');         // Slate 100
            setProperty('--text-color-secondary', '#CBD5E1'); // Slate 300
            setProperty('--border-color', '#334155');       // Slate 700
            setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
            // Element Plus 深色模式变量
            setProperty('--el-bg-color', '#1E293B');
            setProperty('--el-bg-color-page', '#0F172A');
            setProperty('--el-bg-color-overlay', '#1E293B');
            setProperty('--el-text-color-primary', '#F1F5F9');
            setProperty('--el-text-color-regular', '#CBD5E1');
            setProperty('--el-text-color-secondary', '#94A3B8');
            setProperty('--el-border-color', '#334155');
            setProperty('--el-fill-color-blank', '#1E293B');
            setProperty('--el-fill-color-light', '#334155');
        },
        applyLightModeColors() {
            // Swiss Minimalism 亮色模式 CSS 变量
            setProperty('--bg-color', '#FFFFFF');
            setProperty('--bg-color-secondary', '#F8FAFC'); // Slate 50
            setProperty('--bg-color-card', '#FFFFFF');
            setProperty('--text-color', '#0F172A');         // Slate 900
            setProperty('--text-color-secondary', '#475569'); // Slate 600
            setProperty('--border-color', '#E2E8F0');       // Slate 200
            setProperty('--shadow-color', 'rgba(0, 0, 0, 0.06)');
            // Element Plus 亮色模式变量
            setProperty('--el-bg-color', '#FFFFFF');
            setProperty('--el-bg-color-page', '#F8FAFC');
            setProperty('--el-bg-color-overlay', '#FFFFFF');
            setProperty('--el-text-color-primary', '#0F172A');
            setProperty('--el-text-color-regular', '#475569');
            setProperty('--el-text-color-secondary', '#94A3B8');
            setProperty('--el-border-color', '#E2E8F0');
            setProperty('--el-fill-color-blank', '#FFFFFF');
            setProperty('--el-fill-color-light', '#F1F5F9');
        },
        // 跟随系统主题设置
        followSystemTheme() {
            localStorage.removeItem('theme-dark-mode');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                this.enableDarkMode(true);
            } else {
                this.disableDarkMode(true);
            }
        },
        // 检查是否跟随系统
        isFollowingSystem(): boolean {
            return localStorage.getItem('theme-dark-mode') === null;
        }
    }
});