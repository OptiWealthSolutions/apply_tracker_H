import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DailyDigestView } from './components/DailyDigestView';
import { OffersView } from './components/OffersView';
import { SuggestionsView } from './components/SuggestionsView';
import { ApplicationTracker } from './components/ApplicationTracker';
import { PrepAndCvView } from './components/PrepAndCvView';
import { ProfileAndAnalyticsView } from './components/ProfileAndAnalyticsView';
import { ApplicationModal } from './components/ApplicationModal';
import { ApplyActionModal } from './components/ApplyActionModal';
import { CVModal } from './components/CVModal';
import { OfferPrepModal } from './components/OfferPrepModal';
import type {
  Application,
  JobOffer,
  UserProfile,
  AnalyticsData,
  ApplicationStatus,
  DigestResponse,
  SuggestedBoutique,
} from './types';
import { api } from './api/client';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('digest');
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [windowDays, setWindowDays] = useState<number>(7);
  const [startFilter, setStartFilter] = useState<string>('all');
  const [excludePureQuant, setExcludePureQuant] = useState<boolean>(true);
  const [digestPlatformFilter, setDigestPlatformFilter] = useState<string>('all');
  const [digestNoLoginOnly, setDigestNoLoginOnly] = useState<boolean>(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [atsHealth, setAtsHealth] = useState<{ total_boards: number; quarantined_boards: string[] } | null>(null);

  // Loading states
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyTargetOffer, setApplyTargetOffer] = useState<JobOffer | null>(null);
  const [applyTargetApplication, setApplyTargetApplication] = useState<Application | null>(null);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [isOfferPrepOpen, setIsOfferPrepOpen] = useState(false);
  const [prepTargetOffer, setPrepTargetOffer] = useState<JobOffer | null>(null);

  const loadDigest = useCallback(
    async (
      days: number = windowDays,
      sFilter: string = startFilter,
      exclQuant: boolean = excludePureQuant,
      platFilter: string = digestPlatformFilter,
      noLogin: boolean = digestNoLoginOnly
    ) => {
      setIsDigestLoading(true);
      setDigestError(null);
      try {
        const data = await api.getDailyDigest(days, sFilter, exclQuant, platFilter, noLogin);
        setDigest(data);
        if (data.generated_at) {
          setLastSyncTime((prev) => prev || data.generated_at);
        }
      } catch (err) {
        console.error('Failed to load digest:', err);
        setDigestError('Connexion au serveur AlphaTracker (port 8002) impossible. Vérifiez que le backend tourne.');
      } finally {
        setIsDigestLoading(false);
      }
    },
    [windowDays, startFilter, excludePureQuant, digestPlatformFilter, digestNoLoginOnly]
  );

  const loadApplications = useCallback(async () => {
    try {
      const data = await api.getApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const data = await api.getOffers({ only_verified: true });
      setOffers(data);
    } catch (err) {
      console.error('Failed to load offers:', err);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const [data, health] = await Promise.all([
        api.getAnalytics(),
        api.getAtsHealth().catch(() => null),
      ]);
      setAnalytics(data);
      if (health) setAtsHealth(health);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  const handleMasterRefresh = useCallback(async () => {
    await Promise.all([
      loadDigest(windowDays),
      loadApplications(),
      loadOffers(),
      loadProfile(),
      loadAnalytics(),
    ]);
  }, [loadDigest, windowDays, loadApplications, loadOffers, loadProfile, loadAnalytics]);

  useEffect(() => {
    handleMasterRefresh();
  }, [handleMasterRefresh]);

  const handleChangeWindowDays = (days: number) => {
    setWindowDays(days);
    loadDigest(days, startFilter, excludePureQuant, digestPlatformFilter, digestNoLoginOnly);
  };

  const handleChangeStartFilter = (newFilter: string) => {
    setStartFilter(newFilter);
    loadDigest(windowDays, newFilter, excludePureQuant, digestPlatformFilter, digestNoLoginOnly);
  };

  const handleToggleExcludePureQuant = (val: boolean) => {
    setExcludePureQuant(val);
    loadDigest(windowDays, startFilter, val, digestPlatformFilter, digestNoLoginOnly);
  };

  const handleChangeDigestPlatform = (plat: string) => {
    setDigestPlatformFilter(plat);
    loadDigest(windowDays, startFilter, excludePureQuant, plat, digestNoLoginOnly);
  };

  const handleToggleDigestNoLogin = (val: boolean) => {
    setDigestNoLoginOnly(val);
    loadDigest(windowDays, startFilter, excludePureQuant, digestPlatformFilter, val);
  };

  const handleUpdateTargetStartPeriod = async (period: string) => {
    try {
      const saved = await api.updateProfile({ target_start_period: period });
      setProfile(saved);
      await api.recalibrateEmbeddings();
      await Promise.all([loadDigest(windowDays, startFilter, excludePureQuant), loadOffers()]);
      setSyncBanner(`Début cible mis à jour (${period}) et moteur Qwen3 + Ridge recalibré.`);
      setTimeout(() => setSyncBanner(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecalibrate = async () => {
    setIsRecalibrating(true);
    try {
      const res = await api.recalibrateEmbeddings();
      await Promise.all([loadDigest(windowDays), loadOffers()]);
      setSyncBanner(
        `Qwen3 + Ridge recalibré sur ${res.evaluated} offres actives (${res.ridge_samples} signaux personnels).`
      );
      setTimeout(() => setSyncBanner(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRecalibrating(false);
    }
  };

  const handleSyncRealOffers = async () => {
    setIsSyncing(true);
    setSyncBanner(null);
    try {
      const res = await api.syncRealOffers();
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      setSyncBanner(`${res.verified_valid} offres actives synchronisées (${res.new_added} nouvelles) et scorées par Qwen3 + Ridge.`);
      await Promise.all([loadDigest(windowDays), loadOffers(), loadAnalytics()]);
      setTimeout(() => setSyncBanner(null), 6000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerifyLinks = async () => {
    try {
      const res = await api.verifyAllLinks();
      await Promise.all([loadDigest(windowDays), loadOffers()]);
      setSyncBanner(
        `Vérification terminée : ${res.valid_links}/${res.total_checked} liens OK (${res.dead_links} morts purgés${res.protected_skipped ? `, ${res.protected_skipped} protégés anti-bot conservés` : ''}).`
      );
      setTimeout(() => setSyncBanner(null), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank');
  };

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
      loadDigest(windowDays);
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

  const handleScrapeSearch = async (keywords: string, location: string) => {
    setIsScraping(true);
    try {
      await api.scrapeSearch(keywords, location);
      await Promise.all([loadOffers(), loadDigest(windowDays)]);
    } catch (err) {
      console.error('Scraping error:', err);
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapeUrl = async (url: string) => {
    try {
      await api.scrapeUrl(url);
      await Promise.all([loadOffers(), loadDigest(windowDays)]);
      setSyncBanner('Offre vérifiée et importée.');
      setTimeout(() => setSyncBanner(null), 4000);
    } catch {
      alert("Lien inaccessible ou offre expirée.");
    }
  };

  const handleToggleFavorite = async (offerId: number) => {
    try {
      const res = await api.toggleFavorite(offerId);
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, is_favorite: res.is_favorite } : o))
      );
      loadDigest(windowDays);
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  const handleDismissOffer = async (offerId: number) => {
    try {
      await api.dismissOffer(offerId);
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      loadDigest(windowDays);
    } catch (err) {
      console.error('Dismiss offer error:', err);
    }
  };

  const handleUndoDismiss = async (offerId: number) => {
    try {
      await api.restoreOffer(offerId);
      await Promise.all([loadOffers(), loadDigest(windowDays)]);
    } catch (err) {
      console.error('Restore offer error:', err);
    }
  };

  const createAppFromOffer = async (offer: JobOffer, status: ApplicationStatus) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const followUp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const created = await api.createApplication({
        offer_id: offer.id,
        company: offer.company,
        job_title: offer.title,
        desk: offer.desk,
        location: offer.location,
        status,
        applied_date: status === 'applied' ? today : undefined,
        follow_up_date: status === 'applied' ? followUp : undefined,
        salary_monthly: offer.salary_monthly,
        application_url: offer.url,
        notes: `${offer.desk} (${(offer.ats_platform || 'direct').toUpperCase()})`,
      });
      setApplications((prev) => [created, ...prev]);
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, is_applied: true } : o)));
      loadDigest(windowDays);
      loadAnalytics();
      setSyncBanner(`${offer.company} — ${offer.title} enregistré (${status === 'applied' ? 'Postulé' : 'À postuler'}).`);
      setTimeout(() => setSyncBanner(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickTrackBoutique = async (b: SuggestedBoutique) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const followUp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const created = await api.createApplication({
        company: b.name,
        job_title: b.target_role,
        desk: b.category,
        location: b.location,
        status: 'applied',
        applied_date: today,
        follow_up_date: followUp,
        contact_email: b.spontaneous_email || undefined,
        application_url: b.careers_url || b.website_url,
        notes: `Candidature spontanée (${b.category}). ${b.leo_fit_angle}`,
      });
      setApplications((prev) => [created, ...prev]);
      loadAnalytics();
      setSyncBanner(`${b.name} ajouté au Tracker (candidature spontanée enregistrée).`);
      setTimeout(() => setSyncBanner(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

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

  const followUpAlertCount = applications.filter(
    (a) =>
      a.status === 'follow_up_needed' ||
      (a.follow_up_date && a.status === 'applied' && new Date(a.follow_up_date) <= new Date())
  ).length;

  return (
    <div className="min-h-screen bg-white text-[#111818] flex flex-col">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        applicationsCount={applications.length}
        followUpAlertCount={followUpAlertCount}
        onSyncRealOffers={handleSyncRealOffers}
        isSyncing={isSyncing}
        onNewApplication={() => {
          setEditingApplication(null);
          setIsAppModalOpen(true);
        }}
        onOpenCVModal={() => setIsCVModalOpen(true)}
        lastSyncTime={lastSyncTime}
        targetStartPeriod={profile?.target_start_period || 'Juin 2027'}
      />

      {syncBanner && (
        <div className="bg-black text-white px-6 py-2 text-[11px] font-semibold tracking-wide flex items-center justify-between border-b border-black">
          <span>{syncBanner}</span>
          <button
            onClick={() => setSyncBanner(null)}
            className="text-white hover:underline text-[10px] uppercase cursor-pointer"
          >
            FERMER
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-5 md:px-10 pb-12 pt-4">
        {currentTab === 'digest' && (
          <DailyDigestView
            digest={digest}
            isLoading={isDigestLoading}
            errorMessage={digestError}
            windowDays={windowDays}
            startFilter={startFilter}
            excludePureQuant={excludePureQuant}
            platformFilter={digestPlatformFilter}
            noLoginOnly={digestNoLoginOnly}
            targetStartPeriod={profile?.target_start_period || 'Juin 2027'}
            onChangeWindowDays={handleChangeWindowDays}
            onChangeStartFilter={handleChangeStartFilter}
            onToggleExcludePureQuant={handleToggleExcludePureQuant}
            onChangePlatformFilter={handleChangeDigestPlatform}
            onToggleNoLoginOnly={handleToggleDigestNoLogin}
            onUpdateTargetStartPeriod={handleUpdateTargetStartPeriod}
            onRecalibrate={handleRecalibrate}
            isRecalibrating={isRecalibrating}
            onDirectApply={handleDirectApplyFromOffer}
            onQuickApplied={(offer) => createAppFromOffer(offer, 'applied')}
            onSaveToTracker={(offer) => createAppFromOffer(offer, 'saved')}
            onDismissOffer={handleDismissOffer}
            onUndoDismiss={handleUndoDismiss}
            onToggleFavorite={handleToggleFavorite}
            onOpenOffersTab={() => setCurrentTab('offers')}
            onOpenTrackerTab={() => setCurrentTab('tracker')}
          />
        )}

        {currentTab === 'offers' && (
          <OffersView
            offers={offers}
            onScrapeSearch={handleScrapeSearch}
            onScrapeUrl={handleScrapeUrl}
            onSyncRealOffers={handleSyncRealOffers}
            onAddToTracker={(offer) => createAppFromOffer(offer, 'applied')}
            onDirectApply={handleDirectApplyFromOffer}
            onToggleFavorite={handleToggleFavorite}
            onDismissOffer={handleDismissOffer}
            onVerifyLinks={handleVerifyLinks}
            onOfferImported={(newOffer) => {
              setOffers((prev) =>
                prev.some((o) => o.id === newOffer.id || o.url === newOffer.url)
                  ? prev
                  : [newOffer, ...prev]
              );
              loadDigest(windowDays);
            }}
            onOpenOfferPrep={(offer) => {
              setPrepTargetOffer(offer);
              setIsOfferPrepOpen(true);
            }}
            isScraping={isScraping}
            isSyncing={isSyncing}
          />
        )}

        {currentTab === 'suggestions' && (
          <SuggestionsView
            applicationsCount={applications.length}
            onColdApply={handleDirectApplyFromOffer}
            onQuickTrackBoutique={handleQuickTrackBoutique}
          />
        )}

        {currentTab === 'tracker' && (
          <ApplicationTracker
            applications={applications}
            onUpdateStatus={handleUpdateStatus}
            onEditApplication={(app) => {
              setEditingApplication(app);
              setIsAppModalOpen(true);
            }}
            onDeleteApplication={handleDeleteApplication}
            onDirectApply={handleDirectApplyFromApplication}
            onNewApplication={() => {
              setEditingApplication(null);
              setIsAppModalOpen(true);
            }}
            onExportCsv={handleExportCsv}
            onOpenOfferPrep={(offer) => {
              setPrepTargetOffer(offer);
              setIsOfferPrepOpen(true);
            }}
          />
        )}

        {currentTab === 'prep' && <PrepAndCvView />}

        {currentTab === 'profile' && (
          <ProfileAndAnalyticsView
            profile={profile}
            analytics={analytics}
            offersCount={offers.length}
            atsHealth={atsHealth}
            isAnalyticsLoading={isAnalyticsLoading}
            onProfileUpdated={(updated) => {
              setProfile(updated);
              handleRecalibrate();
            }}
            onRecalibrate={handleRecalibrate}
            isRecalibrating={isRecalibrating}
          />
        )}
      </main>

      {/* MODALS */}
      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        onSave={handleSaveApplication}
        initialData={editingApplication}
      />

      <ApplyActionModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        targetOffer={applyTargetOffer}
        targetApplication={applyTargetApplication}
        onApplicationCreatedOrUpdated={handleMasterRefresh}
      />

      <CVModal
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
      />

      <OfferPrepModal
        isOpen={isOfferPrepOpen}
        onClose={() => setIsOfferPrepOpen(false)}
        offer={prepTargetOffer}
        onOpenPitchModal={handleDirectApplyFromOffer}
      />
    </div>
  );
}

export default App;
