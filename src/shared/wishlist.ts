// Tipos de la API de la wishlist, compartidos entre la app y el Worker.

export type ItemStatus = 'pending' | 'bought';

export interface WishlistItem {
  id: number;
  name: string;
  price: number; // CLP
  url: string | null;
  imageUrl: string | null;
  note: string | null;
  priority: number;
  status: ItemStatus;
  createdBy: 'owner' | 'partner';
  createdAt: string;
  boughtAt: string | null;
}

/** Quién agregó cada item, para "Agregado por …". */
export const AUTHOR_NAMES: Record<WishlistItem['createdBy'], string> = { owner: 'Ale', partner: 'Felipe' };

export interface WishlistResponse {
  items: WishlistItem[]; // pendientes por prioridad, después comprados (más reciente primero)
}

export interface ItemInput {
  name: string;
  price: number;
  url?: string | null;
  imageUrl?: string | null;
  note?: string | null;
  status?: ItemStatus;
}

/** Lo que se pudo leer de la página de una tienda. */
export interface ProductMeta {
  title: string | null;
  imageUrl: string | null;
  price: number | null;
}
