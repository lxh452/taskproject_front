<template>
    <div class="file-preview-page" :class="{ 'dark-mode': isDarkMode }">
        <!-- 顶部工具栏 -->
        <header class="preview-header">
            <div class="header-left">
                <el-button class="back-btn" @click="goBack">
                    <el-icon><ArrowLeft /></el-icon>
                    <span>返回</span>
                </el-button>
                <div class="header-divider"></div>
                <div class="file-info">
                    <div class="file-icon" :class="`type-${fileIconType}`">
                        <el-icon><Document /></el-icon>
                    </div>
                    <div class="file-meta">
                        <h1 class="file-name">{{ fileInfo?.fileName || route.query.fileName || '文件预览' }}</h1>
                        <p class="file-size" v-if="fileInfo?.fileSize">{{ formatFileSize(fileInfo.fileSize) }}</p>
                </div>
            </div>
            </div>
            <div class="header-right">
                <!-- 主题切换 -->
                <el-tooltip :content="isDarkMode ? '切换到浅色模式' : '切换到深色模式'" placement="bottom">
                    <button class="icon-btn theme-btn" @click="toggleTheme">
                        <el-icon v-if="isDarkMode"><Sunny /></el-icon>
                        <el-icon v-else><Moon /></el-icon>
                    </button>
                </el-tooltip>
                <!-- Excel工作表 -->
                <el-select 
                    v-if="isExcel && excelSheets.length > 1" 
                    v-model="currentSheet" 
                    size="default"
                    class="sheet-select"
                    @change="onSheetChange"
                >
                    <el-option v-for="sheet in excelSheets" :key="sheet" :label="sheet" :value="sheet" />
                </el-select>
                <!-- 下载按钮 -->
                <el-button type="primary" @click="downloadFile">
                    <el-icon><Download /></el-icon>
                    <span>下载文件</span>
                </el-button>
            </div>
        </header>

        <!-- 主内容区 -->
        <main class="preview-main" v-loading="loading">
            <!-- 文件内容区 -->
            <section class="content-section">
                <!-- 图片预览 -->
                <div v-if="isImage" class="preview-image">
                    <div v-if="!imageBlobUrl" class="loading-state">
                        <el-icon class="loading-spinner"><Loading /></el-icon>
                        <span>正在加载图片...</span>
                    </div>
                    <img v-else :src="imageBlobUrl" :alt="fileInfo?.fileName" />
                </div>
                
                <!-- PDF预览 -->
                <div v-else-if="isPdf" class="preview-pdf">
                    <div v-if="!pdfBlobUrl" class="loading-state">
                        <el-icon class="loading-spinner"><Loading /></el-icon>
                        <span>正在加载PDF...</span>
                    </div>
                    <iframe v-else :src="pdfBlobUrl" frameborder="0"></iframe>
                </div>

                <!-- Markdown预览 -->
                <div v-else-if="isMarkdown" class="preview-markdown">
                    <article class="markdown-body" v-html="markdownHtml"></article>
                </div>

                <!-- Word文档预览 -->
                <div v-else-if="isWord" class="preview-document">
                    <div v-if="wordLoading" class="loading-state">
                        <el-icon class="loading-spinner"><Loading /></el-icon>
                        <span>正在解析文档...</span>
                    </div>
                    <div v-else-if="wordError" class="error-state">
                        <el-icon><WarningFilled /></el-icon>
                        <p>{{ wordError }}</p>
                        <el-button type="primary" @click="downloadFile">下载查看</el-button>
                    </div>
                    <article v-else class="document-body" v-html="wordHtml"></article>
                </div>

                <!-- Excel表格预览 -->
                <div v-else-if="isExcel" class="preview-excel">
                    <div v-if="excelLoading" class="loading-state">
                        <el-icon class="loading-spinner"><Loading /></el-icon>
                        <span>正在解析表格...</span>
                    </div>
                    <div v-else-if="excelError" class="error-state">
                        <el-icon><WarningFilled /></el-icon>
                        <p>{{ excelError }}</p>
                        <el-button type="primary" @click="downloadFile">下载查看</el-button>
                    </div>
                    <div v-else class="excel-wrapper">
                        <table class="excel-table">
                            <thead>
                                <tr>
                                    <th class="row-num">#</th>
                                    <th v-for="(col, idx) in excelHeaders" :key="idx">{{ col }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(row, rowIdx) in excelData" :key="rowIdx">
                                    <td class="row-num">{{ rowIdx + 1 }}</td>
                                    <td v-for="(cell, cellIdx) in row" :key="cellIdx">{{ cell }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- 代码预览 -->
                <div v-else-if="isTextFile" class="preview-code">
                    <div class="code-toolbar">
                        <span class="code-lang">{{ fileLanguage }}</span>
                        <span class="code-info">{{ fileLines.length }} 行</span>
                    </div>
                    <div class="code-container" ref="codeContainerRef">
                        <div 
                            v-for="(line, index) in fileLines" 
                            :key="index"
                            class="code-line"
                            :class="{ 
                                'has-comment': lineHasComment(index + 1),
                                'expanded': expandedCommentLine === index + 1
                            }"
                        >
                            <div class="line-gutter" @click="toggleLineComment(index + 1)">
                                <span class="line-num">{{ index + 1 }}</span>
                                <span v-if="getLineCommentCount(index + 1) > 0" class="comment-badge">
                                    {{ getLineCommentCount(index + 1) }}
                                </span>
                            </div>
                            <div class="line-code">
                                <pre>{{ line || ' ' }}</pre>
                            </div>
                            <button class="line-action" @click="openCommentInput(index + 1)">
                                    <el-icon><ChatDotRound /></el-icon>
                            </button>
                            
                            <!-- 行评论展开区 -->
                            <div v-if="expandedCommentLine === index + 1" class="line-comments-panel">
                                <div class="comments-thread">
                                    <div v-for="comment in getLineComments(index + 1)" :key="comment.commentId" class="thread-comment">
                                        <el-avatar :size="32" class="comment-avatar">
                                            {{ getAvatarText(comment.userId, comment.employeeName) }}
                                        </el-avatar>
                                        <div class="comment-bubble">
                                            <div class="bubble-header">
                                                <span class="author">{{ comment.employeeName || getEmployeeName(comment.userId) || '匿名' }}</span>
                                                <span class="time">{{ formatTime(comment.createTime) }}</span>
                                            </div>
                                            <div class="bubble-content" v-html="renderCommentContent(comment.content)"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="comment-composer" v-if="commentingLine === index + 1">
                                    <el-input
                                        v-model="newLineComment"
                                        type="textarea"
                                        :rows="2"
                                        :placeholder="`在第 ${index + 1} 行添加评论...`"
                                        resize="none"
                                    />
                                    <div class="composer-actions">
                                        <el-button size="small" @click="cancelLineComment">取消</el-button>
                                        <el-button type="primary" size="small" @click="submitLineComment(index + 1)" :loading="submittingComment">
                                            发送
                                        </el-button>
                                    </div>
                                </div>
                                <el-button v-else link type="primary" @click="openCommentInput(index + 1)" class="add-reply-btn">
                                    <el-icon><Plus /></el-icon> 添加评论
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 不支持的文件 -->
                <div v-else class="preview-unsupported">
                    <div class="unsupported-content">
                    <div class="unsupported-icon">
                        <el-icon><Document /></el-icon>
                    </div>
                        <h2>{{ fileInfo?.fileName }}</h2>
                        <p>该文件类型暂不支持在线预览</p>
                        <el-button type="primary" size="large" @click="downloadFile">
                        <el-icon><Download /></el-icon>
                        下载文件
                    </el-button>
                </div>
            </div>
            </section>
            
            <!-- 评论侧边栏 -->
            <aside class="comments-sidebar">
                <div class="sidebar-header">
                    <h2>
                    <el-icon><ChatDotRound /></el-icon>
                        评论
                        <span class="count">{{ filteredComments.length }}</span>
                    </h2>
                    <el-select v-if="taskNodes.length > 0" v-model="commentNodeFilter" placeholder="筛选" clearable size="small" class="filter-select">
                        <el-option label="全部" value="" />
                        <el-option v-for="node in taskNodes" :key="node.id || node.taskNodeId" :label="node.nodeName" :value="node.id || node.taskNodeId" />
                    </el-select>
                </div>
                
                <div class="comments-list" ref="commentsListRef">
                    <div v-for="comment in filteredComments" :key="comment.commentId" class="comment-item" @click="scrollToLine(comment.lineNumber)">
                        <el-avatar :size="36" class="comment-avatar">
                            {{ getAvatarText(comment.userId, comment.employeeName) }}
                        </el-avatar>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">{{ comment.employeeName || getEmployeeName(comment.userId) || '匿名' }}</span>
                                <el-tag 
                                    v-if="comment.lineNumber" 
                                    size="small" 
                                    type="warning"
                                    class="comment-line-tag"
                                >
                                    <el-icon><Document /></el-icon>
                                    第{{ comment.lineNumber }}行
                                </el-tag>
                                <el-tag 
                                    v-if="comment.taskNodeId" 
                                    size="small" 
                                    type="info"
                                    class="comment-node-tag"
                                >
                                    <el-icon><List /></el-icon>
                                    {{ getNodeName(comment.taskNodeId) }}
                                </el-tag>
                                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                            </div>
                            <div class="comment-text" v-html="renderCommentContent(comment.content)"></div>
                            <div class="comment-footer">
                                <el-button link size="small" @click.stop>
                                    <el-icon><Star /></el-icon>
                                    {{ comment.likeCount || 0 }}
                                </el-button>
                                <el-button link size="small" @click.stop>
                                    回复
                                </el-button>
                            </div>
                        </div>
                    </div>
                    <el-empty v-if="filteredComments.length === 0" description="暂无评论" :image-size="80" />
                </div>
                
                <!-- 评论输入框 -->
                <div class="comment-input-box">
                    <div class="input-header">
                        <span>发表评论</span>
                        <el-select v-if="taskNodes.length > 0" v-model="sidebarCommentNodeId" placeholder="关联节点" clearable size="small" class="node-select">
                            <el-option v-for="node in taskNodes" :key="node.id || node.taskNodeId" :label="node.nodeName" :value="node.id || node.taskNodeId" />
                        </el-select>
                        </div>
                    <div class="input-body">
                        <el-input
                            ref="sidebarCommentInputRef"
                            v-model="sidebarComment"
                            type="textarea"
                            :rows="3"
                            placeholder="写下你的评论..."
                            resize="none"
                            @input="onSidebarCommentInput"
                            @keydown="onSidebarCommentKeydown"
                            @blur="onSidebarCommentBlur"
                        />
                            </div>
                    <div class="input-footer">
                        <el-button size="small" @click="showSidebarMentionSelector">
                            <el-icon><User /></el-icon>
                            @提及
                        </el-button>
                        <el-button type="primary" size="small" @click="submitSidebarComment" :loading="submittingSidebarComment">
                            发送
                        </el-button>
                        </div>
                    </div>

                <!-- @提及弹窗 -->
                <div v-if="showSidebarMentionList" class="mention-popup" :style="{ top: mentionListPosition.top + 'px', left: mentionListPosition.left + 'px' }">
                    <div class="mention-header">
                        <el-icon><User /></el-icon>
                        选择成员
                </div>
                    <div class="mention-body">
                        <div v-for="emp in filteredMentionEmployees" :key="emp.id" class="mention-item" @click="insertSidebarMention(emp)">
                            <el-avatar :size="28">{{ emp.name?.[0] || 'U' }}</el-avatar>
                            <span>{{ emp.name }}</span>
            </div>
                        <div v-if="filteredMentionEmployees.length === 0" class="mention-empty">没有匹配的成员</div>
        </div>
                </div>
            </aside>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Document, Download, ChatDotRound, Plus, Loading, WarningFilled, User, Sunny, Moon, Star, List } from '@element-plus/icons-vue';
import { getTask, getAttachmentComments, createAttachmentComment, listEmployees, getMyEmployee } from '@/api';
import { useUserStore } from '@/store/user';
import request from '@/utils/request';
import { marked } from 'marked';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { getFileUrl } from '@/utils/fileUrl';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 主题
const isDarkMode = ref(false);
function initTheme() {
    const saved = localStorage.getItem('app-theme');
    isDarkMode.value = saved === 'dark';
    applyTheme();
}
function toggleTheme() {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('app-theme', isDarkMode.value ? 'dark' : 'light');
    applyTheme();
}
function applyTheme() {
    if (isDarkMode.value) {
        document.documentElement.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
    }
}

const loading = ref(false);
const fileInfo = ref<any>(null);
const fileContent = ref('');
const allComments = ref<any[]>([]);
const taskNodes = ref<any[]>([]);
const employeesMap = ref<Record<string, any>>({});
const imageBlobUrl = ref<string>('');
const pdfBlobUrl = ref<string>('');

// 文档解析
const markdownHtml = ref('');
const wordLoading = ref(false);
const wordError = ref('');
const wordHtml = ref('');
const excelLoading = ref(false);
const excelError = ref('');
const excelSheets = ref<string[]>([]);
const currentSheet = ref('');
const excelData = ref<any[][]>([]);
const excelHeaders = ref<string[]>([]);
const excelWorkbook = ref<any>(null);

// 评论
const expandedCommentLine = ref<number | null>(null);
const commentingLine = ref<number | null>(null);
const newLineComment = ref('');
const newCommentNodeId = ref('');
const submittingComment = ref(false);
const commentNodeFilter = ref('');
const codeContainerRef = ref<HTMLElement | null>(null);
const commentsListRef = ref<HTMLElement | null>(null);

// 侧边栏评论
const sidebarComment = ref('');
const sidebarCommentNodeId = ref('');
const submittingSidebarComment = ref(false);
const sidebarCommentInputRef = ref<HTMLTextAreaElement | null>(null);
const showSidebarMentionList = ref(false);
const mentionFilter = ref('');
const mentionListPosition = ref({ top: 0, left: 0 });

// 文件类型
const fileIconType = computed(() => {
    const fileName = fileInfo.value?.fileName || route.query.fileName as string || '';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    if (['txt', 'md', 'js', 'ts', 'vue', 'py', 'go', 'java', 'c', 'cpp', 'h', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'html'].includes(ext)) return 'text';
    return 'other';
});

const isImage = computed(() => fileInfo.value?.fileType?.includes('image'));
const isPdf = computed(() => fileInfo.value?.fileType?.includes('pdf'));
const isMarkdown = computed(() => {
    const ext = (fileInfo.value?.fileName || '').split('.').pop()?.toLowerCase();
    return ext === 'md' || ext === 'markdown';
});
const isWord = computed(() => {
    const ext = (fileInfo.value?.fileName || '').split('.').pop()?.toLowerCase();
    return ['doc', 'docx'].includes(ext || '');
});
const isExcel = computed(() => {
    const ext = (fileInfo.value?.fileName || '').split('.').pop()?.toLowerCase();
    return ['xls', 'xlsx', 'csv'].includes(ext || '');
});
const isTextFile = computed(() => {
    const ext = (fileInfo.value?.fileName || '').split('.').pop()?.toLowerCase();
    if (['md', 'markdown', 'doc', 'docx', 'xls', 'xlsx', 'csv'].includes(ext || '')) return false;
    const textExts = ['txt', 'js', 'ts', 'vue', 'py', 'go', 'java', 'c', 'cpp', 'h', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'html', 'jsx', 'tsx', 'sql', 'sh', 'php', 'rb', 'rs', 'swift', 'kt', 'log', 'ini', 'conf', 'env'];
    return textExts.includes(ext || '');
});

const fileLanguage = computed(() => {
    const ext = (fileInfo.value?.fileName || '').split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = { 'js': 'JavaScript', 'ts': 'TypeScript', 'vue': 'Vue', 'py': 'Python', 'go': 'Go', 'java': 'Java', 'json': 'JSON', 'html': 'HTML', 'css': 'CSS', 'sql': 'SQL' };
    return map[ext] || ext.toUpperCase();
});

const fileLines = computed(() => fileContent.value ? fileContent.value.split('\n') : []);
const filteredComments = computed(() => commentNodeFilter.value ? allComments.value.filter(c => c.taskNodeId === commentNodeFilter.value) : allComments.value);
const filteredMentionEmployees = computed(() => {
    const emps = Object.values(employeesMap.value);
    if (!mentionFilter.value) return emps;
    return emps.filter((e: any) => e.name?.toLowerCase().includes(mentionFilter.value.toLowerCase()));
});

// 辅助函数
function lineHasComment(ln: number) { return allComments.value.some(c => c.lineNumber === ln); }
function getLineCommentCount(ln: number) { return allComments.value.filter(c => c.lineNumber === ln).length; }
function getLineComments(ln: number) { return allComments.value.filter(c => c.lineNumber === ln); }
function getNodeName(nodeId: string) { return taskNodes.value.find(n => (n.id || n.taskNodeId) === nodeId)?.nodeName || ''; }
function getEmployeeName(id: string) { return employeesMap.value[String(id)]?.name || ''; }
function getEmployeeAvatar(id: string) { return employeesMap.value[String(id)]?.avatar || ''; }
function getAvatarText(id: string, fallback?: string) { return (employeesMap.value[String(id)]?.name || fallback || '未')[0] || 'U'; }
function renderCommentContent(content: string) { return content ? content.replace(/@(\S+)/g, '<span class="mention">@$1</span>') : ''; }
function formatTime(time: string) {
    if (!time) return '';
    try {
        const d = new Date(time);
        return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return time; }
}
function formatFileSize(bytes: number) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function goBack() { router.go(-1); }
async function downloadFile() {
    if (!fileInfo.value?.fileId) return;
    
    try {
        // 通过fetch获取文件内容（携带token）
        const url = getFileUrl(fileInfo.value.fileUrl, fileInfo.value.fileId);
        const response = await fetchWithToken(url);
        
        if (!response.ok) {
            ElMessage.error('下载文件失败');
            return;
        }
        
        // 创建blob并下载
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileInfo.value.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
        console.error('下载文件失败:', error);
        ElMessage.error('下载文件失败');
    }
}

function toggleLineComment(ln: number) { expandedCommentLine.value = expandedCommentLine.value === ln ? null : ln; }
function openCommentInput(ln: number) { expandedCommentLine.value = ln; commentingLine.value = ln; newLineComment.value = ''; }
function cancelLineComment() { commentingLine.value = null; newLineComment.value = ''; newCommentNodeId.value = ''; }

async function submitLineComment(ln: number) {
    if (!newLineComment.value.trim()) { ElMessage.warning('请输入评论内容'); return; }
    const fileId = route.params.fileId as string;
    if (!fileId) return;
    submittingComment.value = true;
    try {
        const resp = await createAttachmentComment({
            fileId, taskId: route.query.taskId as string, taskNodeId: newCommentNodeId.value || undefined,
            content: newLineComment.value, pageNumber: ln, annotationType: 'line_comment',
            annotationData: { lineNumber: ln, text: fileLines.value[ln - 1] || '' }
        });
        if (resp.data?.code === 200) { ElMessage.success('评论成功'); cancelLineComment(); await loadComments(); }
        else { ElMessage.error(resp.data?.msg || '评论失败'); }
    } catch { ElMessage.error('评论失败'); } finally { submittingComment.value = false; }
}

function scrollToLine(ln: number | undefined) {
    if (!ln || !codeContainerRef.value) return;
    const el = codeContainerRef.value.querySelector(`.code-line:nth-child(${ln})`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); expandedCommentLine.value = ln; }
}

// 侧边栏评论
function onSidebarCommentInput(e: any) {
    const val = sidebarComment.value;
    const pos = e.target?.selectionStart || val.length;
    const before = val.substring(0, pos);
    const atIdx = before.lastIndexOf('@');
    if (atIdx !== -1 && (atIdx === 0 || before[atIdx - 1] === ' ' || before[atIdx - 1] === '\n')) {
        const filter = before.substring(atIdx + 1);
        if (!filter.includes(' ') && !filter.includes('\n')) { mentionFilter.value = filter; showSidebarMentionSelector(); return; }
    }
    showSidebarMentionList.value = false;
}
function onSidebarCommentKeydown(e: KeyboardEvent) { if (showSidebarMentionList.value && e.key === 'Escape') { showSidebarMentionList.value = false; e.preventDefault(); } }
function onSidebarCommentBlur() { setTimeout(() => { showSidebarMentionList.value = false; }, 200); }
function showSidebarMentionSelector() {
    const el = document.querySelector('.comment-input-box .input-body');
    if (el) { const r = el.getBoundingClientRect(); mentionListPosition.value = { top: r.top - 220, left: r.left }; }
    mentionFilter.value = ''; showSidebarMentionList.value = true;
}
function insertSidebarMention(emp: any) {
    const val = sidebarComment.value;
    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1) {
        const before = val.substring(0, atIdx);
        const after = val.substring(atIdx).replace(/@[^\s]*/, '');
        sidebarComment.value = `${before}@${emp.name} ${after}`;
    } else { sidebarComment.value += `@${emp.name} `; }
    showSidebarMentionList.value = false;
}

async function submitSidebarComment() {
    if (!sidebarComment.value.trim()) { ElMessage.warning('请输入评论内容'); return; }
    const fileId = route.params.fileId as string;
    if (!fileId) return;
    submittingSidebarComment.value = true;
    try {
        const atMatches = sidebarComment.value.match(/@(\S+)/g);
        const atIds: string[] = [];
        if (atMatches) {
            for (const m of atMatches) {
                const name = m.substring(1);
                const emp = Object.values(employeesMap.value).find((e: any) => e.name === name);
                if (emp) atIds.push((emp as any).id);
            }
        }
        const resp = await createAttachmentComment({
            fileId, taskId: route.query.taskId as string, taskNodeId: sidebarCommentNodeId.value || undefined,
            content: sidebarComment.value, atEmployeeIds: atIds.length > 0 ? atIds : undefined, annotationType: 'general_comment'
        });
        if (resp.data?.code === 200) { ElMessage.success('评论成功'); sidebarComment.value = ''; sidebarCommentNodeId.value = ''; await loadComments(); }
        else { ElMessage.error(resp.data?.msg || '评论失败'); }
    } catch { ElMessage.error('评论失败'); } finally { submittingSidebarComment.value = false; }
}

// 数据加载
async function loadFileInfo() {
    const fileId = route.params.fileId as string;
    if (!fileId) return;
    loading.value = true;
    try {
        const resp = await request({ url: '/upload/file/detail', method: 'post', data: { fileId } });
        if (resp.data?.code === 200) {
            fileInfo.value = resp.data.data;
            // 使用fileId通过代理接口访问（解决CORS问题）
            if (fileInfo.value.fileId) {
                // 对于图片和PDF，需要先加载为blob URL以携带token
                if (isImage.value) await loadImage();
                else if (isPdf.value) await loadPdf();
                else if (isMarkdown.value) await loadMarkdown();
                else if (isWord.value) await loadWord();
                else if (isExcel.value) await loadExcel();
                else if (isTextFile.value) await loadText();
            }
        }
    } catch (e) { console.error('加载文件失败:', e); } finally { loading.value = false; }
}

// 获取认证token
function getAuthToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// 带token的fetch请求
async function fetchWithToken(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken();
    if (!token) {
        console.error('fetchWithToken: 未找到token，无法发送请求');
        throw new Error('未找到认证token，请先登录');
    }
    
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    
    // 调试日志
    if (import.meta.env.DEV) {
        console.log('fetchWithToken: 请求URL:', url);
        console.log('fetchWithToken: 已添加Authorization header, token长度:', token.length);
        console.log('fetchWithToken: Authorization header值:', `Bearer ${token.substring(0, 20)}...`);
    }
    
    return fetch(url, { ...options, headers });
}

// 加载图片为blob URL
async function loadImage() {
    if (!fileInfo.value?.fileId) return;
    try {
        const response = await fetchWithToken(getFileUrl(fileInfo.value.fileUrl, fileInfo.value.fileId));
        if (response.ok) {
            const blob = await response.blob();
            // 释放之前的blob URL
            if (imageBlobUrl.value) {
                URL.revokeObjectURL(imageBlobUrl.value);
            }
            imageBlobUrl.value = URL.createObjectURL(blob);
        }
    } catch (error) {
        console.error('加载图片失败:', error);
    }
}

// 加载PDF为blob URL
async function loadPdf() {
    if (!fileInfo.value?.fileId) return;
    try {
        const response = await fetchWithToken(getFileUrl(fileInfo.value.fileUrl, fileInfo.value.fileId));
        if (response.ok) {
            const blob = await response.blob();
            // 释放之前的blob URL
            if (pdfBlobUrl.value) {
                URL.revokeObjectURL(pdfBlobUrl.value);
            }
            pdfBlobUrl.value = URL.createObjectURL(blob);
        }
    } catch (error) {
        console.error('加载PDF失败:', error);
    }
}

async function loadText() {
    if (!fileInfo.value?.fileId) return;
    try { fileContent.value = await (await fetchWithToken(getFileUrl(fileInfo.value.fileUrl, fileInfo.value.fileId))).text(); }
    catch { fileContent.value = '// 无法加载文件内容'; }
}

async function loadMarkdown() {
    if (!fileInfo.value?.fileId) return;
    try {
        const txt = await (await fetchWithToken(getFileUrl(fileInfo.value.fileUrl, fileInfo.value.fileId))).text();
        fileContent.value = txt;
        marked.setOptions({ breaks: true, gfm: true });
        markdownHtml.value = marked.parse(txt) as string;
    } catch { markdownHtml.value = '<p>无法加载文件</p>'; }
}

async function loadWord() {
    if (!fileInfo.value?.fileId) return;
    wordLoading.value = true; wordError.value = '';
    try {
        const buf = await (await fetchWithToken(getFileUrl(fileInfo.value.fileUrl, fileInfo.value.fileId))).arrayBuffer();
        const res = await mammoth.convertToHtml({ arrayBuffer: buf });
        wordHtml.value = res.value;
    } catch { wordError.value = '无法解析此文档'; } finally { wordLoading.value = false; }
}

async function loadExcel() {
    if (!fileInfo.value?.fileId) return;
    excelLoading.value = true; excelError.value = '';
    try {
        const buf = await (await fetchWithToken(getFileUrl(fileInfo.value.fileUrl, fileInfo.value.fileId))).arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        excelWorkbook.value = wb; excelSheets.value = wb.SheetNames;
        if (wb.SheetNames.length > 0) { currentSheet.value = wb.SheetNames[0]; loadSheetData(wb.SheetNames[0]); }
    } catch { excelError.value = '无法解析此表格'; } finally { excelLoading.value = false; }
}

function loadSheetData(name: string) {
    if (!excelWorkbook.value) return;
    const sheet = excelWorkbook.value.Sheets[name];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    if (json.length > 0) {
        const maxCols = Math.max(...json.map(r => r.length));
        excelHeaders.value = Array.from({ length: maxCols }, (_, i) => { let l = ''; let idx = i; while (idx >= 0) { l = String.fromCharCode((idx % 26) + 65) + l; idx = Math.floor(idx / 26) - 1; } return l; });
        excelData.value = json;
    } else { excelHeaders.value = []; excelData.value = []; }
}

function onSheetChange(name: string) { loadSheetData(name); }

async function loadComments() {
    const fileId = route.params.fileId as string;
    if (!fileId) return;
    try {
        const resp = await getAttachmentComments({ fileId, page: 1, pageSize: 200 });
        if (resp.data?.code === 200) {
            allComments.value = (resp.data.data?.list || []).map((c: any) => ({ ...c, lineNumber: c.pageNumber || c.annotationData?.lineNumber }));
        }
    } catch (e) { console.error('加载评论失败:', e); }
}

async function loadTaskNodes() {
    const taskId = route.query.taskId as string;
    if (!taskId) return;
    try {
        const resp = await getTask({ taskId });
        if (resp.data?.code === 200) { taskNodes.value = resp.data.data?.nodes || []; }
    } catch (e) { console.error('加载节点失败:', e); }
}

async function loadEmployees() {
    try {
        let cid = userStore.companyId || '';
        if (!cid) { const emp = (await getMyEmployee())?.data?.data || {}; cid = emp.companyId || emp.CompanyId || ''; }
        if (cid) {
            const resp = await listEmployees({ page: 1, pageSize: 200, companyId: cid });
            if (resp.data?.code === 200) {
                (resp.data?.data?.list || []).forEach((e: any) => {
                    const id = e.id || e.employeeId || e.EmployeeId;
                    if (id) employeesMap.value[String(id)] = { id, name: e.realName || e.name || '未知', avatar: e.avatar || '' };
                });
            }
        }
    } catch (e) { console.error('加载员工失败:', e); }
}

onMounted(() => { initTheme(); loadFileInfo(); loadComments(); loadTaskNodes(); loadEmployees(); });

// 清理blob URL
onBeforeUnmount(() => {
    if (imageBlobUrl.value) {
        URL.revokeObjectURL(imageBlobUrl.value);
    }
    if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value);
    }
});
</script>

<style scoped>
/* ========== 基础变量 ========== */
.file-preview-page {
    --bg-page: #f5f7fa;
    --bg-card: #ffffff;
    --bg-hover: #f9fafb;
    --bg-code: #fafbfc;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;
    --border-color: #e5e7eb;
    --accent-color: #4f46e5;
    --accent-light: #eef2ff;
    --shadow: 0 1px 3px rgba(0,0,0,0.05);
    --shadow-lg: 0 4px 12px rgba(0,0,0,0.08);
    --radius: 12px;
    --radius-sm: 8px;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    
    min-height: 100vh;
    background: var(--bg-page);
    font-family: var(--font-sans);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
}

/* ========== 深色模式 ========== */
.file-preview-page.dark-mode {
    --bg-page: #0f172a;
    --bg-card: #1e293b;
    --bg-hover: #334155;
    --bg-code: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --border-color: #334155;
    --accent-color: #6366f1;
    --accent-light: rgba(99, 102, 241, 0.15);
    --shadow: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-lg: 0 4px 12px rgba(0,0,0,0.4);
}

/* ========== 头部 ========== */
.preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-left { display: flex; align-items: center; gap: 16px; }
.header-right { display: flex; align-items: center; gap: 12px; }

.back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}
.back-btn:hover { background: var(--accent-light); color: var(--accent-color); border-color: var(--accent-color); }

.header-divider { width: 1px; height: 32px; background: var(--border-color); }

.file-info { display: flex; align-items: center; gap: 12px; }
.file-icon {
    width: 44px; height: 44px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: white;
}
.file-icon.type-image { background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); }
.file-icon.type-pdf { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
.file-icon.type-word { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.file-icon.type-excel { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
.file-icon.type-text { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.file-icon.type-other { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }

.file-meta .file-name { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; }
.file-meta .file-size { font-size: 13px; color: var(--text-muted); margin: 2px 0 0; }

.icon-btn {
    width: 40px; height: 40px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-hover); border: 1px solid var(--border-color);
    color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
}
.icon-btn:hover { background: var(--accent-light); color: var(--accent-color); }

.sheet-select { width: 160px; }

/* ========== 主内容 ========== */
.preview-main { flex: 1; display: flex; overflow: hidden; }

.content-section { flex: 1; overflow: auto; background: var(--bg-page); }

/* 图片预览 */
.preview-image { display: flex; align-items: center; justify-content: center; min-height: 100%; padding: 40px; }
.preview-image img { max-width: 100%; max-height: calc(100vh - 200px); object-fit: contain; border-radius: var(--radius); box-shadow: var(--shadow-lg); }

/* PDF预览 */
.preview-pdf { height: 100%; }
.preview-pdf iframe { width: 100%; height: 100%; }

/* Markdown预览 */
.preview-markdown { padding: 48px; background: var(--bg-card); }
.markdown-body { max-width: 800px; margin: 0 auto; font-size: 15px; line-height: 1.8; color: var(--text-primary); }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) { margin: 24px 0 16px; font-weight: 600; }
.markdown-body :deep(h1) { font-size: 2em; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
.markdown-body :deep(h2) { font-size: 1.5em; }
.markdown-body :deep(code) { background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.9em; }
.markdown-body :deep(pre) { background: var(--bg-code); padding: 16px; border-radius: var(--radius-sm); overflow-x: auto; }
.markdown-body :deep(pre code) { background: none; padding: 0; }

/* 文档预览 */
.preview-document { padding: 48px; background: var(--bg-card); }
.document-body { max-width: 800px; margin: 0 auto; font-size: 15px; line-height: 1.8; color: var(--text-primary); }

/* 加载/错误状态 */
.loading-state, .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--text-muted); gap: 16px; }
.loading-spinner { font-size: 48px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-state { color: #ef4444; }

/* Excel预览 */
.preview-excel { height: 100%; display: flex; flex-direction: column; background: var(--bg-card); }
.excel-wrapper { flex: 1; overflow: auto; padding: 16px; }
.excel-table { border-collapse: collapse; font-size: 13px; font-family: var(--font-mono); min-width: 100%; }
.excel-table th, .excel-table td { border: 1px solid var(--border-color); padding: 10px 14px; text-align: left; white-space: nowrap; }
.excel-table th { background: var(--bg-hover); color: var(--accent-color); font-weight: 600; position: sticky; top: 0; }
.excel-table td { background: var(--bg-card); color: var(--text-primary); }
.excel-table tr:hover td { background: var(--bg-hover); }
.excel-table .row-num { background: var(--bg-hover) !important; color: var(--text-muted); text-align: center; min-width: 50px; position: sticky; left: 0; }

/* 代码预览 */
.preview-code { display: flex; flex-direction: column; height: 100%; background: var(--bg-card); }
.code-toolbar { display: flex; align-items: center; gap: 16px; padding: 12px 20px; background: var(--bg-hover); border-bottom: 1px solid var(--border-color); }
.code-lang { padding: 4px 12px; background: var(--accent-color); color: white; border-radius: 6px; font-size: 12px; font-weight: 600; }
.code-info { color: var(--text-muted); font-size: 13px; }

.code-container { flex: 1; overflow: auto; font-family: var(--font-mono); font-size: 14px; line-height: 1.7; }
.code-line { display: flex; position: relative; min-height: 28px; border-left: 3px solid transparent; transition: background 0.15s; }
.code-line:hover { background: var(--bg-hover); }
.code-line.has-comment { border-left-color: var(--accent-color); background: var(--accent-light); }
.code-line.expanded { background: var(--accent-light); }

.line-gutter { width: 64px; padding: 0 12px; text-align: right; color: var(--text-muted); background: var(--bg-hover); user-select: none; cursor: pointer; display: flex; align-items: center; justify-content: flex-end; gap: 6px; flex-shrink: 0; }
.line-gutter:hover { color: var(--accent-color); }
.line-num { font-size: 13px; }
.comment-badge { background: var(--accent-color); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 600; }

.line-code { flex: 1; padding: 0 16px; color: var(--text-primary); overflow-x: auto; display: flex; align-items: center; }
.line-code pre { margin: 0; white-space: pre; font-family: inherit; }

.line-action { display: none; padding: 0 12px; background: none; border: none; color: var(--text-muted); cursor: pointer; }
.code-line:hover .line-action { display: flex; align-items: center; }
.line-action:hover { color: var(--accent-color); }

/* 行评论面板 */
.line-comments-panel { position: absolute; top: 100%; left: 64px; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 16px; margin-top: 4px; z-index: 10; box-shadow: var(--shadow-lg); }
.comments-thread { display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto; margin-bottom: 12px; }
.thread-comment { display: flex; gap: 12px; }
.comment-avatar { background: var(--accent-color); color: white; font-size: 12px; font-weight: 600; flex-shrink: 0; }
.comment-bubble { flex: 1; background: var(--bg-hover); padding: 12px 16px; border-radius: var(--radius-sm); }
.bubble-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.bubble-header .author { font-weight: 600; color: var(--text-primary); font-size: 13px; }
.bubble-header .time { color: var(--text-muted); font-size: 12px; }
.bubble-content { color: var(--text-secondary); font-size: 14px; line-height: 1.6; }

.comment-composer { border-top: 1px solid var(--border-color); padding-top: 12px; }
.composer-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.add-reply-btn { font-size: 13px; }

/* 不支持预览 */
.preview-unsupported { display: flex; align-items: center; justify-content: center; height: 100%; }
.unsupported-content { text-align: center; color: var(--text-muted); }
.unsupported-icon { font-size: 80px; margin-bottom: 24px; }
.unsupported-content h2 { font-size: 20px; color: var(--text-primary); margin: 0 0 8px; }
.unsupported-content p { margin: 0 0 24px; }

/* ========== 评论侧边栏 ========== */
.comments-sidebar {
    width: 380px; flex-shrink: 0;
    background: var(--bg-card); border-left: 1px solid var(--border-color);
    display: flex; flex-direction: column; position: relative;
}

.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 1px solid var(--border-color); }
.sidebar-header h2 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; }
.sidebar-header .count { background: var(--accent-light); color: var(--accent-color); padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; }
.filter-select { width: 100px; }

.comments-list { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.comment-card { 
    position: relative; 
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px; 
    background: var(--bg-hover); 
    border-radius: var(--radius-sm); 
    cursor: pointer; 
    transition: all 0.2s; 
    border: 1px solid var(--border-color);
    margin-bottom: 12px;
}
.comment-card:hover { 
    border-color: var(--accent-color); 
    transform: translateX(4px); 
    box-shadow: var(--shadow); 
}

/* 评论项 - 与任务详情评论样式一致 */
.comment-item {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    transition: background 0.2s;
    cursor: pointer;
}

.comment-item:hover {
    background: var(--bg-hover);
}

.comment-avatar {
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent-color) 0%, #7c3aed 100%);
    color: white;
    font-weight: 600;
}

.comment-content {
    flex: 1;
    min-width: 0;
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
    flex-wrap: wrap;
}

.comment-author {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}

.comment-time {
    font-size: 12px;
    color: var(--text-muted);
    margin-left: auto;
}

.comment-line-tag,
.comment-node-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.comment-line-tag .el-icon,
.comment-node-tag .el-icon {
    font-size: 12px;
}

.comment-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);
    background: var(--bg-hover);
    padding: 12px 16px;
    border-radius: 0 12px 12px 12px;
    border: 1px solid var(--border-color);
}

.comment-text :deep(.mention) {
    color: var(--accent-color);
    font-weight: 500;
    background: var(--accent-light);
    padding: 2px 6px;
    border-radius: 4px;
}

.comment-footer {
    display: flex;
    gap: 16px;
    margin-top: 8px;
}

/* 评论输入框 */
.comment-input-box { padding: 16px; border-top: 1px solid var(--border-color); background: var(--bg-hover); }
.input-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 14px; font-weight: 600; color: var(--text-primary); }
.node-select { width: 120px; }
.input-body { margin-bottom: 10px; }
.input-body :deep(.el-textarea__inner) { background: var(--bg-card); border-color: var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm); resize: none; }
.input-body :deep(.el-textarea__inner):focus { border-color: var(--accent-color); }
.input-footer { display: flex; justify-content: space-between; }

/* @提及弹窗 */
.mention-popup { position: fixed; width: 280px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius); box-shadow: var(--shadow-lg); z-index: 1000; overflow: hidden; }
.mention-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: var(--bg-hover); font-size: 13px; font-weight: 600; color: var(--text-primary); }
.mention-body { max-height: 200px; overflow-y: auto; }
.mention-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; transition: background 0.15s; }
.mention-item:hover { background: var(--accent-light); }
.mention-item span { color: var(--text-primary); font-size: 14px; }
.mention-empty { padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; }

/* @提及高亮 */
.card-body :deep(.mention), .bubble-content :deep(.mention) { color: var(--accent-color); background: var(--accent-light); padding: 2px 6px; border-radius: 4px; font-weight: 500; }

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
    .preview-main { flex-direction: column; }
    .comments-sidebar { width: 100%; max-height: 400px; border-left: none; border-top: 1px solid var(--border-color); }
}

@media (max-width: 768px) {
    .preview-header { padding: 12px 16px; }
    .header-divider { display: none; }
    .file-meta .file-name { font-size: 14px; }
    .comments-sidebar { max-height: 350px; }
    .comment-input-box { padding: 12px; }
}
</style>

