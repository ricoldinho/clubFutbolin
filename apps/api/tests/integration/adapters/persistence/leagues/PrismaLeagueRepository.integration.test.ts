import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaLeagueRepository } from '@/adapters/persistence/leagues/PrismaLeagueRepository';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
const repository = new PrismaLeagueRepository(prisma);

describe('PrismaLeagueRepository (integración)', () => {
  beforeEach(async () => {
    await prisma.rosterPlayer.deleteMany({});
    await prisma.teamSeason.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.league.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('save: persiste una liga nueva y findById la recupera', async () => {
    const id = LeagueId.generate();
    const league = League.create({
      id,
      name: 'Liga Integración',
      leagueCategory: 'PRIMERA',
    });

    await repository.save(league);

    const found = await repository.findById(id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Liga Integración');
    expect(found!.leagueCategory).toBe('PRIMERA');
  });

  it('findById: devuelve null si la liga no existe', async () => {
    const found = await repository.findById(LeagueId.generate());
    expect(found).toBeNull();
  });

  it('findAll: devuelve lista vacía y luego todas las ligas guardadas', async () => {
    expect(await repository.findAll()).toEqual([]);

    await repository.save(
      League.create({ id: LeagueId.generate(), name: 'A', leagueCategory: 'SEGUNDA' }),
    );
    await repository.save(
      League.create({ id: LeagueId.generate(), name: 'B', leagueCategory: 'ELITE' }),
    );

    const list = await repository.findAll();
    expect(list).toHaveLength(2);
    const names = list.map((l) => l.name).sort();
    expect(names).toEqual(['A', 'B']);
  });

  it('save: actualiza una liga existente', async () => {
    const id = LeagueId.generate();
    await repository.save(
      League.create({ id, name: 'Nombre viejo', leagueCategory: 'CUARTA' }),
    );

    await repository.save(
      League.create({ id, name: 'Nombre nuevo', leagueCategory: 'MASTER' }),
    );

    const found = await repository.findById(id);
    expect(found!.name).toBe('Nombre nuevo');
    expect(found!.leagueCategory).toBe('MASTER');
  });

  it('delete: elimina la liga', async () => {
    const id = LeagueId.generate();
    await repository.save(League.create({ id, name: 'Borrar', leagueCategory: 'PRO' }));

    await repository.delete(id);

    expect(await repository.findById(id)).toBeNull();
  });

  it('save: no permite dos ligas con el mismo nombre (UNIQUE en BD)', async () => {
    await repository.save(
      League.create({ id: LeagueId.generate(), name: 'Mismo nombre', leagueCategory: 'PRIMERA' }),
    );

    await expect(
      repository.save(
        League.create({
          id: LeagueId.generate(),
          name: 'Mismo nombre',
          leagueCategory: 'SEGUNDA',
        }),
      ),
    ).rejects.toThrow();
  });

  it('countSeasonsByLeagueId: cuenta temporadas de la liga', async () => {
    const id = LeagueId.generate();
    await repository.save(League.create({ id, name: 'Con temporadas', leagueCategory: 'AVANZADO' }));

    await prisma.season.create({
      data: { year: 2024, leagueId: id.value },
    });
    await prisma.season.create({
      data: { year: 2025, leagueId: id.value },
    });

    const count = await repository.countSeasonsByLeagueId(id);
    expect(count).toBe(2);
  });
});
