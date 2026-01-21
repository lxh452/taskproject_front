/**
 * XSS防护工具函数
 * 用于净化用户输入的HTML内容，防止XSS攻击
 */

// 允许的HTML标签白名单
const ALLOWED_TAGS = [
  'b', 'i', 'em', 'strong', 'u', 's', 'strike',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'a', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
]

// 允许的属性白名单
const ALLOWED_ATTRS = ['href', 'target', 'rel', 'class', 'id', 'style']

// 危险的属性模式
const DANGEROUS_ATTR_PATTERNS = [
  /^on\w+/i,           // onclick, onerror等事件处理器
  /^javascript:/i,     // javascript:伪协议
  /^data:/i,           // data:伪协议（除了图片）
  /^vbscript:/i,       // vbscript:伪协议
]

// 危险的CSS属性
const DANGEROUS_CSS_PATTERNS = [
  /expression\s*\(/i,  // CSS表达式
  /javascript:/i,      // javascript:
  /behavior\s*:/i,     // IE behavior
  /-moz-binding/i,     // Firefox XBL
]

/**
 * 转义HTML特殊字符
 * @param str 原始字符串
 * @returns 转义后的字符串
 */
export function escapeHtml(str: string): string {
  if (!str) return ''
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char])
}

/**
 * 检查属性值是否安全
 * @param attrName 属性名
 * @param attrValue 属性值
 * @returns 是否安全
 */
function isAttrValueSafe(attrName: string, attrValue: string): boolean {
  const lowerName = attrName.toLowerCase()
  const lowerValue = attrValue.toLowerCase().trim()

  // 检查危险属性模式
  for (const pattern of DANGEROUS_ATTR_PATTERNS) {
    if (pattern.test(lowerName) || pattern.test(lowerValue)) {
      return false
    }
  }

  // 特殊处理href属性
  if (lowerName === 'href') {
    // 只允许http, https, mailto, tel协议
    if (lowerValue && !lowerValue.match(/^(https?:|mailto:|tel:|#|\/)/)) {
      return false
    }
  }

  // 特殊处理style属性
  if (lowerName === 'style') {
    for (const pattern of DANGEROUS_CSS_PATTERNS) {
      if (pattern.test(lowerValue)) {
        return false
      }
    }
  }

  return true
}

/**
 * 净化HTML内容（简单实现）
 * 注意：对于复杂场景，建议使用DOMPurify库
 * @param dirty 原始HTML
 * @returns 净化后的HTML
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''

  // 创建临时DOM元素
  const doc = new DOMParser().parseFromString(dirty, 'text/html')
  const body = doc.body

  // 递归处理所有节点
  function processNode(node: Node): void {
    const nodesToRemove: Node[] = []

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element
        const tagName = element.tagName.toLowerCase()

        // 检查标签是否在白名单中
        if (!ALLOWED_TAGS.includes(tagName)) {
          // 不在白名单中，移除标签但保留内容
          nodesToRemove.push(child)
          return
        }

        // 处理属性
        const attrsToRemove: string[] = []
        for (const attr of Array.from(element.attributes)) {
          const attrName = attr.name.toLowerCase()
          // 检查属性是否在白名单中且值安全
          if (!ALLOWED_ATTRS.includes(attrName) || !isAttrValueSafe(attrName, attr.value)) {
            attrsToRemove.push(attr.name)
          }
        }
        attrsToRemove.forEach((attr) => element.removeAttribute(attr))

        // 为链接添加安全属性
        if (tagName === 'a') {
          element.setAttribute('rel', 'noopener noreferrer')
          if (!element.getAttribute('target')) {
            element.setAttribute('target', '_blank')
          }
        }

        // 递归处理子节点
        processNode(child)
      } else if (child.nodeType === Node.COMMENT_NODE) {
        // 移除注释节点
        nodesToRemove.push(child)
      }
    })

    // 移除不安全的节点，但保留其文本内容
    nodesToRemove.forEach((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) {
        const parent = n.parentNode
        if (parent) {
          // 将子节点移动到父节点
          while (n.firstChild) {
            parent.insertBefore(n.firstChild, n)
          }
          parent.removeChild(n)
        }
      } else {
        n.parentNode?.removeChild(n)
      }
    })
  }

  processNode(body)
  return body.innerHTML
}

/**
 * 净化纯文本（移除所有HTML标签）
 * @param dirty 原始文本
 * @returns 纯文本
 */
export function stripHtml(dirty: string): string {
  if (!dirty) return ''
  const doc = new DOMParser().parseFromString(dirty, 'text/html')
  return doc.body.textContent || ''
}

/**
 * 检测字符串是否包含潜在的XSS攻击
 * @param str 待检测字符串
 * @returns 是否包含XSS攻击特征
 */
export function detectXss(str: string): boolean {
  if (!str) return false
  const lower = str.toLowerCase()
  
  const xssPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /expression\s*\(/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<svg\b.*?on\w+/i,
    /data:\s*text\/html/i,
  ]

  return xssPatterns.some((pattern) => pattern.test(lower))
}

export default {
  escapeHtml,
  sanitizeHtml,
  stripHtml,
  detectXss
}
