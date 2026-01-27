<template>
    <div class="page-container">
        <!-- 页面头部 -->
        <header class="page-header">
            <div class="header-content">
                <div class="header-info">
                    <h1 class="page-title">角色管理</h1>
                    <p class="page-subtitle">管理系统角色与权限配置</p>
                </div>
                <el-button type="primary" @click="openEdit()" class="btn-create">
                    <el-icon><Plus /></el-icon>
                    <span>新建角色</span>
                </el-button>
            </div>
        </header>

        <!-- 搜索栏 -->
        <section class="search-section">
            <div class="search-box">
                <el-icon class="search-icon"><Search /></el-icon>
                <el-input
                    v-model="query.keyword"
                    placeholder="搜索角色名称或编码..."
                    clearable
                    class="search-input"
                    @keyup.enter="load"
                />
            </div>
            <div class="search-actions">
                <el-button @click="load" type="primary">搜索</el-button>
                <el-button @click="resetQuery">重置</el-button>
            </div>
        </section>

        <!-- 主内容区 -->
        <main class="main-content">
            <el-skeleton :rows="4" animated v-if="loading" />

            <template v-else>
                <!-- 角色列表 -->
                <div v-if="rows.length > 0" class="role-list">
                    <article v-for="row in rows" :key="row.id" class="role-item">
                        <div class="role-main">
                            <div class="role-avatar">
                                <el-icon><Key /></el-icon>
                            </div>
                            <div class="role-info">
                                <h3 class="role-name">{{ row.roleName }}</h3>
                                <code class="role-code">{{ row.roleCode }}</code>
                            </div>
                            <div class="role-status">
                                <span class="status-badge" :class="row.status === 1 ? 'active' : 'inactive'">
                                    {{ row.status === 1 ? '启用' : '停用' }}
                                </span>
                            </div>
                        </div>

                        <div class="role-perms">
                            <span class="perms-label">权限：</span>
                            <div class="perms-list">
                                <template v-if="formatPerms(row.permissions).length > 0">
                                    <span
                                        v-for="(perm, idx) in formatPerms(row.permissions).slice(0, 5)"
                                        :key="`${row.id}-${idx}`"
                                        class="perm-tag"
                                    >
                                        {{ perm }}
                                    </span>
                                    <span v-if="formatPerms(row.permissions).length > 5" class="perm-more">
                                        +{{ formatPerms(row.permissions).length - 5 }}
                                    </span>
                                </template>
                                <span v-else class="no-perms">暂无权限</span>
                            </div>
                        </div>

                        <div class="role-actions">
                            <button class="action-btn" @click="openEdit(row)" title="编辑">
                                <el-icon><Edit /></el-icon>
                            </button>
                            <button class="action-btn" @click="openAssign(row)" title="分配">
                                <el-icon><Share /></el-icon>
                            </button>
                            <button class="action-btn danger" @click="onDelete(row)" title="删除">
                                <el-icon><Delete /></el-icon>
                            </button>
                        </div>
                    </article>
                </div>

                <!-- 空状态 -->
                <div v-else class="empty-state">
                    <el-icon class="empty-icon"><Box /></el-icon>
                    <p class="empty-text">暂无角色数据</p>
                    <el-button type="primary" @click="openEdit()">创建第一个角色</el-button>
                </div>
            </template>
        </main>

        <!-- 编辑抽屉 -->
        <el-drawer
            v-model="visible"
            :title="form.id ? '编辑角色' : '新建角色'"
            size="480px"
            destroy-on-close
            class="role-drawer"
        >
            <el-form :model="form" label-position="top" class="role-form">
                <el-form-item label="角色名称" required>
                    <el-input v-model="form.roleName" placeholder="请输入角色名称" />
                </el-form-item>
                <el-form-item label="角色编码" required>
                    <el-input v-model="form.roleCode" placeholder="请输入角色编码，如 ADMIN" />
                </el-form-item>
                <el-form-item label="权限配置">
                    <div class="perm-tree-box">
                        <el-tree
                            ref="permTreeRef"
                            :data="permTree"
                            node-key="key"
                            show-checkbox
                            :default-expanded-keys="expandedPermKeys"
                            :props="{ label: 'label', children: 'children' }"
                        />
                    </div>
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch
                        v-model="form.status"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="停用"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="visible = false">取消</el-button>
                    <el-button type="primary" @click="onSubmit" :loading="saving">保存</el-button>
                </div>
            </template>
        </el-drawer>

        <!-- 分配弹窗 -->
        <el-dialog v-model="assignVisible" title="分配角色" width="480px" class="assign-dialog">
            <el-form label-position="top">
                <el-form-item label="选择职位">
                    <el-select
                        v-model="selectedPositionId"
                        placeholder="搜索并选择职位"
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
                        placeholder="选择要分配的角色"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="r in rows"
                            :key="r.id"
                            :label="r.roleName"
                            :value="r.id"
                        />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="assignVisible = false">取消</el-button>
                <el-button
                    type="primary"
                    @click="onAssignSubmit"
                    :disabled="!selectedPositionId || selectedRoleIds.length === 0"
                    :loading="assigning"
                >
                    确定分配
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Search, Edit, Delete, Share, Key, Box } from '@element-plus/icons-vue';
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
const permTree = ref<any[]>(PERM_TREE.map((group) => ({
    key: group.value,
    label: group.label,
    children: group.children.map((perm) => ({
        key: String(perm.value),
        label: `${PERM_NAMES[perm.value]} (${perm.value})`,
        value: perm.value
    }))
})));
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
        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '加载失败');
            return;
        }
        const list = resp.data?.data?.list || resp.data?.data || [];
        rows.value = (Array.isArray(list) ? list : []).map((r: any) => {
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

            return {
                id: r.id || r.Id,
                roleName: r.roleName || r.RoleName,
                roleCode: r.roleCode || r.RoleCode,
                permissions: permissions,
                status: r.status ?? r.Status ?? 1,
            };
        });
    } catch (error: any) {
        console.error('加载角色列表失败:', error);
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
        setTimeout(() => {
            permTreeRef.value?.setCheckedKeys(formatPermsToKeys(row.permissions));
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
        const payload = { ...form.value, permissions: JSON.stringify(validPerms) };
        if (payload.id) {
            const resp = await updateRole({
                id: payload.id,
                roleName: payload.roleName,
                roleCode: payload.roleCode,
                description: '',
                permissions: payload.permissions,
                status: payload.status
            });
            if (resp.data.code !== 200) throw new Error(resp.data.msg);
            ElMessage.success('更新成功');
        } else {
            const resp = await createRole({
                companyId: userStore.companyId || '',
                roleName: payload.roleName,
                roleCode: payload.roleCode,
                description: '',
                permissions: payload.permissions
            });
            if (resp.data.code !== 200) throw new Error(resp.data.msg);
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
        await ElMessageBox.confirm(`确定删除角色「${row.roleName}」吗？`, '删除确认', { type: 'warning' });
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
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed)) {
            items = parsed;
        } else if (typeof parsed === 'string') {
            items = parsed.split(',').map(s => s.trim()).filter(Boolean);
        } else if (typeof parsed === 'number') {
            items = [parsed];
        }
    } catch (e) {
        if (typeof p === 'string') {
            const parts = p.split(',').map(s => s.trim()).filter(Boolean);
            items = parts.map(part => {
                const num = parseInt(part);
                return isNaN(num) ? part : num;
            });
        }
    }

    if (items.length === 0) return [];

    return items.map((item) => {
        if (typeof item === 'number') {
            return PERM_NAMES[item] || `权限${item}`;
        }
        const num = parseInt(String(item));
        if (!isNaN(num) && PERM_NAMES[num]) {
            return PERM_NAMES[num];
        }
        if (typeof item === 'string') {
            const code = TEXT_TO_CODE[item.toLowerCase()];
            if (code && PERM_NAMES[code]) {
                return PERM_NAMES[code];
            }
        }
        return String(item);
    }).filter(Boolean);
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
    return items.map((item) =>
        typeof item === 'number' ? String(item) :
        (typeof item === 'string' && TEXT_TO_CODE[item.toLowerCase()] ? String(TEXT_TO_CODE[item.toLowerCase()]) : '')
    ).filter(Boolean);
}

async function onPositionRemote(keyword: string) {
    positionLoading.value = true;
    try {
        const resp = await listPositions({ page: 1, pageSize: 100, departmentId: '', name: keyword });
        if (resp.data.code === 200) {
            positions.value = (resp.data.data?.list || []).map((p: any) => ({
                id: p.id,
                positionName: p.positionName || '未命名',
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
    } catch (e: any) {
        ElMessage.error(e.message || '分配失败');
    } finally {
        assigning.value = false;
    }
}

onMounted(load);
</script>

<style scoped>
/* 页面容器 */
.page-container {
    min-height: 100vh;
    background: #f8fafc;
    padding: 24px;
}

/* 页面头部 */
.page-header {
    margin-bottom: 24px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-title {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px;
    letter-spacing: -0.025em;
}

.page-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.btn-create {
    height: 40px;
    padding: 0 20px;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 搜索区域 */
.search-section {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px 20px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
}

.search-icon {
    color: #94a3b8;
    font-size: 18px;
}

.search-input {
    flex: 1;
}

.search-input :deep(.el-input__wrapper) {
    box-shadow: none;
    border: none;
    background: transparent;
}

.search-actions {
    display: flex;
    gap: 8px;
}

/* 主内容区 */
.main-content {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
}

/* 角色列表 */
.role-list {
    display: flex;
    flex-direction: column;
}

.role-item {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.15s ease;
}

.role-item:last-child {
    border-bottom: none;
}

.role-item:hover {
    background: #f8fafc;
}

.role-main {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 280px;
}

.role-avatar {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.role-info {
    flex: 1;
    min-width: 0;
}

.role-name {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px;
}

.role-code {
    font-size: 12px;
    font-family: 'SF Mono', Monaco, monospace;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
}

.role-status {
    flex-shrink: 0;
}

.status-badge {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 20px;
}

.status-badge.active {
    background: #dcfce7;
    color: #16a34a;
}

.status-badge.inactive {
    background: #f1f5f9;
    color: #64748b;
}

/* 权限区域 */
.role-perms {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.perms-label {
    font-size: 13px;
    color: #94a3b8;
    flex-shrink: 0;
}

.perms-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
    min-width: 0;
}

.perm-tag {
    font-size: 12px;
    color: #475569;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
}

.perm-more {
    font-size: 12px;
    color: #6366f1;
    background: #eef2ff;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 500;
}

.no-perms {
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
}

/* 操作按钮 */
.role-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

.action-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.15s ease;
}

.action-btn:hover {
    background: #f1f5f9;
    color: #3b82f6;
}

.action-btn.danger:hover {
    background: #fef2f2;
    color: #ef4444;
}

/* 空状态 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
}

.empty-icon {
    font-size: 48px;
    color: #cbd5e1;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 15px;
    color: #64748b;
    margin: 0 0 20px;
}

/* 抽屉样式 */
.role-drawer :deep(.el-drawer__header) {
    padding: 20px 24px;
    margin-bottom: 0;
    border-bottom: 1px solid #e2e8f0;
}

.role-drawer :deep(.el-drawer__body) {
    padding: 24px;
}

.role-form :deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
}

.perm-tree-box {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    max-height: 300px;
    overflow-y: auto;
    background: #f8fafc;
}

.drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 响应式 */
@media (max-width: 1024px) {
    .role-item {
        flex-wrap: wrap;
    }

    .role-main {
        min-width: 100%;
    }

    .role-perms {
        width: 100%;
        padding-left: 60px;
    }

    .role-actions {
        margin-left: auto;
    }
}

@media (max-width: 768px) {
    .page-container {
        padding: 16px;
    }

    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .btn-create {
        width: 100%;
        justify-content: center;
    }

    .search-section {
        flex-direction: column;
        align-items: stretch;
    }

    .search-box {
        max-width: none;
    }

    .search-actions {
        justify-content: flex-end;
    }

    .role-item {
        padding: 16px;
    }

    .role-perms {
        padding-left: 0;
    }
}
</style>
