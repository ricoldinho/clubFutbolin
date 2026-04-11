import { describe, it, expect } from 'vitest';
import { DeleteTeam } from '@/application/use-cases/teams/DeleteTeam.use-case';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { saveTeamInMemory } from '../../../../doubles/saveTeamInMemory';
import { NotFoundError } from '@/domain/shared/errors';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { isOk } from '@/shared/result';

describe('DeleteTeam', () => {
  it('elimina un equipo y devuelve Result.ok', async () => {
    const repository = new InMemoryTeamRepository();
    const deleteTeam = new DeleteTeam(repository);
    const created = await saveTeamInMemory(repository, 'Equipo Y');
    const teamId = created.id!;

    const result = await deleteTeam.execute(teamId);

    expect(isOk(result)).toBe(true);
    const found = await repository.findById(teamId);
    expect(found).toBeNull();
  });

  it('devuelve Result.fail(NotFoundError) cuando el equipo no existe', async () => {
    const repository = new InMemoryTeamRepository();
    const deleteTeam = new DeleteTeam(repository);
    const result = await deleteTeam.execute(TeamId.generate());
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
