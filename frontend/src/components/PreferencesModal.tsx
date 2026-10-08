import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, User, GraduationCap, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

const AVAILABLE_ROLES = [
  'Assistant Trader',
  'Quant Research',
  'Quantitative Trading',
  'Structuring Produits Structurés',
  'Quantitative Market Making',
  'Asset Management (Gérance Quant / Buy-Side)',
  'Hedge Fund Analyst / Quant Researcher',
  'FinTech Quantitative Engineer / Algo Dev',
  'Macro Trading & Systematic Research',
  'Sales FICC / Institutional',
  'Risk Management de Marché',
  'Commodities & Energy Trading',
  'Gestion Quantitative Multi-Asset',
];

const AVAILABLE_ASSET_CLASSES = [
  'Equity Derivatives & Convexity',
  'Rates & FX Desk',
  'Hedge Fund Systematic Strategies',
  'Asset Management Quantitatif',
  'FinTech & Execution Algorithmique',
  'Cross-Asset Fair Value',
  'Volatility Arbitrage & Dispersion',
  'Credit & Private Debt',
  'Commodities & Energy',
];

const AVAILABLE_LOCATIONS = [
  'Paris',
  'Marseille',
  'Luxembourg',
  'Londres',
  'New York',
  'Milan',
  'Genève',
  'Francfort',
];

const AVAILABLE_SKILLS = [
  'Python',
  'MQL5 (MT5)',
  'Calcul Stochastique & Pricing',
  'Machine Learning Finance',
  'Greeks & High Convexity Payoffs',
  'Macro Scoring & Fair Value',
  'C++',
  'SQL',
  'Bloomberg',
  'Excel Avancé',
];

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetAssetClasses, setTargetAssetClasses] = useState<string[]>([]);
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [targetDuration, setTargetDuration] = useState('6 mois');
  const [targetStartPeriod, setTargetStartPeriod] = useState('Janvier - Avril 2027');
  const [minSalary, setMinSalary] = useState(2400);
  const [serendipityWeight, setSerendipityWeight] = useState(0.35);
  const [bioSummary, setBioSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setSchool(profile.school || '');
      setDegreeLevel(profile.degree_level || '');
      setTargetRoles(profile.target_roles || []);
      setTargetAssetClasses(profile.target_asset_classes || []);
      setTargetLocations(profile.target_locations || []);
      setTechnicalSkills(profile.technical_skills || []);
      setTargetDuration(profile.target_duration || '6 mois');
      setTargetStartPeriod(profile.target_start_period || 'Janvier - Avril 2027');
      setMinSalary(profile.min_salary || 2400);
      setSerendipityWeight(profile.serendipity_exploration_weight || 0.35);
      setBioSummary(profile.bio_summary || '');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        full_name: fullName,
        email,
        phone,
        school,
        degree_level: degreeLevel,
        target_roles: targetRoles,
        target_asset_classes: targetAssetClasses,
        target_locations: targetLocations,
        technical_skills: technicalSkills,
        target_duration: targetDuration,
        target_start_period: targetStartPeriod,
        min_salary: minSalary,
        serendipity_exploration_weight: serendipityWeight,
        bio_summary: bioSummary,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Formulaire de Préférences & Paramètres KNN
            </h2>
            <p className="text-xs text-slate-500">
              Ces critères alimentent le vecteur de recommandation et l'algorithme des plus proches voisins.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Identity & School */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom & Prénom</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">École / Université & Master</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email de contact</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Niveau d'études</label>
              <select
                value={degreeLevel}
                onChange={(e) => setDegreeLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              >
                <option value="Master 2 / Fin d'études (PFE)">Master 2 / Fin d'études (PFE)</option>
                <option value="Année de Césure (M1 / M2)">Année de Césure (M1 / M2)</option>
                <option value="Master 1">Master 1</option>
                <option value="Doctorat / PhD Quant">Doctorat / PhD Quant</option>
              </select>
            </div>
          </div>

          {/* Target Roles */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Rôles Cibles en Finance de Marché
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ROLES.map((role) => {
                const isSelected = targetRoles.includes(role);
                return (
                  <button
                    type="button"
                    key={role}
                    onClick={() => toggleItem(targetRoles, setTargetRoles, role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asset Classes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Classes d'Actifs</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ASSET_CLASSES.map((asset) => {
                const isSelected = targetAssetClasses.includes(asset);
                return (
                  <button
                    type="button"
                    key={asset}
                    onClick={() => toggleItem(targetAssetClasses, setTargetAssetClasses, asset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{asset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Localisations Cibles</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LOCATIONS.map((loc) => {
                const isSelected = targetLocations.includes(loc);
                return (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => toggleItem(targetLocations, setTargetLocations, loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{loc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Compétences Techniques & Outils (utilisés par la vectorisation KNN)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SKILLS.map((skill) => {
                const isSelected = technicalSkills.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleItem(technicalSkills, setTechnicalSkills, skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Serendipity Explorer Slider */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Facteur de Découverte / Pépites Voisines (Serendipity)
              </label>
              <span className="font-mono font-bold text-blue-700 text-xs">
                {Math.round(serendipityWeight * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Règle l'ouverture de l'algorithme vers des desks adjacents (ex: Structuring Exotique, Market Risk, Trading Haute Fréquence) qui partagent vos compétences mais que vous n'auriez pas directement ciblés.
            </p>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={serendipityWeight}
              onChange={(e) => setSerendipityWeight(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Bio / CV Summary */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Résumé du profil / Motivations techniques (utilisé pour le calcul cosinus)
            </label>
            <textarea
              rows={3}
              value={bioSummary}
              onChange={(e) => setBioSummary(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            ></textarea>
          </div>

          {/* Actions */}
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
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer et Recalculer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
