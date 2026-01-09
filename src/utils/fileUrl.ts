/**
 * 文件URL处理工具
 * 用于将后端返回的相对路径或本地路径转换为COS域名完整URL
 */

// COS域名配置（通过环境变量 VITE_COS_DOMAIN 设置）
const COS_DOMAIN = import.meta.env.VITE_COS_DOMAIN || '';

/**
 * 判断URL是否为完整URL（包含协议）
 */
function isFullUrl(url: string): boolean {
    if (!url) return false;
    return /^https?:\/\//i.test(url.trim());
}

/**
 * 判断URL是否为相对路径
 */
function isRelativePath(url: string): boolean {
    if (!url) return false;
    const trimmed = url.trim();
    return !isFullUrl(trimmed) && (trimmed.startsWith('/') || !trimmed.includes('://'));
}

/**
 * 将文件URL转换为代理URL（通过后端代理，解决CORS问题）
 * @param fileUrl 后端返回的文件URL（可能是相对路径、本地路径或完整URL）
 * @param fileId 文件ID（如果提供，则使用代理接口）
 * @returns 代理URL或完整的COS域名URL
 */
export function getFileUrl(fileUrl: string | null | undefined, fileId?: string | null): string {
    // 如果提供了fileId，使用代理接口（解决CORS问题）
    if (fileId) {
        // 使用相对路径，避免跨域问题
        return `/api/v1/upload/file/proxy?fileId=${fileId}`;
    }
    
    if (!fileUrl) return '';
    
    const trimmed = fileUrl.trim();
    
    // 如果已经是完整URL，直接返回
    if (isFullUrl(trimmed)) {
        return trimmed;
    }
    
    // 如果是相对路径（以/开头），拼接COS域名
    if (trimmed.startsWith('/')) {
        return `${COS_DOMAIN}${trimmed}`;
    }
    
    // 如果是本地路径（如 task/attachment/xxx/file.jpg），拼接COS域名
    // 移除可能的本地路径前缀（如 ./upload, upload等）
    let cleanPath = trimmed;
    if (cleanPath.startsWith('./')) {
        cleanPath = cleanPath.substring(2);
    }
    // 移除可能的 upload/ 前缀
    if (cleanPath.startsWith('upload/')) {
        cleanPath = cleanPath.substring(7);
    }
    
    // 确保路径以/开头
    if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
    }
    
    return `${COS_DOMAIN}${cleanPath}`;
}

/**
 * 批量处理文件列表的URL
 * @param files 文件对象数组，每个对象应包含 fileUrl 字段
 * @returns 处理后的文件数组
 */
export function processFileUrls<T extends { fileUrl?: string | null }>(files: T[]): T[] {
    return files.map(file => ({
        ...file,
        fileUrl: getFileUrl(file.fileUrl)
    }));
}

/**
 * 获取COS域名配置
 */
export function getCosDomain(): string {
    return COS_DOMAIN;
}

/**
 * 设置COS域名（仅在开发环境有效）
 */
export function setCosDomain(domain: string): void {
    if (import.meta.env.DEV) {
        (window as any).__COS_DOMAIN__ = domain;
    }
}

