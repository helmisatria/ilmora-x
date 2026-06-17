import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  categories,
  products,
  questions,
  tryoutQuestions,
  tryouts,
} from "../../lib/db/schema";
import { normalizeTryoutAccessLevel } from "../premium-access/premium-access";
import { getTryoutEntitlementAccess } from "../premium-access/payment-service";
import { getStudentViewer } from "../student/student-viewer.server";

export const listPublishedTryouts = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await getStudentViewer();
  const [rows, lifetimeProducts] = await Promise.all([
    db
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
      .orderBy(desc(tryouts.publishedAt), tryouts.title),
    db
      .select({
        id: products.id,
        contentId: products.contentId,
        price: products.price,
      })
      .from(products)
      .where(and(
        eq(products.type, "lifetime_tryout"),
        eq(products.contentType, "tryout"),
        eq(products.active, true),
      )),
  ]);

  const productByTryoutId = new Map(
    lifetimeProducts
      .filter((product) => product.contentId)
      .map((product) => [product.contentId as string, product]),
  );

  return Promise.all(rows.map(async (row) => {
    const access = await getTryoutEntitlementAccess(viewer.userId, row.id);
    const lifetimeProduct = productByTryoutId.get(row.id);

    return {
      ...row,
      accessLevel: normalizeTryoutAccessLevel(row.accessLevel),
      categoryColor: row.categoryColor ?? "#205072",
      questionCount: Number(row.questionCount ?? 0),
      hasPremiumMembership: access.hasPremiumMembership,
      hasLifetimeTryoutPurchase: access.hasLifetimeTryoutPurchase,
      lifetimeProductId: lifetimeProduct?.id ?? null,
      lifetimeProductPrice: lifetimeProduct?.price ?? null,
    };
  }));
});
