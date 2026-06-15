import { useState } from 'react';
import useStore from '@/store';
import {
  BudgetSource,
  SOURCE_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  formatDate,
  daysRemaining,
} from '@/types';
import {
  Plus,
  CheckCircle2,
  XCircle,
  Lock,
  Trash2,
  Calendar,
  Building2,
  Wallet,
  HardHat,
  Megaphone,
  ChevronRight,
  ChevronDown,
  Home,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  publishing: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  constructing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-700',
};

const TABS = [
  { key: 'projects', label: '项目包管理', icon: Building2 },
  { key: 'buildings', label: '楼栋分户', icon: Building2 },
  { key: 'budget', label: '预算来源', icon: Wallet },
  { key: 'construction', label: '施工单位', icon: HardHat },
  { key: 'notice', label: '公示时间', icon: Megaphone },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function Street() {
  const [activeTab, setActiveTab] = useState<TabKey>('projects');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', address: '', totalArea: '', totalBudget: '' });
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [buildingForm, setBuildingForm] = useState({ buildingNo: '', units: '', households: '', area: '' });
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState<{ sourceType: BudgetSource['sourceType']; amount: string; description: string }>({ sourceType: 'fiscal', amount: '', description: '' });
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: '', qualification: '', contactPerson: '', contactPhone: '' });
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ startDate: '', endDate: '' });
  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [householdForm, setHouseholdForm] = useState({ unitNo: '', floorNo: '', roomNo: '', area: '' });

  const store = useStore();
  const {
    projects, buildings, households, budgetSources, constructionUnits, publicNotices,
    addProject, confirmBudget, addBuilding, addBudgetSource, removeBudgetSource,
    addConstructionUnit, publishNotice, getVoteStats, addHousehold,
  } = store;

  const filteredBuildings = buildings.filter((b) => b.projectId === selectedProjectId);
  const filteredBudgets = budgetSources.filter((b) => b.projectId === selectedProjectId);
  const filteredUnits = constructionUnits.filter((u) => u.projectId === selectedProjectId);
  const activeNotice = publicNotices.find(
    (n) => n.projectId === selectedProjectId && (n.status === 'active' || n.status === 'republished')
  );
  const totalBudget = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);

  const handleAddProject = () => {
    if (!projectForm.name || !projectForm.address) return;
    addProject({
      name: projectForm.name,
      address: projectForm.address,
      totalArea: Number(projectForm.totalArea) || 0,
      totalBudget: Number(projectForm.totalBudget) || 0,
    });
    setProjectForm({ name: '', address: '', totalArea: '', totalBudget: '' });
    setShowProjectModal(false);
  };

  const handleAddBuilding = () => {
    if (!selectedProjectId || !buildingForm.buildingNo) return;
    addBuilding({
      projectId: selectedProjectId,
      buildingNo: buildingForm.buildingNo,
      units: Number(buildingForm.units) || 0,
      households: Number(buildingForm.households) || 0,
      area: Number(buildingForm.area) || 0,
    });
    setBuildingForm({ buildingNo: '', units: '', households: '', area: '' });
    setShowBuildingForm(false);
  };

  const handleAddBudget = () => {
    if (!selectedProjectId || !budgetForm.amount) return;
    addBudgetSource({
      projectId: selectedProjectId,
      sourceType: budgetForm.sourceType,
      amount: Number(budgetForm.amount) || 0,
      description: budgetForm.description,
    });
    setBudgetForm({ sourceType: 'fiscal', amount: '', description: '' });
    setShowBudgetForm(false);
  };

  const handleAddUnit = () => {
    if (!selectedProjectId || !unitForm.name) return;
    addConstructionUnit({
      projectId: selectedProjectId,
      name: unitForm.name,
      qualification: unitForm.qualification,
      contactPerson: unitForm.contactPerson,
      contactPhone: unitForm.contactPhone,
    });
    setUnitForm({ name: '', qualification: '', contactPerson: '', contactPhone: '' });
    setShowUnitForm(false);
  };

  const handlePublishNotice = () => {
    if (!selectedProjectId || !noticeForm.startDate || !noticeForm.endDate) return;
    publishNotice(selectedProjectId, noticeForm.startDate, noticeForm.endDate);
    setNoticeForm({ startDate: '', endDate: '' });
  };

  const getHouseholdCount = (buildingId: string) =>
    households.filter((h) => h.buildingId === buildingId).length;

  const getBuildingHouseholds = (buildingId: string) =>
    households.filter((h) => h.buildingId === buildingId);

  const handleAddHousehold = () => {
    if (!selectedBuildingId || !householdForm.roomNo) return;
    addHousehold({
      buildingId: selectedBuildingId,
      unitNo: householdForm.unitNo,
      floorNo: householdForm.floorNo,
      roomNo: householdForm.roomNo,
      area: Number(householdForm.area) || 0,
    });
    setHouseholdForm({ unitNo: '', floorNo: '', roomNo: '', area: '' });
    setShowHouseholdModal(false);
  };

  const voteStats = activeNotice ? getVoteStats(activeNotice.id) : null;
  const remaining = activeNotice ? daysRemaining(activeNotice.endDate) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">街道台账管理</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              新增项目
            </button>
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无项目，请点击新增项目</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{project.address}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>

                <div className="flex gap-6 text-sm text-gray-600">
                  <span>面积: <strong>{project.totalArea}</strong> m²</span>
                  <span>预算: <strong>{project.totalBudget.toLocaleString()}</strong> 元</span>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  {!project.budgetConfirmed && (
                    <button
                      onClick={() => confirmBudget(project.id)}
                      className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      确认预算
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setActiveTab('notice');
                    }}
                    className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    发布公示
                  </button>
                  {project.budgetConfirmed && (
                    <span className="px-3 py-1.5 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> 预算已确认
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showProjectModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <h2 className="text-lg font-semibold">新增项目</h2>
                <div className="space-y-3">
                  <input
                    placeholder="项目名称"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="项目地址"
                    value={projectForm.address}
                    onChange={(e) => setProjectForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="总面积 (m²)"
                    type="number"
                    value={projectForm.totalArea}
                    onChange={(e) => setProjectForm((f) => ({ ...f, totalArea: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="总预算 (元)"
                    type="number"
                    value={projectForm.totalBudget}
                    onChange={(e) => setProjectForm((f) => ({ ...f, totalBudget: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowProjectModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddProject}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'buildings' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
            >
              <option value="">选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {selectedProjectId && (
              <button
                onClick={() => setShowBuildingForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                添加楼栋
              </button>
            )}
          </div>

          {!selectedProjectId && (
            <div className="text-center py-12 text-gray-400">请先选择项目</div>
          )}

          {selectedProjectId && filteredBuildings.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无楼栋数据</div>
          )}

          {selectedProjectId && filteredBuildings.length > 0 && (
            <div className="space-y-3">
              {filteredBuildings.map((b) => {
                const isExpanded = expandedBuildingId === b.id;
                const recorded = getHouseholdCount(b.id);
                const bHouseholds = getBuildingHouseholds(b.id);
                return (
                  <div key={b.id} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedBuildingId(isExpanded ? null : b.id)}
                        >
                          <td className="px-3 py-3 w-8 text-center text-gray-400">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </td>
                          <td className="px-2 py-3 font-medium">{b.buildingNo}</td>
                          <td className="px-2 py-3">{b.units}</td>
                          <td className="px-2 py-3">{b.households}</td>
                          <td className="px-2 py-3">{b.area}</td>
                          <td className="px-2 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                recorded >= b.households
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {recorded} / {b.households || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            {b.inspectionLocked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <Lock size={12} />
                                已验收锁定
                              </span>
                            ) : (
                              <span className="text-gray-400">正常</span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedBuildingId(b.id);
                                setShowHouseholdModal(true);
                              }}
                              disabled={b.inspectionLocked}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                b.inspectionLocked
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              <Plus size={14} />
                              录入分户
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Home size={14} />
                            分户明细（{bHouseholds.length} 条）
                          </h4>
                          <button
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              setShowHouseholdModal(true);
                            }}
                            disabled={b.inspectionLocked}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded ${
                              b.inspectionLocked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white border text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Plus size={12} /> 新增分户
                          </button>
                        </div>
                        {bHouseholds.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-sm">
                            暂无分户明细，请点击右上角"新增分户"录入
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden bg-white">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">单元号</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">楼层</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">房号</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">面积 (m²)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {bHouseholds.map((h) => (
                                  <tr key={h.id}>
                                    <td className="px-3 py-2">{h.unitNo || '-'}</td>
                                    <td className="px-3 py-2">{h.floorNo || '-'}</td>
                                    <td className="px-3 py-2 font-medium">{h.roomNo}</td>
                                    <td className="px-3 py-2">{h.area || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showBuildingForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <h2 className="text-lg font-semibold">添加楼栋</h2>
                <div className="space-y-3">
                  <input
                    placeholder="楼栋号"
                    value={buildingForm.buildingNo}
                    onChange={(e) => setBuildingForm((f) => ({ ...f, buildingNo: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="单元数"
                    type="number"
                    value={buildingForm.units}
                    onChange={(e) => setBuildingForm((f) => ({ ...f, units: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="户数"
                    type="number"
                    value={buildingForm.households}
                    onChange={(e) => setBuildingForm((f) => ({ ...f, households: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="面积 (m²)"
                    type="number"
                    value={buildingForm.area}
                    onChange={(e) => setBuildingForm((f) => ({ ...f, area: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowBuildingForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddBuilding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          )}

          {showHouseholdModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    录入分户 · {buildings.find((b) => b.id === selectedBuildingId)?.buildingNo}
                  </h3>
                  <button onClick={() => setShowHouseholdModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">单元号 <span className="text-gray-400">(可选)</span></label>
                    <input
                      value={householdForm.unitNo}
                      onChange={(e) => setHouseholdForm({ ...householdForm, unitNo: e.target.value })}
                      placeholder="如：1、2、3"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">楼层 <span className="text-gray-400">(可选)</span></label>
                    <input
                      value={householdForm.floorNo}
                      onChange={(e) => setHouseholdForm({ ...householdForm, floorNo: e.target.value })}
                      placeholder="如：1F、2F"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">房号 <span className="text-red-500">*</span></label>
                    <input
                      value={householdForm.roomNo}
                      onChange={(e) => setHouseholdForm({ ...householdForm, roomNo: e.target.value })}
                      placeholder="如：101、2-202"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">面积 (m²) <span className="text-gray-400">(可选)</span></label>
                    <input
                      type="number"
                      value={householdForm.area}
                      onChange={(e) => setHouseholdForm({ ...householdForm, area: e.target.value })}
                      placeholder="如：85.5"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowHouseholdModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddHousehold}
                    disabled={!householdForm.roomNo}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      !householdForm.roomNo
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    确认录入
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
            >
              <option value="">选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {selectedProjectId && (
              <button
                onClick={() => setShowBudgetForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                添加预算
              </button>
            )}
          </div>

          {!selectedProjectId && (
            <div className="text-center py-12 text-gray-400">请先选择项目</div>
          )}

          {selectedProjectId && filteredBudgets.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无预算来源数据</div>
          )}

          {selectedProjectId && filteredBudgets.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">来源类型</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">金额 (元)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">说明</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBudgets.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {SOURCE_TYPE_LABELS[b.sourceType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{b.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">{b.description || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeBudgetSource(b.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedProjectId && filteredBudgets.length > 0 && (
            <div className="flex justify-end px-4 py-3 bg-blue-50 rounded-xl">
              <span className="text-sm text-gray-600">预算合计：</span>
              <span className="text-lg font-bold text-blue-700 ml-2">{totalBudget.toLocaleString()} 元</span>
            </div>
          )}

          {showBudgetForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <h2 className="text-lg font-semibold">添加预算来源</h2>
                <div className="space-y-3">
                  <select
                    value={budgetForm.sourceType}
                    onChange={(e) => setBudgetForm((f) => ({ ...f, sourceType: e.target.value as BudgetSource['sourceType'] }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Object.entries(SOURCE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <input
                    placeholder="金额 (元)"
                    type="number"
                    value={budgetForm.amount}
                    onChange={(e) => setBudgetForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="说明"
                    value={budgetForm.description}
                    onChange={(e) => setBudgetForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowBudgetForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddBudget}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'construction' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
            >
              <option value="">选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {selectedProjectId && (
              <button
                onClick={() => setShowUnitForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                添加单位
              </button>
            )}
          </div>

          {!selectedProjectId && (
            <div className="text-center py-12 text-gray-400">请先选择项目</div>
          )}

          {selectedProjectId && filteredUnits.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无施工单位数据</div>
          )}

          {selectedProjectId && filteredUnits.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">单位名称</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">资质等级</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">联系人</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">联系电话</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUnits.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3">{u.qualification || '-'}</td>
                      <td className="px-4 py-3">{u.contactPerson || '-'}</td>
                      <td className="px-4 py-3">{u.contactPhone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showUnitForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <h2 className="text-lg font-semibold">添加施工单位</h2>
                <div className="space-y-3">
                  <input
                    placeholder="单位名称"
                    value={unitForm.name}
                    onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="资质等级"
                    value={unitForm.qualification}
                    onChange={(e) => setUnitForm((f) => ({ ...f, qualification: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="联系人"
                    value={unitForm.contactPerson}
                    onChange={(e) => setUnitForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="联系电话"
                    value={unitForm.contactPhone}
                    onChange={(e) => setUnitForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowUnitForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddUnit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notice' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
            >
              <option value="">选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {!selectedProjectId && (
            <div className="text-center py-12 text-gray-400">请先选择项目</div>
          )}

          {selectedProjectId && !activeNotice && (
            <div className="border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar size={20} />
                发布公示
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={noticeForm.startDate}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={noticeForm.endDate}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handlePublishNotice}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                发布公示
              </button>
            </div>
          )}

          {selectedProjectId && activeNotice && (
            <div className="space-y-4">
              <div className="border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-lg">公示信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">开始日期：</span>
                    <span className="font-medium">{formatDate(activeNotice.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">结束日期：</span>
                    <span className="font-medium">{formatDate(activeNotice.endDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">剩余天数：</span>
                    <span className={`font-bold ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {remaining > 0 ? `${remaining} 天` : '已到期'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">七天公示：</span>
                    {activeNotice.fullSevenDays ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={16} /> 满足
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircle size={16} /> 不满足
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {voteStats && (
                <div className="border rounded-xl p-6 space-y-3">
                  <h3 className="font-semibold text-lg">投票统计</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{voteStats.approve}</div>
                      <div className="text-xs text-gray-500 mt-1">赞成</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{voteStats.oppose}</div>
                      <div className="text-xs text-gray-500 mt-1">反对</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{voteStats.total}</div>
                      <div className="text-xs text-gray-500 mt-1">总票数</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{(voteStats.rate * 100).toFixed(1)}%</div>
                      <div className="text-xs text-gray-500 mt-1">赞成率</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
