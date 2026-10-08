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
  target_domains?: string[];
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

export interface KeywordItem {
  keyword: string;
  category: string;
  count: number;
  density_percent: number;
  relevance_score: number;
  importance: string;
}

export interface BulletAuditItem {
  original_text: string;
  is_quantified: boolean;
  detected_metrics: string[];
  has_strong_verb: boolean;
  detected_verb?: string;
  xyz_score: number;
  suggestion?: string;
}

export interface CVAuditResponse {
  overall_score: number;
  letter_grade: string;
  executive_summary: string;
  category_scores: Record<string, number>;
  top_ranked_keywords: KeywordItem[];
  missing_high_yield_keywords: Array<{ keyword: string; category: string; impact: string }>;
  quantification_rate_percent: number;
  strong_verbs_rate_percent: number;
  total_words: number;
  bullet_audits: BulletAuditItem[];
  strengths: string[];
  critical_improvements: string[];
  domain_fit: Record<string, number>;
}

export interface CoverLetterAuditResponse {
  overall_score: number;
  letter_grade: string;
  word_count: number;
  personalization_score: number;
  hook_strength_score: number;
  conciseness_score: number;
  call_to_action_score: number;
  detected_company?: string;
  detected_role?: string;
  strengths: string[];
  warnings: string[];
  recommendations: string[];
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

export interface FirmInterviewExpectation {
  id: string;
  firm_name: string;
  sector: string;
  division: string;
  locations: string[];
  recruitment_process: string[];
  culture_and_fit_expectations: string[];
  technical_evaluations: string[];
  brainteasers_or_tests: string[];
  typical_interview_questions: string[];
  insider_candidate_tips: string;
  official_careers_url: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  creator_or_author: string;
  resource_type: string;
  sector: string;
  url: string;
  duration_or_pages: string;
  difficulty: string;
  description: string;
  key_takeaways: string[];
}


