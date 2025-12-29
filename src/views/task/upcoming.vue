<template>
    <div class="upcoming-page">
        <el-card shadow="hover">
            <template #header>
                <div class="card-header">
                    <div class="card-header-title">即将到期任务（7天内）</div>
                    <div class="card-header-desc">按截止时间升序展示</div>
                </div>
            </template>
            <div v-if="list.length === 0" class="empty-wrap"><el-empty description="暂无即将到期任务" /></div>
            <div v-else>
                <div class="up-item" v-for="u in list" :key="u.id">
                    <div class="up-title">
                        <span class="ellipsis">{{ u.name }}</span>
                        <el-tag :type="u.urgencyType" size="small">{{ u.urgencyText }}</el-tag>
                    </div>
                    <div class="up-sub">截止：{{ u.endLabel }}（剩余{{ u.leftDays }}天）</div>
                    <el-progress :percentage="u.progress" :stroke-width="8" :status="u.progressStatus" />
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getMyTaskNodes } from '@/api';
import { ElMessage } from 'element-plus';

interface UItem { 
    id: string; 
    name: string; 
    end: number; 
    endLabel: string; 
    leftDays: number; 
    urgencyText: string; 
    urgencyType: string; 
    progress: number; 
    progressStatus?: string;
}

const list = ref<UItem[]>([]);

function priorityToTag(nodeType?: number) {
    switch (nodeType) {
        case 1: return { text: '紧急', type: 'danger' };
        case 2: return { text: '高', type: 'warning' };
        case 3: return { text: '中', type: 'info' };
        default: return { text: '低', type: '' };
    }
}

onMounted(async () => {
    try {
        const res = await getMyTaskNodes({ page: 1, pageSize: 1000 });
        // 检查响应结构（后端成功 code 为 200）
        if (res.data.code !== 200) {
            console.error('API返回错误:', res.data.msg || '未知错误');
            ElMessage.error(res.data.msg || '加载数据失败');
            list.value = [];
            return;
        }
        
        const responseData = res.data?.data || res.data || {};
        const executorTasks = responseData.executor_task || [];
        const leaderTasks = responseData.leader_task || [];
        const allTasks = [...executorTasks, ...leaderTasks];
        
        const now = Date.now();
        const seven = 7 * 24 * 3600 * 1000;
        
        list.value = allTasks
            .map((t: any) => {
                const deadline = t.nodeDeadline || t.endTime || t.deadline;
                if (!deadline) return null;
                
                const end = Date.parse(deadline);
                if (isNaN(end)) return null;
                
                const left = Math.ceil((end - now) / (24 * 3600 * 1000));
                const pr = priorityToTag(t.nodeType || t.priority);
                const progress = t.progress ?? 0;
                
                return {
                    id: t.id || t.taskNodeId,
                    name: t.nodeName || t.taskNodeName || '未命名任务',
                    end,
                    endLabel: new Date(end).toLocaleString(),
                    leftDays: left,
                    urgencyText: pr.text,
                    urgencyType: pr.type,
                    progress,
                    progressStatus: left < 0 && progress < 100 ? 'exception' : left <= 1 && progress < 100 ? 'warning' : undefined,
                } as UItem;
            })
            .filter((u): u is UItem => {
                if (!u) return false;
                return u.end - now <= seven && u.leftDays >= -3;
            })
            .sort((a, b) => a.end - b.end);
    } catch (error: any) {
        console.error('加载即将到期任务失败:', error);
        ElMessage.error('加载数据失败: ' + (error.message || '未知错误'));
        list.value = [];
    }
});
</script>

<style scoped>
.upcoming-page { padding: 8px; }
.card-header-title { font-weight: 600; }
.card-header-desc { color: #909399; font-size: 12px; }
.up-item { margin-bottom: 16px; }
.up-title { display: flex; justify-content: space-between; align-items: center; font-weight: 500; }
.up-sub { color: #909399; font-size: 12px; margin: 4px 0 8px; }
.ellipsis { max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-wrap { padding: 24px 0; }
</style>


