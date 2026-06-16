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

export type ObjectionCategory = 'safety' | 'price' | 'disturbance';
export type ChangeCategory = 'noise' | 'elevator' | 'fire' | 'pipe' | 'other';

export const OBJECTION_CATEGORY_CONFIG: Record<ObjectionCategory, { label: string; deadlineDays: number; urgency: 'urgent' | 'normal' | 'low' }> = {
  safety: { label: '安全类紧急意见', deadlineDays: 2, urgency: 'urgent' },
  price: { label: '价格类异议', deadlineDays: 5, urgency: 'normal' },
  disturbance: { label: '施工扰民投诉', deadlineDays: 3, urgency: 'low' },
};

export const CHANGE_CATEGORY_CONFIG: Record<ChangeCategory, { label: string }> = {
  noise: { label: '施工噪音' },
  elevator: { label: '加装电梯' },
  fire: { label: '临时消防整改' },
  pipe: { label: '管网变更' },
  other: { label: '其他' },
};

export interface Building {
  id: string;
  projectId: string;
  buildingNo: string;
  units: number;
  households: number;
  area: number;
  inspectionLocked: boolean;
  sharedPipeBuildingIds: string[];
  representativeName: string;
  representativeConfirmed: boolean;
  supervisorFiled: boolean;
  budgetAffectedBy: string[];
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
  buildingIds: string[];
  startDate: string;
  endDate: string;
  fullSevenDays: boolean;
  status: 'active' | 'expired' | 'republished';
  triggeredByChangeId: string;
  cascadeAffectedBuildingIds: string[];
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
  buildingId: string;
  category: ObjectionCategory;
  content: string;
  contactInfo: string;
  status: 'pending' | 'processing' | 'resolved' | 'overdue';
  reply: string;
  createdAt: string;
  processedAt: string;
  overdue: boolean;
  deadlineDays: number;
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
  changeCategory: ChangeCategory;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedAt: string;
  requiresRepublication: boolean;
  rePublicationStart: string;
  rePublicationEnd: string;
  cascadeAffectedBuildingIds: string[];
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
  buildingId: string;
  projectName: string;
  type: 'seven_day' | 'objection_overdue' | 'vote_insufficient' | 'budget_unconfirmed' | 'supervisor_unfiled' | 'inspection_locked_change' | 'representative_unconfirmed' | 'cascade_republication' | 'objection_building_blocked';
  description: string;
  severity: 'high' | 'medium';
  createdAt: string;
}

export type Role = 'street' | 'resident' | 'supervisor';

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const OBJECTION_DEADLINE_DAYS = 5;

export function getObjectionDeadlineDays(category: ObjectionCategory): number {
  return OBJECTION_CATEGORY_CONFIG[category].deadlineDays;
}

export function isObjectionOverdueByCategory(createdAt: string, category: ObjectionCategory): boolean {
  const created = new Date(createdAt).getTime();
  const deadlineDays = getObjectionDeadlineDays(category);
  const deadline = created + deadlineDays * 24 * 60 * 60 * 1000;
  return Date.now() > deadline;
}

export function objectionDeadlineRemaining(createdAt: string, category: ObjectionCategory): number {
  const created = new Date(createdAt).getTime();
  const deadlineDays = getObjectionDeadlineDays(category);
  const deadline = created + deadlineDays * 24 * 60 * 60 * 1000;
  return Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000));
}

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
