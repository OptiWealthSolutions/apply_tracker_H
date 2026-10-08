import type {
  JobOffer,
  Application,
  UserProfile,
  RecommendationResponse,
  ApplyPitchResponse,
  AnalyticsData,
  ApplicationStatus,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Job Offers
  async getOffers(params?: { query?: string; desk?: string; location?: string; only_favorites?: boolean }): Promise<JobOffer[]> {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.desk && params.desk !== 'Tous') queryParams.append('desk', params.desk);
    if (params?.location && params.location !== 'Toutes') queryParams.append('location', params.location);
    if (params?.only_favorites) queryParams.append('only_favorites', 'true');

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
};
