import { Team } from '@/domain/teams/Team.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { InMemoryTeamRepository } from './InMemoryTeamRepository';

/** Persiste un equipo sin plantilla (tests que no usan CreateTeam completo). */
export async function saveTeamInMemory(
  teamRepo: InMemoryTeamRepository,
  name: string,
): Promise<Team> {
  const team = Team.create({ id: TeamId.generate(), name });
  await teamRepo.save(team);
  return team;
}
