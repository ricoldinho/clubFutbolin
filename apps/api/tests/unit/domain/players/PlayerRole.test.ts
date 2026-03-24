import { describe, it, expect } from 'vitest';
import {
  PlayerRole,
  isPlayerRole,
  parsePlayerRole,
} from '@/domain/players/PlayerRole';

describe('PlayerRole', () => {
  it('tiene los valores USER y ADMIN', () => {
    expect(PlayerRole.USER).toBe('USER');
    expect(PlayerRole.ADMIN).toBe('ADMIN');
  });

  it('isPlayerRole devuelve true para USER y ADMIN', () => {
    expect(isPlayerRole('USER')).toBe(true);
    expect(isPlayerRole('ADMIN')).toBe(true);
  });

  it('isPlayerRole devuelve false para valores inválidos', () => {
    expect(isPlayerRole('GUEST')).toBe(false);
    expect(isPlayerRole('')).toBe(false);
    expect(isPlayerRole('user')).toBe(false);
  });

  it('parsePlayerRole devuelve el enum para string válido', () => {
    expect(parsePlayerRole('USER')).toBe(PlayerRole.USER);
    expect(parsePlayerRole('ADMIN')).toBe(PlayerRole.ADMIN);
  });

  it('parsePlayerRole lanza para string inválido', () => {
    expect(() => parsePlayerRole('INVALID')).toThrow(/Rol inválido/);
    expect(() => parsePlayerRole('')).toThrow(/Rol inválido/);
  });
});
