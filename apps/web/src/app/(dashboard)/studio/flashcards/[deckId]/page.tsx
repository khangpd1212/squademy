import { DeckEditorView } from "./_components/deck-editor-view";

interface DeckEditorPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckEditorPage({ params }: DeckEditorPageProps) {
  const { deckId } = await params;
  return <DeckEditorView deckId={deckId} />;
}
