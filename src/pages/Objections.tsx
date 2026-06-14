import { useState, useEffect } from 'react';
import {
  AlertTriangle, Clock, CheckCircle2, Loader2, MessageSquareWarning,
  Send, Play, Filter, ListFilter,
} from 'lucide-react';
import useStore from '@/store';
import {
  OBJECTION_STATUS_LABELS, formatDateTime, isObjectionOverdue,
  type Objection,
} from '@/types';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | Objection['status'];

const STATUS_BADGE_COLORS: Record<Objection['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

const COUNT_CARD_STYLES: { key: StatusFilter; label: string; color: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', color: 'bg-gray-50 border-gray-200 text-gray-700', icon: <ListFilter className="w-5 h-5" /> },
  { key: 'pending', label: '待处理', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: <Clock className="w-5 h-5" /> },
  { key: 'processing', label: '处理中', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: <Loader2 className="w-5 h-5" /> },
  { key: 'resolved', label: '已解决', color: 'bg-green-50 border-green-200 text-green-700', icon: <CheckCircle2 className="w-5 h-5" /> },
  { key: 'overdue', label: '已超期', color: 'bg-red-50 border-red-200 text-red-700', icon: <AlertTriangle className="w-5 h-5" /> },
];

export default function Objections() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [localProcessingIds, setLocalProcessingIds] = useState<Set<string>>(new Set());

  const { objections, projects, publicNotices, processObjection, markObjectionOverdue } = useStore();

  useEffect(() => {
    objections.forEach((o) => {
      if ((o.status === 'pending' || o.status === 'processing') && !o.overdue && isObjectionOverdue(o.createdAt)) {
        markObjectionOverdue(o.id);
      }
    });
  }, [objections, markObjectionOverdue]);

  const getProjectName = (obj: Objection): string => {
    const notice = publicNotices.find((n) => n.id === obj.noticeId);
    if (!notice) return '未知项目';
    const project = projects.find((p) => p.id === notice.projectId);
    return project?.name ?? '未知项目';
  };

  const getProjectId = (obj: Objection): string => {
    const notice = publicNotices.find((n) => n.id === obj.noticeId);
    return notice?.projectId ?? '';
  };

  const enrichedObjections = objections.map((o) => ({
    ...o,
    projectName: getProjectName(o),
    projectId: getProjectId(o),
    effectiveStatus: localProcessingIds.has(o.id) ? 'processing' as const : o.status,
  }));

  const filteredObjections = enrichedObjections.filter((o) => {
    if (statusFilter !== 'all' && o.effectiveStatus !== statusFilter) return false;
    if (projectFilter !== 'all' && o.projectId !== projectFilter) return false;
    return true;
  });

  const counts = {
    all: enrichedObjections.length,
    pending: enrichedObjections.filter((o) => o.effectiveStatus === 'pending').length,
    processing: enrichedObjections.filter((o) => o.effectiveStatus === 'processing').length,
    resolved: enrichedObjections.filter((o) => o.effectiveStatus === 'resolved').length,
    overdue: enrichedObjections.filter((o) => o.effectiveStatus === 'overdue').length,
  };

  const projectOptions = Array.from(new Map(
    enrichedObjections.map((o) => [o.projectId, o.projectName])
  ).entries());

  const handleStartProcessing = (id: string) => {
    setLocalProcessingIds((prev) => new Set(prev).add(id));
  };

  const handleReply = (id: string) => {
    const reply = replyMap[id]?.trim();
    if (!reply) return;
    processObjection(id, reply);
    setReplyMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setLocalProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">异议处理</h1>
          <p className="text-gray-500 mt-1">管理和处理居民提交的异议</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-5 gap-4">
          {COUNT_CARD_STYLES.map((card) => (
            <button
              key={card.key}
              onClick={() => setStatusFilter(card.key)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all',
                card.color,
                statusFilter === card.key ? 'ring-2 ring-offset-1 ring-current scale-[1.02]' : 'opacity-70 hover:opacity-100'
              )}
            >
              {card.icon}
              <div className="text-left">
                <p className="text-2xl font-bold">{counts[card.key]}</p>
                <p className="text-sm font-medium">{card.label}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="overdue">已超期</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-gray-400" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            >
              <option value="all">全部项目</option>
              {projectOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">编号</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">项目名称</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">异议内容</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">联系方式</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">状态</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">提交时间</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">处理时间</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredObjections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                      <MessageSquareWarning className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg">暂无异议记录</p>
                    </td>
                  </tr>
                ) : (
                  filteredObjections.map((obj) => {
                    const isOverdue = obj.overdue || obj.effectiveStatus === 'overdue';
                    const isLocallyProcessing = localProcessingIds.has(obj.id);

                    return (
                      <tr
                        key={obj.id}
                        className={cn(
                          'border-b border-gray-50 transition-colors',
                          isOverdue && 'bg-red-50/60'
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-gray-500">
                          {obj.id.substring(0, 8)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">
                          {obj.projectName}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[240px]">
                          <p className="truncate" title={obj.content}>{obj.content}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{obj.contactInfo}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                              STATUS_BADGE_COLORS[obj.effectiveStatus],
                              obj.effectiveStatus === 'overdue' && 'animate-pulse'
                            )}>
                              {OBJECTION_STATUS_LABELS[obj.effectiveStatus]}
                            </span>
                            {isOverdue && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white animate-pulse">
                                超期
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTime(obj.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTime(obj.processedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {(obj.effectiveStatus === 'pending' && !isLocallyProcessing) && (
                            <button
                              onClick={() => handleStartProcessing(obj.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5" />
                              开始处理
                            </button>
                          )}

                          {(obj.effectiveStatus === 'processing' || (obj.status === 'pending' && isLocallyProcessing)) && (
                            <div className="flex items-center gap-2">
                              <textarea
                                value={replyMap[obj.id] ?? ''}
                                onChange={(e) => setReplyMap((prev) => ({ ...prev, [obj.id]: e.target.value }))}
                                placeholder="输入回复内容..."
                                rows={1}
                                className="w-40 px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none"
                              />
                              <button
                                onClick={() => handleReply(obj.id)}
                                disabled={!replyMap[obj.id]?.trim()}
                                className={cn(
                                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                  replyMap[obj.id]?.trim()
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                )}
                              >
                                <Send className="w-3.5 h-3.5" />
                                回复
                              </button>
                            </div>
                          )}

                          {obj.effectiveStatus === 'resolved' && obj.reply && (
                            <p className="text-xs text-green-700 max-w-[200px] truncate" title={obj.reply}>
                              {obj.reply}
                            </p>
                          )}

                          {obj.effectiveStatus === 'overdue' && obj.status !== 'resolved' && (
                            <div className="flex items-center gap-2">
                              <textarea
                                value={replyMap[obj.id] ?? ''}
                                onChange={(e) => setReplyMap((prev) => ({ ...prev, [obj.id]: e.target.value }))}
                                placeholder="输入回复内容..."
                                rows={1}
                                className="w-40 px-2 py-1.5 border border-red-300 rounded text-xs bg-red-50 focus:ring-1 focus:ring-red-400 focus:border-red-400 outline-none resize-none"
                              />
                              <button
                                onClick={() => handleReply(obj.id)}
                                disabled={!replyMap[obj.id]?.trim()}
                                className={cn(
                                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                  replyMap[obj.id]?.trim()
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                )}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                回复
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
