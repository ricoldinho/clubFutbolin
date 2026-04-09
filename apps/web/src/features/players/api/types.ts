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

export const PLAYER_CATEGORIES = ['CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE'] as const;
export const PLAYER_ROLES = ['USER', 'ADMIN'] as const;

export type PlayerCategory = (typeof PLAYER_CATEGORIES)[number];
export type PlayerRole = (typeof PLAYER_ROLES)[number];

export interface CreatePlayerInput {
  name: string;
  lastname: string;
  nickname: string | null;
  email: string;
  phoneNumber: string;
  birthdate: string;
  category: PlayerCategory;
  password: string;
}

export interface UpdatePlayerInput {
  playerId: string;
  name?: string;
  lastname?: string;
  nickname?: string | null;
  email?: string;
  phoneNumber?: string;
  birthdate?: string;
  category?: PlayerCategory;
  role?: PlayerRole;
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
