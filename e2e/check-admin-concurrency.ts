import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import "dotenv/config";

const url = new URL(process.env.DATABASE_URL ?? "http://missing");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/ilmora_admin_qa") {
  throw new Error("Use only isolated local ilmora_admin_qa.");
}

const { db, closeDb } = await import("../src/lib/db/client");
const { tryouts, questions, tryoutQuestions, categories, subCategories, topics } = await import("../src/lib/db/schema");
const { eq, sql } = await import("drizzle-orm");
const content = await import("../src/features/tryout-content/tryout-content-management");
const bank = await import("../src/features/tryout-content/question-content-management");
const { default: postgres } = await import("postgres");
const lockClient = postgres(url.toString(), { max: 1 });

function importWorkbook(data: Parameters<typeof content.importTryoutWorkbook>[0]) {
  return content.importTryoutWorkbook({ ...data, source: { version: 1, tryoutId: data.tryoutId, updatedAt: data.expectedUpdatedAt } });
}

async function tryoutRow(id: string) {
  const [row] = await db.select().from(tryouts).where(eq(tryouts.id, id));
  assert.ok(row);
  return row;
}

async function assignedQuestions(id: string) {
  return db.select({ question: questions, sortOrder: tryoutQuestions.sortOrder }).from(tryoutQuestions)
    .innerJoin(questions, eq(questions.id, tryoutQuestions.questionId))
    .where(eq(tryoutQuestions.tryoutId, id)).orderBy(tryoutQuestions.sortOrder);
}

async function waitForQueuedWriters(count: number) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const rows = await db.execute(sql`select count(*)::int as count from pg_locks
      where locktype = 'advisory' and classid = 164731 and objid = 1 and not granted`);
    if (Number(rows[0].count) >= count) return;
    await delay(10);
  }
  throw new Error(`Expected ${count} content writers waiting for the lock.`);
}

// Hold the real content lock until both writers queue. Test both admission orders
// without relying on a sleep to make their transactions overlap.
async function compete(first: () => Promise<unknown>, second: () => Promise<unknown>) {
  const results: Promise<PromiseSettledResult<unknown>>[] = [];
  try {
    await lockClient.begin(async (lock) => {
      await lock`select pg_advisory_xact_lock(164731, 1)`;
      results.push(Promise.allSettled([first()]).then(([result]) => result));
      await waitForQueuedWriters(1);
      results.push(Promise.allSettled([second()]).then(([result]) => result));
      await waitForQueuedWriters(2);
    });
  } catch (error) {
    await Promise.all(results);
    throw error;
  }
  return Promise.all(results);
}

function expectConflict(result: PromiseSettledResult<unknown>, message: RegExp) {
  assert.equal(result.status, "rejected");
  if (result.status !== "rejected") return;
  assert.equal(result.reason.status, 409);
  assert.match(result.reason.message, message);
}

try {
  const [category] = await db.select().from(categories).limit(1);
  const [sub] = await db.select().from(subCategories).where(eq(subCategories.categoryId, category.id)).limit(1);
  const [topic] = await db.select().from(topics).where(eq(topics.subCategoryId, sub.id)).limit(1);
  const metadata = { title: "", description: "Local race check", categoryId: category.id,
    durationMinutes: 30, accessLevel: "free" as const, status: "published" as const };
  const question = { categoryId: category.id, subCategoryId: sub.id, topicId: topic.id,
    questionText: "Local QA", optionA: "A", optionB: "B", optionC: "C", optionD: "D",
    correctOption: "B" as const, explanation: "Pembahasan awal", pictureUrl: "https://example.test/original.png",
    accessLevel: "free" as const, status: "published" as const };
  const staleMessage = /Admin lain sudah mengubah/;

  async function fixture(count = 1, status: "published" | "draft" = "published") {
    const tryout = { ...metadata, title: `QA concurrency ${randomUUID()}`, status };
    const created = await content.createTryoutFromWorkbook({ tryout,
      questions: Array.from({ length: count }, (_, index) => ({ ...question, sortOrder: index + 1 })) });
    return { id: created.id, tryout, revision: (await tryoutRow(created.id)).updatedAt.toISOString(),
      assigned: await assignedQuestions(created.id) };
  }

  await test("stale metadata is rejected and parallel removals preserve one published question", async () => {
    const f = await fixture(2);
    const edit = { ...f.tryout, tryoutId: f.id, expectedUpdatedAt: f.revision, title: "Admin A saved" };
    await content.updateTryoutContent(edit);
    await assert.rejects(content.updateTryoutContent({ ...edit, title: "Admin B stale overwrite" }), staleMessage);
    assert.equal((await tryoutRow(f.id)).title, "Admin A saved");
    const revision = (await tryoutRow(f.id)).updatedAt.toISOString();
    const remove = (index: number) => () => content.removeTryoutQuestionContent({ tryoutId: f.id,
      questionId: f.assigned[index].question.id, expectedUpdatedAt: revision });
    const results = await compete(remove(0), remove(1));
    assert.equal(results[0].status, "fulfilled");
    expectConflict(results[1], staleMessage);
    assert.equal((await assignedQuestions(f.id)).filter(row => row.question.status === "published").length, 1);
  });

  await test("competing imports commit one whole workbook in either admission order", async () => {
    for (const winner of ["A", "B"] as const) {
      const f = await fixture();
      const loser = winner === "A" ? "B" : "A";
      const payload = (name: "A" | "B") => ({ tryoutId: f.id, expectedUpdatedAt: f.revision,
        tryout: { ...f.tryout, title: `${f.tryout.title} ${name}` },
        questions: [1, 2].map(sortOrder => ({ ...question, sortOrder, correctOption: name,
          questionText: `${f.id} import ${name} ${sortOrder}`, explanation: `Pembahasan ${name}`,
          pictureUrl: `https://example.test/${name}.png` })) });
      const results = await compete(() => importWorkbook(payload(winner)),
        () => importWorkbook(payload(loser)));
      assert.equal(results[0].status, "fulfilled");
      expectConflict(results[1], staleMessage);
      assert.equal((await tryoutRow(f.id)).title, payload(winner).tryout.title);
      const saved = await assignedQuestions(f.id);
      assert.deepEqual(saved.map(row => row.sortOrder), [1, 2]);
      for (const row of saved) {
        assert.equal(row.question.correctOption, winner);
        assert.equal(row.question.explanation, `Pembahasan ${winner}`);
        assert.equal(row.question.pictureUrl, `https://example.test/${winner}.png`);
      }
      const orphans = await db.select().from(questions).where(eq(questions.questionText, `${f.id} import ${loser} 1`));
      assert.equal(orphans.length, 0);
    }
  });

  await test("import versus manual edit preserves the winner's key, explanation and image in both orders", async () => {
    for (const importFirst of [true, false]) {
      const f = await fixture();
      const questionId = f.assigned[0].question.id;
      const importedQuestion = { ...question, questionId, sortOrder: 1, correctOption: "C" as const,
        explanation: "Pembahasan Excel", pictureUrl: "https://example.test/import.png" };
      const importWrite = () => importWorkbook({ tryoutId: f.id, expectedUpdatedAt: f.revision,
        tryout: { ...f.tryout, title: `${f.tryout.title} imported` }, questions: [importedQuestion] });
      const manualQuestion = { ...question, tryoutId: f.id, questionId, sortOrder: 1, expectedUpdatedAt: f.revision,
        correctOption: "D" as const, explanation: "Pembahasan manual", pictureUrl: "https://example.test/manual.png" };
      const manualWrite = () => content.updateTryoutQuestionContent(manualQuestion);
      const results = await compete(importFirst ? importWrite : manualWrite, importFirst ? manualWrite : importWrite);
      assert.equal(results[0].status, "fulfilled");
      expectConflict(results[1], staleMessage);
      const saved = await assignedQuestions(f.id);
      assert.equal(saved.length, 1);
      assert.equal(saved[0].question.id, questionId);
      const expected = importFirst ? importedQuestion : manualQuestion;
      assert.equal(saved[0].question.correctOption, expected.correctOption);
      assert.equal(saved[0].question.explanation, expected.explanation);
      assert.equal(saved[0].question.pictureUrl, expected.pictureUrl);
      assert.equal((await tryoutRow(f.id)).title, importFirst ? `${f.tryout.title} imported` : f.tryout.title);
    }
  });

  await test("bank hide versus tryout publish cannot publish an empty tryout in either order", async () => {
    for (const hideFirst of [true, false]) {
      const f = await fixture(1, "draft");
      const hide = () => bank.setQuestionPublication({ questionId: f.assigned[0].question.id,
        expectedUpdatedAt: f.assigned[0].question.updatedAt.toISOString(), status: "unpublished" });
      const publish = () => content.publishTryoutContent(f.id, f.revision);
      const results = await compete(hideFirst ? hide : publish, hideFirst ? publish : hide);
      assert.equal(results[0].status, "fulfilled");
      expectConflict(results[1], hideFirst ? staleMessage : /satu-satunya soal tayang/);
      assert.equal((await tryoutRow(f.id)).status, hideFirst ? "draft" : "published");
      const published = (await assignedQuestions(f.id)).filter(row => row.question.status === "published");
      assert.equal(published.length, hideFirst ? 0 : 1);
    }
  });

  await test("two bank hides preserve one published question in both orders", async () => {
    for (const first of [0, 1]) {
      const f = await fixture(2);
      const hide = (index: number) => () => bank.setQuestionPublication({ questionId: f.assigned[index].question.id,
        expectedUpdatedAt: f.assigned[index].question.updatedAt.toISOString(), status: "unpublished" });
      const results = await compete(hide(first), hide(1 - first));
      assert.equal(results[0].status, "fulfilled");
      expectConflict(results[1], /satu-satunya soal tayang/);
      assert.equal((await tryoutRow(f.id)).status, "published");
      const saved = await assignedQuestions(f.id);
      assert.equal(saved.filter(row => row.question.status === "published").length, 1);
      for (const row of saved) {
        assert.equal(row.question.correctOption, question.correctOption);
        assert.equal(row.question.explanation, question.explanation);
        assert.equal(row.question.pictureUrl, question.pictureUrl);
      }
    }
  });

  await test("a bank edit invalidates all shared tryout revisions and stale bank saves", async () => {
    const f = await fixture();
    const source = f.assigned[0].question;
    const second = await content.createTryoutFromWorkbook({ tryout: { ...f.tryout, title: `${f.tryout.title} shared` },
      questions: [{ ...question, sortOrder: 1, questionId: source.id }] });
    const secondRevision = (await tryoutRow(second.id)).updatedAt.toISOString();
    const edit = { ...question, questionId: source.id, expectedUpdatedAt: source.updatedAt.toISOString(),
      explanation: "Shared bank update" };
    await bank.updateQuestionContent(edit);
    await assert.rejects(bank.updateQuestionContent({ ...edit, explanation: "Stale bank update" }), staleMessage);
    for (const [id, revision] of [[f.id, f.revision], [second.id, secondRevision]]) {
      await assert.rejects(importWorkbook({ tryoutId: id, expectedUpdatedAt: revision,
        tryout: f.tryout, questions: [{ ...question, sortOrder: 1, questionId: source.id }] }), staleMessage);
      assert.equal((await assignedQuestions(id))[0].question.explanation, edit.explanation);
    }
  });

  await test("offline imports reject stale, legacy and wrong-tryout files even with a fresh page revision", async () => {
    const f = await fixture();
    await content.updateTryoutContent({ ...f.tryout, tryoutId: f.id, expectedUpdatedAt: f.revision,
      title: `${f.tryout.title} newer` });
    const current = (await tryoutRow(f.id)).updatedAt.toISOString();
    const replacement = { tryoutId: f.id, expectedUpdatedAt: current,
      tryout: { ...f.tryout, title: "Must never overwrite" }, questions: [{ ...question, sortOrder: 1 }] };
    for (const [source, message] of [
      [{ version: 1 as const, tryoutId: f.id, updatedAt: f.revision }, /sudah tertinggal/],
      [undefined, /belum memiliki versi sumber/],
      [{ version: 1 as const, tryoutId: randomUUID(), updatedAt: current }, /try-out lain/],
    ] as const) {
      const [result] = await Promise.allSettled([content.importTryoutWorkbook({ ...replacement, source })]);
      expectConflict(result, message);
      assert.equal((await tryoutRow(f.id)).title, `${f.tryout.title} newer`);
      assert.equal((await tryoutRow(f.id)).updatedAt.toISOString(), current);
      assert.equal((await assignedQuestions(f.id))[0].question.id, f.assigned[0].question.id);
    }
    await content.importTryoutWorkbook({ ...replacement, tryout: { ...f.tryout, title: `${f.tryout.title} fresh` },
      source: { version: 1, tryoutId: f.id, updatedAt: current } });
    assert.equal((await tryoutRow(f.id)).title, `${f.tryout.title} fresh`);
  });

  await test("500-row import completes while another admin save waits for the content lock", async () => {
    const f = await fixture();
    const other = await fixture();
    const started = performance.now();
    const results = await compete(() => importWorkbook({ tryoutId: f.id, expectedUpdatedAt: f.revision,
      tryout: f.tryout, questions: Array.from({ length: 500 }, (_, index) => ({ ...question, sortOrder: index + 1 })) }),
      () => content.updateTryoutContent({ ...other.tryout, tryoutId: other.id, expectedUpdatedAt: other.revision, title: `${other.tryout.title} saved` }));
    assert.deepEqual(results.map(result => result.status), ["fulfilled", "fulfilled"]);
    assert.equal((await assignedQuestions(f.id)).length, 500);
    console.log(`Local 500-row import plus queued save: ${Math.round(performance.now() - started)} ms (not a capacity benchmark).`);
  });
} finally {
  await lockClient.end();
  await closeDb();
}
