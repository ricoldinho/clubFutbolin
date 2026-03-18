import { describe, it, expect } from 'vitest';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
import { UpdateTeam } from '@/application/use-cases/teams/UpdateTeam.use-case';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { NotFoundError } from '@/domain/shared/errors';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { isOk } from '@/shared/result';

describe('UpdateTeam', () => {
  it('actualiza un equipo existente', async () => {
    const repository = new InMemoryTeamRepository();
    const createTeam = new CreateTeam(repository);
    const updateTeam = new UpdateTeam(repository);
    const createResult = await createTeam.execute({ name: 'Equipo X' });
    if (!isOk(createResult)) throw new Error('Expected create to succeed');
    const teamId = createResult.value.id!;

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
    const createTeam = new CreateTeam(repository);
    const updateTeam = new UpdateTeam(repository);
    const r1 = await createTeam.execute({ name: 'Equipo A' });
    const r2 = await createTeam.execute({ name: 'Equipo B' });
    if (!isOk(r1) || !isOk(r2)) throw new Error('Expected create');
    const result = await updateTeam.execute({
      id: r1.value.id!,
      name: 'Equipo B',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Equipo B');
  });

  it('actualiza sin cambiar nombre cuando name no se pasa', async () => {
    const repository = new InMemoryTeamRepository();
    const createTeam = new CreateTeam(repository);
    const updateTeam = new UpdateTeam(repository);
    const createResult = await createTeam.execute({ name: 'Equipo Original' });
    if (!isOk(createResult)) throw new Error('Expected create');
    const result = await updateTeam.execute({
      id: createResult.value.id!,
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
