export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'follow_up_needed'
  | 'interviewing'
  | 'offer_received'
  | 'rejected'
  | 'withdrawn';

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  desk: string;
  asset_class?: string;
  contract_type: string;
  description: string;
  requirements?: string;
  url?: string;
  url_status?: number;
  is_verified?: boolean;
  last_verified_at?: string;
  salary_monthly?: number;
  source: string;
  date_posted?: string;
  start_date?: string;
  end_date?: string;
  duration_months?: string;
  scraped_at?: string;
  is_favorite: boolean;
  is_applied: boolean;
  tags?: string;
  direct_apply_email?: string;
}

export interface Application {
  id: number;
  offer_id?: number | null;
  company: string;
  job_title: string;
  desk: string;
  location: string;
  status: ApplicationStatus;
  applied_date?: string;
  follow_up_date?: string;
  interview_date?: string;
  salary_monthly?: number;
  contact_name?: string;
  contact_email?: string;
  application_url?: string;
  url_status?: number;
  notes?: string;
  cover_letter?: string;
  resume_version?: string;
  created_at?: string;
  updated_at?: string;
  offer?: JobOffer | null;
}

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  school: string;
  degree_level: string;
  target_roles: string[];
  target_locations: string[];
  target_asset_classes: string[];
  technical_skills: string[];
  target_duration: string;
  target_start_period: string;
  min_salary: number;
  bio_summary?: string;
  serendipity_exploration_weight: number;
  updated_at?: string;
}

export interface RecommendationItem {
  offer: JobOffer;
  similarity_score: number;
  is_serendipity_gem: boolean;
  match_reasons: string[];
  desk_adjacency_tag?: string;
}

export interface RecommendationResponse {
  top_direct_matches: RecommendationItem[];
  serendipity_gems: RecommendationItem[];
  total_evaluated: number;
  profile_summary: string;
}

export interface ApplyPitchResponse {
  subject: string;
  cover_letter: string;
  quick_email_pitch: string;
  mailto_url: string;
  recommended_portfolio_bullets: string[];
  cv_view_url?: string;
  cv_download_url?: string;
}

export interface CVInfo {
  id: number;
  filename: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  is_active: boolean;
  view_url: string;
  download_url: string;
}

export interface InterviewQuestionItem {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  question: string;
  expected_answer: string;
  candidate_edge: string;
}

export interface InterviewBrainteaserItem {
  question: string;
  hint: string;
  solution: string;
}

export interface DeskInterviewPrepResponse {
  desk: string;
  desk_title: string;
  overview: string;
  daily_routine: string[];
  key_technical_concepts: string[];
  questions: InterviewQuestionItem[];
  brainteasers: InterviewBrainteaserItem[];
  recommended_market_reading: string[];
}

export interface ATSFitBreakdown {
  overall_score: number;
  category_scores: Record<string, number>;
  strengths: string[];
  missing_keywords: string[];
  strategic_advice: string[];
  recommended_projects: string[];
}


export interface AnalyticsData {
  total_applications: number;
  status_breakdown: Record<ApplicationStatus, number>;
  desks_distribution: Record<string, number>;
  companies_distribution: Record<string, number>;
  interview_conversion_rate: string;
  offer_rate: string;
  action_required_count: number;
  active_interviews_count: number;
}

export interface SyncResponse {
  status: string;
  total_scraped: number;
  verified_valid: number;
  invalid_discarded: number;
  new_added: number;
  timestamp: string;
}

export interface BankDirectoryItem {
  id: string;
  name: string;
  category: string;
  region: string;
  career_portal_url: string;
  search_url_template: string;
  specialties: string[];
}

export interface LiveBankSearchRequest {
  keyword: string;
  bank_ids?: string[];
  location?: string;
  start_period?: string;
}

export interface LiveBankSearchResultItem {
  title: string;
  company: string;
  location: string;
  desk: string;
  asset_class: string;
  contract_type: string;
  description: string;
  requirements?: string;
  url: string;
  bank_career_portal_url?: string;
  bank_search_url?: string;
  salary_monthly: number;
  source: string;
  date_posted: string;
  start_date: string;
  end_date: string;
  duration_months: string;
  tags: string;
  bank_id: string;
  bank_category: string;
  url_status: number;
  is_verified: boolean;
}

