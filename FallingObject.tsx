import React, { useState } from 'react';
import { ItemType, GameObject } from '../types';

interface FallingObjectProps {
  data: GameObject;
  isFrozen: boolean;
  onHit: (id: string, type: ItemType, x: number, y: number) => void;
  onMiss: (id: string) => void;
}

export const FallingObject: React.FC<FallingObjectProps> = ({ data, isFrozen, onHit, onMiss }) => {
  const [hasHit, setHasHit] = useState(false);

  const handleAnimationEnd = () => {
    if (!hasHit) {
      onMiss(data.id);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple hits on same object
    if (hasHit) return;

    setHasHit(true);
    onHit(data.id, data.type, e.clientX, e.clientY);
  };
  
  const renderContent = () => {
    switch(data.type) {
      case ItemType.MELON: return '🍈';
      case ItemType.BOMB: return '💣';
      case ItemType.ICE: return '❄️';
      default: return '❓';
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onAnimationEnd={handleAnimationEnd}
      className={`absolute text-6xl cursor-pointer select-none z-10 will-change-transform ${isFrozen ? 'paused' : ''}`}
      style={{
        left: `${data.x}%`,
        top: '-100px', // Start above
        animation: `fall ${data.duration}s linear forwards`,
        animationPlayState: isFrozen ? 'paused' : 'running'
      }}
    >
      <div className="filter drop-shadow-lg transform transition-transform active:scale-95">
        {renderContent()}
      </div>
    </div>
  );
};