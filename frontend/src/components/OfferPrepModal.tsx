import React, { useState, useEffect } from 'react';
import { X, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { JobOffer, ATSFitBreakdown, DeskInterviewPrepResponse } from '../types';
import { api } from '../api/client';

interface OfferPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: JobOffer | null;
  onOpenPitchModal: (offer: JobOffer) => void;
}

export const OfferPrepModal: React.FC<OfferPrepModalProps> = ({
  isOpen,
  onClose,
  offer,
  onOpenPitchModal,
}) => {
  const [activeTab, setActiveTab] = useState<'ats' | 'interview'>('ats');
  const [atsData, setAtsData] = useState<ATSFitBreakdown | null>(null);
  const [prepData, setPrepData] = useState<DeskInterviewPrepResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen || !offer) return;
    setLoading(true);
    Promise.all([
      api.getOfferATSAnalysis(offer.id).then(setAtsData).catch(() => setAtsData(null)),
      api.getOfferInterviewPrep(offer.id).then(setPrepData).catch(() => setPrepData(null)),
    ]).finally(() => setLoading(false));
  }, [isOpen, offer]);

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-white border border-black w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5e5] bg-[#fafafa] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
              ATS FIT & PRÉPARATION DESK · {offer.desk}
            </div>
            <h2 className="text-[16px] font-bold text-[#111818]">
              {offer.company} — {offer.title}
            </h2>
          </div>
          <button onClick={onClose} className="sq-btn p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-3 pb-2 border-b border-[#e5e5e5] flex gap-2">
          <button
            onClick={() => setActiveTab('ats')}
            className={`sq-btn ${activeTab === 'ats' ? 'sq-btn-primary' : ''}`}
          >
            ANALYSE ATS FIT
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`sq-btn ${activeTab === 'interview' ? 'sq-btn-primary' : ''}`}
          >
            QUESTIONS ENTRETIEN
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-10 text-center text-[12px] text-[#6b7280]">Analyse en cours...</div>
          ) : activeTab === 'ats' && atsData ? (
            <div className="space-y-4">
              <div className="sq-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                    SCORE ATS GLOBAL
                  </div>
                  <div className="text-[24px] font-bold tabular-nums text-[#111818]">
                    {atsData.overall_score}/100
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(atsData.category_scores).map(([k, v]) => (
                    <div key={k} className="px-2.5 py-1 border border-[#e5e5e5] bg-white text-[11px] tabular-nums">
                      <span className="text-[#6b7280] uppercase text-[9px] font-bold mr-1.5">{k}</span>
                      <span className="font-bold">{v}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="sq-card p-4 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1f5fbf]">
                    POINTS FORTS
                  </div>
                  <ul className="text-[12px] space-y-1 list-disc pl-4 text-[#111818]">
                    {atsData.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="sq-card p-4 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#c8312b]">
                    MOTS-CLÉS MANQUANTS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {atsData.missing_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 border border-[#c8312b]/30 bg-[#c8312b]/5 text-[#c8312b]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'interview' && prepData ? (
            <div className="space-y-3">
              <div className="sq-card p-4 text-[12px] text-[#111818]">{prepData.overview}</div>
              {prepData.questions.map((q) => {
                const open = !!expanded[q.id];
                return (
                  <div key={q.id} className="sq-card">
                    <button
                      onClick={() => setExpanded((p) => ({ ...p, [q.id]: !p[q.id] }))}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#6b7280] mr-2">
                          {q.category} · {q.difficulty}
                        </span>
                        <div className="text-[13px] font-semibold text-[#111818]">{q.question}</div>
                      </div>
                      {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                    </button>
                    {open && (
                      <div className="px-3.5 pb-3.5 pt-2 border-t border-[#e5e5e5] bg-white space-y-2 text-[12px]">
                        <div className="text-[#111818]">{q.expected_answer}</div>
                        <div className="text-[#1f5fbf] font-medium">Edge : {q.candidate_edge}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="px-6 py-3.5 border-t border-[#e5e5e5] bg-[#fafafa] flex items-center justify-between">
          <button onClick={onClose} className="sq-btn">
            FERMER
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenPitchModal(offer);
            }}
            className="sq-btn sq-btn-primary"
          >
            <Send className="w-3.5 h-3.5" />
            GÉNÉRER PITCH & POSTULER
          </button>
        </div>
      </div>
    </div>
  );
};
