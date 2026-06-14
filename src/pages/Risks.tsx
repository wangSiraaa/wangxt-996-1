import { useState, useMemo } from 'react';
import useStore from '@/store';
import { formatDateTime, type RiskItem } from '@/types';
import {
  Clock, AlertTriangle, Vote, Wallet, FileText, Lock,
  ShieldAlert, CheckCircle2,
} from 'lucide-react';

const TYPE_CONFIG: Record<RiskItem['type'], { icon: React.ElementType; label: string }> = {
  seven_day: { icon: Clock, label: '公示未满七天' },
  objection_overdue: { icon: AlertTriangle, label: '异议超期' },
  vote_insufficient: { icon: Vote, label: '投票未达标' },
  budget_unconfirmed: { icon: Wallet, label: '预算未确认' },
  supervisor_unfiled: { icon: FileText, label: '监理未备案' },
  inspection_locked_change: { icon: Lock, label: '验收后变更' },
};

const SEVERITY_COLORS: Record<RiskItem['severity'], { bg: string; text: string; border: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
};

type SeverityFilter = 'all' | 'high' | 'medium';

export default function Risks() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<RiskItem['type'] | 'all'>('all');

  const store = useStore();
  const risks = store.getRisks();

  const filtered = useMemo(() => {
    return risks.filter((r) => {
      if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      return true;
    });
  }, [risks, severityFilter, typeFilter]);

  const highCount = risks.filter((r) => r.severity === 'high').length;
  const mediumCount = risks.filter((r) => r.severity === 'medium').length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">红色风险清单</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 border rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{risks.length}</div>
          <div className="text-sm text-gray-500 mt-1">风险总数</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{highCount}</div>
          <div className="text-sm text-red-500 mt-1">高风险</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-amber-600">{mediumCount}</div>
          <div className="text-sm text-amber-500 mt-1">中风险</div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">严重程度：</span>
          <div className="flex gap-1">
            {(['all', 'high', 'medium'] as SeverityFilter[]).map((val) => (
              <button
                key={val}
                onClick={() => setSeverityFilter(val)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  severityFilter === val
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {val === 'all' ? '全部' : val === 'high' ? '高风险' : '中风险'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">类型：</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as RiskItem['type'] | 'all')}
            className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">全部类型</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {risks.length === 0 && (
        <div className="flex items-center gap-3 p-6 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 size={24} className="text-green-600" />
          <span className="text-green-700 font-medium text-lg">无风险项</span>
        </div>
      )}

      {risks.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">没有匹配的风险项</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((risk) => {
          const typeCfg = TYPE_CONFIG[risk.type];
          const severityCfg = SEVERITY_COLORS[risk.severity];
          const Icon = typeCfg.icon;
          return (
            <div
              key={risk.id}
              className={`border-2 ${severityCfg.border} rounded-xl p-5 space-y-3 shadow-sm`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-gray-800 truncate">{risk.projectName}</span>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityCfg.bg} ${severityCfg.text}`}>
                  {risk.severity === 'high' ? '高风险' : '中风险'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Icon size={16} className="text-red-500" />
                <span className="text-sm font-medium text-red-600">{typeCfg.label}</span>
              </div>

              <p className="text-sm text-gray-600">{risk.description}</p>

              <div className="text-xs text-gray-400 pt-1 border-t">
                {formatDateTime(risk.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
