import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Archive,
  LayoutGrid,
  ListFilter,
  Briefcase,
  Download,
  GraduationCap,
  Plus,
} from 'lucide-react';
import type { Application, ApplicationStatus, JobOffer } from '../types';

interface ApplicationTrackerProps {
  applications: Application[];
  onUpdateStatus: (id: number, status: ApplicationStatus) => void;
  onEditApplication: (app: Application) => void;
  onDeleteApplication: (id: number) => void;
  onDirectApply: (app: Application) => void;
  onNewApplication: () => void;
  onExportCsv?: () => void;
  onOpenOfferPrep?: (offer: JobOffer) => void;
}

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  saved: {
    label: 'À postuler',
    badgeClass: 'bg-[#fafafa] text-[#111818] border-[#e5e5e5]',
    icon: Clock,
  },
  applied: {
    label: 'Postulé',
    badgeClass: 'bg-black text-white border-black',
    icon: Send,
  },
  follow_up_needed: {
    label: 'Relance',
    badgeClass: 'bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/40',
    icon: AlertCircle,
  },
  interviewing: {
    label: 'Entretien',
    badgeClass: 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/30',
    icon: Briefcase,
  },
  offer_received: {
    label: 'Offre reçue',
    badgeClass: 'bg-[#16a34a] text-white border-[#16a34a]',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Refusé',
    badgeClass: 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/30',
    icon: XCircle,
  },
  withdrawn: {
    label: 'Retiré',
    badgeClass: 'bg-[#f4f4f5] text-[#6b7280] border-[#e5e5e5]',
    icon: Archive,
  },
};

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  onUpdateStatus,
  onEditApplication,
  onDeleteApplication,
  onDirectApply,
  onNewApplication,
  onExportCsv,
  onOpenOfferPrep,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deskFilter, setDeskFilter] = useState<string>('all');

  const getOfferFromApp = (app: Application): JobOffer => {
    if (app.offer) return app.offer;
    return {
      id: app.offer_id || app.id,
      title: app.job_title,
      company: app.company,
      location: app.location || 'Paris',
      desk: app.desk,
      contract_type: 'Stage',
      description: app.notes || `${app.job_title} chez ${app.company}`,
      url: app.application_url,
      salary_monthly: app.salary_monthly,
      source: 'Tracker',
      is_favorite: false,
      is_applied: true,
    };
  };

  const filteredApps = applications.filter((app) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      app.company.toLowerCase().includes(q) ||
      app.job_title.toLowerCase().includes(q) ||
      app.desk.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesDesk = deskFilter === 'all' || app.desk === deskFilter;
    return matchesSearch && matchesStatus && matchesDesk;
  });

  const uniqueDesks = Array.from(new Set(applications.map((a) => a.desk))).filter(Boolean);

  const kanbanColumns: ApplicationStatus[] = [
    'saved',
    'applied',
    'follow_up_needed',
    'interviewing',
    'offer_received',
    'rejected',
  ];

  return (
    <div className="space-y-5">
      <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6b7280] pt-2">
        PIPELINE & SUIVI DES CANDIDATURES ({applications.length})
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 border border-[#e5e5e5] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer banque, poste, desk, lieu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sq-input w-full pl-8"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sq-input"
          >
            <option value="all">TOUS STATUTS ({applications.length})</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          <select
            value={deskFilter}
            onChange={(e) => setDeskFilter(e.target.value)}
            className="sq-input"
          >
            <option value="all">TOUS DESKS</option>
            {uniqueDesks.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-[#e5e5e5]">
            <button
              onClick={() => setViewMode('table')}
              className={`sq-btn border-0 ${viewMode === 'table' ? 'sq-btn-primary' : ''}`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              TABLEAU
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`sq-btn border-0 ${viewMode === 'kanban' ? 'sq-btn-primary' : ''}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              KANBAN
            </button>
          </div>

          {onExportCsv && (
            <button onClick={onExportCsv} className="sq-btn">
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          )}

          <button onClick={onNewApplication} className="sq-btn sq-btn-primary">
            <Plus className="w-3.5 h-3.5" />
            NOUVELLE
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-[#e5e5e5] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                <th className="py-3 px-4">Entreprise & Poste</th>
                <th className="py-3 px-4">Desk / Lieu</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[12px] text-[#6b7280]">
                    Aucune candidature enregistrée.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;
                  const isFollowUpDue =
                    app.follow_up_date &&
                    app.status === 'applied' &&
                    new Date(app.follow_up_date) <= new Date();

                  return (
                    <tr key={app.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[13px] text-[#111818]">{app.company}</div>
                        <div className="text-[12px] text-[#6b7280]">{app.job_title}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-semibold text-[#111818]">{app.desk}</div>
                        <div className="text-[11px] text-[#6b7280]">{app.location}</div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={app.status}
                          onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 border cursor-pointer outline-none ${cfg.badgeClass}`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                            <option key={key} value={key} className="bg-white text-black">
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 tabular-nums text-[11px] text-[#6b7280]">
                        <div>Envoi : {app.applied_date || '—'}</div>
                        <div className={isFollowUpDue ? 'text-[#b45309] font-bold' : ''}>
                          Relance : {app.follow_up_date || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {app.application_url && (
                            <a
                              href={app.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sq-btn py-1 px-2 text-[10px]"
                              title="Ouvrir l'annonce"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => onDirectApply(app)}
                            className="sq-btn py-1 px-2 text-[10px]"
                            title="Pitch & Relance"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                          {onOpenOfferPrep && (
                            <button
                              onClick={() => onOpenOfferPrep(getOfferFromApp(app))}
                              className="sq-btn py-1 px-2 text-[10px]"
                              title="Prépa entretien"
                            >
                              <GraduationCap className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditApplication(app)}
                            className="sq-btn py-1 px-2 text-[10px]"
                            title="Modifier"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            className="sq-btn py-1 px-2 text-[10px] hover:text-[#dc2626]"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kanbanColumns.map((colStatus) => {
            const cfg = STATUS_CONFIG[colStatus];
            const colApps = filteredApps.filter((a) => a.status === colStatus);
            return (
              <div key={colStatus} className="bg-[#fafafa] border border-[#e5e5e5] flex flex-col min-h-[380px]">
                <div className="p-2.5 border-b border-[#e5e5e5] bg-white flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#111818]">
                    {cfg.label}
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-[#6b7280]">
                    {colApps.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 flex-1">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => onEditApplication(app)}
                      className="bg-white border border-[#e5e5e5] hover:border-black p-2.5 cursor-pointer space-y-1.5"
                    >
                      <div className="font-bold text-[12px] text-[#111818] truncate">{app.company}</div>
                      <div className="text-[11px] text-[#6b7280] line-clamp-2">{app.job_title}</div>
                      <div className="text-[9px] uppercase tracking-wider text-[#9ca3af] tabular-nums">
                        {app.location} {app.applied_date ? `· ${app.applied_date}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
