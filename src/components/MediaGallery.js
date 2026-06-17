import React, { useState, useEffect, useCallback } from 'react';

// Simple video player without native controls to avoid fullscreen flickering
const VideoPlayer = ({ url }) => {
  const videoRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div
      onClick={togglePlay}
      style={{
        position: 'relative',
        maxWidth: '90vw',
        maxHeight: '85vh',
        cursor: 'pointer'
      }}
    >
      <video
        ref={videoRef}
        src={url}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          borderRadius: '8px',
          display: 'block'
        }}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />
      {!isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '60px',
            opacity: 0.9,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        >
          ▶️
        </div>
      )}
    </div>
  );
};

const MediaViewer = ({ media, currentIndex, onClose, onPrev, onNext }) => {
  // Hooks must be called before any early returns
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!media || media.length === 0) return null;

  const item = media[currentIndex];
  const isVideo = item?.type?.startsWith('video/');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        cursor: 'pointer'
      }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.3)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100001
        }}
      >
        ✕
      </button>

      {/* Counter */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          background: 'rgba(0,0,0,0.5)',
          padding: '8px 16px',
          borderRadius: '8px'
          
        }}
      >
        {currentIndex + 1} / {media.length}
      </div>

      {/* Previous button (left side) */}
      {media.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.3)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '28px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100001,
            direction: 'ltr'
          }}
        >
          ❮
        </button>
      )}

      {/* Media */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isVideo ? (
          <VideoPlayer url={item.url} />
        ) : (
          <img
            src={item.url}
            alt={`Media ${currentIndex + 1}`}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        )}
      </div>

      {/* Next button (right side) */}
      {media.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.3)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '28px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100001,
            direction: 'ltr'
          }}
        >
          ❯
        </button>
      )}
    </div>
  );
};

const MediaGallery = ({ media, productName }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const openViewer = (index) => {
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => setViewerOpen(false);

  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % media.length);
  };

  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
  };

  // Main display (first media item)
  const mainItem = media[0];
  const isMainVideo = mainItem?.type?.startsWith('video/');

  return (
    <div>
      {/* Main Media Display */}
      <div
        onClick={() => openViewer(0)}
        style={{
          width: '100%',
          maxHeight: '500px',
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          background: '#000'
        }}
      >
        {isMainVideo ? (
          <div style={{ position: 'relative' }}>
            <video
              src={mainItem.url}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '500px',
                objectFit: 'contain',
                background: '#000',
                display: 'block'
              }}
              onClick={(e) => { e.stopPropagation(); openViewer(0); }}
              controls
            />
            {media.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  pointerEvents: 'none'
                }}
              >
                1/{media.length}
              </div>
            )}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <img
              src={mainItem.url}
              alt={productName}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '500px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            {media.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                1/{media.length}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {media.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            overflowX: 'auto',
            background: '#f9f9f9',
            borderTop: '1px solid #eee'
          }}
        >
          {media.map((item, index) => {
            const isVideo = item?.type?.startsWith('video/');
            return (
              <div
                key={index}
                onClick={() => openViewer(index)}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: currentIndex === index ? '3px solid #3498db' : '2px solid transparent',
                  opacity: currentIndex === index ? 1 : 0.6,
                  transition: 'all 0.2s',
                  position: 'relative',
                  background: '#eee'
                }}
                onMouseOver={(e) => { if (currentIndex !== index) e.currentTarget.style.opacity = '0.8'; }}
                onMouseOut={(e) => { if (currentIndex !== index) e.currentTarget.style.opacity = '0.6'; }}
              >
                {isVideo ? (
                  <>
                    <video
                      src={item.url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      muted
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        fontSize: '14px',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                      }}
                    >
                      ▶️
                    </span>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt={`Thumb ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Viewer */}
      {viewerOpen && (
        <MediaViewer
          media={media}
          currentIndex={currentIndex}
          onClose={closeViewer}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </div>
  );
};

export { MediaViewer };
export default MediaGallery;