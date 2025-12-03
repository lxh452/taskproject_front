<template>
    <div class="roles-page">
        <div class="toolbar">
            <div class="toolbar-left">
                <el-input 
                    v-model="query.keyword" 
                    placeholder="搜索角色名称/编码" 
                    clearable 
                    class="search-input"
                    :prefix-icon="Search"
                />
                <el-button type="primary" @click="load" :icon="Search">搜索</el-button>
            </div>
            <div class="toolbar-right">
                <el-button @click="resetQuery" :icon="Refresh" circle plain />
                <el-button type="primary" :icon="Plus" @click="openEdit()">新建角色</el-button>
            </div>
        </div>
        
        <div class="table-container">
            <el-table 
                :data="rows" 
                style="width: 100%"
                class="roles-table"
                v-loading="loading"
                :header-cell-style="{ background: '#f9fafb', color: '#6b7280', fontWeight: '600' }"
            >
                <el-table-column prop="roleName" label="角色名称" min-width="180">
                    <template #default="{ row }">
                        <div class="role-name-cell">
                            <span class="role-name">{{ row.roleName }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="roleCode" label="编码" width="160">
                    <template #default="{ row }">
                        <span class="code-text">{{ row.roleCode }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="权限" min-width="400">
                    <template #default="{ row }">
                        <div class="perms-container">
                            <span 
                                v-for="tag in formatPerms(row.permissions).slice(0, 5)" 
                                :key="tag" 
                                class="perm-tag"
                            >
                                {{ tag }}
                            </span>
                            <span v-if="formatPerms(row.permissions).length > 5" class="perm-more">
                                +{{ formatPerms(row.permissions).length - 5 }}
                            </span>
                            <span v-if="formatPerms(row.permissions).length === 0" class="no-perms">
                                暂无权限
                            </span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="statusText" label="状态" width="100" align="center">
                    <template #default="{ row }">
                        <div class="status-badge" :class="row.status === 1 ? 'success' : 'default'">
                            {{ row.statusText }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                        <el-button link type="primary" @click="openAssign(row)">分配</el-button>
                        <el-button link type="danger" @click="onDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 角色编辑抽屉 -->
        <el-drawer 
            v-model="visible" 
            :title="form.id ? '编辑角色' : '新建角色'" 
            size="500px"
            class="modern-drawer"
            destroy-on-close
        >
            <el-form :model="form" label-position="top" class="drawer-form">
                <el-form-item label="角色名称">
                    <el-input v-model="form.roleName" placeholder="请输入角色名称" />
                </el-form-item>
                <el-form-item label="角色编码">
                    <el-input v-model="form.roleCode" placeholder="请输入角色编码" />
                </el-form-item>
                <el-form-item label="权限配置">
                    <div class="perm-tree-wrapper">
                        <el-tree
                            ref="permTreeRef"
                            :data="permTree"
                            node-key="key"
                            show-checkbox
                            :default-expanded-keys="expandedPermKeys"
                            :props="{ label: 'label', children: 'children' }"
                            class="perm-tree"
                        />
                    </div>
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch 
                        v-model="form.status" 
                        :active-value="1" 
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="禁用"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="visible=false">取消</el-button>
                    <el-button type="primary" @click="onSubmit" :loading="saving">保存</el-button>
                </div>
            </template>
        </el-drawer>

        <!-- 分配弹窗 -->
        <el-dialog 
            v-model="assignVisible" 
            title="分配角色给职位" 
            width="500px"
            class="modern-dialog"
        >
            <el-form label-position="top">
                <el-form-item label="职位">
                    <el-select
                        v-model="selectedPositionId"
                        placeholder="搜索职位名称或编码"
                        filterable
                        remote
                        :remote-method="onPositionRemote"
                        :loading="positionLoading"
                        style="width: 100%"
                    >
                        <el-option 
                            v-for="p in positions" 
                            :key="p.id" 
                            :label="`${p.positionName}（${p.positionCode}）`" 
                            :value="p.id" 
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="选择角色">
                    <el-select 
                        v-model="selectedRoleIds" 
                        multiple 
                        collapse-tags 
                        placeholder="选择一个或多个角色" 
                        style="width: 100%"
                    >
                        <el-option 
                            v-for="r in rows" 
                            :key="r.id" 
                            :label="`${r.roleName}（${r.roleCode}）`" 
                            :value="r.id" 
                        />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="assignVisible=false">取消</el-button>
                <el-button 
                    type="primary" 
                    @click="onAssignSubmit" 
                    :disabled="!selectedPositionId || selectedRoleIds.length===0"
                    :loading="assigning"
                >
                    确定
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Search, Refresh } from '@element-plus/icons-vue';
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
const permTree = ref<any[]>(
    PERM_TREE.map((group) => ({
        key: group.value,
        label: group.label,
        children: group.children.map((perm) => ({
            key: String(perm.value),
            label: `${PERM_NAMES[perm.value]} (${perm.value})`,
            value: perm.value,
        })),
    }))
);
const expandedPermKeys = ref<string[]>(PERM_TREE.map((g) => g.value));
const assignVisible = ref(false);
const positions = ref<any[]>([]);
const positionKeyword = ref('');
const positionLoading = ref(false);
const selectedPositionId = ref<string>('');
const selectedRoleIds = ref<string[]>([]);
const userStore = useUserStore();

async function load() {
    loading.value = true;
    try {
        const resp = await roleList({ page: 1, pageSize: 100, keyword: query.value.keyword });
        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '加载失败');
            return;
        }
        const list = resp.data?.data?.list || resp.data?.data || [];
        rows.value = (Array.isArray(list) ? list : []).map((r: any) => {
            const id = r.id || r.Id;
            const roleName = r.roleName || r.RoleName;
            const roleCode = r.roleCode || r.RoleCode;
            const permissions = r.permissions?.String ?? r.permissions ?? r.Permissions?.String ?? r.Permissions ?? '';
            const status = r.status ?? r.Status ?? 1;
            return {
                id,
                roleName,
                roleCode,
                permissions,
                status,
                statusText: status === 1 ? '启用' : '禁用',
            };
        });
    } catch (error: any) {
        ElMessage.error('加载失败');
    } finally {
        loading.value = false;
    }
}

function resetQuery() {
    query.value.keyword = '';
    load();
}

function openEdit(row?: any) {
    if (row) {
        form.value = { ...row };
        const checked = formatPermsToKeys(row.permissions);
        setTimeout(() => {
            permTreeRef.value?.setCheckedKeys(checked);
        }, 0);
    } else {
        form.value = { id: '', roleName: '', roleCode: '', permissions: '', status: 1 };
        setTimeout(() => {
            permTreeRef.value?.setCheckedKeys([]);
        }, 0);
    }
    visible.value = true;
}

async function onSubmit() {
    saving.value = true;
    try {
        const keys: string[] = (permTreeRef.value?.getCheckedKeys(true) || []) as string[];
        const nums = keys.filter(k => /^\d+$/.test(k)).map(Number);
        const validPerms = nums.filter(n => PERM_NAMES[n] != null);
        if (validPerms.length === 0 && keys.length > 0) {
            ElMessage.warning('请至少选择一个有效权限');
            return;
        }
        const payload = { ...form.value, permissions: JSON.stringify(validPerms) };
        if (payload.id) {
            const resp = await updateRole({ id: payload.id, roleName: payload.roleName, roleCode: payload.roleCode, description: '', permissions: payload.permissions, status: payload.status });
            if (resp.data.code !== 200) throw new Error(resp.data.msg || '更新失败');
            ElMessage.success('更新成功');
        } else {
            const resp = await createRole({ companyId: userStore.companyId || '', roleName: payload.roleName, roleCode: payload.roleCode, description: '', permissions: payload.permissions });
            if (resp.data.code !== 200) throw new Error(resp.data.msg || '创建失败');
            ElMessage.success('创建成功');
        }
        visible.value = false;
        load();
    } catch (e: any) {
        ElMessage.error(e.message || '保存失败');
    } finally {
        saving.value = false;
    }
}

async function onDelete(row: any) {
    try {
        await ElMessageBox.confirm(`确定删除角色「${row.roleName}」吗？`, '提示', {
            type: 'warning',
        });
        const resp = await deleteRole({ id: row.id });
        if (resp.data.code !== 200) throw new Error(resp.data.msg || '删除失败');
        ElMessage.success('删除成功');
        load();
    } catch (e) {}
}

function formatPerms(p: string): string[] {
    if (!p) return [];
    let items: (string | number)[] = [];
    try {
        const arr = JSON.parse(p);
        if (Array.isArray(arr)) items = arr;
    } catch {
        items = p.split(',').map(s => s.trim()).filter(Boolean);
    }
    return items.map((item) => {
        if (typeof item === 'number') return PERM_NAMES[item] || `权限${item}`;
        if (typeof item === 'string' && TEXT_TO_CODE[item.toLowerCase()]) return PERM_NAMES[TEXT_TO_CODE[item.toLowerCase()]] || item;
        return String(item);
    });
}

function formatPermsToKeys(p: string): string[] {
    if (!p) return [];
    let items: (string | number)[] = [];
    try {
        const arr = JSON.parse(p);
        if (Array.isArray(arr)) items = arr;
    } catch {
        items = p.split(',').map(s => s.trim()).filter(Boolean);
    }
    return items.map((item) => {
        if (typeof item === 'number') return String(item);
        if (typeof item === 'string' && TEXT_TO_CODE[item.toLowerCase()]) return String(TEXT_TO_CODE[item.toLowerCase()]);
        return '';
    }).filter(Boolean);
}

async function onPositionRemote(keyword: string) {
    positionKeyword.value = keyword;
    positionLoading.value = true;
    try {
        const resp = await listPositions({ page: 1, pageSize: 100, departmentId: '', name: keyword });
        if (resp.data.code === 200) {
            const list = resp.data.data?.list || [];
            positions.value = list.map((p: any) => ({
                id: p.id,
                positionName: p.positionName || '未命名职位',
                positionCode: p.positionCode?.String || p.positionCode || '-'
            }));
        }
    } finally {
        positionLoading.value = false;
    }
}

function openAssign(row?: any) {
    assignVisible.value = true;
    selectedPositionId.value = '';
    if (row) {
        selectedRoleIds.value = [row.id];
    } else {
        selectedRoleIds.value = [];
    }
    if (positions.value.length === 0) {
        onPositionRemote('');
    }
}

async function onAssignSubmit() {
    assigning.value = true;
    try {
        const positionId = selectedPositionId.value;
        for (const rid of selectedRoleIds.value) {
            const resp = await assignRole({ positionId: positionId, roleId: rid });
            if (resp.data.code !== 200) throw new Error(resp.data.msg || '分配失败');
        }
        ElMessage.success('分配成功');
        assignVisible.value = false;
        selectedPositionId.value = '';
        selectedRoleIds.value = [];
    } catch (e: any) {
        ElMessage.error(e.message || '分配失败');
    } finally {
        assigning.value = false;
    }
}

onMounted(load);
</script>

<style scoped>
.roles-page {
    padding: 24px;
    background: #f9fafb;
    min-height: calc(100vh - 64px);
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: #ffffff;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-input { width: 280px; }

.table-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 4px;
}

.roles-table {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #f9fafb;
}

.role-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
}

.code-text {
    font-family: monospace;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
}

.perms-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}

.perm-tag {
    font-size: 12px;
    color: #4b5563;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
}

.perm-more {
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
}

.no-perms {
    font-size: 12px;
    color: #9ca3af;
    font-style: italic;
}

.status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}
.status-badge.success { background: #ecfdf5; color: #10b981; }
.status-badge.default { background: #f3f4f6; color: #6b7280; }

/* Drawer Styles */
:deep(.modern-drawer) { background: #ffffff !important; }
:deep(.modern-drawer .el-drawer__header) {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
    font-weight: 600;
}
:deep(.modern-drawer .el-drawer__body) { padding: 24px; }

.drawer-footer {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    gap: 12px;
}

.perm-tree-wrapper {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: #fafbfc;
    max-height: 400px;
    overflow-y: auto;
}
</style>
