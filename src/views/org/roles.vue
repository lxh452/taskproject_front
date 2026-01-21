<template>
    <div class="roles-page">
        <div class="page-header">
            <div class="header-left">
                <h1 class="page-title">角色管理</h1>
                <p class="page-desc">配置系统角色和权限</p>
            </div>
            <el-button type="primary" :icon="Plus" @click="openEdit()" class="create-btn">新建角色</el-button>
        </div>

        <div class="filter-bar">
            <div class="filter-left">
                <el-input v-model="query.keyword" placeholder="搜索角色名称/编码" clearable class="search-input" :prefix-icon="Search" />
                <el-button type="primary" @click="load" :icon="Search">搜索</el-button>
            </div>
            <el-button @click="resetQuery" :icon="Refresh" circle />
        </div>
        
        <div class="content-area">
            <el-skeleton :rows="3" animated v-if="loading" />
            <template v-else>
                <div v-if="rows.length > 0" class="roles-grid">
                    <div v-for="row in rows" :key="row.id" class="role-card">
                        <div class="card-header">
                            <div class="role-icon"><el-icon><Key /></el-icon></div>
                            <div class="status-tag" :class="row.status === 1 ? 'active' : 'inactive'">{{ row.statusText }}</div>
                        </div>

                        <div class="card-body">
                            <h3 class="role-name">{{ row.roleName }}</h3>
                            <el-tag size="small" type="info" effect="plain" class="role-code">{{ row.roleCode }}</el-tag>
                        </div>

                        <div class="perms-section">
                            <div class="perms-label">权限</div>
                            <div class="perms-tags">
                                <template v-if="formatPerms(row.permissions).length > 0">
                                    <el-tag 
                                        v-for="(tag, idx) in formatPerms(row.permissions).slice(0, 4)" 
                                        :key="`${row.id}-perm-${idx}`" 
                                        size="small" 
                                        effect="plain"
                                    >
                                        {{ tag }}
                                    </el-tag>
                                    <el-tag v-if="formatPerms(row.permissions).length > 4" size="small" type="info">
                                        +{{ formatPerms(row.permissions).length - 4 }}
                                    </el-tag>
                                </template>
                                <template v-else>
                                    <span class="no-perms">暂无权限</span>
                                    <el-tooltip v-if="row.permissions" content="原始数据已加载，但解析失败" placement="top">
                                        <el-icon class="debug-icon"><Warning /></el-icon>
                                    </el-tooltip>
                                </template>
                            </div>
                        </div>

                        <div class="card-footer">
                            <el-button plain size="default" @click="openEdit(row)" class="action-btn">
                                <el-icon><Edit /></el-icon>
                                <span>编辑</span>
                            </el-button>
                            <el-button plain size="default" @click="openAssign(row)" class="action-btn">
                                <el-icon><Share /></el-icon>
                                <span>分配</span>
                            </el-button>
                            <el-button plain size="default" @click="onDelete(row)" class="action-btn action-btn-danger">
                                <el-icon><Delete /></el-icon>
                                <span>删除</span>
                            </el-button>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state"><el-empty description="暂无角色数据" /></div>
            </template>
        </div>

        <!-- 角色编辑抽屉 -->
        <el-drawer v-model="visible" :title="form.id ? '编辑角色' : '新建角色'" size="500px" class="vben-drawer" destroy-on-close>
            <el-form :model="form" label-position="top">
                <el-form-item label="角色名称"><el-input v-model="form.roleName" placeholder="请输入角色名称" /></el-form-item>
                <el-form-item label="角色编码"><el-input v-model="form.roleCode" placeholder="请输入角色编码" /></el-form-item>
                <el-form-item label="权限配置">
                    <div class="perm-tree-wrapper">
                        <el-tree ref="permTreeRef" :data="permTree" node-key="key" show-checkbox :default-expanded-keys="expandedPermKeys" :props="{ label: 'label', children: 'children' }" />
                    </div>
                </el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" /></el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="visible=false">取消</el-button>
                <el-button type="primary" @click="onSubmit" :loading="saving">保存</el-button>
            </template>
        </el-drawer>

        <!-- 分配弹窗 -->
        <el-dialog v-model="assignVisible" title="分配角色给职位" width="500px" class="vben-dialog">
            <el-form label-position="top">
                <el-form-item label="职位">
                    <el-select v-model="selectedPositionId" placeholder="搜索职位" filterable remote :remote-method="onPositionRemote" :loading="positionLoading" style="width: 100%">
                        <el-option v-for="p in positions" :key="p.id" :label="`${p.positionName}（${p.positionCode}）`" :value="p.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="选择角色">
                    <el-select v-model="selectedRoleIds" multiple collapse-tags placeholder="选择角色" style="width: 100%">
                        <el-option v-for="r in rows" :key="r.id" :label="`${r.roleName}（${r.roleCode}）`" :value="r.id" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="assignVisible=false">取消</el-button>
                <el-button type="primary" @click="onAssignSubmit" :disabled="!selectedPositionId || selectedRoleIds.length===0" :loading="assigning">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Search, Refresh, Edit, Delete, Share, Key, Warning } from '@element-plus/icons-vue';
import { roleList, createRole, updateRole, deleteRole, listPositions, assignRole } from '@/api';
import { useUserStore } from '@/store/user';
import { ElMessageBox, ElMessage } from 'element-plus';
import { PERM_TREE, PERM_NAMES, TEXT_TO_CODE } from '@/perm/defs';

const rows = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const assigning = ref(false);
const query = ref<any>({ keyword: '' });
const visible = ref(false);
const form = ref<any>({ id: '', roleName: '', roleCode: '', permissions: '', status: 1 });
const permTreeRef = ref();
const permTree = ref<any[]>(PERM_TREE.map((group) => ({ key: group.value, label: group.label, children: group.children.map((perm) => ({ key: String(perm.value), label: `${PERM_NAMES[perm.value]} (${perm.value})`, value: perm.value })) })));
const expandedPermKeys = ref<string[]>(PERM_TREE.map((g) => g.value));
const assignVisible = ref(false);
const positions = ref<any[]>([]);
const positionLoading = ref(false);
const selectedPositionId = ref<string>('');
const selectedRoleIds = ref<string[]>([]);
const userStore = useUserStore();

async function load() {
    loading.value = true;
    try {
        const resp = await roleList({ page: 1, pageSize: 100, keyword: query.value.keyword });
        if (resp.data.code !== 200) { ElMessage.error(resp.data.msg || '加载失败'); return; }
        const list = resp.data?.data?.list || resp.data?.data || [];
        rows.value = (Array.isArray(list) ? list : []).map((r: any) => {
            // 处理权限字段，支持多种格式
            let permissions = '';
            if (r.permissions !== undefined && r.permissions !== null) {
                if (typeof r.permissions === 'string') {
                    permissions = r.permissions;
                } else if (r.permissions.String) {
                    permissions = r.permissions.String;
                } else if (Array.isArray(r.permissions)) {
                    permissions = JSON.stringify(r.permissions);
                }
            } else if (r.Permissions !== undefined && r.Permissions !== null) {
                if (typeof r.Permissions === 'string') {
                    permissions = r.Permissions;
                } else if (r.Permissions.String) {
                    permissions = r.Permissions.String;
                } else if (Array.isArray(r.Permissions)) {
                    permissions = JSON.stringify(r.Permissions);
                }
            }
            
            // 调试日志
            if (r.roleName && !permissions) {
                console.log('角色权限数据:', {
                    roleName: r.roleName,
                    permissions: r.permissions,
                    Permissions: r.Permissions,
                    raw: r
                });
            }
            
            return {
                id: r.id || r.Id, 
                roleName: r.roleName || r.RoleName, 
                roleCode: r.roleCode || r.RoleCode,
                permissions: permissions, 
                status: r.status ?? r.Status ?? 1,
                statusText: (r.status ?? r.Status ?? 1) === 1 ? '启用' : '禁用',
            };
        });
    } catch (error: any) { 
        console.error('加载角色列表失败:', error);
        ElMessage.error('加载失败'); 
    } finally { 
        loading.value = false; 
    }
}

function resetQuery() { query.value.keyword = ''; load(); }

function openEdit(row?: any) {
    if (row) { form.value = { ...row }; setTimeout(() => { permTreeRef.value?.setCheckedKeys(formatPermsToKeys(row.permissions)); }, 0); } 
    else { form.value = { id: '', roleName: '', roleCode: '', permissions: '', status: 1 }; setTimeout(() => { permTreeRef.value?.setCheckedKeys([]); }, 0); }
    visible.value = true;
}

async function onSubmit() {
    saving.value = true;
    try {
        const keys: string[] = (permTreeRef.value?.getCheckedKeys(true) || []) as string[];
        const nums = keys.filter(k => /^\d+$/.test(k)).map(Number);
        const validPerms = nums.filter(n => PERM_NAMES[n] != null);
        const payload = { ...form.value, permissions: JSON.stringify(validPerms) };
        if (payload.id) {
            const resp = await updateRole({ id: payload.id, roleName: payload.roleName, roleCode: payload.roleCode, description: '', permissions: payload.permissions, status: payload.status });
            if (resp.data.code !== 200) throw new Error(resp.data.msg);
            ElMessage.success('更新成功');
        } else {
            const resp = await createRole({ companyId: userStore.companyId || '', roleName: payload.roleName, roleCode: payload.roleCode, description: '', permissions: payload.permissions });
            if (resp.data.code !== 200) throw new Error(resp.data.msg);
            ElMessage.success('创建成功');
        }
        visible.value = false;
        load();
    } catch (e: any) { ElMessage.error(e.message || '保存失败'); } finally { saving.value = false; }
}

async function onDelete(row: any) {
    try {
        await ElMessageBox.confirm(`确定删除角色「${row.roleName}」吗？`, '提示', { type: 'warning' });
        const resp = await deleteRole({ id: row.id });
        if (resp.data.code !== 200) throw new Error(resp.data.msg);
        ElMessage.success('删除成功');
        load();
    } catch (e) {}
}

function formatPerms(p: string): string[] {
    if (!p || p.trim() === '') return [];
    
    let items: (string | number)[] = [];
    
    try { 
        // 尝试解析JSON
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed)) {
            items = parsed;
        } else if (typeof parsed === 'string') {
            items = parsed.split(',').map(s => s.trim()).filter(Boolean);
        } else if (typeof parsed === 'number') {
            items = [parsed];
        }
    } catch (e) { 
        // 如果不是JSON，尝试按逗号分割
        if (typeof p === 'string') {
            const parts = p.split(',').map(s => s.trim()).filter(Boolean);
            items = parts.map(part => {
                const num = parseInt(part);
                return isNaN(num) ? part : num;
            });
        }
    }
    
    if (items.length === 0) {
        console.warn('权限解析失败，原始数据:', p);
        return [];
    }
    
    const result = items.map((item) => {
        // 如果是数字，直接查找权限名称
        if (typeof item === 'number') {
            const permName = PERM_NAMES[item];
            if (permName) {
                return permName;
            }
            console.warn(`未找到权限ID ${item} 对应的名称`);
            return `权限${item}`;
        }
        
        // 如果是字符串，先尝试转换为数字
        const num = parseInt(String(item));
        if (!isNaN(num) && PERM_NAMES[num]) {
            return PERM_NAMES[num];
        }
        
        // 尝试通过文本查找
        if (typeof item === 'string') {
            const code = TEXT_TO_CODE[item.toLowerCase()];
            if (code && PERM_NAMES[code]) {
                return PERM_NAMES[code];
            }
        }
        
        return String(item);
    }).filter(Boolean);
    
    return result;
}

function formatPermsToKeys(p: string): string[] {
    if (!p) return [];
    let items: (string | number)[] = [];
    try { const arr = JSON.parse(p); if (Array.isArray(arr)) items = arr; } catch { items = p.split(',').map(s => s.trim()).filter(Boolean); }
    return items.map((item) => typeof item === 'number' ? String(item) : (typeof item === 'string' && TEXT_TO_CODE[item.toLowerCase()] ? String(TEXT_TO_CODE[item.toLowerCase()]) : '')).filter(Boolean);
}

async function onPositionRemote(keyword: string) {
    positionLoading.value = true;
    try {
        const resp = await listPositions({ page: 1, pageSize: 100, departmentId: '', name: keyword });
        if (resp.data.code === 200) positions.value = (resp.data.data?.list || []).map((p: any) => ({ id: p.id, positionName: p.positionName || '未命名', positionCode: p.positionCode?.String || p.positionCode || '-' }));
    } finally { positionLoading.value = false; }
}

function openAssign(row?: any) {
    assignVisible.value = true;
    selectedPositionId.value = '';
    selectedRoleIds.value = row ? [row.id] : [];
    if (positions.value.length === 0) onPositionRemote('');
}

async function onAssignSubmit() {
    assigning.value = true;
    try {
        for (const rid of selectedRoleIds.value) {
            const resp = await assignRole({ positionId: selectedPositionId.value, roleId: rid });
            if (resp.data.code !== 200) throw new Error(resp.data.msg);
        }
        ElMessage.success('分配成功');
        assignVisible.value = false;
    } catch (e: any) { ElMessage.error(e.message || '分配失败'); } finally { assigning.value = false; }
}

onMounted(load);
</script>

<style scoped>
.roles-page { 
    padding: clamp(16px, 1.5vw, 24px); 
    background: var(--bg-page); 
    min-height: calc(100vh - clamp(56px, 8vh, 64px));
    width: 100%;
    box-sizing: border-box;
}
.page-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: clamp(16px, 1.5vw, 24px); 
}
.page-title { 
    font-size: clamp(20px, 1.5vw, 24px);
    font-weight: 700; 
    color: var(--text-main); 
    margin: 0 0 clamp(4px, 0.3vw, 8px); 
}
.page-desc { 
    font-size: clamp(13px, 0.95vw, 15px);
    color: var(--text-secondary); 
    margin: 0; 
}
.create-btn { height: clamp(36px, 2.5vw, 40px); padding: 0 clamp(16px, 1.3vw, 20px); border-radius: clamp(8px, 0.7vw, 10px); font-weight: 500; background: var(--color-primary); border: none; }

.filter-bar { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: clamp(12px, 1vw, 16px) clamp(16px, 1.3vw, 24px); 
    background: var(--bg-card); 
    border-radius: clamp(10px, 0.8vw, 12px); 
    border: 1px solid var(--border-color); 
    margin-bottom: clamp(16px, 1.5vw, 24px); 
}
.filter-left { display: flex; gap: clamp(10px, 0.8vw, 12px); align-items: center; }
.search-input { width: clamp(240px, 18vw, 300px); }

.roles-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 18vw, 320px), 1fr)); 
    gap: clamp(12px, 1.3vw, 20px);
    width: 100%;
}

.role-card { 
    background: var(--bg-card); 
    border-radius: clamp(12px, 0.9vw, 14px); 
    border: 1px solid var(--border-color); 
    padding: clamp(16px, 1.3vw, 24px); 
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
}
.role-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.role-icon { 
    width: 3vw; 
    height: 3vw; 
    min-width: 40px; 
    min-height: 40px; 
    max-width: 48px; 
    max-height: 48px; 
    border-radius: 0.8vw; 
    background: #eef2ff; 
    color: var(--color-primary); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: clamp(18px, 1.4vw, 22px);
}
.status-tag { font-size: 11px; font-weight: 500; padding: 4px 12px; border-radius: 20px; }
.status-tag.active { background: #d1fae5; color: #059669; }
.status-tag.inactive { background: var(--bg-base); color: var(--text-secondary); }

.card-body { margin-bottom: 16px; }
.role-name { font-size: 16px; font-weight: 600; color: var(--text-main); margin: 0 0 8px; }
.role-code { font-family: monospace; }

.perms-section { background: var(--bg-base); border-radius: 10px; padding: 12px; margin-bottom: 16px; }
.perms-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.perms-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.no-perms { font-size: 12px; color: var(--text-muted); font-style: italic; }
.debug-icon { margin-left: 6px; color: var(--color-warning); font-size: 14px; cursor: help; }

.card-footer { 
    display: flex; 
    justify-content: space-between; 
    gap: 8px; 
    padding-top: 16px; 
    border-top: 1px solid var(--border-color); 
}
.card-footer .action-btn {
    flex: 1;
    height: 34px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-color: var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
}
.card-footer .action-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-light);
}
.card-footer .action-btn-danger:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-danger-light);
}
.empty-state { padding: 60px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); }

.perm-tree-wrapper { border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; background: var(--bg-base); max-height: 360px; overflow-y: auto; }

/* 响应式布局 - 保持比例 */
@media (max-width: 1024px) {
    .roles-grid {
        grid-template-columns: repeat(auto-fill, minmax(22vw, 1fr));
    }
}

@media (max-width: 768px) {
    .roles-page {
        padding: 4vw;
    }
    
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 2vw;
    }
    
    .filter-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5vw;
    }
    
    .filter-left {
        flex-direction: column;
        width: 100%;
    }
    
    .search-input {
        width: 100%;
    }
    
    .roles-grid {
        grid-template-columns: 1fr;
        gap: 3vw;
    }
}
</style>
