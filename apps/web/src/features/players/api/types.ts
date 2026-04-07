export interface PlayerDto {
  id: string | null;
  name: string;
  lastname: string;
  nickname: string | null;
  email: string;
  phoneNumber: string;
  birthdate: string;
  category: 'CUARTA' | 'TERCERA' | 'SEGUNDA' | 'PRIMERA' | 'ELITE';
  role: 'USER' | 'ADMIN';
}

export interface PlayerMembershipDto {
  teamSeasonId: string;
  team: {
    id: string;
    name: string;
  };
  season: {
    id: string;
    year: number;
  };
  league: {
    id: string;
    name: string;
  };
}

export interface PlayerMembershipsResponseDto {
  data: PlayerMembershipDto[];
}
