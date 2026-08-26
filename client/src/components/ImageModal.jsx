import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react';

const ImageModal = ({ isOpen, onClose, imageSrc, title, subtitle }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.3, 0.5));
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    setScale(1);
    setRotation(0);
  };

  const handleRotate = (e) => {
    e.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = imageSrc;
      const safeTitle = (title || 'proof-photo').toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `${safeTitle}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  return (
    <div
      className="image-lightbox-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          right: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '0.6rem 1rem',
          color: '#ffffff',
          zIndex: 100000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ minWidth: 0, flex: 1, marginRight: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title || '📸 Photo Preview'}
          </h3>
          {subtitle && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <ZoomOut size={18} />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 90°"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCw size={18} />
          </button>
          {scale !== 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '8px',
                padding: '0.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <Maximize2 size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            title="Download Image"
            style={{
              background: '#4f46e5',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.4rem 0.65rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={16} /> Save
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Preview (Esc)"
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '0.2rem',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image Display Area */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          paddingTop: '3.5rem'
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxHeight: '85vh',
            maxWidth: '90vw',
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            cursor: scale > 1 ? 'grab' : 'zoom-in',
            userSelect: 'none'
          }}
          onDoubleClick={() => setScale((prev) => (prev > 1 ? 1 : 2))}
        >
          <img
            src={imageSrc}
            alt={title || 'Full size proof'}
            style={{
              maxWidth: '100%',
              maxHeight: '82vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#000'
            }}
          />
        </div>
      </div>

      {/* Footer / Helper instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          color: '#cbd5e1',
          fontSize: '0.75rem',
          pointerEvents: 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        💡 Double click image to Zoom ({Math.round(scale * 100)}%) • Click outside or press Esc to close
      </div>
    </div>
  );
};

export default ImageModal;
