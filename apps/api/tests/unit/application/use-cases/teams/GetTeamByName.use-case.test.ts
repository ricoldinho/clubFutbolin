import { describe, it, expect } from 'vitest';
import { GetTeamByName } from '@/application/use-cases/teams/GetTeamByName.use-case';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
import { isOk } from '@/shared/result';

describe('GetTeamByName', () => {
  it('devuelve el equipo cuando existe', async () => {
    const repo = new InMemoryTeamRepository();
    const createResult = await new CreateTeam(repo).execute({ name: 'Equipo Alpha' });
    if (!isOk(createResult)) throw new Error('Expected team create');
    const getTeam = new GetTeamByName(repo);
    const result = await getTeam.execute('Equipo Alpha');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe('Equipo Alpha');
  });

  it('falla con NotFound cuando el equipo no existe', async () => {
    const repo = new InMemoryTeamRepository();
    const getTeam = new GetTeamByName(repo);
    const result = await getTeam.execute('No Existe');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Team');
    expect(result.error.message).toContain('No Existe');
  });
});
