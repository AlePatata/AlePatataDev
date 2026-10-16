import { describe, expect, it } from 'vitest';
import { canAccess, roleFor } from './roles';

const env = { OWNER_EMAIL: 'duena@example.com', PARTNER_EMAIL: 'pololo@example.com' };

describe('roleFor', () => {
  it('reconoce a la dueña y al pololo', () => {
    expect(roleFor('duena@example.com', env)).toBe('owner');
    expect(roleFor('pololo@example.com', env)).toBe('partner');
  });

  it('ignora mayúsculas y espacios', () => {
    expect(roleFor('  Duena@Example.COM ', env)).toBe('owner');
  });

  it('rechaza cualquier otro email', () => {
    expect(roleFor('otra@example.com', env)).toBeNull();
    expect(roleFor('', env)).toBeNull();
  });

  it('no da acceso si los secretos no están definidos', () => {
    expect(roleFor('', { OWNER_EMAIL: '', PARTNER_EMAIL: '' })).toBeNull();
    expect(roleFor('x@example.com', { OWNER_EMAIL: '', PARTNER_EMAIL: '' })).toBeNull();
  });
});

describe('canAccess', () => {
  it('la dueña accede a todo', () => {
    expect(canAccess('owner', '/api/transactions')).toBe(true);
    expect(canAccess('owner', '/api/wishlist/3')).toBe(true);
  });

  it('el pololo solo accede a /api/me y la wishlist', () => {
    expect(canAccess('partner', '/api/me')).toBe(true);
    expect(canAccess('partner', '/api/wishlist')).toBe(true);
    expect(canAccess('partner', '/api/wishlist/3')).toBe(true);
    expect(canAccess('partner', '/api/transactions')).toBe(false);
    expect(canAccess('partner', '/api/settings')).toBe(false);
    expect(canAccess('partner', '/api/wishlistx')).toBe(false);
  });
});
