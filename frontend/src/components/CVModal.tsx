import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Download, ExternalLink, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { CVInfo } from '../types';
import { api } from '../api/client';

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CVModal: React.FC<CVModalProps> = ({ isOpen, onClose }) => {
  const [cvList, setCvList] = useState<CVInfo[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<'trading' | 'buyside'>('trading');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCvs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const list = await api.getCVList();
      setCvList(list);
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Erreur lors du chargement des CVs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCvs();
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeCv =
    cvList.find((c) => c.variant === selectedVariant) || cvList[0] || null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMessage('Veuillez sélectionner un fichier PDF valide.');
      return;
    }
    setIsUploading(true);
    setErrorMessage(null);
    setStatusMsg(null);
    try {
      await api.uploadCV(file, selectedVariant);
      await loadCvs();
      setStatusMsg(`Variante "${selectedVariant === 'buyside' ? 'CV B · Buy-Side' : 'CV A · Trading'}" mise à jour.`);
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Remplacer votre CV PDF actuel par 2 versions ATS générées automatiquement ?')) {
      return;
    }
    setIsRegenerating(true);
    setErrorMessage(null);
    setStatusMsg(null);
    try {
      const updated = await api.regenerateCVVariants();
      setCvList(updated);
      setStatusMsg('Les 2 variantes ATS-safe (Trading & Buy-Side) ont été générées.');
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Erreur lors de la régénération');
    } finally {
      setIsRegenerating(false);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} o` : `${(bytes / 1024).toFixed(1)} Ko`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-white border border-black w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5e5] bg-[#fafafa] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
              2 VARIANTES DÉDIÉES · ROUTAGE AUTOMATIQUE PAR DESK
            </div>
            <h2 className="text-[16px] font-bold text-[#111818]">Mes 2 CVs Spécialisés</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRegenerate} disabled={isRegenerating} className="sq-btn">
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'GÉNÉRATION...' : 'GÉNÉRER 2 CVs ATS'}</span>
            </button>
            <button onClick={onClose} className="sq-btn p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {/* Variant Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedVariant('trading')}
              className={`p-3.5 border text-left cursor-pointer transition ${
                selectedVariant === 'trading'
                  ? 'bg-black text-white border-black'
                  : 'bg-[#fafafa] text-[#111818] border-[#e5e5e5] hover:border-black'
              }`}
            >
              <div className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                VARIANTE A · MARCHÉS / DESK
              </div>
              <div className="text-[13px] font-bold mt-0.5">
                Trading · Structuring · Sales FICC
              </div>
            </button>

            <button
              onClick={() => setSelectedVariant('buyside')}
              className={`p-3.5 border text-left cursor-pointer transition ${
                selectedVariant === 'buyside'
                  ? 'bg-black text-white border-black'
                  : 'bg-[#fafafa] text-[#111818] border-[#e5e5e5] hover:border-black'
              }`}
            >
              <div className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                VARIANTE B · BUY-SIDE / GESTION
              </div>
              <div className="text-[13px] font-bold mt-0.5">
                Asset Mgmt · Portfolio Mgmt · Hedge Fund
              </div>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#c8312b]/10 border border-[#c8312b]/30 text-[#c8312b] text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {statusMsg && (
            <div className="p-3 bg-[#1f5fbf]/10 border border-[#1f5fbf]/30 text-[#1f5fbf] text-[12px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-[12px] text-[#6b7280]">Chargement...</div>
          ) : activeCv ? (
            <div className="sq-card p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 border border-[#e5e5e5] bg-white flex items-center justify-center">
                    <FileText className="w-4 h-4 text-black" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#111818] truncate">{activeCv.filename}</div>
                    <div className="text-[11px] text-[#6b7280] tabular-nums">
                      {activeCv.label} · {formatSize(activeCv.file_size)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={api.getCVViewUrl(selectedVariant)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sq-btn"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    VOIR
                  </a>
                  <a
                    href={api.getCVDownloadUrl(selectedVariant)}
                    download={activeCv.filename}
                    className="sq-btn sq-btn-primary"
                  >
                    <Download className="w-3.5 h-3.5" />
                    TÉLÉCHARGER
                  </a>
                </div>
              </div>

              <div className="border border-[#e5e5e5] h-[300px] bg-white">
                <iframe
                  key={`${selectedVariant}-${activeCv.id}`}
                  src={`${api.getCVViewUrl(selectedVariant)}#toolbar=0`}
                  title="Aperçu CV"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5]">
            <span className="text-[11px] text-[#6b7280]">
              Remplacer la variante sélectionnée ({selectedVariant === 'buyside' ? 'CV B' : 'CV A'}) :
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="sq-btn"
            >
              <Upload className="w-3.5 h-3.5" />
              {isUploading ? 'ENVOI...' : 'UPLOAD PDF PERSONNALISÉ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
