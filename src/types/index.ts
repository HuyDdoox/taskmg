export type IssueType = 'TASK' | 'STORY' | 'BUG' | 'SUBTASK';
export type PriorityLevel = 'LOWEST' | 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKER';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MemberRole = 'ADMIN' | 'PM' | 'MEMBER' | 'VIEWER';
export type MilestoneStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

export interface ActivityLogItem {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  detailsJson?: string | null;
  createdAt: Date | string;
  user?: User;
}

export interface TaskItem {
  id: string;
  taskNumber: number;
  issueKey: string;
  title: string;
  description?: string | null;
  issueType: IssueType | string;
  priority: PriorityLevel | string;
  riskLevel: RiskLevel | string;
  columnId: string;
  milestoneId?: string | null;
  assigneeId?: string | null;
  reporterId: string;
  orderIndex: number;
  dueDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  assignee?: User | null;
  reporter?: User;
  milestone?: MilestoneItem | null;
  checklists?: TaskChecklistItem[];
  activityLogs?: ActivityLogItem[];
  column?: KanbanColumnItem;
}

export interface KanbanColumnItem {
  id: string;
  projectId: string;
  title: string;
  position: number;
  colorHex: string;
  tasks: TaskItem[];
}

export interface MilestoneItem {
  id: string;
  projectId: string;
  title: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  status: MilestoneStatus | string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: Date | string;
  sender: User;
}

export interface ChatChannelItem {
  id: string;
  projectId: string;
  name: string;
  type: string;
  messages: ChatMessage[];
}

export interface ProjectData {
  id: string;
  name: string;
  projectKey: string;
  description?: string | null;
  ownerId: string;
  owner?: User;
  members: { id: string; role: MemberRole | string; user: User }[];
  milestones: MilestoneItem[];
  columns: KanbanColumnItem[];
  channels?: ChatChannelItem[];
}
