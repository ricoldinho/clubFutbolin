import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaTeamRepository } from '@/adapters/persistence/teams/PrismaTeamRepository';
import { Team } from '@/domain/teams/Team.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
const repository = new PrismaTeamRepository(prisma);

async function clearTeamRelated(): Promise<void> {
  await prisma.rosterPlayer.deleteMany({});
  await prisma.teamSeason.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.league.deleteMany({});
}

describe('PrismaTeamRepository (integración)', () => {
  beforeEach(async () => {
    await clearTeamRelated();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('save: persiste un equipo nuevo y findById lo recupera', async () => {
    const id = TeamId.generate();
    const createdAt = new Date('2024-06-01T12:00:00.000Z');
    const team = Team.create({
      id,
      name: 'Equipo Integración',
      createdAt,
    });

    await repository.save(team);

    const found = await repository.findById(id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Equipo Integración');
    expect(found!.createdAt.getTime()).toBe(createdAt.getTime());
  });

  it('findById: devuelve null si el equipo no existe', async () => {
    expect(await repository.findById(TeamId.generate())).toBeNull();
  });

  it('findByName: busca con trim sobre el valor almacenado', async () => {
    await repository.save(Team.create({ name: 'Nombre Único' }));

    const found = await repository.findByName('  Nombre Único  ');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Nombre Único');
  });

  it('findAll: lista vacía y luego todos los equipos', async () => {
    expect(await repository.findAll()).toEqual([]);

    await repository.save(Team.create({ name: 'T1' }));
    await repository.save(Team.create({ name: 'T2' }));

    const list = await repository.findAll();
    expect(list).toHaveLength(2);
    const names = list.map((t) => t.name).sort();
    expect(names).toEqual(['T1', 'T2']);
  });

  it('findAll con paginación y searchQuery filtra por nombre', async () => {
    await repository.save(Team.create({ name: 'Alfa Club' }));
    await repository.save(Team.create({ name: 'Beta United' }));

    const filtered = await repository.findAll(
      { page: 1, limit: 10 },
      { searchQuery: 'alfa' },
    );
    expect(filtered.total).toBe(1);
    expect(filtered.data[0].name).toBe('Alfa Club');
  });

  it('save: actualiza nombre del equipo', async () => {
    const id = TeamId.generate();
    await repository.save(Team.create({ id, name: 'Viejo' }));

    await repository.save(Team.create({ id, name: 'Nuevo' }));

    const found = await repository.findById(id);
    expect(found!.name).toBe('Nuevo');
  });

  it('delete: elimina el equipo', async () => {
    const id = TeamId.generate();
    await repository.save(Team.create({ id, name: 'Borrar' }));

    await repository.delete(id);

    expect(await repository.findById(id)).toBeNull();
  });
});
