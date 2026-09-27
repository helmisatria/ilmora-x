import { hasFullTryoutReviewAccess, isPremiumQuestionLocked } from "../premium-access/premium-access";

export const FREE_WRONG_PREVIEW = 3;

type ReviewQuestion = {
  accessLevel: "free" | "premium";
  isCorrect: boolean | null;
  correctOption: "A" | "B" | "C" | "D" | "E";
  correctIndex: number;
  explanation: string;
  videoUrl: string | null;
  pictureUrl: string | null;
  relatedMateri: { id: string; title: string } | null;
};

type ReviewAccessInput = {
  tryoutAccessLevel: string;
  hasPremiumMembership: boolean;
  hasLifetimeTryoutPurchase: boolean;
};

// Decides which review questions a Student may fully see, and blanks the paid content
// (answer key, explanation, media) of the locked ones before it leaves the server.
export function applyReviewAccess<T extends ReviewQuestion>(questions: T[], access: ReviewAccessInput) {
  const hasFullReviewAccess = hasFullTryoutReviewAccess({
    accessLevel: access.tryoutAccessLevel,
    hasPremiumMembership: access.hasPremiumMembership,
    hasLifetimeTryoutPurchase: access.hasLifetimeTryoutPurchase,
  });
  let wrongIndex = 0;

  const reviewedQuestions = questions.map((question) => {
    const hasVideo = Boolean(question.videoUrl?.trim());

    if (hasFullReviewAccess) {
      return { ...question, locked: false, hasVideo };
    }

    const isPremiumLocked = isPremiumQuestionLocked({
      questionAccessLevel: question.accessLevel,
      tryoutAccessLevel: access.tryoutAccessLevel,
      hasPremiumMembership: access.hasPremiumMembership,
      hasLifetimeTryoutPurchase: access.hasLifetimeTryoutPurchase,
    });
    let isOverFreePreview = false;

    if (!isPremiumLocked && question.isCorrect !== true) {
      isOverFreePreview = wrongIndex >= FREE_WRONG_PREVIEW;
      wrongIndex++;
    }

    if (!isPremiumLocked && !isOverFreePreview) {
      return { ...question, locked: false, hasVideo };
    }

    const revealsAnswer = question.isCorrect === true;

    return {
      ...question,
      locked: true,
      hasVideo,
      correctOption: revealsAnswer ? question.correctOption : null,
      correctIndex: revealsAnswer ? question.correctIndex : null,
      explanation: "",
      videoUrl: question.accessLevel === "free" ? question.videoUrl : null,
      pictureUrl: null,
      relatedMateri: null,
    };
  });

  return { hasFullReviewAccess, questions: reviewedQuestions };
}
