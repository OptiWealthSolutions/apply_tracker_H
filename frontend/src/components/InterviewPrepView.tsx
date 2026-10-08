import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Clock,
  Code,
  Brain,
} from 'lucide-react';
import type { DeskInterviewPrepResponse, InterviewQuestionItem, InterviewBrainteaserItem } from '../types';
import { api } from '../api/client';

export const InterviewPrepView: React.FC = () => {
  const desks = [
    'Equity Derivatives',
    'Rates & Fixed Income',
    'Quantitative Research & Systematic Trading',
    'FX & Cross-Asset',
    'Structuring',
  ];

  const [selectedDesk, setSelectedDesk] = useState<string>('Equity Derivatives');
  const [prepData, setPrepData] = useState<DeskInterviewPrepResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    setExpandedQuestions({});
    setRevealedHints({});
    setRevealedSolutions({});
    api
      .getInterviewPrep(selectedDesk)
      .then((res) => {
        setPrepData(res);
        // Expand first question by default
        if (res.questions && res.questions.length > 0) {
          setExpandedQuestions({ [res.questions[0].id]: true });
        }
      })
      .catch((err) => console.error('Error fetching interview prep:', err))
      .finally(() => setIsLoading(false));
  }, [selectedDesk]);

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHint = (idx: number) => {
    setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleSolution = (idx: number) => {
    setRevealedSolutions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B1E36] via-[#11243E] to-[#1B3A60] rounded-2xl p-6 text-white border border-[#1E3E66] shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                Préparation Technique
              </span>
              <span className="text-xs text-slate-300">| Salles des Marchés & Banques d'Investissement</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-blue-400" />
              Guide d'Entretien Technique Desk
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Questions réelles posées par les Traders, Structurers et Quants en entretien Master 1 / M2 / Off-Cycle.
              Démonstrations mathématiques complètes, intuition des Grecs et valorisation de votre parcours (EDHEC M1, ENS D2, Horacle Capital).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15 text-right">
            <div className="text-[11px] text-slate-300">Profil Candidat</div>
            <div className="font-bold text-sm text-white mt-0.5">Léo Lombardini</div>
            <div className="text-[11px] text-blue-300">Financial Markets Track</div>
          </div>
        </div>

        {/* Desk Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/10">
          {desks.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDesk(d)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                selectedDesk === d
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                  : 'bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-slate-600 text-sm font-medium">Chargement du guide technique {selectedDesk}...</div>
        </div>
      ) : prepData ? (
        <div className="space-y-6">
          {/* Desk Overview & Daily Routine */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overview & Key Concepts */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  {prepData.desk_title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {prepData.overview}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Concepts Théoriques et Mathématiques Clés
                </h4>
                <ul className="space-y-2">
                  {prepData.key_technical_concepts.map((concept, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                      <span>{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Desk Daily Routine */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Journée Type du Desk
              </h4>
              <div className="space-y-3 text-xs text-slate-600">
                {prepData.daily_routine.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-mono text-[10px] flex items-center justify-center shrink-0 font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technical Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                Questions Techniques Posées en Entretien ({prepData.questions.length})
              </h3>
              <span className="text-xs text-slate-500">
                Cliquez sur une question pour afficher la démonstration détaillée
              </span>
            </div>

            <div className="space-y-3">
              {prepData.questions.map((q: InterviewQuestionItem) => {
                const isExpanded = !!expandedQuestions[q.id];
                return (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      onClick={() => toggleQuestion(q.id)}
                      className="w-full px-6 py-4 text-left flex items-start justify-between gap-4 hover:bg-slate-50/70 transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {q.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                            {q.difficulty}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {q.title}
                        </h4>
                      </div>
                      <div className="p-1 text-slate-400 shrink-0">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 space-y-4 border-t border-slate-100 text-xs">
                        {/* Question Prompt */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800">
                          <span className="font-semibold text-slate-500 mr-2">Question posée :</span>
                          {q.question}
                        </div>

                        {/* Expected Answer */}
                        <div className="space-y-1.5">
                          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Réponse Modèle & Démonstration :</span>
                          </div>
                          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-700 leading-relaxed text-xs">
                            {q.expected_answer}
                          </div>
                        </div>

                        {/* Candidate Edge */}
                        <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/50 border border-blue-200 rounded-xl">
                          <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span>Comment Léo doit faire la différence (Votre avantage concurrentiel) :</span>
                          </div>
                          <div className="text-blue-800 text-xs leading-relaxed">
                            {q.candidate_edge}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brainteasers & Mental Math */}
          {prepData.brainteasers && prepData.brainteasers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                Brainteasers & Épreuves de Rapidité Mentale
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prepData.brainteasers.map((bt: InterviewBrainteaserItem, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
                    <div className="font-semibold text-slate-900 text-xs">
                      <span className="text-blue-600 font-bold mr-1">Énigme {idx + 1} :</span>
                      {bt.question}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleHint(idx)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
                      >
                        {revealedHints[idx] ? "Masquer l'indice" : "Afficher l'indice"}
                      </button>
                      <button
                        onClick={() => toggleSolution(idx)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 transition"
                      >
                        {revealedSolutions[idx] ? "Masquer la solution" : "Révéler la démonstration"}
                      </button>
                    </div>

                    {revealedHints[idx] && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed animate-in fade-in duration-150">
                        <span className="font-semibold">Indice :</span> {bt.hint}
                      </div>
                    )}

                    {revealedSolutions[idx] && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs leading-relaxed animate-in fade-in duration-150">
                        <span className="font-semibold">Démonstration :</span> {bt.solution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reading List */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Lectures Recommandées pour ce Desk
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
              {prepData.recommended_market_reading.map((book, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{book}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
