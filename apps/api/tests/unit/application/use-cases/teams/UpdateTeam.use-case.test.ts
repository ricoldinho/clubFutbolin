import { describe, it, expect } from 'vitest';
import { UpdateTeam } from '@/application/use-cases/teams/UpdateTeam.use-case';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { saveTeamInMemory } from '../../../../doubles/saveTeamInMemory';
import { NotFoundError } from '@/domain/shared/errors';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { isOk } from '@/shared/result';

describe('UpdateTeam', () => {
  it('actualiza un equipo existente', async () => {
    const repository = new InMemoryTeamRepository();
    const updateTeam = new UpdateTeam(repository);
    const created = await saveTeamInMemory(repository, 'Equipo X');
    const teamId = created.id!;

    const result = await updateTeam.execute({
      id: teamId,
      name: 'Equipo X Actualizado',
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe('Equipo X Actualizado');
  });

  it('devuelve AlreadyExistsError cuando el nuevo nombre ya existe en otro equipo', async () => {
    const repository = new InMemoryTeamRepository();
    const updateTeam = new UpdateTeam(repository);
    const a = await saveTeamInMemory(repository, 'Equipo A');
    await saveTeamInMemory(repository, 'Equipo B');
    const result = await updateTeam.execute({
      id: a.id!,
      name: 'Equipo B',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Equipo B');
  });

  it('actualiza sin cambiar nombre cuando name no se pasa', async () => {
    const repository = new InMemoryTeamRepository();
    const updateTeam = new UpdateTeam(repository);
    const created = await saveTeamInMemory(repository, 'Equipo Original');
    const result = await updateTeam.execute({
      id: created.id!,
    });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe('Equipo Original');
  });

  it('devuelve NotFoundError cuando el equipo no existe', async () => {
    const repository = new InMemoryTeamRepository();
    const updateTeam = new UpdateTeam(repository);
    const result = await updateTeam.execute({
      id: TeamId.generate(),
      name: 'Nuevo',
    });
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
