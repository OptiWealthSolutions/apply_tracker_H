import React from 'react';
import {
  Briefcase,
  Search,
  Compass,
  BarChart3,
  Sliders,
  Database,
  TrendingUp,
  Building2,
  GraduationCap,
  FileText,
  Award,
  BookOpen,
} from 'lucide-react';
import type { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  applicationsCount: number;
  profile: UserProfile | null;
  onOpenPreferences?: () => void;
  onOpenCVModal?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    subtext: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    highlight?: boolean;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  applicationsCount,
  profile,
  onOpenPreferences,
  onOpenCVModal,
}) => {
  const navSections: NavSection[] = [
    {
      title: '1. Screening / Recherche',
      items: [
        {
          id: 'bank-search',
          label: 'Portails Carrières Directs',
          subtext: 'Banques, M&A, PE, Audit, Conseil',
          icon: Building2,
          highlight: true,
        },
        {
          id: 'scraper',
          label: 'Scraper de Marché',
          subtext: 'Google Jobs & Web',
          icon: Search,
        },
      ],
    },
    {
      title: '2. Analyser',
      items: [
        {
          id: 'knn',
          label: 'Conseiller KNN & Pépites',
          subtext: 'Plus Proche Voisin',
          icon: Compass,
        },
        {
          id: 'cv-audit',
          label: 'Audit Qualité CV & Lettre',
          subtext: 'Formule Google XYZ & Mots-Clés',
          icon: Award,
          highlight: true,
        },
      ],
    },
    {
      title: '3. Postuler',
      items: [
        {
          id: 'tracker',
          label: 'Suivi Candidatures',
          subtext: 'Tableau & Kanban',
          icon: Briefcase,
          badge: applicationsCount,
        },
      ],
    },
    {
      title: '4. Apprendre les Prérequis',
      items: [
        {
          id: 'resources',
          label: 'Attentes Firmes & Ressources',
          subtext: 'Vidéos, Papers, Livres & Tests',
          icon: BookOpen,
          highlight: true,
        },
        {
          id: 'interview-prep',
          label: 'Guide Entretien Desk',
          subtext: 'Questions & Grecs Desk',
          icon: GraduationCap,
        },
      ],
    },
    {
      title: 'Pilotage & Configuration',
      items: [
        {
          id: 'preferences',
          label: 'Préférences & Métiers',
          subtext: 'Cartographie tous secteurs',
          icon: Sliders,
        },
        {
          id: 'analytics',
          label: 'Analyses & Pipeline',
          subtext: 'Taux de conversion',
          icon: BarChart3,
        },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-[#0B1E36] text-white flex flex-col h-screen border-r border-[#152E4E] shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1A365D]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              ALPHATRACKER
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                MKT
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">Finance & Conseil</div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3.5 py-4 space-y-4 overflow-y-auto">
        {navSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {sec.title}
            </div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/40'
                      : 'text-slate-300 hover:bg-[#132A4A] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs truncate font-semibold leading-tight">{item.label}</div>
                      <div className={`text-[10px] truncate leading-tight mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.subtext}
                      </div>
                    </div>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.2 rounded-full font-mono font-medium ${
                        isActive ? 'bg-blue-800 text-blue-100' : 'bg-[#18365B] text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Desks Cibles
        </div>
        <div className="px-3 space-y-2 text-xs text-slate-300">
          <div className="flex items-center justify-between py-1 border-b border-[#152E4E]/60">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Equity Derivatives
            </span>
            <span className="text-[11px] font-mono text-slate-400">EQD</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#152E4E]/60">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Quant & Systematic
            </span>
            <span className="text-[11px] font-mono text-slate-400">QRT</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#152E4E]/60">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Structuring Solutions
            </span>
            <span className="text-[11px] font-mono text-slate-400">STR</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              FICC Rates & FX
            </span>
            <span className="text-[11px] font-mono text-slate-400">FX</span>
          </div>
        </div>
      </nav>

      {/* User Preferences & Local DB Footer */}
      <div className="p-4 border-t border-[#163356] bg-[#09172A] space-y-2.5">
        {onOpenCVModal && (
          <button
            onClick={onOpenCVModal}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[#0E1E33] hover:bg-[#142A47] text-slate-300 transition-colors border border-[#18365B] text-xs"
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-slate-200">Mon CV Hébergé</span>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
              PDF
            </span>
          </button>
        )}

        <button
          onClick={() => {
            setCurrentTab('preferences');
            if (onOpenPreferences) onOpenPreferences();
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#11243E] hover:bg-[#183458] text-slate-200 transition-colors border border-[#1C3B65]"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center font-bold text-xs text-white uppercase">
              {profile ? profile.full_name.substring(0, 2) : 'LL'}
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {profile?.full_name || 'Candidat'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {profile?.school ? profile.school.split('/')[0].trim() : 'Master Finance'}
              </div>
            </div>
          </div>
          <Sliders className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>SQLite Local</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 font-medium">Actif</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
