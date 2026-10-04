import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import { questions, tryoutQuestions, tryouts } from "../../lib/db/schema";
import { conflict, notFound } from "../../lib/http/errors";

export type ContentTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type ContentRevision = { expectedUpdatedAt: string };

// Shared questions span multiple try-outs. One transaction-scoped lock gives all
// admin content writes the same lock order, including workbook replacements.
// It works across app instances and is released automatically on rollback.
export async function withAdminContentTransaction<T>(work: (tx: ContentTransaction) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(164731, 1)`);
    return work(tx);
  });
}

export function assertContentRevision(actual: Date, expected: string) {
  if (actual.getTime() !== new Date(expected).getTime()) {
    throw conflict("Admin lain sudah mengubah data ini. Salin isian yang ingin dipertahankan, lalu muat ulang halaman dan periksa perubahan terbaru sebelum menyimpan lagi.");
  }
}

export async function requireTryoutRevision(tx: ContentTransaction, id: string, expected: string) {
  const [row] = await tx.select().from(tryouts).where(eq(tryouts.id, id)).limit(1);
  if (!row) throw notFound("Try-out tidak ditemukan.");
  assertContentRevision(row.updatedAt, expected);
  return row;
}

export async function requireQuestionRevision(tx: ContentTransaction, id: string, expected: string) {
  const [row] = await tx.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!row) throw notFound("Soal tidak ditemukan.");
  assertContentRevision(row.updatedAt, expected);
  return row;
}

// Force a different millisecond even for two writes in the same millisecond.
// JS/JSON timestamps round PostgreSQL's default microseconds to milliseconds.
export const nextTryoutRevision = sql`greatest(date_trunc('milliseconds', clock_timestamp()), date_trunc('milliseconds', ${tryouts.updatedAt}) + interval '1 millisecond')`;
export const nextQuestionRevision = sql`greatest(date_trunc('milliseconds', clock_timestamp()), date_trunc('milliseconds', ${questions.updatedAt}) + interval '1 millisecond')`;

export async function touchTryout(tx: ContentTransaction, id: string) {
  await tx.update(tryouts).set({ updatedAt: nextTryoutRevision }).where(eq(tryouts.id, id));
}

export async function touchQuestionTryouts(tx: ContentTransaction, questionId: string) {
  await tx.update(tryouts).set({ updatedAt: nextTryoutRevision }).where(inArray(tryouts.id,
    tx.select({ id: tryoutQuestions.tryoutId }).from(tryoutQuestions).where(eq(tryoutQuestions.questionId, questionId))));
}
