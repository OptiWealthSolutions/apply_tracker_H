import React, { useState, useEffect } from 'react';
import {
  FileText,
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Send,
  Zap,
  Target,
  BarChart2,
  Check,
  Copy,
} from 'lucide-react';
import type { CVAuditResponse, CoverLetterAuditResponse, CVInfo } from '../types';
import { api } from '../api/client';

export const CVAuditView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cv' | 'letter'>('cv');

  // CV Audit State
  const [cvAudit, setCvAudit] = useState<CVAuditResponse | null>(null);
  const [isCvLoading, setIsCvLoading] = useState(false);
  const [cvInfo, setCvInfo] = useState<CVInfo | null>(null);
  const [customCvText, setCustomCvText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Cover Letter Audit State
  const [letterText, setLetterText] = useState(
    "Madame, Monsieur,\n\nActuellement en Master in Finance à l'EDHEC Business School (Financial Markets Track) après une classe préparatoire ENS Paris-Saclay D2, je vous soumets ma candidature pour le stage d'Assistant Trader Dérivés Actions au sein de votre desk.\n\nPassionné par la modélisation de volatilité et l'arbitrage systématique, j'ai développé la plateforme Horacle Hub en Python et MQL5, permettant l'analyse vectorisée de signaux macroéconomiques et de liquidité interbancaire (€STR, SOFR) ainsi que le backtesting de stratégies asymétriques à haute convexité.\n\nRigoureux et immédiatement opérationnel sur les outils quantitatifs (Python, NumPy, pandas, SQL), je souhaite apporter mes compétences analytiques à votre équipe de trading.\n\nJe me tiens à votre entière disposition pour un entretien technique à votre convenance.\n\nCordialement,\nLéo Lombardini\n+33 6 00 00 00 00 | leo.lombardini@edhec.com"
  );
  const [targetCompany, setTargetCompany] = useState('BNP Paribas');
  const [targetRole, setTargetRole] = useState('Assistant Trader Equity Derivatives');
  const [letterAudit, setLetterAudit] = useState<CoverLetterAuditResponse | null>(null);
  const [isLetterLoading, setIsLetterLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load active CV info & run initial CV audit
  useEffect(() => {
    loadCvData();
  }, []);

  const loadCvData = async () => {
    setIsCvLoading(true);
    try {
      try {
        const info = await api.getCVInfo();
        setCvInfo(info);
      } catch (e) {
        console.warn('CV Document info non trouvé:', e);
      }

      const audit = await api.auditCurrentCV();
      setCvAudit(audit);
    } catch (err) {
      console.error('Erreur audit CV:', err);
    } finally {
      setIsCvLoading(false);
    }
  };

  const handleAuditCustomCv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCvText.trim()) return;

    setIsCvLoading(true);
    try {
      const audit = await api.auditCV(customCvText);
      setCvAudit(audit);
    } catch (err) {
      console.error('Erreur audit CV personnalisé:', err);
      alert("Erreur lors de l'audit du CV.");
    } finally {
      setIsCvLoading(false);
    }
  };

  const handleAuditLetter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!letterText.trim()) return;

    setIsLetterLoading(true);
    try {
      const audit = await api.auditCoverLetter(letterText, targetCompany, targetRole);
      setLetterAudit(audit);
    } catch (err) {
      console.error('Erreur audit lettre:', err);
      alert("Erreur lors de l'audit de la lettre.");
    } finally {
      setIsLetterLoading(false);
    }
  };

  // Run initial letter audit if none
  useEffect(() => {
    if (!letterAudit && letterText) {
      handleAuditLetter();
    }
  }, []);

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(letterText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'bg-emerald-600 text-white shadow-xs';
      case 'A':
        return 'bg-blue-600 text-white shadow-xs';
      case 'B+':
        return 'bg-indigo-600 text-white';
      case 'B':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              Algorithme d'Évaluation Quantitative & ATS
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Analyseur de Qualité CV & Lettre de Motivation
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Audit rigoureux sans concessions : détection de la formule Google XYZ (« Accompli [X], mesuré par [Y], en faisant [Z] »), salience des mots-clés TF-IDF, densité terminologique par desk et concision calibrée pour le temps d'attention d'un Managing Director.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('cv')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'cv'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Audit Qualité CV</span>
            </button>
            <button
              onClick={() => setActiveTab('letter')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'letter'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-4 h-4 text-blue-600" />
              <span>Lettre & Pitch Candidature</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Cards (if CV Audit available) */}
        {activeTab === 'cv' && cvAudit && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Score Qualité Global
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                  {cvAudit.overall_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg font-mono ${getGradeBadge(cvAudit.letter_grade)}`}>
                {cvAudit.letter_grade}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Taux de Quantification
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {cvAudit.quantification_rate_percent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Formule Google XYZ validée
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Verbes d'Action Actifs
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {cvAudit.strong_verbs_rate_percent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Élimination du passif
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Volume & Concision
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {cvAudit.total_words} <span className="text-xs text-slate-400 font-normal">mots</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Calibré 1 page institutionnelle
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CV AUDIT VIEW */}
      {/* ======================================================== */}
      {activeTab === 'cv' && (
        <div className="space-y-6">
          {/* Active Hosted CV Banner */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>CV Actif Analysé : {cvInfo?.filename || 'CV_Leo_Lombardini.pdf'}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium border border-emerald-200">
                    Hébergé en SQLite
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Profil vérifié EDHEC M1 Financial Markets & CPGE ENS D2 - Horacle Capital
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{isCustomMode ? 'Masquer éditeur' : 'Tester un texte CV'}</span>
              </button>
              <button
                type="button"
                onClick={loadCvData}
                disabled={isCvLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCvLoading ? 'animate-spin' : ''}`} />
                <span>Réévaluer</span>
              </button>
              <a
                href={api.getCVViewUrl()}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1.5 transition shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Voir le PDF</span>
              </a>
            </div>
          </div>

          {/* Optional Custom CV Text Form */}
          {isCustomMode && (
            <form onSubmit={handleAuditCustomCv} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Coller ou éditer un texte de CV pour audit immédiat
                </label>
                <span className="text-[11px] text-slate-400">
                  L'audit prend en compte les 5 critères de l'algorithme
                </span>
              </div>
              <textarea
                rows={5}
                value={customCvText}
                onChange={(e) => setCustomCvText(e.target.value)}
                placeholder="Collez ici les sections de votre CV à auditer (expériences, compétences, projets)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCvLoading || !customCvText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  Auditer ce texte
                </button>
              </div>
            </form>
          )}

          {cvAudit && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Category Scores & Domain Fit */}
              <div className="space-y-6">
                {/* Executive Summary Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Synthèse Exécutive du Profil</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    {cvAudit.executive_summary}
                  </p>
                </div>

                {/* Category Scores Breakdown */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    <span>Détail des Composantes de Qualité</span>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(cvAudit.category_scores).map(([category, score]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">{category}</span>
                          <span className="font-bold text-slate-900 font-mono">{score}/100</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              score >= 90
                                ? 'bg-emerald-500'
                                : score >= 80
                                ? 'bg-blue-600'
                                : score >= 70
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Domain Fit Index */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Adéquation par Domaine Professionnel</span>
                  </div>

                  <div className="space-y-2.5">
                    {Object.entries(cvAudit.domain_fit).map(([domain, fit]) => (
                      <div
                        key={domain}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60"
                      >
                        <span className="text-xs text-slate-700 font-medium">{domain}</span>
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {fit}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Points Forts Institutionnels</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {cvAudit.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Recommandations d'Amélioration</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {cvAudit.critical_improvements.map((ci, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{ci}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right 2 Columns: Keywords Ranking & Google XYZ Bullet Audit */}
              <div className="lg:col-span-2 space-y-6">
                {/* Keywords Ranking Table */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span>Ranking des Mots-Clés Détectés (TF-IDF & Salience)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {cvAudit.top_ranked_keywords.length} mots-clés quantitatifs classés
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Terme Technique</th>
                          <th className="py-2.5 px-3">Catégorie</th>
                          <th className="py-2.5 px-3 text-center">Occurrences</th>
                          <th className="py-2.5 px-3 text-center">Densité %</th>
                          <th className="py-2.5 px-3 text-right">Priorité ATS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cvAudit.top_ranked_keywords.map((kw, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {kw.keyword}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                {kw.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                              {kw.count}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                              {kw.density_percent}%
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  kw.importance === 'Critique'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : kw.importance === 'Haute'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {kw.importance}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Missing High-Yield Keywords */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-2 border-b border-slate-100">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Mots-Clés Manquants à Fort Rendement ATS</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    L'intégration ciblée de ces termes dans vos descriptions d'expériences maximisera votre score lors des filtrages automatiques en banque d'investissement :
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {cvAudit.missing_high_yield_keywords.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between"
                      >
                        <div className="font-semibold text-xs text-slate-800">{m.keyword}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                          <span>{m.category}</span>
                          <span className="font-medium text-blue-600">{m.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Google XYZ Formula Bullet Points Audit */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span>Audit Détaillé des Bullet Points (Formule Google XYZ)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Critères : Métrique chiffrée [Y] + Verbe d'action [Z]
                    </span>
                  </div>

                  <div className="space-y-3">
                    {cvAudit.bullet_audits.map((bullet, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs text-slate-800 font-medium leading-relaxed">
                            "{bullet.original_text}"
                          </p>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                              bullet.xyz_score >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : bullet.xyz_score >= 60
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Score XYZ : {bullet.xyz_score}/100
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                              bullet.is_quantified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {bullet.is_quantified ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {bullet.is_quantified
                              ? `Quantifié (${bullet.detected_metrics.join(', ')})`
                              : 'Non quantifié'}
                          </span>

                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                              bullet.has_strong_verb
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {bullet.has_strong_verb ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {bullet.has_strong_verb
                              ? `Verbe fort : ${bullet.detected_verb}`
                              : 'Verbe passif'}
                          </span>
                        </div>

                        {bullet.suggestion && (
                          <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mt-2">
                            <span className="font-bold text-blue-700 mr-1">Recommandation :</span>
                            {bullet.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: COVER LETTER & PITCH AUDIT VIEW */}
      {/* ======================================================== */}
      {activeTab === 'letter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Letter Form */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Corps de la Lettre de Motivation & Pitch</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLetter}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copySuccess ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Entreprise / Banque Cible
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="Ex: BNP Paribas, Goldman Sachs, Rothschild..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Intitulé du Poste Cible
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Ex: Assistant Trader Equity Derivatives"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Texte de la Lettre / Mail d'Accompagnement
                </label>
                <textarea
                  rows={16}
                  value={letterText}
                  onChange={(e) => setLetterText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleAuditLetter}
                disabled={isLetterLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLetterLoading ? 'Audit en cours...' : 'Lancer l\'Audit de la Lettre'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Audit Results */}
          <div className="lg:col-span-5 space-y-4">
            {letterAudit ? (
              <div className="space-y-4">
                {/* Overall Score Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Qualité du Pitch
                      </div>
                      <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                        {letterAudit.overall_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg font-mono ${getGradeBadge(letterAudit.letter_grade)}`}>
                      {letterAudit.letter_grade}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Personnalisation (Banque & Desk)</span>
                        <span className="font-bold font-mono text-slate-900">{letterAudit.personalization_score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${letterAudit.personalization_score}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Force de l'Accroche Initiale</span>
                        <span className="font-bold font-mono text-slate-900">{letterAudit.hook_strength_score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${letterAudit.hook_strength_score}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Concision & Calibrage ({letterAudit.word_count} mots)</span>
                        <span className="font-bold font-mono text-slate-900">{letterAudit.conciseness_score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${letterAudit.conciseness_score}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Appel à l'Action & Coordonnées</span>
                        <span className="font-bold font-mono text-slate-900">{letterAudit.call_to_action_score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{ width: `${letterAudit.call_to_action_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback & Recommendations */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
                    Points Forts & Alertes
                  </div>

                  {letterAudit.strengths.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                        Atouts Détectés :
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {letterAudit.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {letterAudit.warnings.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                        Points de Vigilance :
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {letterAudit.warnings.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {letterAudit.recommendations.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                        Recommandations d'Impact :
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {letterAudit.recommendations.map((r, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700">
                  Cliquez sur "Lancer l'Audit de la Lettre" pour générer l'évaluation.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
