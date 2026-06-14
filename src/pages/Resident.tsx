import { useState } from 'react';
import {
  Bell, Vote, MessageSquareWarning, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, CheckCircle2, Send, Building2,
  MapPin, Wallet, HardHat, Clock, User, Phone
} from 'lucide-react';
import useStore from '@/store';
import {
  formatDate, formatDateTime, daysRemaining, SOURCE_TYPE_LABELS,
  OBJECTION_STATUS_LABELS,
  type PublicNotice, type Objection,
} from '@/types';
import { cn } from '@/lib/utils';

type TabKey = 'notice' | 'vote' | 'objection';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'notice', label: '公示公告', icon: <Bell className="w-5 h-5" /> },
  { key: 'vote', label: '投票', icon: <Vote className="w-5 h-5" /> },
  { key: 'objection', label: '异议提交', icon: <MessageSquareWarning className="w-5 h-5" /> },
];

export default function Resident() {
  const [activeTab, setActiveTab] = useState<TabKey>('notice');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [selectedNoticeForVote, setSelectedNoticeForVote] = useState<string>('');
  const [voteChoice, setVoteChoice] = useState<boolean | null>(null);
  const [residentName, setResidentName] = useState('');
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  const [selectedNoticeForObjection, setSelectedNoticeForObjection] = useState<string>('');
  const [objectionContent, setObjectionContent] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [objectionSubmitted, setObjectionSubmitted] = useState(false);
  const [lastObjectionId, setLastObjectionId] = useState('');

  const {
    publicNotices, projects, buildings, budgetSources, constructionUnits,
    votes, objections, addVote, addObjection, getVoteStats,
  } = useStore();

  const activeNotices = publicNotices.filter(
    (n) => n.status === 'active' || n.status === 'republished'
  );

  const getProject = (projectId: string) => projects.find((p) => p.id === projectId);
  const getBuildings = (projectId: string) => buildings.filter((b) => b.projectId === projectId);
  const getBudgetSources = (projectId: string) => budgetSources.filter((b) => b.projectId === projectId);
  const getConstructionUnit = (projectId: string) => constructionUnits.find((u) => u.projectId === projectId);

  const userObjections = objections.filter(
    (o) => activeNotices.some((n) => n.id === o.noticeId)
  );

  const handleVote = () => {
    if (!selectedNoticeForVote || voteChoice === null || !residentName.trim()) return;
    addVote(selectedNoticeForVote, residentName.trim(), voteChoice);
    setVoteSubmitted(true);
    setTimeout(() => {
      setVoteSubmitted(false);
      setVoteChoice(null);
      setResidentName('');
    }, 3000);
  };

  const handleObjection = () => {
    if (!selectedNoticeForObjection || !objectionContent.trim() || !contactInfo.trim()) return;
    const id = addObjection(selectedNoticeForObjection, objectionContent.trim(), contactInfo.trim());
    setLastObjectionId(id);
    setObjectionSubmitted(true);
    setObjectionContent('');
    setContactInfo('');
    setTimeout(() => setObjectionSubmitted(false), 4000);
  };

  const renderBadge = (notice: PublicNotice) => {
    if (notice.status === 'republished') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
          <Clock className="w-3.5 h-3.5" />重新公示
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" />公示中
      </span>
    );
  };

  const renderDaysRemaining = (endDate: string) => {
    const days = daysRemaining(endDate);
    if (days <= 0) {
      return <span className="text-red-500 font-semibold text-lg">公示期已满</span>;
    }
    return <span className="text-emerald-600 font-semibold text-lg">剩余 {days} 天</span>;
  };

  const objectionStatusColor: Record<Objection['status'], string> = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">居民公示平台</h1>
          <p className="text-gray-500 mt-1">查看公示信息、参与投票、提交异议</p>
        </div>
        <nav className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-base font-medium rounded-t-lg transition-colors',
                  activeTab === tab.key
                    ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === 'notice' && (
          <section>
            {activeNotices.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">暂无公示公告</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeNotices.map((notice) => {
                  const project = getProject(notice.projectId);
                  const projectBuildings = getBuildings(notice.projectId);
                  const projectBudget = getBudgetSources(notice.projectId);
                  const constructionUnit = getConstructionUnit(notice.projectId);
                  const isExpanded = expandedId === notice.id;
                  const totalBudget = projectBudget.reduce((sum, b) => sum + b.amount, 0);

                  return (
                    <div
                      key={notice.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                        className="w-full text-left p-5 flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            {renderBadge(notice)}
                            <h3 className="text-lg font-bold text-gray-800 truncate">
                              {project?.name ?? '未知项目'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-4 text-gray-500 text-base flex-wrap">
                            <span>公示期：{formatDate(notice.startDate)} — {formatDate(notice.endDate)}</span>
                            {renderDaysRemaining(notice.endDate)}
                          </div>
                        </div>
                        {isExpanded
                          ? <ChevronUp className="w-6 h-6 text-gray-400 shrink-0 mt-1" />
                          : <ChevronDown className="w-6 h-6 text-gray-400 shrink-0 mt-1" />
                        }
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                          {project && (
                            <div className="grid gap-3">
                              <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-sm text-gray-500">项目地址</span>
                                  <p className="text-base text-gray-800">{project.address}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Wallet className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-sm text-gray-500">预算总额</span>
                                  <p className="text-base text-gray-800">
                                    ¥{totalBudget.toLocaleString()}
                                  </p>
                                  {projectBudget.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {projectBudget.map((b) => (
                                        <span
                                          key={b.id}
                                          className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-600"
                                        >
                                          {SOURCE_TYPE_LABELS[b.sourceType]} ¥{b.amount.toLocaleString()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {constructionUnit && (
                                <div className="flex items-start gap-3">
                                  <HardHat className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-sm text-gray-500">施工单位</span>
                                    <p className="text-base text-gray-800">{constructionUnit.name}</p>
                                    <p className="text-sm text-gray-500">
                                      资质：{constructionUnit.qualification} ｜ 联系人：{constructionUnit.contactPerson} ｜ 电话：{constructionUnit.contactPhone}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {projectBuildings.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">楼栋列表</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {projectBuildings.map((b) => (
                                  <div
                                    key={b.id}
                                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm"
                                  >
                                    <span className="font-medium text-gray-700">{b.buildingNo}</span>
                                    <span className="text-gray-400 ml-1">
                                      {b.units}单元 · {b.households}户 · {b.area}m²
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'vote' && (
          <section className="space-y-6">
            {activeNotices.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Vote className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">暂无可投票的公示</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    选择公示项目
                  </label>
                  <select
                    value={selectedNoticeForVote}
                    onChange={(e) => {
                      setSelectedNoticeForVote(e.target.value);
                      setVoteChoice(null);
                      setVoteSubmitted(false);
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                  >
                    <option value="">请选择公示项目</option>
                    {activeNotices.map((n) => {
                      const p = getProject(n.projectId);
                      return (
                        <option key={n.id} value={n.id}>
                          {p?.name ?? '未知项目'} ({formatDate(n.startDate)} — {formatDate(n.endDate)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedNoticeForVote && !voteSubmitted && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        您的姓名
                      </label>
                      <input
                        type="text"
                        value={residentName}
                        onChange={(e) => setResidentName(e.target.value)}
                        placeholder="请输入姓名"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        投票选择
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setVoteChoice(true)}
                          className={cn(
                            'flex flex-col items-center gap-2 py-6 rounded-xl border-2 transition-all text-lg font-semibold',
                            voteChoice === true
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/50'
                          )}
                        >
                          <ThumbsUp className="w-10 h-10" />
                          赞成
                        </button>
                        <button
                          onClick={() => setVoteChoice(false)}
                          className={cn(
                            'flex flex-col items-center gap-2 py-6 rounded-xl border-2 transition-all text-lg font-semibold',
                            voteChoice === false
                              ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:bg-red-50/50'
                          )}
                        >
                          <ThumbsDown className="w-10 h-10" />
                          反对
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleVote}
                      disabled={voteChoice === null || !residentName.trim()}
                      className={cn(
                        'w-full py-4 rounded-xl text-lg font-bold transition-all',
                        voteChoice !== null && residentName.trim()
                          ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      提交投票
                    </button>
                  </div>
                )}

                {selectedNoticeForVote && voteSubmitted && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-800 mb-2">感谢您的参与！</p>
                    <p className="text-gray-500 text-lg">您的投票已成功提交</p>
                  </div>
                )}

                {selectedNoticeForVote && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">投票统计</h3>
                    {(() => {
                      const stats = getVoteStats(selectedNoticeForVote);
                      return (
                        <div className="space-y-3">
                          <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: stats.total > 0 ? `${stats.rate * 100}%` : '0%' }}
                            />
                            {stats.total > 0 && (
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow">
                                {(stats.rate * 100).toFixed(1)}% 赞成
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-emerald-50 rounded-lg py-3">
                              <p className="text-2xl font-bold text-emerald-600">{stats.approve}</p>
                              <p className="text-sm text-emerald-600">赞成</p>
                            </div>
                            <div className="bg-red-50 rounded-lg py-3">
                              <p className="text-2xl font-bold text-red-600">{stats.oppose}</p>
                              <p className="text-sm text-red-600">反对</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg py-3">
                              <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
                              <p className="text-sm text-gray-600">总计</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'objection' && (
          <section className="space-y-6">
            {activeNotices.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <MessageSquareWarning className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">暂无可提交异议的公示</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    选择公示项目
                  </label>
                  <select
                    value={selectedNoticeForObjection}
                    onChange={(e) => {
                      setSelectedNoticeForObjection(e.target.value);
                      setObjectionSubmitted(false);
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                  >
                    <option value="">请选择公示项目</option>
                    {activeNotices.map((n) => {
                      const p = getProject(n.projectId);
                      return (
                        <option key={n.id} value={n.id}>
                          {p?.name ?? '未知项目'} ({formatDate(n.startDate)} — {formatDate(n.endDate)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedNoticeForObjection && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        异议内容
                      </label>
                      <textarea
                        value={objectionContent}
                        onChange={(e) => setObjectionContent(e.target.value)}
                        placeholder="请详细描述您的异议..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        联系方式
                      </label>
                      <input
                        type="text"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="手机号或其他联系方式"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleObjection}
                      disabled={!objectionContent.trim() || !contactInfo.trim()}
                      className={cn(
                        'w-full py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2',
                        objectionContent.trim() && contactInfo.trim()
                          ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      <Send className="w-5 h-5" />
                      提交异议
                    </button>
                  </div>
                )}

                {objectionSubmitted && lastObjectionId && (
                  <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 text-center">
                    <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                    <p className="text-xl font-bold text-gray-800 mb-1">异议提交成功！</p>
                    <p className="text-gray-500 text-base">
                      异议编号：<span className="font-mono text-amber-600">{lastObjectionId}</span>
                    </p>
                    <p className="text-gray-400 text-sm mt-2">我们将在5个工作日内处理您的异议</p>
                  </div>
                )}

                {userObjections.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">我的异议记录</h3>
                    <div className="space-y-3">
                      {userObjections.map((obj) => {
                        const notice = publicNotices.find((n) => n.id === obj.noticeId);
                        const project = notice ? getProject(notice.projectId) : null;
                        return (
                          <div
                            key={obj.id}
                            className="bg-gray-50 rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">
                                {project?.name ?? '未知项目'}
                              </span>
                              <span className={cn(
                                'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                                objectionStatusColor[obj.status]
                              )}>
                                {OBJECTION_STATUS_LABELS[obj.status]}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{obj.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />{obj.contactInfo}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />{formatDateTime(obj.createdAt)}
                              </span>
                            </div>
                            {obj.reply && (
                              <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <p className="text-xs text-emerald-600 font-semibold mb-1">回复：</p>
                                <p className="text-sm text-emerald-800">{obj.reply}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
