import React, { useState, useEffect } from 'react';
import { X, DollarSign, Building, Briefcase, Mail, Link as LinkIcon, User } from 'lucide-react';
import type { Application, ApplicationStatus } from '../types';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appData: Partial<Application>) => void;
  initialData?: Application | null;
}

const DESK_OPTIONS = [
  'Trading Flow / Exotics',
  'Trading Assistant / Market Making',
  'Structuring Produits Structurés',
  'Quantitative Research / Trading',
  'Quantitative Market Making',
  'Rates & FX Desk',
  'Credit Trading / Structuring',
  'Sales FICC / Institutional',
  'Risk Management de Marché',
  'Commodities & Energy',
  'Gestion Quantitative Multi-Asset',
];

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [desk, setDesk] = useState('Trading Flow / Exotics');
  const [location, setLocation] = useState('Paris');
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [appliedDate, setAppliedDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [salaryMonthly, setSalaryMonthly] = useState<number | ''>(2600);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [resumeVersion, setResumeVersion] = useState('CV_Finance_Marche_2026.pdf');

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || '');
      setJobTitle(initialData.job_title || '');
      setDesk(initialData.desk || 'Trading Flow / Exotics');
      setLocation(initialData.location || 'Paris');
      setStatus(initialData.status || 'applied');
      setAppliedDate(initialData.applied_date || '');
      setFollowUpDate(initialData.follow_up_date || '');
      setInterviewDate(initialData.interview_date || '');
      setSalaryMonthly(initialData.salary_monthly || '');
      setContactName(initialData.contact_name || '');
      setContactEmail(initialData.contact_email || '');
      setApplicationUrl(initialData.application_url || '');
      setNotes(initialData.notes || '');
      setResumeVersion(initialData.resume_version || 'CV_Finance_Marche_2026.pdf');
    } else {
      setCompany('');
      setJobTitle('');
      setDesk('Trading Flow / Exotics');
      setLocation('Paris');
      setStatus('applied');
      const today = new Date().toISOString().split('T')[0];
      setAppliedDate(today);
      const followUp = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFollowUpDate(followUp);
      setInterviewDate('');
      setSalaryMonthly(2600);
      setContactName('');
      setContactEmail('');
      setApplicationUrl('');
      setNotes('');
      setResumeVersion('CV_Finance_Marche_2026.pdf');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddDaysToFollowUp = (days: number) => {
    const base = appliedDate ? new Date(appliedDate) : new Date();
    base.setDate(base.getDate() + days);
    setFollowUpDate(base.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      company,
      job_title: jobTitle,
      desk,
      location,
      status,
      applied_date: appliedDate,
      follow_up_date: followUpDate,
      interview_date: interviewDate,
      salary_monthly: salaryMonthly ? Number(salaryMonthly) : undefined,
      contact_name: contactName,
      contact_email: contactEmail,
      application_url: applicationUrl,
      notes,
      resume_version: resumeVersion,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialData ? 'Modifier la Candidature' : 'Nouvelle Candidature de Stage'}
            </h2>
            <p className="text-xs text-slate-500">
              Renseignez les détails du poste, du desk et le calendrier de suivi.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Company & Job Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Établissement / Banque *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: BNP Paribas, Goldman Sachs, SG"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Intitulé du poste *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: Stage Assistant Trader Dérivés Actions"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Desk, Location & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Desk / Métier</label>
              <select
                value={desk}
                onChange={(e) => setDesk(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              >
                {DESK_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Localisation</label>
              <input
                type="text"
                placeholder="Paris, Londres, Genève..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Statut Candidature</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
              >
                <option value="saved">À postuler (Sauvegardé)</option>
                <option value="applied">Postulé</option>
                <option value="follow_up_needed">Relance à effectuer</option>
                <option value="interviewing">Entretien en cours</option>
                <option value="offer_received">Offre reçue / Accepté</option>
                <option value="rejected">Refusé</option>
                <option value="withdrawn">Retiré</option>
              </select>
            </div>
          </div>

          {/* Dates & Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date d'envoi</label>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono-numbers text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date de relance</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono-numbers text-xs"
              />
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => handleAddDaysToFollowUp(7)}
                  className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-100 font-medium"
                >
                  +7j
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDaysToFollowUp(14)}
                  className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-100 font-medium"
                >
                  +14j
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date d'entretien (si prévu)</label>
              <input
                type="text"
                placeholder="2026-10-18 10:00"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono-numbers text-xs"
              />
            </div>
          </div>

          {/* Salary, URL & Resume */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gratification mensuelle (€)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  placeholder="2500"
                  value={salaryMonthly}
                  onChange={(e) => setSalaryMonthly(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono-numbers text-xs"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Lien de l'offre / ATS</label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://..."
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom du Contact / RH / Trader</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ex: Jean D. (Head of EQD)"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email du contact</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="contact@banque.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Notes de suivi & Préparation technique (Black-Scholes, Grecs, Brainteasers...)
            </label>
            <textarea
              rows={3}
              placeholder="Questions posées, points à approfondir, feedback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            ></textarea>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
            >
              {initialData ? 'Mettre à jour' : 'Enregistrer la candidature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
