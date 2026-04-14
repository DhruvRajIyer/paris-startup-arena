import { useState, useEffect } from 'react';
import { Company } from '../types';

interface CompanyLogoProps {
  company: Company;
  size?: number;
  isHovered?: boolean;
  format?: 'webp' | 'png' | 'jpg';
  theme?: 'light' | 'dark' | 'auto';
  quality?: number;
}

export function CompanyLogo({ 
  company, 
  size = 32, 
  isHovered = false,
  format = 'webp',
  theme = 'dark',
  quality = 80
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Extract domain from website URL
  const getDomain = (website?: string): string | null => {
    if (!website) return null;
    try {
      const url = website.startsWith('http') ? website : `https://${website}`;
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return null;
    }
  };

  const domain = getDomain(company.website);
  
  // Build Logo.dev URL with all parameters
  const buildLogoUrl = (domain: string): string => {
    const params = new URLSearchParams({
      token: import.meta.env.VITE_LOGO_DEV_API_KEY || '',
      size: size.toString(),
      format: format,
      theme: theme,
      quality: quality.toString(),
      retina: 'true', // Enable retina/high-DPI support
    });
    
    return `https://img.logo.dev/${domain}?${params.toString()}`;
  };

  const logoUrl = domain ? buildLogoUrl(domain) : null;
  const shouldShowLogo = logoUrl && !imageError && isInView;

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Start loading 50px before entering viewport
    );

    const element = document.getElementById(`logo-${company.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [company.id]);

  // Get sector color for initials fallback
  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      'DeepTech': '#60A5FA',
      'HealthTech': '#34D399',
      'FinTech': '#FBBF24',
      'CleanTech': '#10B981',
      'FoodTech': '#F97316',
      'HRTech': '#A78BFA',
      'Other': '#9CA3AF'
    };
    return colors[sector] || colors['Other'];
  };

  const sectorColor = getSectorColor(company.sector);

  return (
    <div
      id={`logo-${company.id}`}
      className="relative transition-all duration-300"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: '1000px',
      }}
    >
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          transform: isHovered 
            ? 'perspective(1000px) rotateX(15deg) rotateY(-15deg) translateZ(30px) scale(1.2)' 
            : 'perspective(1000px) rotateX(10deg) rotateY(-10deg) translateZ(20px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 3D Frame */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)',
            border: '2px solid rgba(200, 169, 110, 0.3)',
            boxShadow: isHovered
              ? '0 20px 40px rgba(0,0,0,0.5), 0 2px 12px rgba(200, 169, 110, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 10px 30px rgba(0,0,0,0.3), 0 1px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Logo or Initials */}
          {shouldShowLogo ? (
            <div className="relative w-full h-full p-1.5">
              {/* Loading skeleton */}
              {!imageLoaded && (
                <div 
                  className="absolute inset-0 flex items-center justify-center text-xs font-bold animate-pulse"
                  style={{ color: sectorColor }}
                >
                  {company.logo_initials || company.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              
              {/* Actual logo image */}
              <img
                src={logoUrl}
                alt={`${company.name} logo`}
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.warn(`Failed to load logo for ${company.name} (${domain})`);
                  setImageError(true);
                }}
                // Responsive images for different screen densities
                srcSet={domain ? `
                  ${buildLogoUrl(domain)} 1x,
                  ${buildLogoUrl(domain).replace(`size=${size}`, `size=${size * 2}`)} 2x
                ` : undefined}
              />
            </div>
          ) : (
            // Fallback to initials
            <div 
              className="w-full h-full flex items-center justify-center font-bold"
              style={{ 
                color: sectorColor,
                fontSize: `${size * 0.35}px`,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {company.logo_initials || company.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Glow effect on hover */}
        {isHovered && (
          <div
            className="absolute inset-0 rounded-xl animate-pulse"
            style={{
              background: `radial-gradient(circle, ${sectorColor}40 0%, transparent 70%)`,
              filter: 'blur(8px)',
              zIndex: -1,
            }}
          />
        )}
      </div>
    </div>
  );
}
