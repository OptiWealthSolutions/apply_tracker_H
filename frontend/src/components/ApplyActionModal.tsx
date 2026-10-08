import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Mail,
  Copy,
  Check,
  Send,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type { JobOffer, Application, ApplyPitchResponse } from '../types';
import { api } from '../api/client';

interface ApplyActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetOffer: JobOffer | null;
  targetApplication: Application | null;
  onApplicationCreatedOrUpdated: () => void;
}

export const ApplyActionModal: React.FC<ApplyActionModalProps> = ({
  isOpen,
  onClose,
  targetOffer,
  targetApplication,
  onApplicationCreatedOrUpdated,
}) => {
  const [pitchData, setPitchData] = useState<ApplyPitchResponse | null>(null);
  const [isLoadingPitch, setIsLoadingPitch] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isMarkingApplied, setIsMarkingApplied] = useState(false);
  const [markedSuccess, setMarkedSuccess] = useState(false);

  const company = targetOffer?.company || targetApplication?.company || '';
  const jobTitle = targetOffer?.title || targetApplication?.job_title || '';
  const desk = targetOffer?.desk || targetApplication?.desk || 'Trading Flow';
  const url = targetOffer?.url || targetApplication?.application_url || '';
  const offerId = targetOffer?.id || targetApplication?.offer_id || undefined;

  useEffect(() => {
    if (isOpen && company && jobTitle) {
      setIsLoadingPitch(true);
      setMarkedSuccess(false);
      api
        .generatePitch({
          offer_id: offerId,
          job_title: jobTitle,
          company,
          desk,
        })
        .then((res) => setPitchData(res))
        .catch((err) => console.error('Pitch generation error:', err))
        .finally(() => setIsLoadingPitch(false));
    }
  }, [isOpen, company, jobTitle, desk, offerId]);

  if (!isOpen) return null;

  const handleCopy = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsApplied = async () => {
    setIsMarkingApplied(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const followUp = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (targetApplication) {
        // Update existing application
        await api.updateApplication(targetApplication.id, {
          status: 'applied',
          applied_date: today,
          follow_up_date: followUp,
          notes: targetApplication.notes || 'Candidature envoyée via portail / email.',
        });
      } else if (targetOffer) {
        // Create new application from offer
        await api.createApplication({
          offer_id: targetOffer.id,
          company: targetOffer.company,
          job_title: targetOffer.title,
          desk: targetOffer.desk,
          location: targetOffer.location,
          status: 'applied',
          applied_date: today,
          follow_up_date: followUp,
          salary_monthly: targetOffer.salary_monthly,
          application_url: targetOffer.url,
          notes: 'Candidature envoyée avec pitch généré.',
        });
      }
      setMarkedSuccess(true);
      onApplicationCreatedOrUpdated();
    } catch (e) {
      console.error('Failed to mark applied:', e);
    } finally {
      setIsMarkingApplied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Postuler à l'offre & Pitch d'Accroche
            </h2>
            <p className="text-xs text-slate-500">
              {company} — {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Action 1: Official Portal / ATS */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-blue-900 text-xs">Portail Officiel de Candidature</div>
              <div className="text-[11px] text-blue-700 mt-0.5">
                {url
                  ? "Accédez directement à la page de soumission de l'offre (ATS / Career Portal)."
                  : "Aucun lien web spécifique renseigné pour cette offre."}
              </div>
            </div>

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition"
              >
                <span>Ouvrir le portail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Action 2: Generated Pitch & Cover Email */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Pitch d'Accroche Personnalisé ({desk})</span>
              </div>
              {pitchData?.mailto_url && (
                <a
                  href={pitchData.mailto_url}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Ouvrir client email (mailto)</span>
                </a>
              )}
            </div>

            {isLoadingPitch ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-slate-500 text-xs">Génération du pitch adapté au desk...</div>
              </div>
            ) : pitchData ? (
              <div className="space-y-3">
                {/* Email Subject */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-500 mr-2 text-[11px]">Objet :</span>
                    <span className="font-medium text-slate-800 text-xs">{pitchData.subject}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(pitchData.subject, setCopiedPitch)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Copier l'objet"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Short Email Pitch */}
                <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-3.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email d'accroche direct :
                  </div>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {pitchData.quick_email_pitch}
                  </pre>
                  <button
                    onClick={() => handleCopy(pitchData.quick_email_pitch, setCopiedPitch)}
                    className="absolute top-3 right-3 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded text-[11px] flex items-center gap-1 font-medium transition"
                  >
                    {copiedPitch ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Key Points */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600">Points clés à valoriser :</div>
                  <ul className="space-y-1">
                    {pitchData.recommended_portfolio_bullets.map((b, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>

          {/* Action 3: Tracker synchronization */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Synchroniser le statut dans le tableau :
            </div>
            <button
              onClick={handleMarkAsApplied}
              disabled={isMarkingApplied || markedSuccess}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                markedSuccess
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-900 hover:bg-black text-white shadow-xs'
              }`}
            >
              {markedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enregistré comme Postulé (Relance J+14)</span>
                </>
              ) : isMarkingApplied ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Marquer comme "Postulé" au Tracker</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
