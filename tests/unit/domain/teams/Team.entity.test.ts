import { describe, it, expect } from 'vitest';
import { Team } from '@/domain/teams/Team.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';

describe('Team', () => {
  it('crea un equipo con name y createdAt por defecto', () => {
    const team = Team.create({ name: 'Equipo Test' });
    expect(team.name).toBe('Equipo Test');
    expect(team.createdAt).toBeInstanceOf(Date);
    expect(team.id).toBeUndefined();
  });

  it('crea un equipo con id cuando se pasa', () => {
    const id = TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const team = Team.create({ id, name: 'Equipo Con Id' });
    expect(team.id).toBeDefined();
    expect(team.id?.value).toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});
