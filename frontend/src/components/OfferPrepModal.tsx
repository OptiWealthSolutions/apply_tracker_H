import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  Layers,
} from 'lucide-react';
import type {
  JobOffer,
  ATSFitBreakdown,
  DeskInterviewPrepResponse,
  InterviewQuestionItem,
  InterviewBrainteaserItem,
} from '../types';
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
  const [isLoadingAts, setIsLoadingAts] = useState(false);
  const [isLoadingPrep, setIsLoadingPrep] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen && offer) {
      // Load ATS analysis
      setIsLoadingAts(true);
      api
        .getOfferATSAnalysis(offer.id)
        .then((res) => setAtsData(res))
        .catch((err) => console.error('Error fetching ATS data:', err))
        .finally(() => setIsLoadingAts(false));

      // Load interview prep
      setIsLoadingPrep(true);
      api
        .getOfferInterviewPrep(offer.id)
        .then((res) => {
          setPrepData(res);
          // Expand first question by default
          if (res.questions && res.questions.length > 0) {
            setExpandedQuestions({ [res.questions[0].id]: true });
          }
        })
        .catch((err) => console.error('Error fetching interview prep:', err))
        .finally(() => setIsLoadingPrep(false));
    }
  }, [isOpen, offer]);

  if (!isOpen || !offer) return null;

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHint = (idx: number) => {
    setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleSolution = (idx: number) => {
    setRevealedSolutions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {offer.desk}
              </span>
              <span className="text-xs text-slate-400 font-medium">| {offer.company}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{offer.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('ats')}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'ats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Score ATS & Mots-Clés ({atsData ? `${atsData.overall_score}%` : '...'})</span>
            </button>
            <button
              onClick={() => setActiveTab('interview')}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'interview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Questions Techniques Desk</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenPitchModal(offer);
            }}
            className="mb-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Postuler / Pitcher</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* TAB 1: ATS MATCH ANALYSIS */}
          {activeTab === 'ats' && (
            <>
              {isLoadingAts ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <div>Calcul de la compatibilité ATS avec le profil de Léo Lombardini...</div>
                </div>
              ) : atsData ? (
                <div className="space-y-6">
                  {/* Hero Match Score */}
                  <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/50 border border-blue-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-blue-200 shadow-sm flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-blue-700 font-mono">
                          {atsData.overall_score}%
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                          Match ATS
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <span>Adéquation Institutionnelle Desk</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getScoreColor(atsData.overall_score)}`}>
                            {atsData.overall_score >= 90 ? 'Candidat Idéal' : 'Forte Adéquation'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs mt-1">
                          Le profil quantitatif et financier (EDHEC M1 Market Finance, ENS D2, Horacle Capital) couvre parfaitement les prérequis du desk.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                      <div><span className="font-semibold text-slate-800">Candidat :</span> Léo Lombardini</div>
                      <div><span className="font-semibold text-slate-800">Cible :</span> {offer.desk}</div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                      Décomposition par Pôle de Compétences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(atsData.category_scores).map(([category, score]) => (
                        <div
                          key={category}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-xs">{category}</span>
                            <span className="font-mono font-bold text-blue-600 text-xs">{score}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Missing Keywords */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                      <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Forces Clés Identifiées sur le CV</span>
                      </div>
                      <ul className="space-y-1.5 text-slate-700 text-[11px]">
                        {atsData.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Missing / High-Yield Keywords */}
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2.5">
                      <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span>Mots-Clés ATS Recommandés à Insérer</span>
                      </div>
                      <ul className="space-y-1.5 text-slate-700 text-[11px]">
                        {atsData.missing_keywords.map((kw, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                            <span>{kw}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Strategic Advice */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Conseils Stratégiques pour Candidater</span>
                    </div>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {atsData.strategic_advice.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* TAB 2: TECHNICAL DESK INTERVIEW QUESTIONS */}
          {activeTab === 'interview' && (
            <>
              {isLoadingPrep ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <div>Chargement des questions techniques du desk...</div>
                </div>
              ) : prepData ? (
                <div className="space-y-6">
                  {/* Desk Header */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                    <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>{prepData.desk_title}</span>
                    </div>
                    <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                      {prepData.overview}
                    </p>
                  </div>

                  {/* Questions list */}
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Questions Techniques Déterminantes Posées par les Traders ({prepData.questions.length})
                    </div>

                    {prepData.questions.map((q: InterviewQuestionItem) => {
                      const isExpanded = !!expandedQuestions[q.id];
                      return (
                        <div
                          key={q.id}
                          className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-xs"
                        >
                          <button
                            onClick={() => toggleQuestion(q.id)}
                            className="w-full px-4 py-3 text-left flex items-start justify-between gap-3 hover:bg-slate-50/60 transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  {q.category}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {q.difficulty}
                                </span>
                              </div>
                              <div className="font-semibold text-slate-900 text-xs mt-1">
                                {q.title}
                              </div>
                            </div>
                            <div className="p-1 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 text-xs">
                              {/* Exact Question */}
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium text-slate-800">
                                <span className="font-semibold text-slate-500 mr-1.5">Question du Trader :</span>
                                {q.question}
                              </div>

                              {/* Model Answer */}
                              <div className="space-y-1">
                                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Réponse Modèle Institutionnelle :</span>
                                </div>
                                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 leading-relaxed text-[11px]">
                                  {q.expected_answer}
                                </div>
                              </div>

                              {/* Léo's Competitive Edge */}
                              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px]">
                                <div className="font-bold text-blue-900 mb-0.5 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Votre Avantage Concurrentiel (À citer lors de l'échange) :</span>
                                </div>
                                <div className="text-blue-800">
                                  {q.candidate_edge}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Brainteasers */}
                  {prepData.brainteasers && prepData.brainteasers.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Brainteaser & Épreuve de Calcul Mental Rapide
                      </div>
                      {prepData.brainteasers.map((bt: InterviewBrainteaserItem, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="font-semibold text-slate-800 text-xs">
                            <span className="text-blue-600 mr-1">Énigme {idx + 1} :</span>
                            {bt.question}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleHint(idx)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-600 transition"
                            >
                              {revealedHints[idx] ? "Masquer l'indice" : "Afficher l'indice"}
                            </button>
                            <button
                              onClick={() => toggleSolution(idx)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-semibold text-blue-700 transition"
                            >
                              {revealedSolutions[idx] ? "Masquer la solution" : "Révéler la solution"}
                            </button>
                          </div>

                          {revealedHints[idx] && (
                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                              <span className="font-semibold">Indice :</span> {bt.hint}
                            </div>
                          )}

                          {revealedSolutions[idx] && (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px]">
                              <span className="font-semibold">Démonstration & Solution :</span> {bt.solution}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Guide Desk — EDHEC Financial Markets & ENS D2
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
