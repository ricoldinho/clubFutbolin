import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
import { RegisterTeamToSeason } from '@/application/use-cases/rosters/RegisterTeamToSeason.use-case';
import { AddPlayerToRoster } from '@/application/use-cases/rosters/AddPlayerToRoster.use-case';
import type { InMemoryTeamRepository } from './InMemoryTeamRepository';
import type { InMemorySeasonRepository } from './InMemorySeasonRepository';
import type { InMemoryRosterRepository } from './InMemoryRosterRepository';
import type { InMemoryPlayerRepository } from './InMemoryPlayerRepository';

export function buildCreateTeamUseCase(deps: {
  teamRepository: InMemoryTeamRepository;
  seasonRepository: InMemorySeasonRepository;
  rosterRepository: InMemoryRosterRepository;
  playerRepository: InMemoryPlayerRepository;
}): CreateTeam {
  const registerTeamToSeason = new RegisterTeamToSeason(
    deps.rosterRepository,
    deps.teamRepository,
    deps.seasonRepository,
  );
  const addPlayerToRoster = new AddPlayerToRoster(deps.rosterRepository);
  return new CreateTeam(
    deps.teamRepository,
    deps.seasonRepository,
    deps.rosterRepository,
    deps.playerRepository,
    registerTeamToSeason,
    addPlayerToRoster,
  );
}
