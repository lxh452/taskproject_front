import { defineStore } from 'pinia';

interface UserInfo {
    userId?: string;
    username?: string;
    realName?: string;
    employeeId?: string;
    companyId?: string;
    departmentId?: string;
}

export const useUserStore = defineStore('user', {
    state: (): { userInfo: UserInfo } => ({
        userInfo: {}
    }),
    getters: {
        userId: (state) => state.userInfo.userId || localStorage.getItem('userId') || '',
        employeeId: (state) => state.userInfo.employeeId || localStorage.getItem('employeeId') || '',
        companyId: (state) => state.userInfo.companyId || localStorage.getItem('companyId') || '',
        username: (state) => state.userInfo.username || localStorage.getItem('vuems_name') || '',
    },
    actions: {
        setUserInfo(info: Partial<UserInfo>) {
            this.userInfo = { ...this.userInfo, ...info };
            // 同步到 localStorage
            if (info.userId) localStorage.setItem('userId', info.userId);
            if (info.employeeId) localStorage.setItem('employeeId', info.employeeId);
            if (info.companyId) localStorage.setItem('companyId', info.companyId);
        },
        clearUserInfo() {
            this.userInfo = {};
            localStorage.removeItem('userId');
            localStorage.removeItem('employeeId');
            localStorage.removeItem('companyId');
        }
    }
});

