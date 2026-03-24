import { describe, it, expect } from 'vitest';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { AlreadyExistsError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';
import { TeamId } from '@/domain/teams/TeamId.value-object';

describe('CreateTeam', () => {
  it('crea un equipo y devuelve Result.ok', async () => {
    const repository = new InMemoryTeamRepository();
    const createTeam = new CreateTeam(repository);

    const result = await createTeam.execute({ name: 'Equipo A' });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe('Equipo A');
    expect(result.value.id).toBeInstanceOf(TeamId);
  });

  it('devuelve Result.fail(AlreadyExistsError) cuando ya existe un equipo con el mismo nombre', async () => {
    const repository = new InMemoryTeamRepository();
    const createTeam = new CreateTeam(repository);
    await createTeam.execute({ name: 'Equipo A' });

    const result = await createTeam.execute({ name: 'Equipo A' });

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(AlreadyExistsError);
  });
});
