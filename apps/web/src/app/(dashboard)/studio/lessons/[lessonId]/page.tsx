import LessonEditorPageClient from "./_components/lesson-editor-page-client";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonEditorPage({ params }: Props) {
  const { lessonId } = await params;
  return <LessonEditorPageClient lessonId={lessonId} />;
}
