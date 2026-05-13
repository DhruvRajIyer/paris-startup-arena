/**
 * Auto-classifier for contract_type and experience_level
 * Called at sync time for every ingested job.
 */

export type ContractType = 'cdi' | 'cdd' | 'stage' | 'alternance' | 'freelance';
export type ExperienceLevel = 'intern' | 'junior' | 'mid' | 'senior';

export function classifyContractType(title: string, description = ''): ContractType {
  const text = `${title} ${description}`.toLowerCase();

  if (/\b(stage|internship|intern\b|stagiaire)/.test(text)) return 'stage';
  if (/\b(alternance|alternant|apprenti|apprentissage|apprenticeship)/.test(text)) return 'alternance';
  if (/\b(freelance|contractor|contrat de prestation|mission freelance)/.test(text)) return 'freelance';
  if (/\bcdd\b|fixed[- ]term|contrat à durée déterminée/.test(text)) return 'cdd';

  return 'cdi';
}

export function classifyExperienceLevel(title: string, tags: string[] = [], description = ''): ExperienceLevel {
  const text = `${title} ${tags.join(' ')} ${description}`.toLowerCase();

  // Intern / entry-level signals
  if (/\b(intern\b|internship|stage|stagiaire|alternance|alternant|entry.?level|graduate|trainee)/.test(text)) {
    return 'intern';
  }

  // Junior signals
  if (/\b(junior\b|jr\b|entry|débutant|less than 2 years|0.?2 years?)/.test(text)) {
    return 'junior';
  }

  // Senior / lead signals
  if (/\b(senior\b|sr\b|lead\b|principal\b|staff\b|director\b|\bvp\b|head of|chief|architect|confirmé|expérimenté)/.test(text)) {
    return 'senior';
  }

  return 'mid';
}
