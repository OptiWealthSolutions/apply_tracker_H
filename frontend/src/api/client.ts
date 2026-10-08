import type {
  JobOffer,
  Application,
  UserProfile,
  RecommendationResponse,
  ApplyPitchResponse,
  AnalyticsData,
  ApplicationStatus,
  SyncResponse,
  BankDirectoryItem,
  LiveBankSearchRequest,
  LiveBankSearchResultItem,
  CVInfo,
  DeskInterviewPrepResponse,
  ATSFitBreakdown,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Real Live Synchronization & Link Verification Engine
  async syncRealOffers(): Promise<SyncResponse> {
    const res = await fetch(`${API_BASE}/sync`, { method: 'POST' });
    if (!res.ok) throw new Error('Erreur lors de la synchronisation des offres');
    return res.json();
  },

  async verifyAllLinks(): Promise<{ status: string; total_checked: number; valid_links: number; dead_links: number }> {
    const res = await fetch(`${API_BASE}/offers/verify-links`, { method: 'POST' });
    if (!res.ok) throw new Error('Erreur lors de la vérification des liens');
    return res.json();
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/export/csv`;
  },

  // Job Offers
  async getOffers(params?: {
    query?: string;
    desk?: string;
    location?: string;
    company?: string;
    start_period?: string;
    duration?: string;
    only_favorites?: boolean;
    only_verified?: boolean;
  }): Promise<JobOffer[]> {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.desk && params.desk !== 'Tous') queryParams.append('desk', params.desk);
    if (params?.location && params.location !== 'Toutes') queryParams.append('location', params.location);
    if (params?.company && params.company !== 'Toutes') queryParams.append('company', params.company);
    if (params?.start_period && params.start_period !== 'Toutes') queryParams.append('start_period', params.start_period);
    if (params?.duration && params.duration !== 'Toutes') queryParams.append('duration', params.duration);
    if (params?.only_favorites) queryParams.append('only_favorites', 'true');
    if (params?.only_verified !== undefined) queryParams.append('only_verified', params.only_verified ? 'true' : 'false');

    const res = await fetch(`${API_BASE}/offers?${queryParams.toString()}`);
    if (!res.ok) throw new Error('Erreur lors du chargement des offres');
    return res.json();
  },

  async toggleFavorite(offerId: number): Promise<{ id: number; is_favorite: boolean }> {
    const res = await fetch(`${API_BASE}/offers/${offerId}/toggle-favorite`, { method: 'POST' });
    if (!res.ok) throw new Error('Erreur lors de la mise en favori');
    return res.json();
  },

  async deleteOffer(offerId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/offers/${offerId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Erreur lors de la suppression de l'offre");
  },

  // Applications
  async getApplications(statusFilter?: string): Promise<Application[]> {
    const url = statusFilter && statusFilter !== 'all'
      ? `${API_BASE}/applications?status_filter=${encodeURIComponent(statusFilter)}`
      : `${API_BASE}/applications`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur lors du chargement des candidatures');
    return res.json();
  },

  async createApplication(data: Partial<Application>): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la création de la candidature');
    return res.json();
  },

  async updateApplication(id: number, data: Partial<Application>): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour de la candidature');
    return res.json();
  },

  async updateApplicationStatus(id: number, status: ApplicationStatus): Promise<Application> {
    return this.updateApplication(id, { status });
  },

  async deleteApplication(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur lors de la suppression de la candidature');
  },

  // Scraper
  async scrapeSearch(keywords: string, location: string = 'Paris', limit: number = 15): Promise<JobOffer[]> {
    const res = await fetch(`${API_BASE}/scrape/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location, limit, scrape_google: true }),
    });
    if (!res.ok) throw new Error('Erreur lors du scraping des offres');
    return res.json();
  },

  async scrapeUrl(url: string): Promise<JobOffer> {
    const res = await fetch(`${API_BASE}/scrape/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error("Erreur lors de l'extraction de l'URL");
    return res.json();
  },

  // KNN Recommendations
  async getKnnRecommendations(): Promise<RecommendationResponse> {
    const res = await fetch(`${API_BASE}/recommendations/knn`);
    if (!res.ok) throw new Error('Erreur lors du calcul des recommandations KNN');
    return res.json();
  },

  // User Profile
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile`);
    if (!res.ok) throw new Error('Erreur lors de la récupération du profil');
    return res.json();
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour des préférences');
    return res.json();
  },

  // Pitch & Direct Apply Generator
  async generatePitch(data: { offer_id?: number; job_title: string; company: string; desk: string }): Promise<ApplyPitchResponse> {
    const res = await fetch(`${API_BASE}/pitch/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la génération du pitch');
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des analytics');
    return res.json();
  },

  // Bank Career Portals & Live Queries
  async getBankDirectory(): Promise<BankDirectoryItem[]> {
    const res = await fetch(`${API_BASE}/banks/directory`);
    if (!res.ok) throw new Error('Erreur lors de la récupération du répertoire bancaire');
    return res.json();
  },

  async liveBankSearch(req: LiveBankSearchRequest): Promise<LiveBankSearchResultItem[]> {
    const res = await fetch(`${API_BASE}/banks/live-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Erreur lors de la recherche en direct sur les portails bancaires');
    return res.json();
  },

  async importBankOffer(offer: LiveBankSearchResultItem): Promise<JobOffer> {
    const res = await fetch(`${API_BASE}/banks/import-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer),
    });
    if (!res.ok) throw new Error("Erreur lors de l'import de l'offre bancaire");
    return res.json();
  },

  // CV Storage & Streaming
  async getCVInfo(): Promise<CVInfo> {
    const res = await fetch(`${API_BASE}/cv/info`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des informations du CV');
    return res.json();
  },

  getCVViewUrl(): string {
    return `${API_BASE}/cv/view`;
  },

  getCVDownloadUrl(): string {
    return `${API_BASE}/cv/download`;
  },

  async uploadCV(file: File): Promise<CVInfo> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/cv/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error("Erreur lors de l'upload du CV");
    return res.json();
  },

  // Technical Interview Prep Guide
  async getInterviewPrep(desk?: string): Promise<DeskInterviewPrepResponse> {
    const url = desk ? `${API_BASE}/interview-prep?desk=${encodeURIComponent(desk)}` : `${API_BASE}/interview-prep`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur lors du chargement du guide d entretien');
    return res.json();
  },

  async getOfferInterviewPrep(offerId: number): Promise<DeskInterviewPrepResponse> {
    const res = await fetch(`${API_BASE}/offers/${offerId}/interview-prep`);
    if (!res.ok) throw new Error('Erreur lors du chargement du guide d entretien pour cette offre');
    return res.json();
  },

  // ATS Fit & Match Analyzer
  async getOfferATSAnalysis(offerId: number): Promise<ATSFitBreakdown> {
    const res = await fetch(`${API_BASE}/offers/${offerId}/ats-analysis`);
    if (!res.ok) throw new Error("Erreur lors de l'analyse ATS de cette offre");
    return res.json();
  },
};


