import React, { useState, useEffect } from 'react';
import { Music, PlayCircle, X } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

const EmbeddedMediaPlayer: React.FC = () => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'spotify' | 'youtube' | null>(null);

  // Load saved media from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('aura-media-url');
    if (saved) {
      setMediaUrl(saved);
      parseAndSetEmbed(saved);
    }
  }, []);

  const parseAndSetEmbed = (url: string) => {
    if (!url.trim()) {
      setEmbedUrl(null);
      setMediaType(null);
      return;
    }

    try {
      // YouTube Parsing
      const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const ytMatch = url.match(ytRegex);
      if (ytMatch && ytMatch[1]) {
        setEmbedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`);
        setMediaType('youtube');
        localStorage.setItem('aura-media-url', url);
        return;
      }

      // Spotify Parsing (track, album, playlist, episode)
      const spotifyRegex = /spotify\.com\/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/i;
      const spMatch = url.match(spotifyRegex);
      if (spMatch && spMatch[1] && spMatch[2]) {
        const type = spMatch[1]; // track, playlist, album
        const id = spMatch[2];
        setEmbedUrl(`https://open.spotify.com/embed/${type}/${id}?utm_source=generator`);
        setMediaType('spotify');
        localStorage.setItem('aura-media-url', url);
        return;
      }

      // If it doesn't match
      setEmbedUrl(null);
      setMediaType(null);
    } catch (e) {
      console.error("Failed to parse media URL", e);
      setEmbedUrl(null);
      setMediaType(null);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseAndSetEmbed(mediaUrl);
  };

  const handleClear = () => {
    setMediaUrl('');
    setEmbedUrl(null);
    setMediaType(null);
    localStorage.removeItem('aura-media-url');
  };

  return (
    <GlassPanel className="focus-mixer" style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Music size={20} /> Media Player
        </h3>
        {mediaType === 'spotify' && <span style={{ fontSize: '0.8rem', backgroundColor: '#1DB954', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Spotify</span>}
        {mediaType === 'youtube' && <span style={{ fontSize: '0.8rem', backgroundColor: '#FF0000', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>YouTube</span>}
      </div>
      
      {!embedUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <form onSubmit={handleUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Paste a YouTube or Spotify link to play music while you focus.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://open.spotify.com/..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                className="glass-button" 
                style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                disabled={!mediaUrl.trim()}
              >
                <PlayCircle size={18} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
          <div style={{ 
            flex: 1, 
            borderRadius: '12px', 
            overflow: 'hidden', 
            background: 'rgba(0,0,0,0.3)',
            minHeight: mediaType === 'youtube' ? '200px' : '152px',
            position: 'relative'
          }}>
            <iframe 
              src={embedUrl} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            ></iframe>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleClear}
              className="glass-button" 
              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <X size={14} /> Clear Media
            </button>
          </div>
        </div>
      )}
    </GlassPanel>
  );
};

export default EmbeddedMediaPlayer;
