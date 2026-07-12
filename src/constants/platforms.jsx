import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaInstagram,
  FaWhatsapp,
  FaTiktok,
  FaAt,
} from 'react-icons/fa';

export const PLATFORM_IDS = [
  'facebook',
  'instagram',
  'twitter',
  'threads',
  'linkedin',
  'youtube',
  'tiktok',
  'whatsapp',
];

export const PLATFORM_DISPLAY_NAMES = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  threads: 'Threads',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
};

export const PLATFORM_CHAR_LIMITS = {
  facebook: 63206,
  instagram: 2200,
  twitter: 280,
  threads: 500,
  linkedin: 3000,
  youtube: 5000,
  tiktok: 2200,
  whatsapp: 4096,
};

export const PLATFORM_CONFIG = {
  facebook: {
    icon: FaFacebook,
    color: 'text-[#1877F2]',
    bg: 'bg-[#1877F2]/10',
    border: 'border-[#1877F2]/30',
    ring: 'ring-[#1877F2]/40',
    accent: '#1877F2',
    supportsImage: true,
    supportsVideo: true,
    requiresMedia: false,
  },
  instagram: {
    icon: FaInstagram,
    color: 'text-[#E4405F]',
    bg: 'bg-[#E4405F]/10',
    border: 'border-[#E4405F]/30',
    ring: 'ring-[#E4405F]/40',
    accent: '#E4405F',
    supportsImage: true,
    supportsVideo: true,
    requiresMedia: true,
  },
  twitter: {
    icon: FaTwitter,
    color: 'text-[#1DA1F2]',
    bg: 'bg-[#1DA1F2]/10',
    border: 'border-[#1DA1F2]/30',
    ring: 'ring-[#1DA1F2]/40',
    accent: '#1DA1F2',
    supportsImage: true,
    supportsVideo: true,
    requiresMedia: false,
    supportsThread: true,
  },
  threads: {
    icon: FaAt,
    color: 'text-black',
    bg: 'bg-black/10',
    border: 'border-black/20',
    ring: 'ring-black/30',
    accent: '#000000',
    supportsImage: true,
    supportsVideo: true,
    requiresMedia: false,
    supportsThread: true,
  },
  linkedin: {
    icon: FaLinkedin,
    color: 'text-[#0A66C2]',
    bg: 'bg-[#0A66C2]/10',
    border: 'border-[#0A66C2]/30',
    ring: 'ring-[#0A66C2]/40',
    accent: '#0A66C2',
    supportsImage: true,
    supportsVideo: true,
    requiresMedia: false,
  },
  youtube: {
    icon: FaYoutube,
    color: 'text-[#FF0000]',
    bg: 'bg-[#FF0000]/10',
    border: 'border-[#FF0000]/30',
    ring: 'ring-[#FF0000]/40',
    accent: '#FF0000',
    supportsImage: false,
    supportsVideo: true,
    requiresMedia: true,
  },
  tiktok: {
    icon: FaTiktok,
    color: 'text-black',
    bg: 'bg-black/10',
    border: 'border-black/20',
    ring: 'ring-black/30',
    accent: '#000000',
    supportsImage: false,
    supportsVideo: true,
    requiresMedia: true,
  },
  whatsapp: {
    icon: FaWhatsapp,
    color: 'text-[#25D366]',
    bg: 'bg-[#25D366]/10',
    border: 'border-[#25D366]/30',
    ring: 'ring-[#25D366]/40',
    accent: '#25D366',
    supportsImage: true,
    supportsVideo: true,
    requiresMedia: false,
  },
};

export const getPlatformIcon = (platform, size = 20) => {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return null;
  const Icon = config.icon;
  return <Icon className={config.color} size={size} />;
};
