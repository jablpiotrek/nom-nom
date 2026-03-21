import { eq, and, notInArray, asc } from "drizzle-orm";
import { games, names, swipes } from "../../../database/schema";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid")!;
  const parent = getQuery(event).parent as string;

  verifyGameAuth(event, uuid);

  if (!parent || !["mommy", "daddy"].includes(parent)) {
    throw createError({
      statusCode: 400,
      message: 'parent must be "mommy" or "daddy"',
    });
  }

  const game = await db.select().from(games).where(eq(games.id, uuid)).get();
  if (!game) {
    throw createError({ statusCode: 404, message: "Game not found" });
  }

  const parentRole = parent as "mommy" | "daddy";

  const swipedRows = await db
    .select({ nameId: swipes.nameId })
    .from(swipes)
    .where(and(eq(swipes.gameId, uuid), eq(swipes.parent, parentRole)))
    .all();
  const swipedNameIds = [...new Set(swipedRows.map((s) => s.nameId))];

  const nameFilter =
    swipedNameIds.length > 0
      ? and(eq(names.sex, game.sex), notInArray(names.id, swipedNameIds))
      : eq(names.sex, game.sex);

  const rows = await db
    .select({ id: names.id, name: names.name })
    .from(names)
    .where(nameFilter)
    .orderBy(asc(names.id))
    .all();

  return {
    items: rows.map((r) => ({ nameId: r.id, name: r.name })),
    done: rows.length === 0,
  };
});
