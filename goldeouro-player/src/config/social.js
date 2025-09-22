// Configuração de Redes Sociais - Gol de Ouro Player
export const SOCIAL_URLS = {
  whatsapp: import.meta.env.VITE_WHATSAPP_SHARE_URL || 'https://wa.me/',
  telegram: import.meta.env.VITE_TELEGRAM_SHARE_URL || 'https://t.me/share/url',
  facebook: import.meta.env.VITE_FACEBOOK_SHARE_URL || 'https://www.facebook.com/sharer/sharer.php',
  twitter: import.meta.env.VITE_TWITTER_SHARE_URL || 'https://twitter.com/intent/tweet'
};

export const getShareUrl = (platform, text, url) => {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  
  switch (platform) {
    case 'whatsapp':
      return `${SOCIAL_URLS.whatsapp}?text=${encodedText} ${encodedUrl}`;
    case 'telegram':
      return `${SOCIAL_URLS.telegram}?url=${encodedUrl}&text=${encodedText}`;
    case 'facebook':
      return `${SOCIAL_URLS.facebook}?u=${encodedUrl}&quote=${encodedText}`;
    case 'twitter':
      return `${SOCIAL_URLS.twitter}?text=${encodedText}&url=${encodedUrl}`;
    default:
      return url;
  }
};
