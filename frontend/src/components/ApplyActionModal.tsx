import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Mail, ExternalLink, FileText, Download, Zap, RefreshCw } from 'lucide-react';
import type { JobOffer, Application, ApplyPitchResponse, CVInfo } from '../types';
import { api } from '../api/client';

interface ApplyActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetOffer?: JobOffer | null;
  targetApplication?: Application | null;
  onApplicationCreatedOrUpdated: () => void;
}

const SPEED_APPLY_SNIPPETS = [
  { label: 'Nom', value: 'Léo Lombardini' },
  { label: 'Email', value: 'llombardini.leo@gmail.com' },
  { label: 'Tél', value: '07 85 42 69 11' },
  { label: 'École', value: 'EDHEC Business School — Master in Management (Finance Track)' },
  { label: 'Dispo', value: 'Juin 2027 · Stage 6 mois' },
  { label: 'Site / Hub', value: 'https://horaclecapital.com' },
];

export const ApplyActionModal: React.FC<ApplyActionModalProps> = ({
  isOpen,
  onClose,
  targetOffer,
  targetApplication,
  onApplicationCreatedOrUpdated,
}) => {
  const [pitch, setPitch] = useState<ApplyPitchResponse | null>(null);
  const [cvInfo, setCvInfo] = useState<CVInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'speed' | 'details' | 'email' | 'letter'>('speed');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [savingTracker, setSavingTracker] = useState(false);

  const company = targetOffer?.company || targetApplication?.company || '';
  const jobTitle = targetOffer?.title || targetApplication?.job_title || '';
  const desk = targetOffer?.desk || targetApplication?.desk || 'Trading Flow';
  const applyUrl = targetOffer?.url || targetApplication?.application_url || '';
  const atsPlat = (targetOffer?.ats_platform || 'direct').toLowerCase();
  const isNoLoginAts = ['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'teamtailor', 'workable', 'flatchr', 'taleez', 'direct'].includes(atsPlat);

  const recommendedVariant: 'trading' | 'buyside' = /asset|portfolio|gérant|gerant|hedge|buy-side|wealth|private|m&a|corporate|research/i.test(
    `${desk} ${jobTitle}`
  )
    ? 'buyside'
    : 'trading';
  const [selectedVariant, setSelectedVariant] = useState<'trading' | 'buyside'>(recommendedVariant);

  const fetchPitch = useCallback((useLlm: boolean = true) => {
    setLoading(true);
    api
      .generatePitch({
        offer_id: targetOffer?.id ? targetOffer.id : undefined,
        job_title: jobTitle,
        company,
        desk,
        direct_email: targetApplication?.contact_email || targetOffer?.direct_apply_email || undefined,
        location: targetOffer?.location || targetApplication?.location || 'Paris',
        contact_name:
          targetApplication?.contact_name ||
          targetOffer?.requirements?.match(/Contact cible\s*:\s*([^|\n]+)/)?.[1]?.trim() ||
          undefined,
        offer_description: targetOffer?.description || undefined,
        offer_requirements: targetOffer?.requirements || undefined,
        use_llm: useLlm,
      })
      .then((res) => {
        setPitch(res);
        const rawMail = res.mailto_url.replace('mailto:', '').split('?')[0];
        setRecipientEmail(targetApplication?.contact_email || targetOffer?.direct_apply_email || rawMail || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetOffer, targetApplication, company, jobTitle, desk]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedVariant(recommendedVariant);
    fetchPitch(true);
    api.getCVInfo(recommendedVariant).then(setCvInfo).catch(() => setCvInfo(null));
  }, [isOpen, recommendedVariant, fetchPitch]);

  const handleVariantSwitch = (v: 'trading' | 'buyside') => {
    setSelectedVariant(v);
    api.getCVInfo(v).then(setCvInfo).catch(() => setCvInfo(null));
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleMarkAsApplied = async () => {
    setSavingTracker(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const followUp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (targetApplication) {
        await api.updateApplication(targetApplication.id, {
          status: 'applied',
          applied_date: targetApplication.applied_date || today,
          follow_up_date: targetApplication.follow_up_date || followUp,
          contact_email: recipientEmail || targetApplication.contact_email,
          cover_letter: pitch?.cover_letter,
        });
      } else {
        await api.createApplication({
          offer_id: targetOffer?.id ? targetOffer.id : undefined,
          company,
          job_title: jobTitle,
          desk,
          location: targetOffer?.location || 'Paris',
          status: 'applied',
          applied_date: today,
          follow_up_date: followUp,
          salary_monthly: targetOffer?.salary_monthly || 2500,
          contact_email: recipientEmail,
          application_url: applyUrl,
          cover_letter: pitch?.cover_letter,
          notes: `Candidature rapide via AlphaTracker.`,
        });
      }
      onApplicationCreatedOrUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTracker(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-white border border-black w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#fafafa]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
              <span>SPEED-APPLY & PITCH DESK · {desk}</span>
              <span
                className={`px-1.5 py-0.5 border text-[9px] ${
                  isNoLoginAts
                    ? 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/30'
                    : 'bg-white text-[#6b7280] border-[#e5e5e5]'
                }`}
              >
                {isNoLoginAts ? `${atsPlat.toUpperCase()} · SANS LOGIN` : `${atsPlat.toUpperCase()} · COMPTE REQUIS`}
              </span>
              {pitch?.generated_by && (
                <span className="px-1.5 py-0.5 border border-[#e5e5e5] bg-white text-[9px] text-[#111818]">
                  {pitch.generated_by === 'qwen3-context' ? 'QWEN3 · ADAPTÉ À L\'OFFRE' : 'MODÈLE CALIBRÉ'}
                </span>
              )}
            </div>
            <h2 className="text-[16px] font-bold text-[#111818] mt-0.5">
              {company} — {jobTitle}
            </h2>
          </div>
          <button onClick={onClose} className="sq-btn p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Links & Auto-Routed 2-Variant CV Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#fafafa] border border-[#e5e5e5]">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <FileText className="w-3.5 h-3.5 text-black" />
              <span className="font-semibold text-[#111818]">
                {cvInfo ? cvInfo.filename : selectedVariant === 'buyside' ? 'CV B · Buy-Side' : 'CV A · Trading'}
              </span>
              <div className="flex border border-[#e5e5e5] bg-white ml-1">
                <button
                  type="button"
                  onClick={() => handleVariantSwitch('trading')}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase cursor-pointer ${
                    selectedVariant === 'trading' ? 'bg-black text-white' : 'text-[#6b7280]'
                  }`}
                >
                  CV A · TRADING
                </button>
                <button
                  type="button"
                  onClick={() => handleVariantSwitch('buyside')}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase cursor-pointer ${
                    selectedVariant === 'buyside' ? 'bg-black text-white' : 'text-[#6b7280]'
                  }`}
                >
                  CV B · BUY-SIDE
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {applyUrl && (
                <a
                  href={applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sq-btn sq-btn-primary py-1 px-2.5 text-[10px]"
                  title={applyUrl}
                >
                  <ExternalLink className="w-3 h-3" />
                  {targetOffer?.id ? "OUVRIR L'OFFRE" : 'OUVRIR PORTAIL'}
                </a>
              )}
              <a
                href={api.getCVDownloadUrl(selectedVariant)}
                target="_blank"
                rel="noopener noreferrer"
                className="sq-btn py-1 px-2.5 text-[10px]"
              >
                <Download className="w-3 h-3" />
                TÉLÉCHARGER CV
              </a>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e5e5] pb-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('speed')}
                className={`sq-btn ${activeTab === 'speed' ? 'sq-btn-primary' : ''}`}
              >
                <Zap className="w-3 h-3" />
                COPIE RAPIDE
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`sq-btn ${activeTab === 'details' ? 'sq-btn-primary' : ''}`}
              >
                <FileText className="w-3 h-3" />
                FICHE POSTE
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`sq-btn ${activeTab === 'email' ? 'sq-btn-primary' : ''}`}
              >
                <Mail className="w-3 h-3" />
                EMAIL / LINKEDIN
              </button>
              <button
                onClick={() => setActiveTab('letter')}
                className={`sq-btn ${activeTab === 'letter' ? 'sq-btn-primary' : ''}`}
              >
                LETTRE INSTITUTIONNELLE
              </button>
            </div>
            <button
              type="button"
              onClick={() => fetchPitch(true)}
              disabled={loading}
              className="sq-btn py-1 px-2 text-[10px]"
              title="Actualiser le mail et la lettre adaptés à l'offre via Qwen3-Embedding"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              ACTUALISER PITCH
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[12px] text-[#6b7280]">
              Calibrage sémantique du pitch via Qwen3-Embedding...
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-3">
              <div className="bg-[#fafafa] border border-[#e5e5e5] p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                      INTITULÉ EXACT À CHERCHER SI REDIRECTION ATS
                    </div>
                    <div className="text-[13px] font-bold text-[#111818] mt-0.5">{jobTitle}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(jobTitle, 'exact_title')}
                    className="sq-btn py-1 px-2 text-[10px]"
                  >
                    {copiedField === 'exact_title' ? 'TITRE COPIÉ' : 'COPIER TITRE'}
                  </button>
                </div>
                <div className="text-[11px] text-[#6b7280]">
                  {company} · {targetOffer?.location || targetApplication?.location || 'Europe'}
                  {targetOffer?.start_date ? ` · Début: ${targetOffer.start_date}` : ''}
                  {targetOffer?.duration_months ? ` · ${targetOffer.duration_months}` : ''}
                  {targetOffer?.salary_monthly ? ` · ~${targetOffer.salary_monthly} €/m` : ''}
                </div>
                {applyUrl && (
                  <div className="flex items-center justify-between gap-2 bg-white border border-[#e5e5e5] px-2.5 py-1.5 text-[11px]">
                    <span className="truncate font-mono text-[#111818]">{applyUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(applyUrl, 'exact_url')}
                      className="sq-btn py-0.5 px-2 text-[10px] shrink-0"
                    >
                      {copiedField === 'exact_url' ? 'COPIÉ' : 'COPIER LIEN'}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white border border-[#e5e5e5] p-4 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                  DESCRIPTION COMPLÈTE DU POSTE
                </div>
                <div className="text-[12px] text-[#111818] whitespace-pre-line leading-relaxed max-h-[240px] overflow-y-auto">
                  {targetOffer?.description || targetApplication?.notes || 'Aucune description détaillée enregistrée.'}
                </div>
                {targetOffer?.requirements && (
                  <div className="pt-2 border-t border-[#e5e5e5]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                      PRÉREQUIS / INFOS CLÉS
                    </div>
                    <div className="text-[11.5px] text-[#4b5563] mt-1">{targetOffer.requirements}</div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'speed' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#fafafa] border border-[#e5e5e5] px-3 py-2 text-[11px]">
                <span className="text-[#6b7280]">
                  {isNoLoginAts
                    ? 'Formulaire direct sans création de compte : remplissez et joignez le CV.'
                    : 'Portail avec compte candidat : copiez vos champs en 1 clic ci-dessous.'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      SPEED_APPLY_SNIPPETS.map((s) => `${s.label}: ${s.value}`).join('\n'),
                      'all_snippets'
                    )
                  }
                  className="sq-btn py-1 px-2 text-[10px] shrink-0"
                >
                  {copiedField === 'all_snippets' ? <Check className="w-3 h-3 text-[#16a34a]" /> : <Copy className="w-3 h-3" />}
                  TOUT COPIER
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SPEED_APPLY_SNIPPETS.map((s) => (
                  <div
                    key={s.label}
                    onClick={() => handleCopy(s.value, s.label)}
                    className="sq-card p-3 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b7280]">
                        {s.label}
                      </div>
                      <div className="text-[12px] font-medium text-[#111818] truncate">
                        {s.value}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#6b7280] shrink-0">
                      {copiedField === s.label ? <Check className="w-3.5 h-3.5 text-[#16a34a]" /> : <Copy className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                ))}
              </div>

              {pitch && (
                <div className="bg-[#fafafa] border border-[#e5e5e5] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                      BULLETS PORTFOLIO À COLLER
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(pitch.recommended_portfolio_bullets.join('\n• '), 'bullets')
                      }
                      className="sq-btn py-1 px-2 text-[10px]"
                    >
                      {copiedField === 'bullets' ? 'COPIÉ' : 'COPIER TOUT'}
                    </button>
                  </div>
                  <ul className="text-[12px] text-[#111818] space-y-1 list-disc pl-4">
                    {pitch.recommended_portfolio_bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : activeTab === 'email' && pitch ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                    DESTINATAIRE
                  </span>
                </div>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="sq-input w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                    OBJET
                  </span>
                  <button
                    onClick={() => handleCopy(pitch.subject, 'subj')}
                    className="sq-btn py-0.5 px-2 text-[10px]"
                  >
                    {copiedField === 'subj' ? 'COPIÉ' : 'COPIER'}
                  </button>
                </div>
                <div className="sq-input bg-[#fafafa]">{pitch.subject}</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                    PITCH COURT
                  </span>
                  <button
                    onClick={() => handleCopy(pitch.quick_email_pitch, 'email')}
                    className="sq-btn py-0.5 px-2 text-[10px]"
                  >
                    {copiedField === 'email' ? 'COPIÉ' : 'COPIER'}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={pitch.quick_email_pitch}
                  className="sq-input w-full bg-[#fafafa] leading-relaxed"
                />
              </div>
            </div>
          ) : pitch ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                  LETTRE DE MOTIVATION CALIBRÉE
                </span>
                <button
                  onClick={() => handleCopy(pitch.cover_letter, 'letter')}
                  className="sq-btn py-0.5 px-2 text-[10px]"
                >
                  {copiedField === 'letter' ? 'COPIÉ' : 'COPIER'}
                </button>
              </div>
              <textarea
                readOnly
                rows={13}
                value={pitch.cover_letter}
                className="sq-input w-full bg-[#fafafa] leading-relaxed"
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e5e5e5] bg-[#fafafa] flex items-center justify-between gap-3">
          <button onClick={onClose} className="sq-btn">
            FERMER
          </button>
          <div className="flex items-center gap-2">
            {pitch && (
              <a
                href={`mailto:${recipientEmail}?subject=${encodeURIComponent(
                  pitch.subject
                )}&body=${encodeURIComponent(pitch.quick_email_pitch)}`}
                className="sq-btn"
              >
                <Mail className="w-3.5 h-3.5" />
                MAILTO
              </a>
            )}
            <button
              onClick={async () => {
                if (applyUrl) window.open(applyUrl, '_blank', 'noopener,noreferrer');
                await handleMarkAsApplied();
              }}
              disabled={savingTracker}
              className="sq-btn sq-btn-primary"
            >
              <Check className="w-3.5 h-3.5" />
              {savingTracker ? 'ENREGISTREMENT...' : applyUrl ? 'OUVRIR + ENREGISTRER POSTULÉ' : 'ENREGISTRER COMME POSTULÉ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
