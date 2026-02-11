export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  todayDue: number;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  averageWorkload: number;
  efficiency: number;
}

export interface Project {
  id: string;
  name: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  memberCount: number;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee: string;
  dueDate: string;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  message: string;
  time: string;
}

export interface DashboardData {
  tasks: TaskStats;
  team: TeamStats;
  projects: Project[];
  recentTasks: Task[];
  alerts: Alert[];
}
