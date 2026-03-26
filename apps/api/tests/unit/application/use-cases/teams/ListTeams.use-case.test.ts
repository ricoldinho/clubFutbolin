import { describe, it, expect } from 'vitest';
import { ListTeams } from '@/application/use-cases/teams/ListTeams.use-case';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { isOk } from '@/shared/result';

describe('ListTeams', () => {
  it('devuelve Result.ok([]) cuando no hay equipos', async () => {
    const repository = new InMemoryTeamRepository();
    const listTeams = new ListTeams(repository);

    const result = await listTeams.execute({ pagination: { page: 1, limit: 20 } });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data).toEqual([]);
    expect(result.value.total).toBe(0);
  });

  it('devuelve Result.ok con todos los equipos guardados', async () => {
    const repository = new InMemoryTeamRepository();
    const createTeam = new CreateTeam(repository);
    const r1 = await createTeam.execute({ name: 'Equipo Uno' });
    const r2 = await createTeam.execute({ name: 'Equipo Dos' });
    if (!isOk(r1) || !isOk(r2)) throw new Error('Expected team create');
    const listTeams = new ListTeams(repository);

    const result = await listTeams.execute({ pagination: { page: 1, limit: 20 } });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data).toHaveLength(2);
    expect(result.value.total).toBe(2);
    const names = result.value.data.map((t) => t.name).sort();
    expect(names).toEqual(['Equipo Dos', 'Equipo Uno']);
  });
});
