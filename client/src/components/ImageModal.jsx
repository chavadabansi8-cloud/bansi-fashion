import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, ExternalLink, AlertCircle } from 'lucide-react';

const ImageModal = ({ isOpen, onClose, imageSrc, title, subtitle }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setImageError(false);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, imageSrc]);

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

  const handleOpenNewTab = (e) => {
    e.stopPropagation();
    try {
      if (imageSrc.startsWith('data:')) {
        const imageWindow = window.open();
        if (imageWindow) {
          imageWindow.document.write(
            `<html><head><title>${title || 'Image Preview'}</title></head><body style="margin:0;background:#0f172a;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="${imageSrc}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`
          );
          imageWindow.document.close();
        }
      } else {
        window.open(imageSrc, '_blank');
      }
    } catch (err) {
      console.error('Failed to open image in new window:', err);
    }
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

  const handleWheel = (e) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.15, 4));
    } else {
      setScale((prev) => Math.max(prev - 0.15, 0.5));
    }
  };

  const modalContent = (
    <div
      className="image-lightbox-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        animation: 'fadeIn 0.2s ease-out',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 'max(calc(env(safe-area-inset-top, 0px) + 0.85rem), 2.4rem)',
          left: '0.75rem',
          right: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '14px',
          padding: '0.6rem 0.85rem',
          color: '#ffffff',
          zIndex: 10000000,
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.6)',
          gap: '0.4rem',
          flexWrap: 'nowrap'
        }}
      >
        <div style={{ minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title || '📸 Verification Proof Photo'}
          </h3>
          {subtitle && (
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
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
            <ZoomIn size={17} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
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
            <ZoomOut size={17} />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 90°"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
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
            <RotateCw size={17} />
          </button>
          {scale !== 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom (100%)"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
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
              <Maximize2 size={17} />
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenNewTab}
            title="Open Full Image in New Tab"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
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
            <ExternalLink size={17} />
          </button>
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
              fontWeight: 700,
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={16} /> Save
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
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
          paddingTop: '3.8rem',
          paddingBottom: '2.8rem',
          boxSizing: 'border-box'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxHeight: '80vh',
            maxWidth: '92vw',
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            cursor: scale > 1 ? 'grab' : 'zoom-in',
            userSelect: 'none'
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setScale((prev) => (prev > 1 ? 1 : 2));
          }}
        >
          {imageError ? (
            <div style={{
              background: '#1e293b',
              color: '#f8fafc',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #ef4444',
              maxWidth: '400px'
            }}>
              <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Failed to Load Image</h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
                The image data may be corrupted or inaccessible.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenNewTab}
                style={{ fontSize: '0.8rem' }}
              >
                Try Open in New Tab
              </button>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={title || 'Full size proof'}
              onError={() => setImageError(true)}
              style={{
                maxWidth: '100%',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: '#000'
              }}
            />
          )}
        </div>
      </div>

      {/* Footer / Helper instructions */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 0.75rem), 1.5rem)',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '0.45rem 1rem',
          borderRadius: '20px',
          color: '#e2e8f0',
          fontSize: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10000000,
          maxWidth: 'calc(100% - 1.5rem)',
          textAlign: 'center',
          justifyContent: 'center'
        }}
      >
        <span>💡 Double click or scroll wheel to Zoom ({Math.round(scale * 100)}%)</span>
        <span style={{ opacity: 0.5 }}>•</span>
        <span>Click outside or press Esc to close</span>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default ImageModal;
