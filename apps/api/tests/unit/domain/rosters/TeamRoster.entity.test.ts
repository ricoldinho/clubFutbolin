import { describe, it, expect } from 'vitest';
import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { DomainValidationError } from '@/domain/shared/errors';

describe('TeamRoster', () => {
  const teamSeasonId = TeamSeasonId.generate();
  const teamId = TeamId.generate();
  const seasonId = SeasonId.generate();

  it('addPlayer añade jugadores hasta 4', () => {
    let roster = TeamRoster.create({ teamSeasonId, teamId, seasonId });
    const p1 = PlayerId.generate();
    const p2 = PlayerId.generate();
    const p3 = PlayerId.generate();
    const p4 = PlayerId.generate();

    roster = roster.addPlayer(p1, 'PORTERO');
    roster = roster.addPlayer(p2, 'DELANTERO');
    roster = roster.addPlayer(p3, 'DELANTERO');
    roster = roster.addPlayer(p4, 'PORTERO');

    expect(roster.members).toHaveLength(4);
  });

  it('addPlayer lanza cuando se excede el máximo', () => {
    let roster = TeamRoster.create({ teamSeasonId, teamId, seasonId });
    for (let i = 0; i < 4; i++) {
      roster = roster.addPlayer(PlayerId.generate(), 'DELANTERO');
    }
    expect(() => roster.addPlayer(PlayerId.generate(), 'PORTERO')).toThrow(DomainValidationError);
  });

  it('addPlayer lanza cuando el jugador ya está', () => {
    let roster = TeamRoster.create({ teamSeasonId, teamId, seasonId });
    const p = PlayerId.generate();
    roster = roster.addPlayer(p, 'PORTERO');
    expect(() => roster.addPlayer(p, 'DELANTERO')).toThrow(DomainValidationError);
  });

  it('removePlayer elimina al jugador', () => {
    let roster = TeamRoster.create({ teamSeasonId, teamId, seasonId });
    const p = PlayerId.generate();
    roster = roster.addPlayer(p, 'PORTERO');
    roster = roster.removePlayer(p);
    expect(roster.members).toHaveLength(0);
  });
});
