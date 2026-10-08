import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Check,
  Save,
  MapPin,
  Calendar,
  Compass,
  CheckCircle2,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import type { UserProfile } from '../types';
import { api } from '../api/client';

interface PreferencesViewProps {
  initialProfile: UserProfile | null;
  onProfileUpdated?: (updated: UserProfile) => void;
}

interface ProfessionDomain {
  id: string;
  name: string;
  description: string;
  color: string;
  roles: string[];
}

const PROFESSIONS_BY_DOMAIN: ProfessionDomain[] = [
  {
    id: 'market_finance',
    name: 'Finance de Marché & Global Markets (S&T / Structuration)',
    description: 'Trading pour compte propre et flux clients, structuration de produits sur-mesure, vente institutionnelle et tenue de marché.',
    color: 'blue',
    roles: [
      'Assistant Trader Equity Derivatives (EQD)',
      'Assistant Trader Fixed Income, Rates & Swaps',
      'Assistant Trader FX & Matières Premières',
      'Trader Assistant Crédit / Repo & Monétaire',
      'Sales Dérivés Actions & Solutions Structurées',
      'Sales FICC (Taux, Crédit, Devises)',
      'Structuration Produits Structurés & Hybrides',
      'Market Making & Exécution Algorithmique',
      'Recherche Quantitative & Stratégie Cross-Asset',
    ],
  },
  {
    id: 'corp_fin_mna',
    name: 'Corporate Finance & M&A / Capital Markets',
    description: 'Conseil en fusions-acquisitions, levées de capitaux sur les marchés d\'actions et de dette, financements structurés.',
    color: 'indigo',
    roles: [
      'Analyste M&A Large Cap & Boutiques d\'Élite',
      'Analyste M&A Mid Cap',
      'ECM (Equity Capital Markets) Analyst',
      'DCM (Debt Capital Markets) & Syndication',
      'Acquisition & Leveraged Finance (LevFin)',
      'Financements Structurés & Financement de Projet',
      'Restructuring Financier & Distressed Debt',
    ],
  },
  {
    id: 'private_equity',
    name: 'Private Equity, Private Debt & Venture Capital',
    description: 'Investissement en capital-transmission (LBO), dette privée, financement de l\'innovation et capital-développement.',
    color: 'emerald',
    roles: [
      'Analyste Private Equity LBO / Buyout',
      'Analyste Venture Capital & Tech Growth Equity',
      'Analyste Private Debt & Direct Lending',
      'Analyste Co-investissements & Secondaries PE',
      'Analyste Real Estate & Infrastructure Private Equity',
      'Analyste ESG & Impact Investing Private Markets',
    ],
  },
  {
    id: 'asset_mgmt_hf',
    name: 'Asset Management & Hedge Funds',
    description: 'Gestion d\'actifs pour compte de tiers, stratégies quantitatives systématiques et fonds alternatifs multi-stratégies.',
    color: 'cyan',
    roles: [
      'Assistant Gérant de Portefeuille Actions / Taux',
      'Analyste Buy-Side Fondamental (Equity Research)',
      'Quantitative Research & Multi-Asset Hedge Fund',
      'Systematic Trading & Execution Algorithmique Buy-Side',
      'Risque de Marché Buy-Side & Attribution de Performance',
      'Sélection de Fonds & Multi-Gestion',
    ],
  },
  {
    id: 'audit_ts',
    name: 'Audit Financier & Transaction Services (TS)',
    description: 'Audit légal des institutions financières, due diligence financière d\'acquisition et de cession, évaluation financière.',
    color: 'amber',
    roles: [
      'Transaction Services (Financial Due Diligence - FDD / VDD)',
      'Audit Financier Banques & Institutions Financières (FS Audit)',
      'Évaluation Financière & Modélisation (Valuation & Business Modeling)',
      'Forensic, Investigations Financières & Litiges',
      'Restructuring Opérationnel & Revue Indépendante de Business Plan (IBR)',
    ],
  },
  {
    id: 'strategy_consulting',
    name: 'Conseil en Stratégie & Organisation Financière',
    description: 'Missions de direction générale, stratégie d\'entreprise pour institutions financières, fusions-acquisitions stratégiques.',
    color: 'purple',
    roles: [
      'Conseil en Stratégie de Direction Générale (C-Level)',
      'Stratégie & Modèles Opérationnels Banques & Assurances',
      'Stratégie M&A & Intégration Post-Acquisition (PMI)',
      'Conseil Réglementaire Bancaire (Bâle IV, Risques & Liquidité)',
      'CFO Advisory & Pilotage de la Performance Financière',
    ],
  },
  {
    id: 'quant_tech',
    name: 'Fintech, Quant Tech & Ingénierie Financière',
    description: 'Développement de systèmes de trading haute performance, modélisation mathématique et ingénierie de données financières.',
    color: 'rose',
    roles: [
      'Quantitative Developer (C++ / Python / Low-Latency)',
      'Machine Learning Engineer Marchés Financiers',
      'Développeur Systématique MQL5 / Algorithmic Trading',
      'Data Scientist Séries Temporelles & Données Alternatives',
      'Ingénieur Pricing & Validation de Modèles Quantitatifs',
    ],
  },
];

const AVAILABLE_LOCATIONS = [
  'Paris',
  'Londres (London)',
  'New York (NY)',
  'Luxembourg',
  'Marseille',
  'Milan (Milano)',
  'Genève (Suisse)',
  'Francfort (Frankfurt)',
];

const AVAILABLE_START_PERIODS = [
  'Janvier 2026',
  'Mars / Avril 2026',
  'Juin / Juillet 2026 (Summer / Off-cycle)',
  'Septembre 2026',
  'Janvier 2027',
  'Immédiat / Dès que possible',
];

const AVAILABLE_DURATIONS = [
  '6 mois (Stage de Césure / Fin d\'Études)',
  '3 à 4 mois (Summer Internship)',
  'Off-Cycle (4 à 6 mois)',
  '12 mois (Contrat d\'Alternance / Graduate)',
];

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  initialProfile,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetDomains, setTargetDomains] = useState<string[]>([]);
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState<number>(2000);
  const [serendipityWeight, setSerendipityWeight] = useState<number>(0.25);
  const [targetStartPeriod, setTargetStartPeriod] = useState<string>('Janvier 2026');
  const [targetDuration, setTargetDuration] = useState<string>('6 mois (Stage de Césure / Fin d\'Études)');
  const [school, setSchool] = useState<string>('EDHEC Business School (M1 Financial Markets)');
  const [degreeLevel, setDegreeLevel] = useState<string>('Master 1 / Master 2');
  const [fullName, setFullName] = useState<string>('Léo Lombardini');
  const [email, setEmail] = useState<string>('leo.lombardini@edhec.com');
  const [phone, setPhone] = useState<string>('+33 6 00 00 00 00');
  const [bioSummary, setBioSummary] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTabDomain, setActiveTabDomain] = useState<string>('all');

  // Sync profile data
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setFullName(initialProfile.full_name || 'Léo Lombardini');
      setEmail(initialProfile.email || 'leo.lombardini@edhec.com');
      setPhone(initialProfile.phone || '+33 6 00 00 00 00');
      setSchool(initialProfile.school || 'EDHEC Business School');
      setDegreeLevel(initialProfile.degree_level || 'Master 1');
      setTargetRoles(initialProfile.target_roles || []);
      setTargetDomains(initialProfile.target_domains || []);
      setTargetLocations(initialProfile.target_locations || ['Paris']);
      setMinSalary(initialProfile.min_salary || 2000);
      setSerendipityWeight(initialProfile.serendipity_exploration_weight ?? 0.25);
      setTargetStartPeriod(initialProfile.target_start_period || 'Janvier 2026');
      setTargetDuration(initialProfile.target_duration || '6 mois (Stage de Césure / Fin d\'Études)');
      setBioSummary(initialProfile.bio_summary || '');
    }
  }, [initialProfile]);

  const toggleRole = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleAllRolesInDomain = (domainRoles: string[]) => {
    const allSelected = domainRoles.every((r) => targetRoles.includes(r));
    if (allSelected) {
      setTargetRoles((prev) => prev.filter((r) => !domainRoles.includes(r)));
    } else {
      const union = Array.from(new Set([...targetRoles, ...domainRoles]));
      setTargetRoles(union);
    }
  };

  const toggleLocation = (loc: string) => {
    setTargetLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await api.updateProfile({
        full_name: fullName,
        email,
        phone,
        school,
        degree_level: degreeLevel,
        target_domains: targetDomains,
        target_roles: targetRoles,
        target_locations: targetLocations,
        target_asset_classes: profile?.target_asset_classes || ['Equity Derivatives', 'Rates', 'FX'],
        technical_skills: profile?.technical_skills || ['Python', 'MQL5', 'Options Pricing', 'Calcul Stochastique'],
        target_duration: targetDuration,
        target_start_period: targetStartPeriod,
        min_salary: minSalary,
        bio_summary: bioSummary,
        serendipity_exploration_weight: serendipityWeight,
      });

      setProfile(updated);
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du profil:', err);
      alert('Erreur lors de la sauvegarde des préférences.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDomains = activeTabDomain === 'all'
    ? PROFESSIONS_BY_DOMAIN
    : PROFESSIONS_BY_DOMAIN.filter((d) => d.id === activeTabDomain);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sliders className="w-3.5 h-3.5" />
              Configuration Institutionnelle & Critères Cibles
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Préférences Professionnelles & Cartographie des Métiers
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Définissez vos ambitions sectorielles à travers toute l'industrie financière : Finance de Marché, M&A, Private Equity, Asset Management, Audit & TS, Conseil en Stratégie et Quant Tech. Ces critères calibrent en temps réel le moteur de recommandation KNN et les scrapers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Préférences Enregistrées
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les Critères'}</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Postes Sélectionnés
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
              {targetRoles.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              sur 43 intitulés institutionnels
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Places Financières
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
              {targetLocations.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Hubs ciblés dans l'UE, UK & US
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gratification Cible
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
              {minSalary.toLocaleString('fr-FR')} €/mois
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Minimum requis filtrant
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Sérendipité KNN
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
              {Math.round(serendipityWeight * 100)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Exploration d'opportunités connexes
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns: Candidate Profile & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Identity & Parameters */}
        <div className="space-y-6">
          {/* Identity & Education Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Identité & Formation Académique</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nom Complet
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Email Professionnel
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  École / Institution
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Niveau d'Études Actuel
                </label>
                <input
                  type="text"
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Pitch Bio / Synthèse de Profil
                </label>
                <textarea
                  rows={3}
                  value={bioSummary}
                  onChange={(e) => setBioSummary(e.target.value)}
                  placeholder="Ex: EDHEC M1 Financial Markets, CPGE ENS D2, Fondateur Horacle Capital..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Timing & Salary Parameters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Calendrier & Conditions Financières</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Date de Début Cible
                </label>
                <select
                  value={targetStartPeriod}
                  onChange={(e) => setTargetStartPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {AVAILABLE_START_PERIODS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Format / Durée de Stage
                </label>
                <select
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {AVAILABLE_DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Gratification Minimale (€/mois)
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {minSalary} €
                  </span>
                </div>
                <input
                  type="range"
                  min="1200"
                  max="4500"
                  step="100"
                  value={minSalary}
                  onChange={(e) => setMinSalary(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>1 200 €</span>
                  <span>2 500 €</span>
                  <span>4 500 €</span>
                </div>
              </div>
            </div>
          </div>

          {/* KNN Serendipity Exploration Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Algorithme KNN & Découverte de Pépites</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 font-medium">Taux de Sérendipité :</span>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {Math.round(serendipityWeight * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={serendipityWeight}
                onChange={(e) => setSerendipityWeight(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (Strict)</span>
                <span>50% (Équilibré)</span>
                <span>100% (Exploratoire)</span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                Une valeur entre 20% et 35% permet à l'algorithme de plus proche voisin de vous suggérer des stages à forte valeur ajoutée légèrement en dehors de vos critères principaux (ex: Arbitrage Statistique ou Structuration Exotique si vous ciblez le Trading EQD).
              </p>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Geographic Hubs & Full Professions Mapping */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Locations Hubs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Places Financières & Hubs Géographiques Cibles</span>
              </div>
              <span className="text-xs text-slate-500">
                {targetLocations.length} sélectionnée(s)
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_LOCATIONS.map((loc) => {
                const isSelected = targetLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{loc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Professions Directory: Header & Domain Tabs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Répertoire Exhaustif des Métiers par Domaine</span>
              </div>

              {/* Domain Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTabDomain('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    activeTabDomain === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous ({PROFESSIONS_BY_DOMAIN.length})
                </button>
                {PROFESSIONS_BY_DOMAIN.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveTabDomain(d.id)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition truncate max-w-[130px] ${
                      activeTabDomain === d.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={d.name}
                  >
                    {d.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Domains */}
            <div className="space-y-6">
              {filteredDomains.map((domain) => {
                const domainRolesSelected = domain.roles.filter((r) => targetRoles.includes(r)).length;
                const isAllDomainSelected = domainRolesSelected === domain.roles.length;

                return (
                  <div
                    key={domain.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    {/* Domain Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {domain.name}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {domainRolesSelected} / {domain.roles.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {domain.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleAllRolesInDomain(domain.roles)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 shrink-0 self-start sm:self-auto"
                      >
                        {isAllDomainSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    </div>

                    {/* Roles Badges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {domain.roles.map((role) => {
                        const isSelected = targetRoles.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleRole(role)}
                            className={`p-2.5 rounded-lg text-left text-xs font-medium flex items-center justify-between gap-2 transition border ${
                              isSelected
                                ? 'bg-white border-blue-500 text-slate-900 shadow-2xs ring-1 ring-blue-500'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="leading-snug">{role}</span>
                            <div
                              className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-slate-300 bg-slate-50'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
