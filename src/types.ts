export interface Project {
  id: string;
  name: string;
  address: string;
  totalArea: number;
  totalBudget: number;
  status: 'draft' | 'publishing' | 'approved' | 'constructing' | 'completed' | 'archived';
  budgetConfirmed: boolean;
  supervisorFiled: boolean;
  createdAt: string;
}

export interface Building {
  id: string;
  projectId: string;
  buildingNo: string;
  units: number;
  households: number;
  area: number;
  inspectionLocked: boolean;
}

export interface Household {
  id: string;
  buildingId: string;
  unitNo: string;
  floorNo: string;
  roomNo: string;
  area: number;
}

export interface BudgetSource {
  id: string;
  projectId: string;
  sourceType: 'fiscal' | 'special_fund' | 'self_funded' | 'other';
  amount: number;
  description: string;
}

export interface ConstructionUnit {
  id: string;
  projectId: string;
  name: string;
  qualification: string;
  contactPerson: string;
  contactPhone: string;
}

export interface PublicNotice {
  id: string;
  projectId: string;
  startDate: string;
  endDate: string;
  fullSevenDays: boolean;
  status: 'active' | 'expired' | 'republished';
}

export interface Vote {
  id: string;
  noticeId: string;
  residentName: string;
  approve: boolean;
  votedAt: string;
}

export interface Objection {
  id: string;
  noticeId: string;
  content: string;
  contactInfo: string;
  status: 'pending' | 'processing' | 'resolved' | 'overdue';
  reply: string;
  createdAt: string;
  processedAt: string;
  overdue: boolean;
}

export interface ConstructionPhase {
  id: string;
  projectId: string;
  buildingId: string;
  phaseName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rework';
}

export interface Inspection {
  id: string;
  phaseId: string;
  result: 'pass' | 'fail' | 'rework';
  score: number;
  inspectedAt: string;
  inspector: string;
}

export interface Rework {
  id: string;
  inspectionId: string;
  reason: string;
  measure: string;
  reinspectResult: 'pass' | 'fail';
  reinspectAt: string;
}

export interface ChangeRecord {
  id: string;
  projectId: string;
  buildingId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedAt: string;
  requiresRepublication: boolean;
  rePublicationStart: string;
  rePublicationEnd: string;
}

export interface AuditLog {
  id: string;
  projectId: string;
  operator: string;
  role: 'street' | 'resident' | 'supervisor';
  action: string;
  detail: string;
  timestamp: string;
}

export interface RiskItem {
  id: string;
  projectId: string;
  projectName: string;
  type: 'seven_day' | 'objection_overdue' | 'vote_insufficient' | 'budget_unconfirmed' | 'supervisor_unfiled' | 'inspection_locked_change';
  description: string;
  severity: 'high' | 'medium';
  createdAt: string;
}

export type Role = 'street' | 'resident' | 'supervisor';

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const OBJECTION_DEADLINE_DAYS = 5;

export const SOURCE_TYPE_LABELS: Record<BudgetSource['sourceType'], string> = {
  fiscal: '财政拨款',
  special_fund: '专项基金',
  self_funded: '自筹资金',
  other: '其他',
};

export const PROJECT_STATUS_LABELS: Record<Project['status'], string> = {
  draft: '草稿',
  publishing: '公示中',
  approved: '已审批',
  constructing: '施工中',
  completed: '已完工',
  archived: '已归档',
};

export const PHASE_STATUS_LABELS: Record<ConstructionPhase['status'], string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  rework: '返工中',
};

export const OBJECTION_STATUS_LABELS: Record<Objection['status'], string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  overdue: '已超期',
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function isSevenDaysFull(startDate: string, endDate: string): boolean {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return end - start >= SEVEN_DAYS_MS;
}

export function isObjectionOverdue(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const deadline = created + OBJECTION_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > deadline;
}

export function daysRemaining(endDate: string): number {
  const end = new Date(endDate).getTime();
  const diff = end - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
