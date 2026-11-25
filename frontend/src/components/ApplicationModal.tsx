import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  'Hedge Fund / Systematic Strategies',
  'Quantitative Asset Management',
  'FinTech / Quantitative Engineering',
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
  const [salaryMonthly, setSalaryMonthly] = useState<number | ''>(2800);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [notes, setNotes] = useState('');

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
    } else {
      const today = new Date().toISOString().split('T')[0];
      const followUp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setCompany('');
      setJobTitle('');
      setDesk('Quantitative Research / Trading');
      setLocation('Paris');
      setStatus('applied');
      setAppliedDate(today);
      setFollowUpDate(followUp);
      setInterviewDate('');
      setSalaryMonthly(2800);
      setContactName('');
      setContactEmail('');
      setApplicationUrl('');
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      company,
      job_title: jobTitle,
      desk,
      location,
      status,
      applied_date: appliedDate || undefined,
      follow_up_date: followUpDate || undefined,
      interview_date: interviewDate || undefined,
      salary_monthly: salaryMonthly ? Number(salaryMonthly) : undefined,
      contact_name: contactName || undefined,
      contact_email: contactEmail || undefined,
      application_url: applicationUrl || undefined,
      notes: notes || undefined,
      resume_version: 'CV_Leo_Lombardini.pdf',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-white border border-black w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5e5] bg-[#fafafa] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
              TRACKER PIPELINE
            </div>
            <h2 className="text-[16px] font-bold text-[#111818]">
              {initialData ? 'Modifier la Candidature' : 'Nouvelle Candidature'}
            </h2>
          </div>
          <button onClick={onClose} className="sq-btn p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Entreprise *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="ex: IMC Trading, BNP Paribas..."
                className="sq-input w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Intitulé du poste *
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="ex: Quantitative Research Intern"
                className="sq-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Desk / Spécialisation
              </label>
              <select value={desk} onChange={(e) => setDesk(e.target.value)} className="sq-input w-full">
                {DESK_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Localisation
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="sq-input w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="sq-input w-full"
              >
                <option value="saved">À postuler</option>
                <option value="applied">Postulé</option>
                <option value="follow_up_needed">Relance à faire</option>
                <option value="interviewing">Entretien</option>
                <option value="offer_received">Offre reçue</option>
                <option value="rejected">Refusé</option>
                <option value="withdrawn">Retiré</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Date d'envoi
              </label>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="sq-input w-full tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Date de relance
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="sq-input w-full tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Date entretien
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="sq-input w-full tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                Contact (Nom / Email)
              </label>
              <input
                type="text"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="recrutement@..."
                className="sq-input w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                URL de l'offre
              </label>
              <input
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://..."
                className="sq-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="sq-input w-full"
            />
          </div>

          <div className="pt-3 border-t border-[#e5e5e5] flex justify-end gap-2">
            <button type="button" onClick={onClose} className="sq-btn">
              ANNULER
            </button>
            <button type="submit" className="sq-btn sq-btn-primary">
              ENREGISTRER
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
