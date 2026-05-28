export type TryoutAccessLevel = "free" | "premium";
export type QuestionAccessLevel = "free" | "premium";
export type ContentStatus = "draft" | "published" | "unpublished";
export type QuestionOption = "A" | "B" | "C" | "D" | "E";

export type CategoryOption = {
  id: string;
  name: string;
  subCategories?: { id: string; name: string }[];
};

export type TryoutContentInput = {
  title: string;
  description: string;
  icon?: string;
  categoryId: string;
  durationMinutes: number;
  accessLevel: TryoutAccessLevel;
};

export type TryoutWorkbookTryout = {
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  durationMinutes: number;
  accessLevel: TryoutAccessLevel;
  status: ContentStatus;
};

export type TryoutWorkbookQuestion = {
  questionId?: string;
  sortOrder: number;
  categoryId: string;
  categoryName?: string;
  subCategoryId: string;
  subCategoryName?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctOption: QuestionOption;
  explanation: string;
  videoUrl?: string;
  accessLevel: QuestionAccessLevel;
  status: ContentStatus;
};

export type TryoutWorkbookInput = {
  tryout: TryoutWorkbookTryout;
  questions: TryoutWorkbookQuestion[];
};

export type TryoutQuestionContentInput = {
  tryoutId: string;
  questionId: string;
  sortOrder: number;
  categoryId: string;
  subCategoryId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctOption: QuestionOption;
  explanation: string;
  videoUrl?: string;
  pictureUrl?: string;
  accessLevel: QuestionAccessLevel;
  status: ContentStatus;
};
