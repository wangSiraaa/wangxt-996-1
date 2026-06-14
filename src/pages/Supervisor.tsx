import { useState } from 'react';
import useStore from '@/store';
import {
  PHASE_STATUS_LABELS,
  formatDate,
  formatDateTime,
  type Inspection,
} from '@/types';
import {
  ClipboardCheck,
  Wrench,
  FileCheck2,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HardHat,
  MapPin,
  Wallet,
  Bell,
  User,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'inspection' | 'rework' | 'filing';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'inspection', label: '阶段验收', icon: <ClipboardCheck className="w-5 h-5" /> },
  { key: 'rework', label: '返工记录', icon: <Wrench className="w-5 h-5" /> },
  { key: 'filing', label: '备案确认', icon: <FileCheck2 className="w-5 h-5" /> },
];

const RESULT_LABELS: Record<Inspection['result'], string> = {
  pass: '合格',
  fail: '不合格',
  rework: '返工',
};

const RESULT_COLORS: Record<Inspection['result'], string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  rework: 'bg-amber-100 text-amber-700',
};

const PHASE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rework: 'bg-red-100 text-red-700',
};

export default function Supervisor() {
  const [activeTab, setActiveTab] = useState<TabKey>('inspection');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [inspectingPhaseId, setInspectingPhaseId] = useState<string | null>(null);
  const [inspForm, setInspForm] = useState({ result: 'pass' as Inspection['result'], score: '', inspector: '' });

  const [reworkInspectionId, setReworkInspectionId] = useState<string | null>(null);
  const [reworkForm, setReworkForm] = useState({ reason: '', measure: '', reinspectResult: 'pass' as 'pass' | 'fail', reinspectAt: '' });

  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);

  const store = useStore();
  const {
    projects, buildings, constructionPhases, inspections, reworks,
    constructionUnits, budgetSources, publicNotices,
    addInspection, addRework, supervisorFile,
  } = store;

  const filteredBuildings = buildings.filter((b) => b.projectId === selectedProjectId);
  const filteredPhases = constructionPhases.filter((p) => p.projectId === selectedProjectId);
  const filteredInspections = inspections.filter((i) =>
    filteredPhases.some((p) => p.id === i.phaseId)
  );

  const failedInspections = filteredInspections.filter(
    (i) => i.result === 'fail' || i.result === 'rework'
  );
  const filteredReworks = reworks.filter((r) =>
    failedInspections.some((i) => i.id === r.inspectionId)
  );

  const handleInspectionSubmit = (phaseId: string) => {
    if (!inspForm.score || !inspForm.inspector) return;
    addInspection({
      phaseId,
      result: inspForm.result,
      score: Number(inspForm.score),
      inspectedAt: new Date().toISOString(),
      inspector: inspForm.inspector,
    });
    setInspectingPhaseId(null);
    setInspForm({ result: 'pass', score: '', inspector: '' });
  };

  const handleReworkSubmit = (inspectionId: string) => {
    if (!reworkForm.reason || !reworkForm.measure || !reworkForm.reinspectAt) return;
    addRework({
      inspectionId,
      reason: reworkForm.reason,
      measure: reworkForm.measure,
      reinspectResult: reworkForm.reinspectResult,
      reinspectAt: new Date(reworkForm.reinspectAt).toISOString(),
    });
    setReworkInspectionId(null);
    setReworkForm({ reason: '', measure: '', reinspectResult: 'pass', reinspectAt: '' });
  };

  const getPhasesForBuilding = (buildingId: string) =>
    filteredPhases.filter((p) => p.buildingId === buildingId);

  const getInspectionsForPhase = (phaseId: string) =>
    filteredInspections.filter((i) => i.phaseId === phaseId);

  const getPhaseBuilding = (phaseId: string) => {
    const phase = constructionPhases.find((p) => p.id === phaseId);
    if (!phase) return null;
    return buildings.find((b) => b.id === phase.buildingId);
  };

  const renderProjectSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[220px]"
    >
      <option value="">选择项目</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">监理工作台</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inspection' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {renderProjectSelect(selectedProjectId, (v) => {
              setSelectedProjectId(v);
              setExpandedBuildingId(null);
              setInspectingPhaseId(null);
            })}
          </div>

          {!selectedProjectId && (
            <div className="text-center py-12 text-gray-400">请先选择项目</div>
          )}

          {selectedProjectId && filteredBuildings.length === 0 && (
            <div className="text-center py-12 text-gray-400">该项目暂无楼栋数据</div>
          )}

          {filteredBuildings.map((building) => {
            const phases = getPhasesForBuilding(building.id);
            const isExpanded = expandedBuildingId === building.id;

            return (
              <div key={building.id} className="border rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedBuildingId(isExpanded ? null : building.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={20} className="text-blue-500" />
                    <span className="font-semibold text-lg">{building.buildingNo}</span>
                    <span className="text-sm text-gray-500">
                      {building.units}单元 · {building.households}户 · {building.area}m²
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{phases.length} 个阶段</span>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t p-4 space-y-3 bg-gray-50">
                    {phases.length === 0 && (
                      <div className="text-center py-4 text-gray-400 text-sm">暂无施工阶段</div>
                    )}

                    {phases.map((phase) => {
                      const phaseInspections = getInspectionsForPhase(phase.id);
                      const canInspect = phase.status === 'in_progress' || phase.status === 'rework';
                      const isInspecting = inspectingPhaseId === phase.id;

                      return (
                        <div key={phase.id} className="bg-white border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{phase.phaseName}</span>
                              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', PHASE_STATUS_COLORS[phase.status])}>
                                {PHASE_STATUS_LABELS[phase.status]}
                              </span>
                            </div>
                            {canInspect && !isInspecting && (
                              <button
                                onClick={() => {
                                  setInspectingPhaseId(phase.id);
                                  setInspForm({ result: 'pass', score: '', inspector: '' });
                                }}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                验收
                              </button>
                            )}
                          </div>

                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>开始: {formatDate(phase.startDate)}</span>
                            <span>结束: {formatDate(phase.endDate)}</span>
                          </div>

                          {isInspecting && (
                            <div className="border-t pt-3 space-y-3 bg-blue-50 p-3 rounded-lg">
                              <h4 className="text-sm font-semibold text-blue-700">验收表单</h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">验收结果</label>
                                  <select
                                    value={inspForm.result}
                                    onChange={(e) => setInspForm((f) => ({ ...f, result: e.target.value as Inspection['result'] }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                  >
                                    <option value="pass">合格</option>
                                    <option value="fail">不合格</option>
                                    <option value="rework">返工</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">评分 (0-100)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={inspForm.score}
                                    onChange={(e) => setInspForm((f) => ({ ...f, score: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                    placeholder="0-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">验收人</label>
                                  <input
                                    type="text"
                                    value={inspForm.inspector}
                                    onChange={(e) => setInspForm((f) => ({ ...f, inspector: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                    placeholder="验收人姓名"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setInspectingPhaseId(null)}
                                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => handleInspectionSubmit(phase.id)}
                                  disabled={!inspForm.score || !inspForm.inspector}
                                  className={cn(
                                    'px-4 py-1.5 text-sm rounded-lg transition-colors',
                                    inspForm.score && inspForm.inspector
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  )}
                                >
                                  提交验收
                                </button>
                              </div>
                            </div>
                          )}

                          {phaseInspections.length > 0 && (
                            <div className="border-t pt-2 space-y-2">
                              <span className="text-xs font-semibold text-gray-500">验收记录</span>
                              {phaseInspections.map((insp) => (
                                <div key={insp.id} className="flex items-center gap-3 text-sm bg-gray-50 rounded px-3 py-2">
                                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', RESULT_COLORS[insp.result])}>
                                    {RESULT_LABELS[insp.result]}
                                  </span>
                                  <span className="flex items-center gap-1 text-gray-600">
                                    <Star size={12} className="text-amber-500" />
                                    {insp.score}分
                                  </span>
                                  <span className="flex items-center gap-1 text-gray-500">
                                    <User size={12} />
                                    {insp.inspector}
                                  </span>
                                  <span className="text-gray-400 ml-auto text-xs">
                                    {formatDateTime(insp.inspectedAt)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'rework' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {renderProjectSelect(selectedProjectId, (v) => {
              setSelectedProjectId(v);
              setReworkInspectionId(null);
            })}
          </div>

          {!selectedProjectId && (
            <div className="text-center py-12 text-gray-400">请先选择项目</div>
          )}

          {selectedProjectId && failedInspections.length === 0 && (
            <div className="text-center py-12 text-gray-400">该项目暂无不合格验收记录</div>
          )}

          {failedInspections.map((insp) => {
            const phase = constructionPhases.find((p) => p.id === insp.phaseId);
            const building = phase ? buildings.find((b) => b.id === phase.buildingId) : null;
            const isRegistering = reworkInspectionId === insp.id;
            const inspReworks = reworks.filter((r) => r.inspectionId === insp.id);

            return (
              <div key={insp.id} className="border rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', RESULT_COLORS[insp.result])}>
                      {RESULT_LABELS[insp.result]}
                    </span>
                    <span className="font-medium">
                      {building?.buildingNo ?? '-'} - {phase?.phaseName ?? '-'}
                    </span>
                    <span className="text-sm text-gray-500">
                      评分: {insp.score} · 验收人: {insp.inspector}
                    </span>
                  </div>
                  {!isRegistering && (
                    <button
                      onClick={() => {
                        setReworkInspectionId(insp.id);
                        setReworkForm({ reason: '', measure: '', reinspectResult: 'pass', reinspectAt: '' });
                      }}
                      className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      登记返工
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  验收时间: {formatDateTime(insp.inspectedAt)}
                </div>

                {isRegistering && (
                  <div className="border-t pt-3 space-y-3 bg-amber-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-amber-700">返工登记表单</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">返工原因</label>
                        <textarea
                          value={reworkForm.reason}
                          onChange={(e) => setReworkForm((f) => ({ ...f, reason: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm resize-none"
                          placeholder="请描述返工原因"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">整改措施</label>
                        <textarea
                          value={reworkForm.measure}
                          onChange={(e) => setReworkForm((f) => ({ ...f, measure: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm resize-none"
                          placeholder="请描述整改措施"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">复验结果</label>
                        <select
                          value={reworkForm.reinspectResult}
                          onChange={(e) => setReworkForm((f) => ({ ...f, reinspectResult: e.target.value as 'pass' | 'fail' }))}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                        >
                          <option value="pass">合格</option>
                          <option value="fail">不合格</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">复验日期</label>
                        <input
                          type="date"
                          value={reworkForm.reinspectAt}
                          onChange={(e) => setReworkForm((f) => ({ ...f, reinspectAt: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReworkInspectionId(null)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleReworkSubmit(insp.id)}
                        disabled={!reworkForm.reason || !reworkForm.measure || !reworkForm.reinspectAt}
                        className={cn(
                          'px-4 py-1.5 text-sm rounded-lg transition-colors',
                          reworkForm.reason && reworkForm.measure && reworkForm.reinspectAt
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        提交返工记录
                      </button>
                    </div>
                  </div>
                )}

                {inspReworks.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">返工原因</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">整改措施</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">复验结果</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">复验日期</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {inspReworks.map((rw) => (
                          <tr key={rw.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700">{rw.reason}</td>
                            <td className="px-3 py-2 text-gray-700">{rw.measure}</td>
                            <td className="px-3 py-2">
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', RESULT_COLORS[rw.reinspectResult])}>
                                {rw.reinspectResult === 'pass' ? '合格' : '不合格'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">{formatDate(rw.reinspectAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {selectedProjectId && filteredReworks.length > 0 && failedInspections.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 font-semibold text-sm text-gray-700">
                全部返工记录汇总
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-t">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">楼栋</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">施工阶段</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">返工原因</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">整改措施</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">复验结果</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">复验日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredReworks.map((rw) => {
                    const insp = inspections.find((i) => i.id === rw.inspectionId);
                    const phase = insp ? constructionPhases.find((p) => p.id === insp.phaseId) : null;
                    const building = phase ? buildings.find((b) => b.id === phase.buildingId) : null;
                    return (
                      <tr key={rw.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{building?.buildingNo ?? '-'}</td>
                        <td className="px-4 py-3">{phase?.phaseName ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{rw.reason}</td>
                        <td className="px-4 py-3 text-gray-600">{rw.measure}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', RESULT_COLORS[rw.reinspectResult])}>
                            {rw.reinspectResult === 'pass' ? '合格' : '不合格'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(rw.reinspectAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'filing' && (
        <div className="space-y-4">
          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无项目数据</div>
          )}

          {projects.map((project) => {
            const unit = constructionUnits.find((u) => u.projectId === project.id);
            const projectBudgets = budgetSources.filter((b) => b.projectId === project.id);
            const totalBudget = projectBudgets.reduce((sum, b) => sum + b.amount, 0);
            const activeNotice = publicNotices.find(
              (n) => n.projectId === project.id && (n.status === 'active' || n.status === 'republished')
            );

            return (
              <div key={project.id} className="border rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      {project.supervisorFiled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle2 size={12} />
                          已备案
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <AlertTriangle size={12} />
                          未备案
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={14} />
                      {project.address}
                    </div>
                  </div>

                  {!project.supervisorFiled && (
                    <button
                      onClick={() => supervisorFile(project.id)}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FileCheck2 size={16} />
                      确认备案
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-gray-400" />
                    <div>
                      <div className="text-gray-500 text-xs">预算状态</div>
                      {project.budgetConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle2 size={14} /> 已确认 ¥{totalBudget.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                          <XCircle size={14} /> 未确认
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-gray-400" />
                    <div>
                      <div className="text-gray-500 text-xs">公示状态</div>
                      {activeNotice ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle2 size={14} /> 公示中
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                          <XCircle size={14} /> 未公示
                        </span>
                      )}
                    </div>
                  </div>

                  {unit && (
                    <div className="flex items-center gap-2">
                      <HardHat size={16} className="text-gray-400" />
                      <div>
                        <div className="text-gray-500 text-xs">施工单位</div>
                        <span className="font-medium text-gray-700">{unit.name}</span>
                        <span className="text-gray-400 ml-2 text-xs">
                          {unit.qualification} · {unit.contactPerson} · {unit.contactPhone}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
