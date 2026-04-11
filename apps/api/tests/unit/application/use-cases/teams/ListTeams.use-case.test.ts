import { describe, it, expect } from 'vitest';
import { ListTeams } from '@/application/use-cases/teams/ListTeams.use-case';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { saveTeamInMemory } from '../../../../doubles/saveTeamInMemory';
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
    await saveTeamInMemory(repository, 'Equipo Uno');
    await saveTeamInMemory(repository, 'Equipo Dos');
    const listTeams = new ListTeams(repository);

    const result = await listTeams.execute({ pagination: { page: 1, limit: 20 } });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data).toHaveLength(2);
    expect(result.value.total).toBe(2);
    const names = result.value.data.map((t) => t.name).sort();
    expect(names).toEqual(['Equipo Dos', 'Equipo Uno']);
  });

  it('con searchQuery solo devuelve equipos cuyo nombre coincide', async () => {
    const repository = new InMemoryTeamRepository();
    await saveTeamInMemory(repository, 'Atlético Norte');
    await saveTeamInMemory(repository, 'Betis Sur');
    const listTeams = new ListTeams(repository);

    const result = await listTeams.execute({
      pagination: { page: 1, limit: 20 },
      searchQuery: 'Atl',
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.total).toBe(1);
    expect(result.value.data[0].name).toBe('Atlético Norte');
  });
});
