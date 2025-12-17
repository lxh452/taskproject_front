<template>
    <div class="task-checklist">
        <!-- 标题和统计 -->
        <div class="checklist-header">
            <div class="header-left">
                <el-icon class="header-icon"><List /></el-icon>
                <span class="header-title">任务清单</span>
                <el-tag size="small" type="info" v-if="stats.totalCount > 0" class="stats-tag">
                    {{ stats.completedCount }}/{{ stats.totalCount }}
                </el-tag>
            </div>
            <div class="header-right">
                <el-progress 
                    v-if="stats.totalCount > 0"
                    :percentage="stats.progress" 
                    :status="stats.progress === 100 ? 'success' : undefined"
                    :stroke-width="6"
                    class="progress-bar"
                />
                <!-- 提交审批按钮：当清单100%完成且节点状态为进行中时显示 -->
                <el-button 
                    v-if="canSubmitApproval"
                    type="success" 
                    size="small" 
                    @click="handleSubmitApproval"
                    class="submit-btn"
                >
                    提交审批
                </el-button>
                <el-button 
                    type="primary" 
                    size="small" 
                    :icon="Plus" 
                    @click="showAddDialog"
                    v-if="canAdd"
                    class="add-btn"
                >
                    添加
                </el-button>
                <el-tooltip v-else content="只有执行人可以添加清单" placement="top">
                    <el-button 
                        type="info" 
                        size="small" 
                        :icon="Plus" 
                        disabled
                        class="add-btn"
                    >
                        添加
                    </el-button>
                </el-tooltip>
            </div>
        </div>

        <!-- 清单列表 -->
        <div class="checklist-content" v-loading="loading">
            <div v-if="checklistItems.length === 0" class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-text">暂无清单项</div>
                <el-button 
                    v-if="canAdd"
                    type="primary" 
                    size="small" 
                    @click="showAddDialog"
                >
                    添加第一个清单
                </el-button>
            </div>
            
            <div v-else class="checklist-list">
                <div 
                    v-for="item in checklistItems"
                    :key="item.id"
                    class="checklist-item" 
                    :class="{ 
                        'completed': item.isCompleted === 1, 
                        'own-item': item.creatorId === currentEmployeeId 
                    }"
                >
                    <div class="item-left">
                        <el-checkbox 
                            :model-value="item.isCompleted === 1"
                            @change="(val) => toggleComplete(item, val)"
                            :disabled="item.creatorId !== currentEmployeeId"
                            class="item-checkbox"
                        />
                        <div class="item-content">
                            <span 
                                v-if="!item.editing" 
                                class="content-text"
                                :class="{ 'completed-text': item.isCompleted === 1 }"
                            >
                                {{ item.content }}
                            </span>
                            <el-input 
                                v-else
                                v-model="item.editContent"
                                size="small"
                                @keyup.enter="saveEdit(item)"
                                @blur="saveEdit(item)"
                                class="edit-input"
                            />
                        </div>
                    </div>
                    <div class="item-right">
                        <div class="creator-info">
                            <el-avatar :size="20" class="creator-avatar">
                                {{ item.creatorName?.[0] || 'U' }}
                            </el-avatar>
                            <span class="creator-name">{{ item.creatorName || '未知' }}</span>
                        </div>
                        <div class="item-actions" v-if="item.creatorId === currentEmployeeId">
                            <el-button 
                                link 
                                type="primary" 
                                size="small"
                                @click.stop="startEdit(item)"
                                v-if="!item.editing"
                            >
                                <el-icon><Edit /></el-icon>
                            </el-button>
                            <el-button 
                                link 
                                type="danger" 
                                size="small"
                                @click.stop="deleteItem(item)"
                            >
                                <el-icon><Delete /></el-icon>
                            </el-button>
                        </div>
                        <el-tooltip v-else content="只有创建者可以编辑" placement="top">
                            <el-icon class="lock-icon"><Lock /></el-icon>
                        </el-tooltip>
                    </div>
                </div>
            </div>
        </div>

        <!-- 添加清单对话框 - 使用 append-to-body 避免定位问题 -->
        <el-dialog 
            v-model="addDialogVisible" 
            title="添加清单项" 
            width="480px"
            :close-on-click-modal="false"
            append-to-body
            destroy-on-close
            class="checklist-dialog"
        >
            <div class="dialog-content">
                <div class="dialog-icon">📋</div>
                <el-input 
                    v-model="addForm.content" 
                    type="textarea" 
                    :rows="4"
                    placeholder="请输入清单内容，例如：完成设计稿审核"
                    maxlength="500"
                    show-word-limit
                    class="content-input"
                />
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="addDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="addItem" :loading="submitting">
                        添加清单
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { List, Plus, Edit, Delete, Lock } from '@element-plus/icons-vue';
import { 
    getChecklistList, 
    createChecklist, 
    updateChecklist, 
    deleteChecklist,
    submitTaskNodeCompletionApproval
} from '@/api';

// Props
const props = defineProps<{
    taskNodeId: string;
    currentEmployeeId: string;
    canAdd?: boolean;
    nodeStatus?: number; // 节点状态：0-待处理，1-进行中，2-已完成，3-已逾期，4-待审批
    nodeProgress?: number; // 节点进度
}>();

// Emits
const emit = defineEmits<{
    (e: 'progress-change', progress: number): void;
    (e: 'approval-submitted'): void; // 审批提交后触发
}>();

// 状态
const loading = ref(false);
const submitting = ref(false);
const addDialogVisible = ref(false);
const checklistItems = ref<any[]>([]);
const stats = ref({
    totalCount: 0,
    completedCount: 0,
    progress: 0
});

// 是否可以提交审批：节点状态为进行中（1），进度100%，且当前用户是执行人
const canSubmitApproval = computed(() => {
    if (!props.currentEmployeeId) return false;
    // 检查清单进度是否100%
    if (stats.value.progress < 100 || stats.value.totalCount === 0) return false;
    // 检查节点状态是否为进行中（1）
    if (props.nodeStatus !== undefined && props.nodeStatus !== 1) return false;
    // 检查节点进度是否100%（如果有传入）
    if (props.nodeProgress !== undefined && props.nodeProgress < 100) return false;
    return true;
});
const addForm = ref({
    content: ''
});

// 加载清单列表
async function loadChecklists() {
    if (!props.taskNodeId) return;
    
    loading.value = true;
    try {
        const resp = await getChecklistList({ 
            taskNodeId: props.taskNodeId,
            page: 1,
            pageSize: 100
        });
        
        if (resp.data.code === 200) {
            const data = resp.data.data || {};
            checklistItems.value = (data.list || []).map((item: any) => ({
                ...item,
                editing: false,
                editContent: item.content
            }));
            stats.value = data.stats || {
                totalCount: 0,
                completedCount: 0,
                progress: 0
            };
            emit('progress-change', stats.value.progress);
        } else {
            console.error('加载清单失败:', resp.data.msg);
        }
    } catch (error: any) {
        console.error('加载清单失败:', error);
    } finally {
        loading.value = false;
    }
}

// 显示添加对话框
function showAddDialog() {
    addForm.value.content = '';
    addDialogVisible.value = true;
}

// 添加清单项
async function addItem() {
    if (!addForm.value.content.trim()) {
        ElMessage.warning('请输入清单内容');
        return;
    }
    
    submitting.value = true;
    try {
        const resp = await createChecklist({
            taskNodeId: props.taskNodeId,
            content: addForm.value.content.trim(),
            sortOrder: checklistItems.value.length
        });
        
        if (resp.data.code === 200) {
            ElMessage.success('添加成功');
            addDialogVisible.value = false;
            await loadChecklists();
        } else {
            ElMessage.error(resp.data.msg || '添加失败');
        }
    } catch (error: any) {
        ElMessage.error('添加失败: ' + (error.message || '未知错误'));
    } finally {
        submitting.value = false;
    }
}

// 切换完成状态
async function toggleComplete(item: any, completed: boolean | string | number) {
    if (item.creatorId !== props.currentEmployeeId) {
        ElMessage.warning('只有创建者可以修改清单状态');
        return;
    }
    
    try {
        const isCompleted = completed ? 1 : 0;
        const resp = await updateChecklist({
            checklistId: item.id,
            isCompleted
        });
        
        if (resp.data.code === 200) {
            item.isCompleted = isCompleted;
            await loadChecklists(); // 重新加载以更新统计
        } else {
            ElMessage.error(resp.data.msg || '更新失败');
        }
    } catch (error: any) {
        ElMessage.error('更新失败: ' + (error.message || '未知错误'));
    }
}

// 开始编辑
function startEdit(item: any) {
    item.editContent = item.content;
    item.editing = true;
}

// 保存编辑
async function saveEdit(item: any) {
    if (!item.editing) return;
    
    const newContent = item.editContent.trim();
    if (!newContent) {
        item.editing = false;
        item.editContent = item.content;
        return;
    }
    
    if (newContent === item.content) {
        item.editing = false;
        return;
    }
    
    try {
        const resp = await updateChecklist({
            checklistId: item.id,
            content: newContent
        });
        
        if (resp.data.code === 200) {
            item.content = newContent;
            ElMessage.success('保存成功');
        } else {
            ElMessage.error(resp.data.msg || '保存失败');
            item.editContent = item.content;
        }
    } catch (error: any) {
        ElMessage.error('保存失败: ' + (error.message || '未知错误'));
        item.editContent = item.content;
    } finally {
        item.editing = false;
    }
}

// 删除清单项
async function deleteItem(item: any) {
    try {
        await ElMessageBox.confirm(
            `确定要删除清单项 "${item.content.substring(0, 20)}${item.content.length > 20 ? '...' : ''}" 吗？`,
            '确认删除',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );
        
        const resp = await deleteChecklist({ checklistId: item.id });
        
        if (resp.data.code === 200) {
            ElMessage.success('删除成功');
            await loadChecklists();
        } else {
            ElMessage.error(resp.data.msg || '删除失败');
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败: ' + (error.message || '未知错误'));
        }
    }
}

// 提交审批
async function handleSubmitApproval() {
    if (!props.taskNodeId) {
        ElMessage.error('任务节点ID不能为空');
        return;
    }

    try {
        await ElMessageBox.confirm(
            '确定要提交任务节点完成审批吗？提交后需要等待项目负责人审批。',
            '确认提交审批',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
            }
        );

        const resp = await submitTaskNodeCompletionApproval({ nodeId: props.taskNodeId });
        if (resp.data.code === 200) {
            ElMessage.success('提交审批成功，等待项目负责人审批');
            emit('approval-submitted');
        } else {
            ElMessage.error(resp.data.msg || '提交审批失败');
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('提交审批失败:', error);
            ElMessage.error('提交审批失败');
        }
    }
}

// 监听taskNodeId变化
watch(() => props.taskNodeId, (newVal) => {
    if (newVal) {
        loadChecklists();
    }
}, { immediate: true });

// 暴露刷新方法
defineExpose({
    refresh: loadChecklists
});
</script>

<style scoped>
.task-checklist {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
}

.checklist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: linear-gradient(135deg, #fafbfc 0%, #f3f4f6 100%);
    border-bottom: 1px solid #e5e7eb;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-icon {
    font-size: 16px;
    color: #6366f1;
}

.header-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
}

.stats-tag {
    background: #eef2ff;
    color: #6366f1;
    border: none;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.progress-bar {
    width: 100px;
}

.add-btn {
    border-radius: 6px;
}

.submit-btn {
    border-radius: 6px;
    margin-right: 8px;
}

.checklist-content {
    padding: 12px;
    min-height: 80px;
    max-height: 300px;
    overflow-y: auto;
}

.checklist-content::-webkit-scrollbar {
    width: 4px;
}

.checklist-content::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.checklist-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    text-align: center;
}

.empty-icon {
    font-size: 32px;
    margin-bottom: 8px;
}

.empty-text {
    font-size: 13px;
    color: #9ca3af;
    margin-bottom: 12px;
}

.checklist-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.checklist-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.checklist-item:hover {
    border-color: #c7d2fe;
    background: #fafbff;
}

.checklist-item.completed {
    background: #f0fdf4;
    border-color: #bbf7d0;
}

.checklist-item.own-item {
    border-left: 3px solid #6366f1;
}

.item-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
}

.item-checkbox {
    flex-shrink: 0;
}

.item-content {
    flex: 1;
    min-width: 0;
}

.content-text {
    font-size: 13px;
    color: #374151;
    word-break: break-word;
    line-height: 1.4;
}

.completed-text {
    text-decoration: line-through;
    color: #9ca3af;
}

.edit-input {
    width: 100%;
}

.item-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}

.creator-info {
    display: flex;
    align-items: center;
    gap: 4px;
}

.creator-avatar {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-size: 10px;
    flex-shrink: 0;
}

.creator-name {
    font-size: 11px;
    color: #9ca3af;
    max-width: 50px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.checklist-item:hover .item-actions {
    opacity: 1;
}

.lock-icon {
    font-size: 12px;
    color: #d1d5db;
}

/* 对话框样式 */
:deep(.checklist-dialog) {
    border-radius: 16px;
}

:deep(.checklist-dialog .el-dialog__header) {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f0f0f0;
    margin-right: 0;
}

:deep(.checklist-dialog .el-dialog__title) {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

:deep(.checklist-dialog .el-dialog__body) {
    padding: 20px 24px;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.dialog-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.content-input {
    width: 100%;
}

.content-input :deep(.el-textarea__inner) {
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    line-height: 1.5;
}

.content-input :deep(.el-textarea__inner:focus) {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.dialog-footer .el-button {
    border-radius: 8px;
    padding: 8px 20px;
}

/* 响应式 */
@media (max-width: 640px) {
    .checklist-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }
    
    .header-right {
        width: 100%;
        justify-content: space-between;
    }
    
    .creator-info {
        display: none;
    }
    
    .item-actions {
        opacity: 1;
    }
}
</style>
