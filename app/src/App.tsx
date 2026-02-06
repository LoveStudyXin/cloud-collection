import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CloudBackground } from '@/components/CloudBackground';
import { HomePage } from '@/pages/HomePage';
import { RecognitionPage } from '@/pages/RecognitionPage';
import { ResultPage } from '@/pages/ResultPage';
import { DetailPage } from '@/pages/DetailPage';
import { CollectionPage } from '@/pages/CollectionPage';
import { useUserState } from '@/hooks/useUserState';
import { cloudCardMap } from '@/data/cloudCards';
import { compressToThumbnail } from '@/services/cloudRecognition';
import type { RecognitionResult, CloudCard, AIAnalysis } from '@/types/cloud';
import './App.css';

type ViewState =
  | { type: 'home' }
  | { type: 'recognition'; imageUrl?: string; imageFile?: File }
  | { type: 'result'; result: RecognitionResult; imageUrl?: string; thumbnail?: string }
  | { type: 'detail'; cardId: string; aiAnalysis?: AIAnalysis }
  | { type: 'collection' };

function App() {
  const [view, setView] = useState<ViewState>({ type: 'home' });
  const { points, getCardState, litCard, unlockCard, getStreakInfo, isInCooldown } = useUserState();

  // Handle image capture
  const handleCapture = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setView({ type: 'recognition', imageUrl: url, imageFile: file });
  }, []);

  // Handle recognition error
  const handleRecognitionError = useCallback((error: string) => {
    alert(error);
    setView({ type: 'home' });
  }, []);

  // Handle recognition complete — pre-generate thumbnail so it's ready when lit
  const handleRecognitionComplete = useCallback((result: RecognitionResult) => {
    setView(prev => {
      const imageUrl = prev.type === 'recognition' ? prev.imageUrl : undefined;
      const imageFile = prev.type === 'recognition' ? prev.imageFile : undefined;
      // Generate thumbnail in background, update view when ready
      if (imageFile) {
        compressToThumbnail(imageFile).then(thumb => {
          setView(v => v.type === 'result' ? { ...v, thumbnail: thumb } : v);
        }).catch(() => {});
      }
      return { type: 'result', result, imageUrl };
    });
  }, []);

  // Handle lit card (from result page)
  const handleLitCard = useCallback(() => {
    if (view.type === 'result') {
      const { result, imageUrl, thumbnail } = view;

      // Navigate to detail immediately
      setView({ type: 'detail', cardId: result.cloudId, aiAnalysis: result.aiAnalysis });

      // Lit card with pre-generated thumbnail
      litCard(result.cloudId, imageUrl, thumbnail, result.aiAnalysis);
    }
  }, [view, litCard]);

  // Handle card click (from home or collection)
  const handleCardClick = useCallback((cardId: string) => {
    setView({ type: 'detail', cardId });
  }, []);

  // Go home
  const goHome = useCallback(() => {
    setView({ type: 'home' });
  }, []);

  // Go to collection
  const goCollection = useCallback(() => {
    setView({ type: 'collection' });
  }, []);

  return (
    <div className="relative min-h-screen">
      <CloudBackground />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {view.type === 'home' && (
            <HomePage
              key="home"
              points={points}
              getCardState={getCardState}
              onCapture={handleCapture}
              onCardClick={handleCardClick}
              onCollectionClick={goCollection}
            />
          )}

          {view.type === 'recognition' && (
            <RecognitionPage
              key="recognition"
              imageUrl={view.imageUrl}
              imageFile={view.imageFile}
              onRecognitionComplete={handleRecognitionComplete}
              onError={handleRecognitionError}
            />
          )}

          {view.type === 'result' && (() => {
            const streakInfo = getStreakInfo(view.result.rarity);
            const cooldown = isInCooldown(view.result.cloudId);
            return (
              <ResultPage
                key="result"
                result={view.result}
                streakInfo={streakInfo}
                inCooldown={cooldown}
                onLitCard={handleLitCard}
                onBack={goHome}
              />
            );
          })()}

          {view.type === 'detail' && (() => {
            const card = cloudCardMap.get(view.cardId);
            if (!card) return null;
            return (
              <DetailPage
                key={`detail-${view.cardId}`}
                card={card}
                cardState={getCardState(view.cardId)}
                aiAnalysis={view.aiAnalysis}
                onBack={goHome}
              />
            );
          })()}

          {view.type === 'collection' && (
            <CollectionPage
              key="collection"
              points={points}
              getCardState={getCardState}
              onCardClick={(card: CloudCard) => handleCardClick(card.id)}
              onUnlockCard={unlockCard}
              onBack={goHome}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
