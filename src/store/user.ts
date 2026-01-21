import { defineStore } from 'pinia';
import { getMyEmployee } from '@/api';

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
        },
        async getUserInfo() {
            try {
                const res = await getMyEmployee();
                if (res.data.code === 200 && res.data.data) {
                    const employeeData = res.data.data;
                    this.setUserInfo({
                        userId: employeeData.userId || employeeData.UserId,
                        employeeId: employeeData.id || employeeData.Id,
                        companyId: employeeData.companyId || employeeData.CompanyId,
                        departmentId: employeeData.departmentId || employeeData.DepartmentId,
                        username: employeeData.username || employeeData.Username,
                        realName: employeeData.realName || employeeData.RealName,
                    });
                    return employeeData;
                }
                return null;
            } catch (error) {
                console.error('获取用户信息失败:', error);
                return null;
            }
        }
    }
});

