export interface TeamProfileDto {
  team: {
    id: string | null;
    name: string;
    createdAt: string;
  };
  leagues: Array<{
    id: string;
    name: string;
    leagueCategory: string;
    seasonId: string;
    seasonYear: number;
  }>;
  players: Array<{
    id: string;
    name: string;
    lastname: string;
    nickname: string | null;
    category: string;
    isCurrent: boolean;
  }>;
}

export interface TeamListItemDto {
  id: string | null;
  name: string;
  createdAt: string;
}

export interface CreateTeamInput {
  name: string;
}

export interface UpdateTeamInput {
  teamId: string;
  name?: string;
}
