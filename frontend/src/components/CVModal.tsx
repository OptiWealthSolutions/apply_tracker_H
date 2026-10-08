import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Upload,
  CheckCircle2,
  HardDrive,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { CVInfo } from '../types';
import { api } from '../api/client';

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CVModal: React.FC<CVModalProps> = ({ isOpen, onClose }) => {
  const [cvInfo, setCvInfo] = useState<CVInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCvInfo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getCVInfo();
      setCvInfo(data);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Erreur lors du chargement des informations du CV');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCvInfo();
      setUploadSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMessage('Veuillez sélectionner un fichier PDF valide.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadSuccess(false);

    try {
      const updated = await api.uploadCV(file);
      setCvInfo(updated);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (e: any) {
      setErrorMessage(e?.message || "Erreur lors de l'upload du fichier");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                CV Candidat Hébergé en Base de Données
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  SQLite Live
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Léo Lombardini — Track Financial Markets (EDHEC) / Mathématiques & Économie (ENS D2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Metadata Card */}
          <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200 rounded-xl p-4.5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>{isLoading ? 'Chargement...' : cvInfo ? cvInfo.filename : 'CV_Leo_Lombardini.pdf'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-slate-600 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-800">Taille :</span>
                    {cvInfo ? formatFileSize(cvInfo.file_size) : '392.5 Ko'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">Statut :</span>
                    Actif en base locale
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Lien direct actif pour vos candidatures
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5">
                <a
                  href={api.getCVViewUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ouvrir en plein écran</span>
                </a>
                <a
                  href={api.getCVDownloadUrl()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger PDF</span>
                </a>
              </div>
            </div>

            {/* Email Auto-link information */}
            <div className="mt-4 pt-3 border-t border-blue-200/60 text-[11px] text-blue-800 flex items-center justify-between">
              <span>
                Ce CV est directement servi par le backend local et inclus dans le corps de vos e-mails de pitch (mailto) générés pour chaque offre.
              </span>
              <span className="font-mono text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                http://127.0.0.1:8000/api/cv/view
              </span>
            </div>
          </div>

          {/* Upload New Version */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-800 text-xs">Mettre à jour le fichier PDF</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Importez une nouvelle version de votre CV pour actualiser automatiquement les liens de pitch et la base locale.
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Upload en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Remplacer le CV</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nouveau CV sauvegardé avec succès dans la base de données SQLite !</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live In-Modal PDF Viewer */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-700 text-xs flex items-center justify-between">
              <span>Aperçu en direct du document :</span>
              <span className="text-slate-400 text-[11px]">Rendu natif PDF</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-inner h-[440px]">
              <iframe
                src={`${api.getCVViewUrl()}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Aperçu CV Léo Lombardini"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Hébergement binaire Blob SQLite — AlphaTracker Local
          </span>
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
