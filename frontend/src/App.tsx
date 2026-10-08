import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ApplicationTracker } from './components/ApplicationTracker';
import { JobScraperView } from './components/JobScraperView';
import { KnnRecommenderView } from './components/KnnRecommenderView';
import { AnalyticsView } from './components/AnalyticsView';
import { ApplicationModal } from './components/ApplicationModal';
import { PreferencesModal } from './components/PreferencesModal';
import { ApplyActionModal } from './components/ApplyActionModal';
import type {
  Application,
  JobOffer,
  UserProfile,
  RecommendationResponse,
  AnalyticsData,
  ApplicationStatus,
} from './types';
import { api } from './api/client';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('tracker');
  const [applications, setApplications] = useState<Application[]>([]);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Loading states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isKnnLoading, setIsKnnLoading] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyTargetOffer, setApplyTargetOffer] = useState<JobOffer | null>(null);
  const [applyTargetApplication, setApplyTargetApplication] = useState<Application | null>(null);

  // Fetch applications
  const loadApplications = useCallback(async () => {
    try {
      const data = await api.getApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  }, []);

  // Fetch job offers
  const loadOffers = useCallback(async () => {
    try {
      const data = await api.getOffers({ only_verified: true });
      setOffers(data);
    } catch (err) {
      console.error('Failed to load offers:', err);
    }
  }, []);

  // Fetch user profile
  const loadProfile = useCallback(async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  // Fetch KNN recommendations
  const loadRecommendations = useCallback(async () => {
    setIsKnnLoading(true);
    try {
      const data = await api.getKnnRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to load KNN recommendations:', err);
    } finally {
      setIsKnnLoading(false);
    }
  }, []);

  // Fetch Analytics
  const loadAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  // Master refresh
  const handleMasterRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadApplications(),
        loadOffers(),
        loadProfile(),
        loadRecommendations(),
        loadAnalytics(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadApplications, loadOffers, loadProfile, loadRecommendations, loadAnalytics]);

  useEffect(() => {
    handleMasterRefresh();
  }, [handleMasterRefresh]);

  // Real-time synchronization
  const handleSyncRealOffers = async () => {
    setIsSyncing(true);
    setSyncBanner(null);
    try {
      const res = await api.syncRealOffers();
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      setSyncBanner(`${res.verified_valid} offres de stages réelles synchronisées avec liens vérifiés (HTTP 200).`);
      await Promise.all([loadOffers(), loadRecommendations(), loadAnalytics()]);
      setTimeout(() => setSyncBanner(null), 6000);
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Erreur lors de la synchronisation : vérifiez votre connexion réseau.');
    } finally {
      setIsSyncing(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank');
  };

  // Application Handlers
  const handleUpdateStatus = async (id: number, newStatus: ApplicationStatus) => {
    try {
      const updated = await api.updateApplicationStatus(id, newStatus);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      loadAnalytics();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveApplication = async (data: Partial<Application>) => {
    try {
      if (editingApplication) {
        const updated = await api.updateApplication(editingApplication.id, data);
        setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await api.createApplication(data);
        setApplications((prev) => [created, ...prev]);
      }
      loadOffers();
      loadAnalytics();
    } catch (err) {
      console.error('Failed to save application:', err);
    }
  };

  const handleDeleteApplication = async (id: number) => {
    if (!window.confirm('Supprimer cette candidature de votre suivi ?')) return;
    try {
      await api.deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      loadOffers();
      loadAnalytics();
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const handleEditApplication = (app: Application) => {
    setEditingApplication(app);
    setIsAppModalOpen(true);
  };

  const handleNewApplication = () => {
    setEditingApplication(null);
    setIsAppModalOpen(true);
  };

  // Scraper Handlers
  const handleScrapeSearch = async (keywords: string, location: string) => {
    setIsScraping(true);
    try {
      await api.scrapeSearch(keywords, location);
      await loadOffers();
      await loadRecommendations();
    } catch (err) {
      console.error('Scraping error:', err);
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapeUrl = async (url: string) => {
    try {
      await api.scrapeUrl(url);
      await loadOffers();
      await loadRecommendations();
    } catch (err) {
      alert("Erreur lors de l'extraction de l'URL : lien inaccessible ou format non reconnu.");
    }
  };

  const handleToggleFavorite = async (offerId: number) => {
    try {
      const res = await api.toggleFavorite(offerId);
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, is_favorite: res.is_favorite } : o))
      );
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  const handleAddOfferToTracker = async (offer: JobOffer) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const followUp = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const created = await api.createApplication({
        offer_id: offer.id,
        company: offer.company,
        job_title: offer.title,
        desk: offer.desk,
        location: offer.location,
        status: 'applied',
        applied_date: today,
        follow_up_date: followUp,
        salary_monthly: offer.salary_monthly,
        application_url: offer.url,
        notes: `Offre réelle vérifiée. Desk : ${offer.desk}.`,
      });
      setApplications((prev) => [created, ...prev]);
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, is_applied: true } : o)));
      loadAnalytics();
      setCurrentTab('tracker');
    } catch (err) {
      console.error('Failed to add offer to tracker:', err);
    }
  };

  // Direct Apply Action Modal Triggers
  const handleDirectApplyFromOffer = (offer: JobOffer) => {
    setApplyTargetOffer(offer);
    setApplyTargetApplication(null);
    setIsApplyModalOpen(true);
  };

  const handleDirectApplyFromApplication = (app: Application) => {
    setApplyTargetApplication(app);
    setApplyTargetOffer(null);
    setIsApplyModalOpen(true);
  };

  // Preferences save
  const handleSavePreferences = async (updated: Partial<UserProfile>) => {
    try {
      const saved = await api.updateProfile(updated);
      setProfile(saved);
      loadRecommendations();
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const followUpAlertCount = applications.filter(
    (a) =>
      a.status === 'follow_up_needed' ||
      (a.follow_up_date && new Date(a.follow_up_date) <= new Date())
  ).length;

  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'tracker':
        return {
          title: 'Tableau de Suivi des Candidatures',
          subtitle:
            'Gérez votre pipeline de stages en finance de marché avec statuts temps réel et relances.',
        };
      case 'scraper':
        return {
          title: 'Scraper de Marché & Google Search',
          subtitle:
            'Offres réelles vérifiées en direct (HTTP 200) sans aucun lien mort ou hardcodé.',
        };
      case 'knn':
        return {
          title: 'Conseiller KNN & Découverte Latente',
          subtitle:
            'Algorithme de plus proche voisin recommandant cibles directes et pépites de desks adjacents.',
        };
      case 'analytics':
        return {
          title: 'Statistiques & Performance du Pipeline',
          subtitle:
            'Mesurez vos taux de conversion, relances critiques et répartition par spécialisation.',
        };
      default:
        return {
          title: 'AlphaTracker',
          subtitle: 'Stages Finance de Marché',
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* Institutional Navy Blue Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        applicationsCount={applications.length}
        profile={profile}
        onOpenPreferences={() => setIsPrefModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-white">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onNewApplication={handleNewApplication}
          onOpenPreferences={() => setIsPrefModalOpen(true)}
          onRefresh={handleMasterRefresh}
          isRefreshing={isRefreshing}
          onSyncRealOffers={handleSyncRealOffers}
          isSyncing={isSyncing}
          onExportCsv={handleExportCsv}
          followUpAlertCount={followUpAlertCount}
          lastSyncTime={lastSyncTime}
        />

        {/* Real-time Sync Toast Notification */}
        {syncBanner && (
          <div className="bg-emerald-600 text-white px-6 py-2 text-xs font-semibold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300">
            <span>{syncBanner}</span>
            <button
              onClick={() => setSyncBanner(null)}
              className="text-white hover:text-emerald-100 text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Dynamic Body Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/70">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'tracker' && (
              <ApplicationTracker
                applications={applications}
                onUpdateStatus={handleUpdateStatus}
                onEditApplication={handleEditApplication}
                onDeleteApplication={handleDeleteApplication}
                onDirectApply={handleDirectApplyFromApplication}
                onNewApplication={handleNewApplication}
                onExportCsv={handleExportCsv}
              />
            )}

            {currentTab === 'scraper' && (
              <JobScraperView
                offers={offers}
                onScrapeSearch={handleScrapeSearch}
                onScrapeUrl={handleScrapeUrl}
                onSyncRealOffers={handleSyncRealOffers}
                onAddToTracker={handleAddOfferToTracker}
                onDirectApply={handleDirectApplyFromOffer}
                onToggleFavorite={handleToggleFavorite}
                isScraping={isScraping}
                isSyncing={isSyncing}
              />
            )}

            {currentTab === 'knn' && (
              <KnnRecommenderView
                recommendations={recommendations}
                isLoading={isKnnLoading}
                onOpenPreferences={() => setIsPrefModalOpen(true)}
                onAddToTracker={handleAddOfferToTracker}
                onDirectApply={handleDirectApplyFromOffer}
                onRefreshKnn={loadRecommendations}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView analytics={analytics} isLoading={isAnalyticsLoading} />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        onSave={handleSaveApplication}
        initialData={editingApplication}
      />

      <PreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        profile={profile}
        onSave={handleSavePreferences}
      />

      <ApplyActionModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        targetOffer={applyTargetOffer}
        targetApplication={applyTargetApplication}
        onApplicationCreatedOrUpdated={handleMasterRefresh}
      />
    </div>
  );
}
export default App;
