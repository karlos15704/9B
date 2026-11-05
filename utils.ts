export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

/**
 * Retorna uma imagem padrão oficial local de alta qualidade baseada no tipo de produto.
 * Nunca retorna placeholders externos ou links quebrados.
 */
export const getDefaultProductImage = (product?: { name?: string; category?: string; comboItems?: any[] } | null): string => {
  if (!product) return '/images/combo-classico.png';
  
  const name = (product.name || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();
  const isCombo = (product.comboItems && product.comboItems.length > 0) || cat.includes('combo') || name.includes('combo');

  if (isCombo) {
    if (name.includes('batata') && (name.includes('refri') || name.includes('refrigerante'))) {
      return '/images/combo-batata-refri.png';
    }
    return '/images/combo-classico.png';
  }

  if (name.includes('batata')) {
    return '/images/batata.png';
  }

  if (name.includes('água') || name.includes('agua')) {
    return '/images/agua.png';
  }

  if (cat.includes('bebida') || name.includes('refri') || name.includes('coca') || name.includes('fanta') || name.includes('guaran') || name.includes('soda')) {
    return '/images/refrigerante.png';
  }

  if (name.includes('junior') || name.includes('100g')) {
    return '/images/frito-junior.png';
  }

  // Frango frito clássico / porção padrão
  return '/images/frito-classico.png';
};

/**
 * Valida e higieniza a URL da imagem. Se for inválida, vazia ou contiver placeholder, retorna o padrão inteligente local.
 */
export const resolveProductImage = (imageUrl?: string | null, product?: { name?: string; category?: string; comboItems?: any[] } | null): string => {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return getDefaultProductImage(product);
  }
  const cleanUrl = imageUrl.trim();
  if (
    cleanUrl.includes('via.placeholder.com') ||
    cleanUrl.includes('/images/placeholder.png') ||
    cleanUrl.startsWith('https://viahttps:') ||
    cleanUrl === 'placeholder' ||
    cleanUrl.includes('placeholder.com')
  ) {
    return getDefaultProductImage(product);
  }
  return cleanUrl;
};