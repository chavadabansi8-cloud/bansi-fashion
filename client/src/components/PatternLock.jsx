import { useState, useRef, useEffect } from 'react';
import { RotateCcw, Lock } from 'lucide-react';

const PatternLock = ({ onComplete, onReset, title = 'Draw Pattern Lock' }) => {
  const [selectedDots, setSelectedDots] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef(null);

  // 3x3 Grid positions (percentages)
  const dots = [
    { id: 1, row: 0, col: 0 },
    { id: 2, row: 0, col: 1 },
    { id: 3, row: 0, col: 2 },
    { id: 4, row: 1, col: 0 },
    { id: 5, row: 1, col: 1 },
    { id: 6, row: 1, col: 2 },
    { id: 7, row: 2, col: 0 },
    { id: 8, row: 2, col: 1 },
    { id: 9, row: 2, col: 2 }
  ];

  const getDotCoordinates = (dotId) => {
    const dot = dots.find(d => d.id === dotId);
    if (!dot) return { x: 0, y: 0 };
    const x = 20 + dot.col * 30;
    const y = 20 + dot.row * 30;
    return { x, y };
  };

  const getDotFromElement = (element) => {
    if (!element) return null;
    const dotId = element.getAttribute('data-dot-id');
    return dotId ? parseInt(dotId, 10) : null;
  };

  const getDotFromCoords = (clientX, clientY) => {
    const target = document.elementFromPoint(clientX, clientY);
    return getDotFromElement(target);
  };

  const handleStart = (dotId) => {
    setIsDrawing(true);
    setSelectedDots([dotId]);
  };

  const handleMove = (dotId) => {
    if (!isDrawing || !dotId) return;
    if (!selectedDots.includes(dotId)) {
      const newSequence = [...selectedDots, dotId];
      setSelectedDots(newSequence);
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (selectedDots.length >= 3) {
      const patternString = selectedDots.join('-');
      if (onComplete) onComplete(patternString);
    }
  };

  // Touch event listeners for seamless mobile dragging
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchMove = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dotId = getDotFromCoords(touch.clientX, touch.clientY);
      if (dotId) handleMove(dotId);
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDrawing, selectedDots]);

  const handleClear = () => {
    setSelectedDots([]);
    setIsDrawing(false);
    if (onReset) onReset();
  };

  return (
    <div className="pattern-lock-wrapper" style={{ textAlign: 'center', margin: '0 auto', maxWidth: '280px' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
        <Lock size={15} color="var(--primary)" /> {title}
      </div>

      <div
        ref={containerRef}
        className="pattern-lock-container"
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        style={{
          position: 'relative',
          width: '240px',
          height: '240px',
          margin: '0 auto',
          background: 'radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '24px',
          border: '2px solid #cbd5e1',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05), 0 10px 25px -5px rgba(0,0,0,0.08)',
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'pointer'
        }}
      >
        {/* Lines SVG overlay */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {selectedDots.map((dotId, index) => {
            if (index === 0) return null;
            const prevDotId = selectedDots[index - 1];
            const start = getDotCoordinates(prevDotId);
            const end = getDotCoordinates(dotId);
            return (
              <line
                key={`line-${index}`}
                x1={`${start.x}%`}
                y1={`${start.y}%`}
                x2={`${end.x}%`}
                y2={`${end.y}%`}
                stroke="var(--primary)"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.85"
              />
            );
          })}
        </svg>

        {/* 9 Pattern Dots */}
        {dots.map((dot) => {
          const isSelected = selectedDots.includes(dot.id);
          const coords = getDotCoordinates(dot.id);
          return (
            <div
              key={dot.id}
              data-dot-id={dot.id}
              onMouseDown={() => handleStart(dot.id)}
              onMouseEnter={() => handleMove(dot.id)}
              onTouchStart={() => handleStart(dot.id)}
              style={{
                position: 'absolute',
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                transition: 'all 0.15s ease',
                zIndex: 2
              }}
            >
              <div
                data-dot-id={dot.id}
                style={{
                  width: isSelected ? '22px' : '14px',
                  height: isSelected ? '22px' : '14px',
                  borderRadius: '50%',
                  background: isSelected ? 'var(--primary)' : '#64748b',
                  boxShadow: isSelected ? '0 0 12px var(--primary), 0 0 0 4px rgba(79, 70, 229, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
        <span style={{ fontSize: '0.78rem', color: selectedDots.length >= 3 ? '#16a34a' : '#64748b', fontWeight: 600 }}>
          {selectedDots.length === 0 ? 'Connect at least 3 dots' : selectedDots.length < 3 ? 'Keep connecting...' : `Pattern: ${selectedDots.length} dots`}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleClear}
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>
    </div>
  );
};

export default PatternLock;
