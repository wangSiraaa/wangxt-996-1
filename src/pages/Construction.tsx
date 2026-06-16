import { useState } from 'react';
import useStore from '@/store';
import {
  PHASE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  formatDate,
  isSevenDaysFull,
  isObjectionOverdueByCategory,
} from '@/types';
import {
  CheckCircle2,
  XCircle,
  Lock,
  Plus,
  Play,
  CheckCheck,
  AlertTriangle,
  Hammer,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rework: 'bg-red-100 text-red-700',
};

export default function Construction() {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ phaseName: '', startDate: '', endDate: '' });

  const store = useStore();
  const {
    projects,
    buildings,
    publicNotices,
    objections,
    constructionPhases,
    canStartConstruction,
    canBuildingStartConstruction,
    changeRecords,
    getVoteStats,
    addConstructionPhase,
    startPhase,
    completePhase,
  } = store;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectBuildings = buildings.filter((b) => b.projectId === selectedProjectId);
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  const activeNotice = publicNotices.find(
    (n) => n.projectId === selectedProjectId && (n.status === 'active' || n.status === 'republished')
  );

  const projectObjections = objections.filter((o) => {
    const notice = publicNotices.find((n) => n.id === o.noticeId);
    return notice?.projectId === selectedProjectId;
  });
  const unresolvedObjections = projectObjections.filter(
    (o) => o.status === 'pending' || o.status === 'processing' || o.status === 'overdue'
  );

  const voteStats = activeNotice ? getVoteStats(activeNotice.id) : null;

  const conditions = selectedProjectId
    ? [
        {
          label: '公示满七天',
          passed: activeNotice ? isSevenDaysFull(activeNotice.startDate, activeNotice.endDate) : false,
        },
        {
          label: '异议已处理',
          passed: unresolvedObjections.length === 0,
        },
        {
          label: '投票达标',
          passed: voteStats ? voteStats.rate >= 0.5 && voteStats.total > 0 : false,
        },
        {
          label: '预算已确认',
          passed: selectedProject?.budgetConfirmed ?? false,
        },
        {
          label: '监理已备案',
          passed: selectedProject?.supervisorFiled ?? false,
        },
      ]
    : [];

  const startCheck = selectedProjectId ? canStartConstruction(selectedProjectId) : { canStart: false, reasons: [] };

  const lockedBuildings = projectBuildings.filter((b) => b.inspectionLocked);

  const buildingPhases = constructionPhases.filter(
    (p) => p.projectId === selectedProjectId && p.buildingId === selectedBuildingId
  );

  const handleAddPhase = () => {
    if (!selectedProjectId || !selectedBuildingId || !phaseForm.phaseName || !phaseForm.startDate || !phaseForm.endDate) return;
    addConstructionPhase({
      projectId: selectedProjectId,
      buildingId: selectedBuildingId,
      phaseName: phaseForm.phaseName,
      startDate: phaseForm.startDate,
      endDate: phaseForm.endDate,
    });
    setPhaseForm({ phaseName: '', startDate: '', endDate: '' });
    setShowPhaseForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <Hammer size={28} className="text-amber-600" />
        施工管理
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
          <ShieldCheck size={20} className="text-blue-600" />
          开工条件校验
        </h2>

        <select
          value={selectedProjectId}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setSelectedBuildingId('');
          }}
          className="w-full max-w-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">选择项目</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {!selectedProjectId && (
          <div className="text-center py-10 text-gray-400">请先选择项目</div>
        )}

        {selectedProjectId && (
          <div className="space-y-4">
            <div className="border rounded-xl divide-y">
              {conditions.map((cond, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{cond.label}</span>
                  </div>
                  <span className={cn('flex items-center gap-1.5 text-sm font-semibold', cond.passed ? 'text-green-600' : 'text-red-600')}>
                    {cond.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {cond.passed ? '已满足' : '未满足'}
                  </span>
                </div>
              ))}
            </div>

            {lockedBuildings.length > 0 && (
              <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>该楼栋已验收锁定，变更需重新公示（涉及楼栋：{lockedBuildings.map((b) => b.buildingNo).join('、')}）</span>
              </div>
            )}

            {startCheck.canStart ? (
              <div className="flex items-center justify-between px-6 py-5 bg-green-50 border-2 border-green-300 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={32} className="text-green-600" />
                  <div>
                    <div className="text-xl font-bold text-green-700">允许开工</div>
                    <div className="text-sm text-green-600">所有开工条件均已满足</div>
                  </div>
                </div>
                {buildingPhases.length === 0 && selectedBuildingId && (
                  <button
                    onClick={() => {
                      const first = constructionPhases.find(
                        (p) => p.projectId === selectedProjectId && p.buildingId === selectedBuildingId && p.status === 'pending'
                      );
                      if (first) startPhase(first.id);
                    }}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                  >
                    开始首阶段
                  </button>
                )}
              </div>
            ) : (
              <div className="px-6 py-5 bg-red-50 border-2 border-red-300 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle size={32} className="text-red-600" />
                  <div>
                    <div className="text-xl font-bold text-red-700">禁止开工</div>
                    <div className="text-sm text-red-600">以下条件未满足，无法开工</div>
                  </div>
                </div>
                <ul className="ml-11 space-y-1">
                  {startCheck.reasons.map((reason, i) => (
                    <li key={i} className="text-sm text-red-600 flex items-center gap-2">
                      <XCircle size={14} />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {selectedProjectId && projectBuildings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
            <ShieldCheck size={20} className="text-blue-600" />
            楼栋开工校验
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {projectBuildings.map((building) => {
              const buildingCheck = canBuildingStartConstruction(building.id);
              const buildingObjections = objections.filter((o) => o.buildingId === building.id);
              const hasOverdueObjections = buildingObjections.some(
                (o) => o.status === 'overdue' || (isObjectionOverdueByCategory(o.createdAt, o.category) && (o.status === 'pending' || o.status === 'processing'))
              );
              const cascadeBlocked = building.inspectionLocked && changeRecords.some(
                (c) => c.status === 'approved' && c.cascadeAffectedBuildingIds.includes(building.id)
              );
              const checklist = [
                { label: '代表人已确认', passed: building.representativeConfirmed },
                { label: '监理已备案', passed: building.supervisorFiled },
                { label: '无超期异议', passed: !hasOverdueObjections },
                { label: '未受级联变更禁止', passed: !cascadeBlocked },
              ];
              return (
                <div key={building.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{building.buildingNo}</h3>
                    {buildingCheck.canStart ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <CheckCircle2 size={16} />
                        允许开工
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                        <XCircle size={16} />
                        禁止开工
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {checklist.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className={cn('flex items-center gap-1.5 text-sm font-medium', item.passed ? 'text-green-600' : 'text-red-600')}>
                          {item.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          {item.passed ? '已满足' : '未满足'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {cascadeBlocked && (
                    <div className="text-sm text-red-600 flex items-start gap-2 px-3 py-2 bg-red-50 rounded-lg">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <span>受级联变更影响，已验收楼栋禁止回改施工计划</span>
                    </div>
                  )}
                  {!buildingCheck.canStart && buildingCheck.reasons.length > 0 && (
                    <div className="space-y-1">
                      {buildingCheck.reasons.map((reason, i) => (
                        <div key={i} className="text-sm text-red-500 flex items-center gap-1.5">
                          <XCircle size={12} />
                          {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
          <Hammer size={20} className="text-amber-600" />
          施工阶段管理
        </h2>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedBuildingId('');
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[180px]"
          >
            <option value="">选择项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[180px]"
          >
            <option value="">选择楼栋</option>
            {projectBuildings.map((b) => (
              <option key={b.id} value={b.id}>{b.buildingNo}</option>
            ))}
          </select>

          {selectedBuildingId && !selectedBuilding?.inspectionLocked && (
            <button
              onClick={() => setShowPhaseForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              添加阶段
            </button>
          )}

          {selectedBuilding?.inspectionLocked && (
            <span className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
              <Lock size={16} />
              已验收锁定，禁止编辑
            </span>
          )}
        </div>

        {!selectedBuildingId && (
          <div className="text-center py-10 text-gray-400">请选择项目和楼栋</div>
        )}

        {selectedBuildingId && buildingPhases.length === 0 && (
          <div className="text-center py-10 text-gray-400">暂无施工阶段数据</div>
        )}

        {selectedBuildingId && buildingPhases.length > 0 && (
          <div className="relative pl-8">
            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {buildingPhases.map((phase, i) => (
                <div key={phase.id} className="relative">
                  <div
                    className={cn(
                      'absolute left-[-20px] top-4 w-4 h-4 rounded-full border-2 border-white shadow',
                      phase.status === 'completed' ? 'bg-green-500' :
                      phase.status === 'in_progress' ? 'bg-blue-500' :
                      phase.status === 'rework' ? 'bg-red-500' : 'bg-gray-300'
                    )}
                  />

                  <div className="ml-2 border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{phase.phaseName}</h3>
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', PHASE_STATUS_COLORS[phase.status])}>
                          {PHASE_STATUS_LABELS[phase.status]}
                        </span>
                      </div>

                      {!selectedBuilding?.inspectionLocked && (
                        <div className="flex gap-2">
                          {phase.status === 'pending' && (
                            <button
                              onClick={() => startPhase(phase.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Play size={14} />
                              开始施工
                            </button>
                          )}
                          {phase.status === 'in_progress' && (
                            <button
                              onClick={() => completePhase(phase.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <CheckCheck size={14} />
                              完成阶段
                            </button>
                          )}
                        </div>
                      )}

                      {selectedBuilding?.inspectionLocked && (
                        <Lock size={16} className="text-gray-400" />
                      )}
                    </div>

                    <div className="flex gap-6 text-sm text-gray-500">
                      <span>开始：{formatDate(phase.startDate)}</span>
                      <span>结束：{formatDate(phase.endDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPhaseForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
              <h2 className="text-lg font-semibold">添加施工阶段</h2>
              <div className="space-y-3">
                <input
                  placeholder="阶段名称"
                  value={phaseForm.phaseName}
                  onChange={(e) => setPhaseForm((f) => ({ ...f, phaseName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div>
                  <label className="block text-sm text-gray-600 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={phaseForm.startDate}
                    onChange={(e) => setPhaseForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={phaseForm.endDate}
                    onChange={(e) => setPhaseForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPhaseForm(false);
                    setPhaseForm({ phaseName: '', startDate: '', endDate: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  onClick={handleAddPhase}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
