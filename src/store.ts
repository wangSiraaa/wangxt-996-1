import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Project, Building, Household, BudgetSource, ConstructionUnit,
  PublicNotice, Vote, Objection, ConstructionPhase, Inspection,
  Rework, ChangeRecord, AuditLog, RiskItem, Role, ChangeCategory,
  generateId, isSevenDaysFull, SEVEN_DAYS_MS,
  OBJECTION_CATEGORY_CONFIG, type ObjectionCategory,
  isObjectionOverdueByCategory, objectionDeadlineRemaining,
} from '@/types';

interface AppState {
  role: Role;
  projects: Project[];
  buildings: Building[];
  households: Household[];
  budgetSources: BudgetSource[];
  constructionUnits: ConstructionUnit[];
  publicNotices: PublicNotice[];
  votes: Vote[];
  objections: Objection[];
  constructionPhases: ConstructionPhase[];
  inspections: Inspection[];
  reworks: Rework[];
  changeRecords: ChangeRecord[];
  auditLogs: AuditLog[];

  setRole: (role: Role) => void;

  addProject: (p: Omit<Project, 'id' | 'createdAt' | 'status' | 'budgetConfirmed' | 'supervisorFiled'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  confirmBudget: (id: string) => void;
  supervisorFile: (id: string) => void;
  archiveProject: (id: string) => void;

  addBuilding: (b: Omit<Building, 'id' | 'inspectionLocked'>) => string;
  updateBuilding: (id: string, updates: Partial<Building>) => void;
  lockBuildingInspection: (id: string) => void;

  addHousehold: (h: Omit<Household, 'id'>) => string;

  addBudgetSource: (b: Omit<BudgetSource, 'id'>) => string;
  removeBudgetSource: (id: string) => void;

  addConstructionUnit: (u: Omit<ConstructionUnit, 'id'>) => string;
  updateConstructionUnit: (id: string, updates: Partial<ConstructionUnit>) => void;

  publishNotice: (projectId: string, startDate: string, endDate: string) => string;
  republishNotice: (noticeId: string, cascadeBuildingIds?: string[], triggeredByChangeId?: string) => void;

  addVote: (noticeId: string, residentName: string, approve: boolean) => void;

  addObjection: (noticeId: string, buildingId: string, category: ObjectionCategory, content: string, contactInfo: string) => string;
  processObjection: (id: string, reply: string) => void;
  markObjectionOverdue: (id: string) => void;

  addConstructionPhase: (p: Omit<ConstructionPhase, 'id' | 'status'>) => string;
  updateConstructionPhase: (id: string, updates: Partial<ConstructionPhase>) => void;
  startPhase: (id: string) => void;
  completePhase: (id: string) => void;

  addInspection: (i: Omit<Inspection, 'id'>) => string;
  addRework: (r: Omit<Rework, 'id'>) => string;

  submitChange: (projectId: string, buildingId: string, changeCategory: ChangeCategory, reason: string) => string;
  approveChange: (id: string) => void;
  rejectChange: (id: string) => void;

  confirmRepresentative: (buildingId: string) => void;
  confirmBuildingSupervisor: (buildingId: string) => void;

  addAuditLog: (projectId: string, action: string, detail: string) => void;

  getRisks: () => RiskItem[];
  canStartConstruction: (projectId: string) => { canStart: boolean; reasons: string[] };
  canBuildingStartConstruction: (buildingId: string) => { canStart: boolean; reasons: string[] };
  getVoteStats: (noticeId: string) => { total: number; approve: number; oppose: number; rate: number };
  getCascadeAffectedBuildings: (buildingId: string) => string[];
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: 'street',
      projects: [],
      buildings: [],
      households: [],
      budgetSources: [],
      constructionUnits: [],
      publicNotices: [],
      votes: [],
      objections: [],
      constructionPhases: [],
      inspections: [],
      reworks: [],
      changeRecords: [],
      auditLogs: [],

      setRole: (role) => set({ role }),

      addProject: (p) => {
        const id = generateId();
        const project: Project = {
          ...p,
          id,
          status: 'draft',
          budgetConfirmed: false,
          supervisorFiled: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ projects: [...s.projects, project] }));
        get().addAuditLog(id, '创建项目', `创建项目: ${p.name}`);
        return id;
      },

      updateProject: (id, updates) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      confirmBudget: (id) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, budgetConfirmed: true } : p)),
        }));
        get().addAuditLog(id, '确认预算', '预算已确认');
      },

      supervisorFile: (id) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, supervisorFiled: true } : p)),
        }));
        get().addAuditLog(id, '监理备案', '监理已备案');
      },

      archiveProject: (id) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)),
        }));
        get().addAuditLog(id, '归档', '项目已归档');
      },

      addBuilding: (b) => {
        const id = generateId();
        const building: Building = { ...b, id, inspectionLocked: false };
        set((s) => ({ buildings: [...s.buildings, building] }));
        get().addAuditLog(b.projectId, '添加楼栋', `添加楼栋: ${b.buildingNo}`);
        return id;
      },

      updateBuilding: (id, updates) => {
        set((s) => ({
          buildings: s.buildings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }));
      },

      lockBuildingInspection: (id) => {
        const building = get().buildings.find((b) => b.id === id);
        set((s) => ({
          buildings: s.buildings.map((b) => (b.id === id ? { ...b, inspectionLocked: true } : b)),
        }));
        if (building) {
          get().addAuditLog(building.projectId, '验收锁定', `楼栋 ${building.buildingNo} 已验收锁定`);
        }
      },

      addHousehold: (h) => {
        const id = generateId();
        const household: Household = { ...h, id };
        set((s) => ({ households: [...s.households, household] }));
        const building = get().buildings.find((b) => b.id === h.buildingId);
        if (building) {
          get().addAuditLog(
            building.projectId,
            '录入分户',
            `${building.buildingNo} · 房号${h.roomNo}${h.area ? ` · ${h.area}m²` : ''}`
          );
        }
        return id;
      },

      addBudgetSource: (b) => {
        const id = generateId();
        const budget: BudgetSource = { ...b, id };
        set((s) => ({ budgetSources: [...s.budgetSources, budget] }));
        get().addAuditLog(b.projectId, '添加预算来源', `添加预算: ${b.sourceType} ${b.amount}元`);
        return id;
      },

      removeBudgetSource: (id) => {
        const budget = get().budgetSources.find((b) => b.id === id);
        set((s) => ({ budgetSources: s.budgetSources.filter((b) => b.id !== id) }));
        if (budget) {
          get().addAuditLog(budget.projectId, '删除预算来源', `删除预算: ${budget.sourceType}`);
        }
      },

      addConstructionUnit: (u) => {
        const id = generateId();
        const unit: ConstructionUnit = { ...u, id };
        set((s) => ({ constructionUnits: [...s.constructionUnits, unit] }));
        get().addAuditLog(u.projectId, '添加施工单位', `添加施工单位: ${u.name}`);
        return id;
      },

      updateConstructionUnit: (id, updates) => {
        set((s) => ({
          constructionUnits: s.constructionUnits.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        }));
      },

      publishNotice: (projectId, startDate, endDate) => {
        const id = generateId();
        const fullSevenDays = isSevenDaysFull(startDate, endDate);
        const projectBuildings = get().buildings.filter((b) => b.projectId === projectId);
        const notice: PublicNotice = {
          id,
          projectId,
          buildingIds: projectBuildings.map((b) => b.id),
          startDate,
          endDate,
          fullSevenDays,
          status: 'active',
          triggeredByChangeId: '',
          cascadeAffectedBuildingIds: [],
        };
        set((s) => ({
          publicNotices: [...s.publicNotices, notice],
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, status: 'publishing' as const } : p
          ),
        }));
        get().addAuditLog(projectId, '发布公示', `公示期: ${startDate} 至 ${endDate}`);
        return id;
      },

      republishNotice: (noticeId, cascadeBuildingIds: string[] = [], triggeredByChangeId: string = '') => {
        const notice = get().publicNotices.find((n) => n.id === noticeId);
        if (!notice) return;
        const now = new Date();
        const newEnd = new Date(now.getTime() + SEVEN_DAYS_MS);
        const newNotice: PublicNotice = {
          id: generateId(),
          projectId: notice.projectId,
          buildingIds: [...new Set([...notice.buildingIds, ...cascadeBuildingIds])],
          startDate: now.toISOString(),
          endDate: newEnd.toISOString(),
          fullSevenDays: true,
          status: 'republished',
          triggeredByChangeId,
          cascadeAffectedBuildingIds: cascadeBuildingIds,
        };
        set((s) => ({
          publicNotices: [...s.publicNotices, newNotice],
        }));
        get().addAuditLog(notice.projectId, '重新公示', '变更后重新公示，公示期重新计算');
      },

      addVote: (noticeId, residentName, approve) => {
        const vote: Vote = {
          id: generateId(),
          noticeId,
          residentName,
          approve,
          votedAt: new Date().toISOString(),
        };
        const notice = get().publicNotices.find((n) => n.id === noticeId);
        set((s) => ({ votes: [...s.votes, vote] }));
        if (notice) {
          get().addAuditLog(notice.projectId, '居民投票', `${residentName} ${approve ? '赞成' : '反对'}`);
        }
      },

      addObjection: (noticeId, buildingId, category, content, contactInfo) => {
        const id = generateId();
        const now = new Date().toISOString();
        const deadlineDays = OBJECTION_CATEGORY_CONFIG[category].deadlineDays;
        const objection: Objection = {
          id,
          noticeId,
          buildingId,
          category,
          content,
          contactInfo,
          status: 'pending',
          reply: '',
          createdAt: now,
          processedAt: '',
          overdue: false,
          deadlineDays,
        };
        const notice = get().publicNotices.find((n) => n.id === noticeId);
        set((s) => ({ objections: [...s.objections, objection] }));
        if (notice) {
          get().addAuditLog(notice.projectId, '提交异议', `异议内容: ${content.substring(0, 50)}`);
        }
        return id;
      },

      processObjection: (id, reply) => {
        set((s) => ({
          objections: s.objections.map((o) =>
            o.id === id ? { ...o, status: 'resolved' as const, reply, processedAt: new Date().toISOString() } : o
          ),
        }));
        const obj = get().objections.find((o) => o.id === id);
        const notice = obj ? get().publicNotices.find((n) => n.id === obj.noticeId) : null;
        if (notice) {
          get().addAuditLog(notice.projectId, '处理异议', `异议已回复: ${reply.substring(0, 50)}`);
        }
      },

      markObjectionOverdue: (id) => {
        set((s) => ({
          objections: s.objections.map((o) =>
            o.id === id ? { ...o, status: 'overdue' as const, overdue: true } : o
          ),
        }));
      },

      addConstructionPhase: (p) => {
        const id = generateId();
        const phase: ConstructionPhase = { ...p, id, status: 'pending' };
        set((s) => ({ constructionPhases: [...s.constructionPhases, phase] }));
        get().addAuditLog(p.projectId, '添加施工阶段', `阶段: ${p.phaseName}`);
        return id;
      },

      updateConstructionPhase: (id, updates) => {
        set((s) => ({
          constructionPhases: s.constructionPhases.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      startPhase: (id) => {
        const phase = get().constructionPhases.find((p) => p.id === id);
        if (!phase) return;
        const check = get().canStartConstruction(phase.projectId);
        if (!check.canStart) return;
        set((s) => ({
          constructionPhases: s.constructionPhases.map((p) =>
            p.id === id ? { ...p, status: 'in_progress' as const } : p
          ),
          projects: s.projects.map((p) =>
            p.id === phase.projectId && p.status !== 'constructing' ? { ...p, status: 'constructing' as const } : p
          ),
        }));
        get().addAuditLog(phase.projectId, '开始施工', `阶段 ${phase.phaseName} 开始施工`);
      },

      completePhase: (id) => {
        set((s) => ({
          constructionPhases: s.constructionPhases.map((p) =>
            p.id === id ? { ...p, status: 'completed' as const } : p
          ),
        }));
        const phase = get().constructionPhases.find((p) => p.id === id);
        if (phase) {
          get().addAuditLog(phase.projectId, '完成施工阶段', `阶段 ${phase.phaseName} 已完成`);
        }
      },

      addInspection: (i) => {
        const id = generateId();
        const inspection: Inspection = { ...i, id };
        set((s) => ({ inspections: [...s.inspections, inspection] }));
        if (i.result === 'pass') {
          const phase = get().constructionPhases.find((p) => p.id === i.phaseId);
          if (phase) {
            get().lockBuildingInspection(phase.buildingId);
          }
        }
        const phase = get().constructionPhases.find((p) => p.id === i.phaseId);
        if (phase) {
          get().addAuditLog(phase.projectId, '阶段验收', `验收结果: ${i.result}, 得分: ${i.score}`);
        }
        return id;
      },

      addRework: (r) => {
        const id = generateId();
        const rework: Rework = { ...r, id };
        set((s) => ({ reworks: [...s.reworks, rework] }));
        set((s) => ({
          constructionPhases: s.constructionPhases.map((p) =>
            p.id === get().inspections.find((i) => i.id === r.inspectionId)?.phaseId
              ? { ...p, status: 'rework' as const }
              : p
          ),
        }));
        return id;
      },

      submitChange: (projectId, buildingId, changeCategory, reason) => {
        const id = generateId();
        const building = get().buildings.find((b) => b.id === buildingId);
        const requiresRepublication = building?.inspectionLocked ?? false;
        const cascadeAffectedBuildingIds = get().getCascadeAffectedBuildings(buildingId);
        const record: ChangeRecord = {
          id,
          projectId,
          buildingId,
          changeCategory,
          reason,
          status: 'pending',
          appliedAt: new Date().toISOString(),
          approvedAt: '',
          requiresRepublication,
          rePublicationStart: '',
          rePublicationEnd: '',
          cascadeAffectedBuildingIds,
        };
        set((s) => ({ changeRecords: [...s.changeRecords, record] }));
        get().addAuditLog(projectId, '提交变更', `变更原因: ${reason.substring(0, 50)}${requiresRepublication ? ' (需重新公示)' : ''}`);
        return id;
      },

      approveChange: (id) => {
        const record = get().changeRecords.find((r) => r.id === id);
        if (!record) return;
        const now = new Date();
        const updates: Partial<ChangeRecord> = {
          status: 'approved',
          approvedAt: now.toISOString(),
        };
        if (record.requiresRepublication) {
          const end = new Date(now.getTime() + SEVEN_DAYS_MS);
          updates.rePublicationStart = now.toISOString();
          updates.rePublicationEnd = end.toISOString();
        }
        set((s) => ({
          changeRecords: s.changeRecords.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));

        const cascadeIds = record.cascadeAffectedBuildingIds;
        const allAffectedIds = [...new Set([record.buildingId, ...cascadeIds])];

        if (record.requiresRepublication || cascadeIds.length > 0) {
          const activeNotice = get().publicNotices.find(
            (n) => n.projectId === record.projectId && (n.status === 'active' || n.status === 'republished')
          );
          if (activeNotice) {
            get().republishNotice(activeNotice.id, allAffectedIds, id);
          } else {
            get().publishNotice(
              record.projectId,
              now.toISOString().split('T')[0],
              new Date(now.getTime() + SEVEN_DAYS_MS).toISOString().split('T')[0]
            );
          }
        }

        if (cascadeIds.length > 0) {
          const affectedBuildingNos = cascadeIds
            .map((bid) => get().buildings.find((b) => b.id === bid)?.buildingNo)
            .filter(Boolean)
            .join('、');
          get().addAuditLog(
            record.projectId,
            '级联影响',
            `变更级联影响楼栋: ${affectedBuildingNos}，公示期/投票/预算需重新确认`
          );

          cascadeIds.forEach((bid) => {
            const b = get().buildings.find((bld) => bld.id === bid);
            if (b && b.inspectionLocked) {
              get().addAuditLog(
                record.projectId,
                '已验收楼栋受影响',
                `楼栋 ${b.buildingNo} 已验收锁定但受级联影响，禁止回改施工计划`
              );
            }
          });
        }

        get().addAuditLog(record.projectId, '审批变更', `变更已批准${record.requiresRepublication ? '，已触发重新公示' : ''}${cascadeIds.length > 0 ? `，级联影响 ${cascadeIds.length} 栋楼` : ''}`);
      },

      rejectChange: (id) => {
        const record = get().changeRecords.find((r) => r.id === id);
        if (!record) return;
        set((s) => ({
          changeRecords: s.changeRecords.map((r) =>
            r.id === id ? { ...r, status: 'rejected' as const, approvedAt: new Date().toISOString() } : r
          ),
        }));
        get().addAuditLog(record.projectId, '驳回变更', '变更申请已驳回');
      },

      addAuditLog: (projectId, action, detail) => {
        const role = get().role;
        const operatorLabels: Record<Role, string> = { street: '街道', resident: '居民', supervisor: '监理' };
        const log: AuditLog = {
          id: generateId(),
          projectId,
          operator: operatorLabels[role],
          role,
          action,
          detail,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ auditLogs: [...s.auditLogs, log] }));
      },

      confirmRepresentative: (buildingId) => {
        const building = get().buildings.find((b) => b.id === buildingId);
        set((s) => ({
          buildings: s.buildings.map((b) => (b.id === buildingId ? { ...b, representativeConfirmed: true } : b)),
        }));
        if (building) {
          get().addAuditLog(building.projectId, '确认代表人', `楼栋 ${building.buildingNo} 代表人已确认`);
        }
      },

      confirmBuildingSupervisor: (buildingId) => {
        const building = get().buildings.find((b) => b.id === buildingId);
        set((s) => ({
          buildings: s.buildings.map((b) => (b.id === buildingId ? { ...b, supervisorFiled: true } : b)),
        }));
        if (building) {
          get().addAuditLog(building.projectId, '楼栋监理备案', `楼栋 ${building.buildingNo} 监理已备案`);
        }
      },

      getRisks: () => {
        const state = get();
        const risks: RiskItem[] = [];

        state.publicNotices
          .filter((n) => n.status === 'active' || n.status === 'republished')
          .forEach((notice) => {
            const now = Date.now();
            const start = new Date(notice.startDate).getTime();
            const end = new Date(notice.endDate).getTime();
            if (now - start < SEVEN_DAYS_MS) {
              const project = state.projects.find((p) => p.id === notice.projectId);
              risks.push({
                id: generateId(),
                projectId: notice.projectId,
                buildingId: '',
                projectName: project?.name || '未知项目',
                type: 'seven_day',
                description: `公示未满七天，剩余 ${Math.ceil((end - now) / (24 * 60 * 60 * 1000))} 天`,
                severity: 'high',
                createdAt: new Date().toISOString(),
              });
            }
          });

        state.objections
          .filter((o) => o.status === 'pending' || o.status === 'processing')
          .forEach((obj) => {
            const overdue = isObjectionOverdueByCategory(obj.createdAt, obj.category);
            if (overdue) {
              const notice = state.publicNotices.find((n) => n.id === obj.noticeId);
              const project = notice ? state.projects.find((p) => p.id === notice.projectId) : null;
              const building = state.buildings.find((b) => b.id === obj.buildingId);
              const categoryLabel = OBJECTION_CATEGORY_CONFIG[obj.category]?.label || obj.category;
              risks.push({
                id: generateId(),
                projectId: notice?.projectId || '',
                buildingId: obj.buildingId,
                projectName: project?.name || '未知项目',
                type: 'objection_overdue',
                description: `${building ? `楼栋${building.buildingNo} ` : ''}${categoryLabel}超期未处理: ${obj.content.substring(0, 30)}...`,
                severity: obj.category === 'safety' ? 'high' : 'medium',
                createdAt: new Date().toISOString(),
              });
            }
          });

        state.buildings
          .filter((b) => !b.representativeConfirmed)
          .forEach((building) => {
            const project = state.projects.find((p) => p.id === building.projectId);
            if (project && (project.status === 'publishing' || project.status === 'approved')) {
              risks.push({
                id: generateId(),
                projectId: building.projectId,
                buildingId: building.id,
                projectName: project.name,
                type: 'representative_unconfirmed',
                description: `楼栋 ${building.buildingNo} 代表人未确认`,
                severity: 'high',
                createdAt: new Date().toISOString(),
              });
            }
          });

        state.projects
          .filter((p) => p.status === 'publishing' || p.status === 'approved')
          .forEach((project) => {
            const notices = state.publicNotices.filter((n) => n.projectId === project.id);
            const activeNotice = notices.find((n) => n.status === 'active' || n.status === 'republished');
            if (activeNotice) {
              const voteStats = get().getVoteStats(activeNotice.id);
              if (voteStats.total > 0 && voteStats.rate < 0.5) {
                risks.push({
                  id: generateId(),
                  projectId: project.id,
                  buildingId: '',
                  projectName: project.name,
                  type: 'vote_insufficient',
                  description: `投票赞成率 ${(voteStats.rate * 100).toFixed(1)}%，未达50%`,
                  severity: 'medium',
                  createdAt: new Date().toISOString(),
                });
              }
            }

            if (!project.budgetConfirmed) {
              risks.push({
                id: generateId(),
                projectId: project.id,
                buildingId: '',
                projectName: project.name,
                type: 'budget_unconfirmed',
                description: '预算未确认',
                severity: 'high',
                createdAt: new Date().toISOString(),
              });
            }

            if (!project.supervisorFiled) {
              risks.push({
                id: generateId(),
                projectId: project.id,
                buildingId: '',
                projectName: project.name,
                type: 'supervisor_unfiled',
                description: '监理未备案',
                severity: 'high',
                createdAt: new Date().toISOString(),
              });
            }
          });

        state.changeRecords
          .filter((c) => c.status === 'approved' && c.requiresRepublication)
          .forEach((change) => {
            const project = state.projects.find((p) => p.id === change.projectId);
            const building = state.buildings.find((b) => b.id === change.buildingId);
            if (building?.inspectionLocked) {
              risks.push({
                id: generateId(),
                projectId: change.projectId,
                buildingId: building.id,
                projectName: project?.name || '未知项目',
                type: 'inspection_locked_change',
                description: `已验收楼栋 ${building.buildingNo} 变更，需重新公示`,
                severity: 'high',
                createdAt: new Date().toISOString(),
              });
            }
          });

        state.changeRecords
          .filter((c) => c.status === 'approved' && c.cascadeAffectedBuildingIds.length > 0)
          .forEach((change) => {
            const project = state.projects.find((p) => p.id === change.projectId);
            change.cascadeAffectedBuildingIds.forEach((bid) => {
              const affectedBuilding = state.buildings.find((b) => b.id === bid);
              if (affectedBuilding) {
                risks.push({
                  id: generateId(),
                  projectId: change.projectId,
                  buildingId: bid,
                  projectName: project?.name || '未知项目',
                  type: 'cascade_republication',
                  description: `楼栋 ${affectedBuilding.buildingNo} 受级联变更影响，公示期/投票/预算需重算`,
                  severity: 'high',
                  createdAt: new Date().toISOString(),
                });
              }
            });
          });

        state.buildings.forEach((building) => {
          if (building.inspectionLocked) return;
          const buildingObjections = state.objections.filter((o) => o.buildingId === building.id);
          const overdueObjections = buildingObjections.filter(
            (o) => o.status === 'overdue' || (isObjectionOverdueByCategory(o.createdAt, o.category) && (o.status === 'pending' || o.status === 'processing'))
          );
          if (overdueObjections.length > 0) {
            const project = state.projects.find((p) => p.id === building.projectId);
            risks.push({
              id: generateId(),
              projectId: building.projectId,
              buildingId: building.id,
              projectName: project?.name || '未知项目',
              type: 'objection_building_blocked',
              description: `楼栋 ${building.buildingNo} 有 ${overdueObjections.length} 条超期异议未答复，禁止开工`,
              severity: 'high',
              createdAt: new Date().toISOString(),
            });
          }
        });

        return risks;
      },

      canStartConstruction: (projectId) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        const reasons: string[] = [];

        if (!project) return { canStart: false, reasons: ['项目不存在'] };

        const notices = state.publicNotices.filter((n) => n.projectId === projectId);
        const activeNotice = notices.find((n) => n.status === 'active' || n.status === 'republished');

        if (!activeNotice) {
          reasons.push('未发布公示');
        } else {
          const now = Date.now();
          const start = new Date(activeNotice.startDate).getTime();
          if (now - start < SEVEN_DAYS_MS) {
            const remaining = Math.ceil((start + SEVEN_DAYS_MS - now) / (24 * 60 * 60 * 1000));
            reasons.push(`公示未满七天（剩余 ${remaining} 天）`);
          }
        }

        const projectObjections = state.objections.filter((o) => {
          const notice = state.publicNotices.find((n) => n.id === o.noticeId);
          return notice?.projectId === projectId;
        });
        const unresolvedObjections = projectObjections.filter(
          (o) => o.status === 'pending' || o.status === 'processing' || o.status === 'overdue'
        );
        if (unresolvedObjections.length > 0) {
          reasons.push(`有 ${unresolvedObjections.length} 条异议未处理`);
        }

        if (activeNotice) {
          const voteStats = get().getVoteStats(activeNotice.id);
          if (voteStats.total === 0) {
            reasons.push('尚无居民投票');
          } else if (voteStats.rate < 0.5) {
            reasons.push(`投票赞成率 ${(voteStats.rate * 100).toFixed(1)}%，未达50%`);
          }
        }

        if (!project.budgetConfirmed) {
          reasons.push('预算未确认');
        }

        if (!project.supervisorFiled) {
          reasons.push('监理未备案');
        }

        return { canStart: reasons.length === 0, reasons };
      },

      getVoteStats: (noticeId) => {
        const noticeVotes = get().votes.filter((v) => v.noticeId === noticeId);
        const total = noticeVotes.length;
        const approve = noticeVotes.filter((v) => v.approve).length;
        const oppose = total - approve;
        const rate = total > 0 ? approve / total : 0;
        return { total, approve, oppose, rate };
      },

      canBuildingStartConstruction: (buildingId) => {
        const state = get();
        const building = state.buildings.find((b) => b.id === buildingId);
        const reasons: string[] = [];
        if (!building) return { canStart: false, reasons: ['楼栋不存在'] };

        const project = state.projects.find((p) => p.id === building.projectId);

        if (!building.representativeConfirmed) {
          reasons.push('代表人未确认');
        }

        if (!building.supervisorFiled) {
          reasons.push('楼栋监理未备案');
        }

        if (project && !project.supervisorFiled) {
          reasons.push('项目监理未备案');
        }

        const buildingObjections = state.objections.filter((o) => o.buildingId === buildingId);
        const overdueObjections = buildingObjections.filter(
          (o) => o.status === 'overdue' || (isObjectionOverdueByCategory(o.createdAt, o.category) && (o.status === 'pending' || o.status === 'processing'))
        );
        if (overdueObjections.length > 0) {
          reasons.push(`有 ${overdueObjections.length} 条异议超期未答复`);
        }

        const unresolvedObjections = buildingObjections.filter(
          (o) => o.status === 'pending' || o.status === 'processing'
        );
        if (unresolvedObjections.length > 0 && overdueObjections.length === 0) {
          reasons.push(`有 ${unresolvedObjections.length} 条异议未处理`);
        }

        const cascadedChanges = state.changeRecords.filter(
          (c) => c.status === 'approved' && c.cascadeAffectedBuildingIds.includes(buildingId)
        );
        if (cascadedChanges.length > 0 && building.inspectionLocked) {
          reasons.push('受级联变更影响，已验收楼栋禁止回改施工计划');
        }

        return { canStart: reasons.length === 0, reasons };
      },

      getCascadeAffectedBuildings: (buildingId) => {
        const state = get();
        const building = state.buildings.find((b) => b.id === buildingId);
        if (!building) return [];

        const affectedIds = new Set<string>();

        building.sharedPipeBuildingIds.forEach((pid) => {
          if (pid !== buildingId) affectedIds.add(pid);
        });

        building.budgetAffectedBy.forEach((bid) => {
          const otherBuilding = state.buildings.find((b) => b.id === bid);
          if (otherBuilding && otherBuilding.id !== buildingId) {
            affectedIds.add(otherBuilding.id);
          }
        });

        state.buildings.forEach((other) => {
          if (other.id === buildingId) return;
          if (other.sharedPipeBuildingIds.includes(buildingId)) {
            affectedIds.add(other.id);
          }
          if (other.budgetAffectedBy.includes(buildingId)) {
            affectedIds.add(other.id);
          }
        });

        return Array.from(affectedIds);
      },
    }),
    {
      name: 'renovation-publicity-storage',
    }
  )
);

export default useStore;
