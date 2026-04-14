export interface RegisterTeamToSeasonInput {
  teamId: string;
  seasonId: string;
}

export interface RegisterTeamToSeasonResponseDto {
  teamSeasonId: string;
  teamId: string;
  seasonId: string;
  membersCount: number;
}
