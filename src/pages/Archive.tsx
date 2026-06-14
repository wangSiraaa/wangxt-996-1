import { useState, useMemo } from 'react';
import useStore from '@/store';
import { formatDateTime, PROJECT_STATUS_LABELS } from '@/types';
import {
  ScrollText, Archive as ArchiveIcon, User, Clock, CheckCircle2,
  XCircle, Building2, ShieldCheck, FileCheck, Lock,
} from 'lucide-react';

const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  street: { bg: 'bg-blue-100', text: 'text-blue-700', label: '街道' },
  resident: { bg: 'bg-green-100', text: 'text-green-700', label: '居民' },
  supervisor: { bg: 'bg-amber-100', text: 'text-amber-700', label: '监理' },
};

type TabKey = 'logs' | 'archive';
type RoleFilter = 'all' | 'street' | 'resident' | 'supervisor';

export default function Archive() {
  const [activeTab, setActiveTab] = useState<TabKey>('logs');
  const [projectFilter, setProjectFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const store = useStore();
  const { projects, buildings, constructionPhases, inspections, auditLogs, archiveProject } = store;

  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        if (projectFilter && log.projectId !== projectFilter) return false;
        if (roleFilter !== 'all' && log.role !== roleFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, projectFilter, roleFilter]);

  const completedProjects = projects.filter(
    (p) => p.status === 'completed' || p.status === 'archived'
  );

  const getProjectPhases = (projectId: string) =>
    constructionPhases.filter((p) => p.projectId === projectId);

  const getProjectInspections = (projectId: string) => {
    const phaseIds = constructionPhases
      .filter((p) => p.projectId === projectId)
      .map((p) => p.id);
    return inspections.filter((i) => phaseIds.includes(i.phaseId));
  };

  const handleArchive = (id: string) => {
    archiveProject(id);
    setConfirmId(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">归档审计</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'logs' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ScrollText size={16} />
          操作日志
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'archive' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArchiveIcon size={16} />
          归档管理
        </button>
      </div>

      {activeTab === 'logs' && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
            >
              <option value="">全部项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="flex gap-1">
              {(['all', 'street', 'resident', 'supervisor'] as RoleFilter[]).map((val) => (
                <button
                  key={val}
                  onClick={() => setRoleFilter(val)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    roleFilter === val
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {val === 'all' ? '全部角色' : ROLE_BADGE[val].label}
                </button>
              ))}
            </div>

            <span className="ml-auto text-sm text-gray-500">
              共 {filteredLogs.length} 条记录
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">暂无操作日志</div>
          ) : (
            <div className="relative pl-6 space-y-0">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
              {filteredLogs.map((log) => {
                const roleCfg = ROLE_BADGE[log.role];
                return (
                  <div key={log.id} className="relative pl-8 pb-6 last:pb-0">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {formatDateTime(log.timestamp)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleCfg.bg} ${roleCfg.text}`}>
                          {roleCfg.label}
                        </span>
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <User size={14} />
                          {log.operator}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-800">{log.action}</div>
                      <div className="text-sm text-gray-500">{log.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'archive' && (
        <div className="space-y-4">
          {completedProjects.length === 0 ? (
            <div className="text-center py-16 text-gray-400">暂无已完工项目</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedProjects.map((project) => {
                const isArchived = project.status === 'archived';
                const phases = getProjectPhases(project.id);
                const projectInspections = getProjectInspections(project.id);
                const completedPhases = phases.filter((p) => p.status === 'completed').length;
                const passedInspections = projectInspections.filter((i) => i.result === 'pass').length;

                return (
                  <div
                    key={project.id}
                    className={`border rounded-xl p-5 space-y-4 shadow-sm transition-opacity ${
                      isArchived ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{project.address}</p>
                      </div>
                      {isArchived ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 flex items-center gap-1">
                          <Lock size={12} />
                          已归档
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          {PROJECT_STATUS_LABELS[project.status]}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Building2 size={12} />
                          施工阶段
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-gray-800">{completedPhases}</span>
                          <span className="text-gray-400"> / {phases.length} 已完成</span>
                        </div>
                        {phases.length > 0 && completedPhases === phases.length && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 size={10} /> 全部完成
                          </span>
                        )}
                        {phases.length > 0 && completedPhases < phases.length && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <XCircle size={10} /> 未全部完成
                          </span>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <ShieldCheck size={12} />
                          验收情况
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-gray-800">{passedInspections}</span>
                          <span className="text-gray-400"> / {projectInspections.length} 通过</span>
                        </div>
                        {projectInspections.length > 0 && passedInspections === projectInspections.length && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <FileCheck size={10} /> 全部通过
                          </span>
                        )}
                        {projectInspections.length > 0 && passedInspections < projectInspections.length && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <XCircle size={10} /> 未全部通过
                          </span>
                        )}
                      </div>
                    </div>

                    {!isArchived && (
                      <button
                        onClick={() => setConfirmId(project.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <ArchiveIcon size={16} />
                        归档
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold">确认归档</h2>
            <p className="text-sm text-gray-600">
              归档后项目将不可再修改，确定要归档该项目吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={() => handleArchive(confirmId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确认归档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
