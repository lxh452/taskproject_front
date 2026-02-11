// AI Agent 类型定义

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    status?: string;
    priority?: string;
    prerequisiteNodes?: string[];
    [key: string]: any;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

export interface DesignOption {
  id: string;
  name: string;
  description: string;
  mermaidCode: string;
  estimatedDays: number;
  requiredPeople: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendationScore: number;
  isRecommended?: boolean;
}

export interface PolishedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  tags?: string[];
  subtasks?: string[];
}

export interface AIAgent {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'idle' | 'running' | 'completed' | 'error';
}

export interface AgentExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  duration?: number;
}
