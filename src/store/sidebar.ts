import { defineStore } from 'pinia';

// 检测是否为移动端
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;

export const useSidebarStore = defineStore('sidebar', {
	state: () => {
		return {
			// 移动端默认收起侧边栏
			collapse: isMobile(),
			bgColor: localStorage.getItem('sidebar-bg-color') || '#ffffff',
			textColor: localStorage.getItem('sidebar-text-color') || '#374151'
		};
	},
	getters: {},
	actions: {
		handleCollapse() {
			this.collapse = !this.collapse;
		},
		// 设置收起状态
		setCollapse(value: boolean) {
			this.collapse = value;
		},
		setBgColor(color: string) {
			this.bgColor = color;
			localStorage.setItem('sidebar-bg-color', color);
		},
		setTextColor(color: string) {
			this.textColor = color;
			localStorage.setItem('sidebar-text-color', color);
		}
	}
});
