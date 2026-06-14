import { useNavigate } from 'react-router-dom';
import { Building2, Users, ClipboardCheck } from 'lucide-react';
import useStore from '@/store';
import type { Role } from '@/types';

const roles: {
  key: Role;
  label: string;
  icon: React.ReactNode;
  desc: string;
  color: string;
  border: string;
  bg: string;
  shadow: string;
  route: string;
}[] = [
  {
    key: 'street',
    label: '街道',
    icon: <Building2 className="w-10 h-10" />,
    desc: '录入项目、管理公示、处理异议',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    shadow: 'hover:shadow-blue-500/20',
    route: '/street',
  },
  {
    key: 'resident',
    label: '居民',
    icon: <Users className="w-10 h-10" />,
    desc: '查看公示、参与投票、提交异议',
    color: 'text-green-600',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    shadow: 'hover:shadow-green-500/20',
    route: '/resident',
  },
  {
    key: 'supervisor',
    label: '监理',
    icon: <ClipboardCheck className="w-10 h-10" />,
    desc: '阶段验收、返工记录、备案确认',
    color: 'text-amber-600',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    shadow: 'hover:shadow-amber-500/20',
    route: '/supervisor',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const setRole = useStore((s) => s.setRole);

  const handleClick = (role: Role, route: string) => {
    setRole(role);
    navigate(route);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] border border-white/5 rounded-full" />
        <div className="absolute top-[-5%] left-[0%] w-[350px] h-[350px] border border-white/5 rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] border border-white/5 rounded-full" />
        <div className="absolute bottom-[-8%] right-[-5%] w-[400px] h-[400px] border border-white/5 rounded-full" />
        <div className="absolute top-[40%] right-[10%] w-3 h-3 bg-white/10 rotate-45" />
        <div className="absolute top-[20%] left-[15%] w-2 h-2 bg-white/10 rotate-45" />
        <div className="absolute bottom-[30%] left-[8%] w-4 h-4 bg-white/5 rotate-45" />
        <div className="absolute top-[60%] left-[70%] w-2 h-2 bg-white/10 rotate-45" />
        <div className="absolute top-[10%] right-[30%] w-20 h-20 border border-white/5 rotate-45" />
        <div className="absolute bottom-[15%] left-[40%] w-16 h-16 border border-white/5 rotate-12" />
      </div>

      <div className="relative z-10 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide mb-4">
          老旧小区改造公示管理平台
        </h1>
        <p className="text-lg md:text-xl text-slate-400 tracking-widest">
          街道·居民·监理 三方协同，透明合规
        </p>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8">
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => handleClick(r.key, r.route)}
            className={`
              group relative w-72 p-8 rounded-2xl
              bg-white/5 backdrop-blur-xl border ${r.border}
              transition-all duration-300
              hover:scale-105 hover:shadow-2xl ${r.shadow}
              cursor-pointer text-left
            `}
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${r.bg} ${r.color} mb-6 transition-transform duration-300 group-hover:scale-110`}>
              {r.icon}
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">{r.label}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{r.desc}</p>
            <div className={`absolute inset-x-0 bottom-0 h-1 rounded-b-2xl ${r.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </button>
        ))}
      </div>
    </div>
  );
}
