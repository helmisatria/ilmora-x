import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  categories,
  questions,
  tryoutQuestions,
  tryouts,
} from "../../lib/db/schema";
import { normalizeTryoutAccessLevel } from "../premium-access/premium-access";

export const listPublishedTryouts = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      id: tryouts.id,
      title: tryouts.title,
      description: tryouts.description,
      icon: tryouts.icon,
      categoryId: tryouts.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      durationMinutes: tryouts.durationMinutes,
      accessLevel: tryouts.accessLevel,
      questionCount: sql<number>`count(${tryoutQuestions.id})`,
    })
    .from(tryouts)
    .innerJoin(categories, eq(categories.id, tryouts.categoryId))
    .leftJoin(
      tryoutQuestions,
      and(
        eq(tryoutQuestions.tryoutId, tryouts.id),
        sql`${tryoutQuestions.questionId} in (select id from questions where status = 'published')`,
      ),
    )
    .where(eq(tryouts.status, "published"))
    .groupBy(
      tryouts.id,
      categories.id,
    )
    .orderBy(desc(tryouts.publishedAt), tryouts.title);

  return rows.map((row) => ({
    ...row,
    accessLevel: normalizeTryoutAccessLevel(row.accessLevel),
    categoryColor: row.categoryColor ?? "#205072",
    questionCount: Number(row.questionCount ?? 0),
  }));
});
