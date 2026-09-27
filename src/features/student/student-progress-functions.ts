import { createServerFn } from "@tanstack/react-start";
import { hasPremiumMembershipEndsAt } from "../premium-access/premium-access";
import { getStudentEvaluation } from "../student-evaluation/student-evaluation";
import { buildProgressSummary } from "./progress-summary";
import { getStudentViewer } from "./student-viewer.server";

export const listProgressSummary = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await getStudentViewer();
  const evaluation = await getStudentEvaluation(viewer.userId);
  const hasPremiumEvaluation = hasPremiumMembershipEndsAt(viewer.premiumMembershipEndsAt);

  return buildProgressSummary(evaluation, hasPremiumEvaluation);
});
