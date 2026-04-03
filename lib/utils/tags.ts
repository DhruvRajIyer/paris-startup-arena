/**
 * Auto-extract tech tags from job titles and descriptions
 */

const TAG_PATTERNS: [RegExp, string][] = [
  [/\bReact\b/i, 'React'],
  [/\bNext\.?js\b/i, 'Next.js'],
  [/\bVue\b/i, 'Vue'],
  [/\bAngular\b/i, 'Angular'],
  [/\bNode\.?js\b/i, 'Node.js'],
  [/\bPython\b/i, 'Python'],
  [/\bTypeScript\b/i, 'TypeScript'],
  [/\bJavaScript\b/i, 'JavaScript'],
  [/\bRust\b/i, 'Rust'],
  [/\bGo\b|\bGolang\b/i, 'Go'],
  [/\bJava\b/i, 'Java'],
  [/\bKotlin\b/i, 'Kotlin'],
  [/\bSwift\b/i, 'Swift'],
  [/\bPostgres\b|PostgreSQL/i, 'PostgreSQL'],
  [/\bMongoDB\b/i, 'MongoDB'],
  [/\bRedis\b/i, 'Redis'],
  [/\bK8s\b|Kubernetes/i, 'Kubernetes'],
  [/\bDocker\b/i, 'Docker'],
  [/\bAWS\b/i, 'AWS'],
  [/\bGCP\b|Google Cloud/i, 'GCP'],
  [/\bAzure\b/i, 'Azure'],
  [/\bML\b|Machine Learning/i, 'ML'],
  [/\bAI\b|Artificial Intelligence/i, 'AI'],
  [/\bLLM\b/i, 'LLMs'],
  [/\bFigma\b/i, 'Figma'],
  [/\bSQL\b/i, 'SQL'],
  [/\bGraphQL\b/i, 'GraphQL'],
  [/\bREST\b|RESTful/i, 'REST API'],
  [/\bTailwind\b/i, 'Tailwind'],
  [/\bThree\.?js\b/i, 'Three.js'],
];

export function extractTagsFromTitle(title: string, description = ''): string[] {
  const text = `${title} ${description}`;
  const foundTags = TAG_PATTERNS
    .filter(([re]) => re.test(text))
    .map(([, tag]) => tag);
  
  // Remove duplicates and limit to 6 tags
  return [...new Set(foundTags)].slice(0, 6);
}

export function mapCategory(department?: string): string {
  if (!department) return 'ops';
  
  const dept = department.toLowerCase();
  
  if (dept.includes('engineer') || dept.includes('dev') || dept.includes('tech')) return 'eng';
  if (dept.includes('product')) return 'product';
  if (dept.includes('design') || dept.includes('ux') || dept.includes('ui')) return 'design';
  if (dept.includes('market') || dept.includes('growth') || dept.includes('sales')) return 'growth';
  if (dept.includes('data') || dept.includes('analyt')) return 'data';
  
  return 'ops';
}

export function detectWorkMode(title: string, description = ''): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('full remote') || text.includes('fully remote') || text.includes('100% remote')) {
    return 'remote';
  }
  if (text.includes('hybrid') || text.includes('flexible')) {
    return 'hybrid';
  }
  
  return 'onsite';
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function addDays(date: Date | string, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
