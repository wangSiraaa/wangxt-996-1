import { useState, useMemo } from 'react';
import useStore from '@/store';
import { formatDate, formatDateTime, ChangeCategory, CHANGE_CATEGORY_CONFIG } from '@/types';
import {
  FileEdit, History, AlertTriangle, CheckCircle2, XCircle,
  Clock, RefreshCw, Send, Building2, Link2,
} from 'lucide-react';

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: '待审批' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: '已批准' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '已驳回' },
};

export default function Changes() {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [changeCategory, setChangeCategory] = useState<ChangeCategory>('other');
  const [reason, setReason] = useState('');

  const store = useStore();
  const { projects, buildings, changeRecords, submitChange, approveChange, rejectChange, publicNotices } = store;

  const projectBuildings = buildings.filter((b) => b.projectId === selectedProjectId);
  const projectChanges = changeRecords.filter((c) => c.projectId === selectedProjectId);
  const selectedBuilding = buildings.find((b) => b.id === buildingId);
  const isInspectionLocked = selectedBuilding?.inspectionLocked ?? false;

  const cascadeAffectedIds = useMemo(() => {
    if (!buildingId) return [];
    return store.getCascadeAffectedBuildings(buildingId);
  }, [buildingId, store, buildings]);

  const cascadeAffectedDetails = useMemo(() => {
    return cascadeAffectedIds.map((aid) => {
      const affectedBuilding = buildings.find((b) => b.id === aid);
      if (!affectedBuilding) return null;
      const reasons: string[] = [];
      if (selectedBuilding?.sharedPipeBuildingIds.includes(aid)) {
        reasons.push('共享管网');
      }
      if (selectedBuilding?.budgetAffectedBy.includes(aid)) {
        reasons.push('共享预算');
      }
      if (affectedBuilding.sharedPipeBuildingIds.includes(buildingId)) {
        reasons.push('共享管网');
      }
      if (affectedBuilding.budgetAffectedBy.includes(buildingId)) {
        reasons.push('共享预算');
      }
      return {
        id: aid,
        buildingNo: affectedBuilding.buildingNo,
        reasons: [...new Set(reasons)],
        inspectionLocked: affectedBuilding.inspectionLocked,
      };
    }).filter(Boolean) as { id: string; buildingNo: string; reasons: string[]; inspectionLocked: boolean }[];
  }, [cascadeAffectedIds, buildings, selectedBuilding, buildingId]);

  const handleSubmit = () => {
    if (!selectedProjectId || !buildingId || !reason.trim()) return;
    submitChange(selectedProjectId, buildingId, changeCategory, reason.trim());
    setBuildingId('');
    setChangeCategory('other');
    setReason('');
  };

  const getCascadeInfoForRecord = (record: (typeof projectChanges)[0]) => {
    if (!record.cascadeAffectedBuildingIds.length) return null;
    return record.cascadeAffectedBuildingIds.map((aid) => {
      const b = buildings.find((bl) => bl.id === aid);
      return b ? b.buildingNo : aid.slice(-6);
    });
  };

  const getRepublicationStatus = (record: (typeof projectChanges)[0]) => {
    const notice = publicNotices.find(
      (n) => n.triggeredByChangeId === record.id && (n.status === 'active' || n.status === 'republished')
    );
    if (!notice) return null;
    return {
      startDate: notice.startDate,
      endDate: notice.endDate,
      cascadeBuildingIds: notice.cascadeAffectedBuildingIds,
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">变更历史</h1>
        <select
          value={selectedProjectId}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setBuildingId('');
            setChangeCategory('other');
            setReason('');
          }}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[220px]"
        >
          <option value="">选择项目</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!selectedProjectId && (
        <div className="text-center py-16 text-gray-400">请先选择项目</div>
      )}

      {selectedProjectId && (
        <>
          <section className="border rounded-xl p-6 space-y-5 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileEdit size={20} className="text-blue-600" />
              变更申请
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">楼栋</label>
                <select
                  value={buildingId}
                  onChange={(e) => setBuildingId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">选择楼栋</option>
                  {projectBuildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.buildingNo}{b.inspectionLocked ? ' (已验收锁定)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">变更类型</label>
                <select
                  value={changeCategory}
                  onChange={(e) => setChangeCategory(e.target.value as ChangeCategory)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {(Object.keys(CHANGE_CATEGORY_CONFIG) as ChangeCategory[]).map((key) => (
                    <option key={key} value={key}>{CHANGE_CATEGORY_CONFIG[key].label}</option>
                  ))}
                </select>
              </div>

              {buildingId && cascadeAffectedDetails.length > 0 && (
                <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-orange-700 font-medium">
                    <Link2 size={16} />
                    <span>级联影响（{cascadeAffectedDetails.length} 栋楼受影响）</span>
                  </div>
                  <div className="space-y-2">
                    {cascadeAffectedDetails.map((detail) => (
                      <div key={detail.id} className="flex items-center gap-3 bg-white rounded-md px-3 py-2 border border-orange-100">
                        <Building2 size={14} className="text-orange-500 shrink-0" />
                        <span className="font-medium text-sm">{detail.buildingNo}</span>
                        <div className="flex items-center gap-1.5">
                          {detail.reasons.map((r) => (
                            <span key={r} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              {r}
                            </span>
                          ))}
                        </div>
                        {detail.inspectionLocked && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            已验收锁定
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600">
                    变更批准后，以上楼栋的公示期/投票/预算将受到级联影响
                  </p>
                </div>
              )}

              {isInspectionLocked && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700 font-medium">
                    该楼栋已验收锁定，变更后需重新公示七天
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">变更原因</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请输入变更原因..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {isInspectionLocked
                    ? '系统将自动标记为需要重新公示'
                    : buildingId
                      ? '该楼栋无需重新公示'
                      : ''}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!buildingId || !reason.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  提交变更
                </button>
              </div>
            </div>
          </section>

          <section className="border rounded-xl p-6 space-y-5 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History size={20} className="text-purple-600" />
              变更历史
            </h2>

            {projectChanges.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无变更记录</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">楼栋</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">变更类型</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">原因</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">级联影响</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">申请时间</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">需重新公示</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">公示期</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {projectChanges.map((record) => {
                      const building = buildings.find((b) => b.id === record.buildingId);
                      const badge = STATUS_BADGE[record.status];
                      const shortId = record.id.slice(-6);
                      const categoryLabel = CHANGE_CATEGORY_CONFIG[record.changeCategory]?.label ?? record.changeCategory;
                      const cascadeInfo = getCascadeInfoForRecord(record);
                      const republicationStatus = record.status === 'approved' ? getRepublicationStatus(record) : null;
                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{shortId}</td>
                          <td className="px-4 py-3 font-medium">
                            {building?.buildingNo ?? '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {categoryLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                            {record.reason}
                          </td>
                          <td className="px-4 py-3">
                            {cascadeInfo ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 w-fit">
                                  <Link2 size={10} />
                                  {record.cascadeAffectedBuildingIds.length} 栋
                                </span>
                                <span className="text-xs text-gray-500">{cascadeInfo.join('、')}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">无</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                              {record.status === 'pending' && <Clock size={12} />}
                              {record.status === 'approved' && <CheckCircle2 size={12} />}
                              {record.status === 'rejected' && <XCircle size={12} />}
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {formatDateTime(record.appliedAt)}
                          </td>
                          <td className="px-4 py-3">
                            {record.requiresRepublication ? (
                              <span className="text-red-600 font-medium">是</span>
                            ) : (
                              <span className="text-gray-400">否</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {record.status === 'approved' && record.requiresRepublication && record.rePublicationStart ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {formatDate(record.rePublicationStart)} — {formatDate(record.rePublicationEnd)}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-fit">
                                  <RefreshCw size={10} />
                                  重新公示中
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {record.status === 'pending' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => approveChange(record.id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  批准
                                </button>
                                <button
                                  onClick={() => rejectChange(record.id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  驳回
                                </button>
                              </div>
                            )}
                            {record.status === 'approved' && record.cascadeAffectedBuildingIds.length > 0 && (
                              <div className="flex flex-col items-end gap-1">
                                {republicationStatus && republicationStatus.cascadeBuildingIds.length > 0 && (
                                  <span className="text-xs text-orange-600">
                                    已重新公示（含 {republicationStatus.cascadeBuildingIds.length} 栋级联楼栋）
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">
                                  {record.cascadeAffectedBuildingIds
                                    .map((aid) => buildings.find((b) => b.id === aid)?.buildingNo ?? aid.slice(-6))
                                    .join('、')}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
