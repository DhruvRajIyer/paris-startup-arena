export type Sector = 'DeepTech' | 'HealthTech' | 'FinTech' | 'CleanTech' | 'FoodTech' | 'HRTech' | 'Other';
export type FundingStage = 'Seed' | 'Série A' | 'Série B' | 'Série C' | 'Coté';
export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type JobCategory = 'eng' | 'product' | 'design' | 'growth' | 'data' | 'ops';

export interface Company {
  id: string;
  name: string;
  sector: Sector;
  logo_initials?: string;
  logo_url?: string;
  lat: number;
  lng: number;
  arrondissement?: number;
  funding_stage?: FundingStage;
  website?: string;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  company?: Company; // Joined data
  title: string;
  tags: string[];
  salary_min?: number;
  salary_max?: number;
  work_mode: WorkMode;
  category: JobCategory;
  description?: string;
  requirements?: string;
  apply_url?: string;
  posted_at: string;
  is_featured: boolean;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  type: 'notify' | 'advertise';
  created_at: string;
}
