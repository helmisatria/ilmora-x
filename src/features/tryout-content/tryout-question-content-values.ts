import type {
  TryoutQuestionContentInput,
  TryoutWorkbookQuestion,
} from "./tryout-content-types";

export function sameWorkbookQuestionContent(
  existingQuestion: {
    categoryId: string;
    subCategoryId: string;
    topicId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    optionE: string | null;
    correctOption: string;
    explanation: string;
    videoUrl: string | null;
    accessLevel: string;
    status: string;
  },
  workbookQuestion: TryoutWorkbookQuestion,
) {
  return (
    existingQuestion.categoryId === workbookQuestion.categoryId &&
    existingQuestion.subCategoryId === workbookQuestion.subCategoryId &&
    existingQuestion.topicId === workbookQuestion.topicId &&
    existingQuestion.questionText === workbookQuestion.questionText &&
    existingQuestion.optionA === workbookQuestion.optionA &&
    existingQuestion.optionB === workbookQuestion.optionB &&
    existingQuestion.optionC === workbookQuestion.optionC &&
    existingQuestion.optionD === workbookQuestion.optionD &&
    (existingQuestion.optionE ?? "") === (workbookQuestion.optionE ?? "") &&
    existingQuestion.correctOption === workbookQuestion.correctOption &&
    existingQuestion.explanation === workbookQuestion.explanation &&
    (existingQuestion.videoUrl ?? "") === (workbookQuestion.videoUrl ?? "") &&
    existingQuestion.accessLevel === workbookQuestion.accessLevel &&
    existingQuestion.status === workbookQuestion.status
  );
}

export function toQuestionInsertValues(question: TryoutWorkbookQuestion) {
  return {
    categoryId: question.categoryId,
    subCategoryId: question.subCategoryId,
    topicId: question.topicId,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    optionE: normalizeOptionalText(question.optionE),
    correctOption: question.correctOption,
    explanation: question.explanation,
    videoUrl: normalizeOptionalText(question.videoUrl),
    accessLevel: question.accessLevel,
    status: question.status,
  };
}

export function toEditableQuestionValues(question: TryoutQuestionContentInput) {
  return {
    categoryId: question.categoryId,
    subCategoryId: question.subCategoryId,
    topicId: question.topicId,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    optionE: normalizeOptionalText(question.optionE),
    correctOption: question.correctOption,
    explanation: question.explanation,
    videoUrl: normalizeOptionalText(question.videoUrl),
    pictureUrl: normalizeOptionalText(question.pictureUrl),
    accessLevel: question.accessLevel,
    status: question.status,
  };
}

export function sameEditableQuestionContent(
  existingQuestion: {
    categoryId: string;
    subCategoryId: string;
    topicId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    optionE: string | null;
    correctOption: string;
    explanation: string;
    videoUrl: string | null;
    pictureUrl: string | null;
    accessLevel: string;
    status: string;
  },
  nextQuestion: ReturnType<typeof toEditableQuestionValues>,
) {
  return (
    existingQuestion.categoryId === nextQuestion.categoryId &&
    existingQuestion.subCategoryId === nextQuestion.subCategoryId &&
    existingQuestion.topicId === nextQuestion.topicId &&
    existingQuestion.questionText === nextQuestion.questionText &&
    existingQuestion.optionA === nextQuestion.optionA &&
    existingQuestion.optionB === nextQuestion.optionB &&
    existingQuestion.optionC === nextQuestion.optionC &&
    existingQuestion.optionD === nextQuestion.optionD &&
    existingQuestion.optionE === nextQuestion.optionE &&
    existingQuestion.correctOption === nextQuestion.correctOption &&
    existingQuestion.explanation === nextQuestion.explanation &&
    existingQuestion.videoUrl === nextQuestion.videoUrl &&
    existingQuestion.pictureUrl === nextQuestion.pictureUrl &&
    existingQuestion.accessLevel === nextQuestion.accessLevel &&
    existingQuestion.status === nextQuestion.status
  );
}

function normalizeOptionalText(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return null;

  return trimmedValue;
}
