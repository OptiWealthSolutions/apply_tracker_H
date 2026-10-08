import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Building2,
  ExternalLink,
  Search,
  CheckCircle2,
  GraduationCap,
  Video,
  FileText,
  Code,
  Target,
  Award,
  HelpCircle,
  Sparkles,
  ChevronRight,
  MapPin,
  Layers,
  Loader2,
} from 'lucide-react';
import type { FirmInterviewExpectation, EducationalResource } from '../types';
import { api } from '../api/client';

export const ResourcesView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'firms' | 'resources'>('firms');

  // Firm expectations state
  const [firms, setFirms] = useState<FirmInterviewExpectation[]>([]);
  const [firmSectorFilter, setFirmSectorFilter] = useState<string>('all');
  const [firmSearch, setFirmSearch] = useState<string>('');
  const [isFirmsLoading, setIsFirmsLoading] = useState<boolean>(false);
  const [expandedFirmId, setExpandedFirmId] = useState<string | null>(null);

  // Educational resources state
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [resourceSectorFilter, setResourceSectorFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [resourceSearch, setResourceSearch] = useState<string>('');
  const [isResourcesLoading, setIsResourcesLoading] = useState<boolean>(false);

  // Load firm expectations
  useEffect(() => {
    setIsFirmsLoading(true);
    api
      .getFirmExpectations(firmSectorFilter)
      .then((data) => setFirms(data))
      .catch((err) => console.error('Erreur chargement attentes firmes:', err))
      .finally(() => setIsFirmsLoading(false));
  }, [firmSectorFilter]);

  // Load educational resources
  useEffect(() => {
    setIsResourcesLoading(true);
    api
      .getEducationalResources(resourceSectorFilter, resourceTypeFilter)
      .then((data) => setResources(data))
      .catch((err) => console.error('Erreur chargement ressources:', err))
      .finally(() => setIsResourcesLoading(false));
  }, [resourceSectorFilter, resourceTypeFilter]);

  const filteredFirms = firms.filter((f) => {
    if (!firmSearch.trim()) return true;
    const q = firmSearch.toLowerCase();
    return (
      f.firm_name.toLowerCase().includes(q) ||
      f.division.toLowerCase().includes(q) ||
      f.sector.toLowerCase().includes(q) ||
      f.technical_evaluations.some((t) => t.toLowerCase().includes(q))
    );
  });

  const filteredResources = resources.filter((r) => {
    if (!resourceSearch.trim()) return true;
    const q = resourceSearch.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.creator_or_author.toLowerCase().includes(q) ||
      r.sector.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.key_takeaways.some((k) => k.toLowerCase().includes(q))
    );
  });

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'Vidéo / Cours':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'Paper de Recherche':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'Livre de Référence':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'Repository GitHub':
        return <Code className="w-4 h-4 text-slate-800" />;
      case 'Entraînement / Outil':
        return <Target className="w-4 h-4 text-emerald-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-blue-600" />;
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Fondamental':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermédiaire':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Avancé / Desk Head':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Phase 4 du Pipeline : Apprendre les Prérequis
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Attentes par Firme & Bibliothèque de Ressources
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Préparez méthodiquement vos entretiens techniques et comportementaux : exigences concrètes des banques d'affaires (Goldman Sachs, Rothschild, Morgan Stanley, Lazard), des desks de dérivés (BNP, SG) et des hedge funds (Jane Street, Citadel, Optiver), accompagnées des meilleures ressources vidéos, papers académiques et simulateurs.
            </p>
          </div>

          {/* Segmented Subtab Switch */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveSubTab('firms')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeSubTab === 'firms'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Attentes par Entreprise ({firms.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('resources')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeSubTab === 'resources'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Vidéos, Papers & Livres ({resources.length})</span>
            </button>
          </div>
        </div>

        {/* Pipeline Breadcrumb Reminder */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Architecture du Pipeline :
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
            1. Screening / Recherche
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
            2. Analyser (KNN & CV)
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
            3. Postuler (Pitch & Mail)
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold shadow-2xs">
            4. Apprendre les Prérequis & Attentes
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 1: FIRM INTERVIEW EXPECTATIONS */}
      {/* ======================================================== */}
      {activeSubTab === 'firms' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Sector Filters */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Secteur :
                </span>
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'Investment Banking', label: 'Investment Banking (M&A / CIB)' },
                  { id: 'Global Markets', label: 'Global Markets (S&T / Structuration)' },
                  { id: 'Hedge Funds', label: 'Hedge Funds & Prop Trading' },
                  { id: 'Private Equity', label: 'Private Equity' },
                  { id: 'Audit', label: 'Audit & TS' },
                  { id: 'Conseil', label: 'Conseil en Stratégie' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFirmSectorFilter(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      firmSectorFilter === s.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[260px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={firmSearch}
                  onChange={(e) => setFirmSearch(e.target.value)}
                  placeholder="Rechercher une firme, un concept..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Firm Cards Grid */}
          {isFirmsLoading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">Chargement des attentes institutionnelles...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFirms.map((firm) => {
                const isExpanded = expandedFirmId === firm.id;
                return (
                  <div
                  key={firm.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5 hover:border-slate-300 transition"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                          {firm.firm_name}
                        </h2>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {firm.sector}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="font-medium text-slate-700">{firm.division}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {firm.locations.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={firm.official_careers_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>Portail Carrières</span>
                      </a>
                      <button
                        onClick={() => setExpandedFirmId(isExpanded ? null : firm.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition"
                      >
                        {isExpanded ? 'Réduire' : 'Détails & Questions'}
                      </button>
                    </div>
                  </div>

                  {/* 3 Columns: Recruitment Process, Culture & Fit, Technical Expectations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Column 1: Process */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Processus de Recrutement</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {firm.recruitment_process.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 2: Fit & Culture */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>Culture & Attentes Comportementales</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {firm.culture_and_fit_expectations.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 3: Technical Focus */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-blue-600" />
                        <span>Évaluations Techniques Clés</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {firm.technical_evaluations.map((t, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Expanded Section: Brainteasers & Questions */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                      {/* Brainteasers & Tests */}
                      {firm.brainteasers_or_tests.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-purple-600" />
                            <span>Tests Spécifiques, Calcul Mental & Cas Pratiques</span>
                          </div>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {firm.brainteasers_or_tests.map((b, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Typical Interview Questions */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-900">
                          Questions Réelles Posées en Entretien :
                        </div>
                        <div className="space-y-2">
                          {firm.typical_interview_questions.map((q, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                            >
                              "{q}"
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Insider Candidate Tip */}
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold mr-1">Conseil Tactique pour Votre Profil :</span>
                          {firm.insider_candidate_tips}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* ======================================================== */}
      {/* SUBTAB 2: EDUCATIONAL RESOURCES */}
      {/* ======================================================== */}
      {activeSubTab === 'resources' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Sector Filters */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Discipline :
                </span>
                {[
                  { id: 'all', label: 'Toutes' },
                  { id: 'Finance de Marché', label: 'Marchés & Dérivés' },
                  { id: 'Investment Banking', label: 'Investment Banking & M&A' },
                  { id: 'Quant', label: 'Quant & Algo Trading' },
                  { id: 'Brainteasers', label: 'Brainteasers & Math' },
                  { id: 'Private Equity', label: 'Private Equity & LBO' },
                  { id: 'Strategy Consulting', label: 'Conseil & TS' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setResourceSectorFilter(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      resourceSectorFilter === s.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Resource Type Filter */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {[
                  { id: 'all', label: 'Tous Formats' },
                  { id: 'Vidéo', label: 'Vidéos' },
                  { id: 'Paper', label: 'Papers' },
                  { id: 'Livre', label: 'Livres' },
                  { id: 'GitHub', label: 'GitHub' },
                  { id: 'Entraînement', label: 'Trainers' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setResourceTypeFilter(t.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      resourceTypeFilter === t.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Rechercher un livre (Hull, Rosenbaum, Taleb), auteur, mot-clé (Dupire, LBO, Avellaneda)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Resources Cards Grid */}
          {isResourcesLoading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">Chargement de la bibliothèque de ressources...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredResources.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {getResourceTypeIcon(res.resource_type)}
                      <span>{res.resource_type}</span>
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getDifficultyBadge(
                        res.difficulty
                      )}`}
                    >
                      {res.difficulty}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {res.title}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Par <span className="font-semibold text-slate-700">{res.creator_or_author}</span> • {res.duration_or_pages}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {res.description}
                  </p>

                  {/* Key Takeaways */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Concepts Clés à Maîtriser :
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {res.key_takeaways.map((k, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    {res.sector}
                  </span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <span>Accéder à la Ressource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
    </div>
  );
};
