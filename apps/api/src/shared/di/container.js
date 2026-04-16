"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContainer = buildContainer;
const awilix_1 = require("awilix");
const PrismaPlayerRepository_1 = require("@/adapters/persistence/players/PrismaPlayerRepository");
const PrismaLeagueRepository_1 = require("@/adapters/persistence/leagues/PrismaLeagueRepository");
const PrismaTeamRepository_1 = require("@/adapters/persistence/teams/PrismaTeamRepository");
const PrismaSeasonRepository_1 = require("@/adapters/persistence/seasons/PrismaSeasonRepository");
const PrismaRosterRepository_1 = require("@/adapters/persistence/rosters/PrismaRosterRepository");
const PrismaMatchRepository_1 = require("@/adapters/persistence/matches/PrismaMatchRepository");
const BcryptPasswordHasher_1 = require("@/adapters/auth/BcryptPasswordHasher");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const LoginPlayer_use_case_1 = require("@/application/use-cases/players/LoginPlayer.use-case");
const RegisterPlayer_use_case_1 = require("@/application/use-cases/players/RegisterPlayer.use-case");
const ListPlayers_use_case_1 = require("@/application/use-cases/players/ListPlayers.use-case");
const GetPlayerById_use_case_1 = require("@/application/use-cases/players/GetPlayerById.use-case");
const UpdatePlayer_use_case_1 = require("@/application/use-cases/players/UpdatePlayer.use-case");
const DeletePlayer_use_case_1 = require("@/application/use-cases/players/DeletePlayer.use-case");
const CreateLeague_use_case_1 = require("@/application/use-cases/leagues/CreateLeague.use-case");
const UpdateLeague_use_case_1 = require("@/application/use-cases/leagues/UpdateLeague.use-case");
const DeleteLeague_use_case_1 = require("@/application/use-cases/leagues/DeleteLeague.use-case");
const ListLeagues_use_case_1 = require("@/application/use-cases/leagues/ListLeagues.use-case");
const GetLeagueById_use_case_1 = require("@/application/use-cases/leagues/GetLeagueById.use-case");
const CreateTeam_use_case_1 = require("@/application/use-cases/teams/CreateTeam.use-case");
const UpdateTeam_use_case_1 = require("@/application/use-cases/teams/UpdateTeam.use-case");
const DeleteTeam_use_case_1 = require("@/application/use-cases/teams/DeleteTeam.use-case");
const ListTeams_use_case_1 = require("@/application/use-cases/teams/ListTeams.use-case");
const GetTeamByName_use_case_1 = require("@/application/use-cases/teams/GetTeamByName.use-case");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const ListSeasons_use_case_1 = require("@/application/use-cases/seasons/ListSeasons.use-case");
const GetSeasonById_use_case_1 = require("@/application/use-cases/seasons/GetSeasonById.use-case");
const SetSeasonWinners_use_case_1 = require("@/application/use-cases/seasons/SetSeasonWinners.use-case");
const RegisterTeamToSeason_use_case_1 = require("@/application/use-cases/rosters/RegisterTeamToSeason.use-case");
const AddPlayerToRoster_use_case_1 = require("@/application/use-cases/rosters/AddPlayerToRoster.use-case");
const RemovePlayerFromRoster_use_case_1 = require("@/application/use-cases/rosters/RemovePlayerFromRoster.use-case");
const GenerateSeasonCalendar_use_case_1 = require("@/application/use-cases/matches/GenerateSeasonCalendar.use-case");
const GetMatchById_use_case_1 = require("@/application/use-cases/matches/GetMatchById.use-case");
const UpdateMatchScore_use_case_1 = require("@/application/use-cases/matches/UpdateMatchScore.use-case");
const UpdateMatchStatus_use_case_1 = require("@/application/use-cases/matches/UpdateMatchStatus.use-case");
const UpdateSeasonRoundDate_use_case_1 = require("@/application/use-cases/matches/UpdateSeasonRoundDate.use-case");
function buildContainer({ prisma, config, }) {
    const container = (0, awilix_1.createContainer)();
    container.register({
        // Repositorios/adaptadores: singleton (stateless) con inyección automática.
        playerRepository: (0, awilix_1.asClass)(PrismaPlayerRepository_1.PrismaPlayerRepository).classic().singleton(),
        leagueRepository: (0, awilix_1.asClass)(PrismaLeagueRepository_1.PrismaLeagueRepository).classic().singleton(),
        teamRepository: (0, awilix_1.asClass)(PrismaTeamRepository_1.PrismaTeamRepository).classic().singleton(),
        seasonRepository: (0, awilix_1.asClass)(PrismaSeasonRepository_1.PrismaSeasonRepository).classic().singleton(),
        rosterRepository: (0, awilix_1.asClass)(PrismaRosterRepository_1.PrismaRosterRepository).classic().singleton(),
        matchRepository: (0, awilix_1.asClass)(PrismaMatchRepository_1.PrismaMatchRepository).classic().singleton(),
        // Servicios (no dependientes salvo config para JWT).
        passwordHasher: (0, awilix_1.asClass)(BcryptPasswordHasher_1.BcryptPasswordHasher).classic().singleton(),
        jwtService: (0, awilix_1.asClass)(JoseJwtService_1.JoseJwtService, {
            injector: () => ({
                secret: config.JWT_SECRET,
                expiresIn: config.JWT_EXPIRES_IN,
            }),
        }).classic().singleton(),
        // Casos de uso: scoped por request.
        loginPlayer: (0, awilix_1.asClass)(LoginPlayer_use_case_1.LoginPlayer).classic().scoped(),
        registerPlayer: (0, awilix_1.asClass)(RegisterPlayer_use_case_1.RegisterPlayer).classic().scoped(),
        listPlayers: (0, awilix_1.asClass)(ListPlayers_use_case_1.ListPlayers).classic().scoped(),
        getPlayerById: (0, awilix_1.asClass)(GetPlayerById_use_case_1.GetPlayerById).classic().scoped(),
        updatePlayer: (0, awilix_1.asClass)(UpdatePlayer_use_case_1.UpdatePlayer).classic().scoped(),
        deletePlayer: (0, awilix_1.asClass)(DeletePlayer_use_case_1.DeletePlayer).classic().scoped(),
        createLeague: (0, awilix_1.asClass)(CreateLeague_use_case_1.CreateLeague).classic().scoped(),
        updateLeague: (0, awilix_1.asClass)(UpdateLeague_use_case_1.UpdateLeague).classic().scoped(),
        deleteLeague: (0, awilix_1.asClass)(DeleteLeague_use_case_1.DeleteLeague).classic().scoped(),
        listLeagues: (0, awilix_1.asClass)(ListLeagues_use_case_1.ListLeagues).classic().scoped(),
        getLeagueById: (0, awilix_1.asClass)(GetLeagueById_use_case_1.GetLeagueById).classic().scoped(),
        createTeam: (0, awilix_1.asClass)(CreateTeam_use_case_1.CreateTeam).classic().scoped(),
        updateTeam: (0, awilix_1.asClass)(UpdateTeam_use_case_1.UpdateTeam).classic().scoped(),
        deleteTeam: (0, awilix_1.asClass)(DeleteTeam_use_case_1.DeleteTeam).classic().scoped(),
        listTeams: (0, awilix_1.asClass)(ListTeams_use_case_1.ListTeams).classic().scoped(),
        getTeamByName: (0, awilix_1.asClass)(GetTeamByName_use_case_1.GetTeamByName).classic().scoped(),
        createSeason: (0, awilix_1.asClass)(CreateSeason_use_case_1.CreateSeason).classic().scoped(),
        listSeasons: (0, awilix_1.asClass)(ListSeasons_use_case_1.ListSeasons).classic().scoped(),
        getSeasonById: (0, awilix_1.asClass)(GetSeasonById_use_case_1.GetSeasonById).classic().scoped(),
        setSeasonWinners: (0, awilix_1.asClass)(SetSeasonWinners_use_case_1.SetSeasonWinners).classic().scoped(),
        registerTeamToSeason: (0, awilix_1.asClass)(RegisterTeamToSeason_use_case_1.RegisterTeamToSeason).classic().scoped(),
        addPlayerToRoster: (0, awilix_1.asClass)(AddPlayerToRoster_use_case_1.AddPlayerToRoster).classic().scoped(),
        removePlayerFromRoster: (0, awilix_1.asClass)(RemovePlayerFromRoster_use_case_1.RemovePlayerFromRoster).classic().scoped(),
        generateSeasonCalendar: (0, awilix_1.asClass)(GenerateSeasonCalendar_use_case_1.GenerateSeasonCalendar).classic().scoped(),
        getMatchById: (0, awilix_1.asClass)(GetMatchById_use_case_1.GetMatchById).classic().scoped(),
        updateMatchScore: (0, awilix_1.asClass)(UpdateMatchScore_use_case_1.UpdateMatchScore).classic().scoped(),
        updateMatchStatus: (0, awilix_1.asClass)(UpdateMatchStatus_use_case_1.UpdateMatchStatus).classic().scoped(),
        updateSeasonRoundDate: (0, awilix_1.asClass)(UpdateSeasonRoundDate_use_case_1.UpdateSeasonRoundDate).classic().scoped(),
        prisma: (0, awilix_1.asValue)(prisma),
    });
    return container;
}
