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
  ChevronDown,
  LayoutGrid,
  ListFilter,
  Briefcase,
  Mail,
  Building,
  Download,
} from 'lucide-react';
import type { Application, ApplicationStatus } from '../types';

interface ApplicationTrackerProps {
  applications: Application[];
  onUpdateStatus: (id: number, status: ApplicationStatus) => void;
  onEditApplication: (app: Application) => void;
  onDeleteApplication: (id: number) => void;
  onDirectApply: (app: Application) => void;
  onNewApplication: () => void;
  onExportCsv?: () => void;
}

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  saved: {
    label: 'À postuler',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: Clock,
  },
  applied: {
    label: 'Postulé',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Send,
  },
  follow_up_needed: {
    label: 'Relance à faire',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: AlertCircle,
  },
  interviewing: {
    label: 'Entretien en cours',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Briefcase,
  },
  offer_received: {
    label: 'Offre reçue / Accepté',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Refusé',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: XCircle,
  },
  withdrawn: {
    label: 'Retiré',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
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
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deskFilter, setDeskFilter] = useState<string>('all');

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.desk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase()));

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
    <div className="space-y-6">
      {/* Control Bar: Filters, Search & View Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher banque, rôle, desk, lieu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1">
            <ListFilter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts ({applications.length})</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desk Filter */}
          {uniqueDesks.length > 0 && (
            <select
              value={deskFilter}
              onChange={(e) => setDeskFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tous les desks</option>
              {uniqueDesks.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* View Toggle & Export CSV */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition"
              title="Exporter les candidatures en CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vue Tableau"
            >
              <ListFilter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'kanban' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vue Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Render Empty State if no apps */}
      {filteredApps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Aucune candidature correspondante</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Vous n'avez pas encore de candidature pour ces filtres. Ajoutez-en une manuellement ou importez depuis le scraper d'offres.
          </p>
          <button
            onClick={onNewApplication}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Ajouter une première candidature
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Établissement & Rôle</th>
                  <th className="py-3.5 px-4">Desk / Marché</th>
                  <th className="py-3.5 px-4">Lieu</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Date Envoi</th>
                  <th className="py-3.5 px-4">Relance / Échéance</th>
                  <th className="py-3.5 px-4">Gratification</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                  const StatusIcon = statusConf.icon;
                  const isFollowUpDue =
                    app.status === 'follow_up_needed' ||
                    (app.follow_up_date && new Date(app.follow_up_date) <= new Date());

                  return (
                    <tr key={app.id} className="hover:bg-blue-50/40 transition-colors group">
                      {/* Company & Title */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {app.company}
                          {app.application_url && (
                            <a
                              href={app.application_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-blue-600 flex items-center gap-1"
                              title="Ouvrir le portail d'offre vérifié"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="text-[10px] text-emerald-600 font-mono">200 OK</span>
                            </a>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] font-normal truncate max-w-xs">
                          {app.job_title}
                        </div>
                      </td>

                      {/* Desk */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {app.desk}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600">{app.location || 'Paris'}</td>

                      {/* Status Selector */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <select
                            value={app.status}
                            onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                            className={`appearance-none text-[11px] font-semibold pl-6 pr-6 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([val, conf]) => (
                              <option key={val} value={val}>
                                {conf.label}
                              </option>
                            ))}
                          </select>
                          <StatusIcon className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${statusConf.text}`} />
                          <ChevronDown className={`w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${statusConf.text}`} />
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 font-mono-numbers text-slate-600">
                        {app.applied_date || '-'}
                      </td>

                      {/* Follow-up / Relance */}
                      <td className="py-3.5 px-4 font-mono-numbers">
                        {app.follow_up_date ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              isFollowUpDue ? 'text-amber-700 font-semibold' : 'text-slate-500'
                            }`}
                          >
                            {isFollowUpDue && <AlertCircle className="w-3 h-3 text-amber-600" />}
                            {app.follow_up_date}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Salary */}
                      <td className="py-3.5 px-4 font-mono-numbers font-medium text-slate-700">
                        {app.salary_monthly ? `${app.salary_monthly} €/m` : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => onDirectApply(app)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 rounded"
                            title="Générer email / pitch de candidature"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditApplication(app)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Modifier les détails"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kanbanColumns.map((colStatus) => {
            const conf = STATUS_CONFIG[colStatus];
            const StatusIcon = conf.icon;
            const colApps = filteredApps.filter((a) => a.status === colStatus);

            return (
              <div
                key={colStatus}
                className="bg-slate-100/70 rounded-xl p-3 border border-slate-200/80 flex flex-col min-h-[480px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <StatusIcon className={`w-3.5 h-3.5 ${conf.text}`} />
                    <span className="text-xs font-bold text-slate-800">{conf.label}</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                    {colApps.length}
                  </span>
                </div>

                {/* Cards in Column */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-semibold text-xs text-slate-900 leading-snug">
                          {app.company}
                        </div>
                        {app.application_url && (
                          <a
                            href={app.application_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-blue-600 flex items-center gap-0.5"
                            title="Lien vérifié 200 OK"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {app.job_title}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[10px]">
                          {app.desk}
                        </span>
                        {app.salary_monthly && (
                          <span className="px-1.5 py-0.5 bg-blue-50/70 border border-blue-200 text-blue-700 rounded text-[10px] font-mono-numbers">
                            {app.salary_monthly} €
                          </span>
                        )}
                      </div>

                      {app.follow_up_date && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1 font-mono-numbers">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Relance: {app.follow_up_date}
                          </span>
                        </div>
                      )}

                      {/* Card Bottom Actions */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => onDirectApply(app)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                        >
                          <Send className="w-2.5 h-2.5" /> Postuler / Pitch
                        </button>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEditApplication(app)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
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
