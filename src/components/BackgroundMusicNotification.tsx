
import { useEffect, useState } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoData } from '@/types/playlist';

interface BackgroundMusicNotificationProps {
  currentVideo: VideoData | null;
  isPlaying: boolean;
  isMinimized: boolean;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onClose: () => void;
  onToggleMinimize: () => void;
}

export const BackgroundMusicNotification = ({
  currentVideo,
  isPlaying,
  isMinimized,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
  onClose,
  onToggleMinimize
}: BackgroundMusicNotificationProps) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!currentVideo) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 w-16 h-16 cursor-move"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <Card className={`w-full h-full btn-primary border-0 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer ${isPlaying ? 'playing-glow' : ''}`}>
          <div 
            className="w-full h-full flex items-center justify-center text-white text-2xl relative overflow-hidden"
            onClick={onToggleMinimize}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            {isPlaying ? '⏸️' : '▶️'}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 w-80"
      style={{ left: position.x, top: position.y }}
    >
      <Card className="card-premium shadow-2xl border-white/30">
        <div className="p-4">
          {/* Header with drag handle */}
          <div 
            className="flex items-center justify-between mb-3 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg"></div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onToggleMinimize}
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/20 rounded-full transition-all duration-300"
              >
                <VolumeX className="w-4 h-4" />
              </Button>
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/20 rounded-full transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Song Info */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <img
                src={currentVideo.thumbnail}
                alt={currentVideo.title}
                className="w-14 h-10 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm line-clamp-1 mb-1">
                {currentVideo.title}
              </h4>
              <p className="text-gray-300 text-xs line-clamp-1">
                {currentVideo.channel}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={onPlayPrevious}
              size="sm"
              className="rounded-full w-10 h-10 p-0 btn-glass"
            >
              <span>⏮️</span>
            </Button>
            
            <Button
              onClick={onTogglePlayPause}
              size="sm"
              className={`rounded-full btn-primary w-12 h-12 p-0 ${isPlaying ? 'playing-glow' : ''} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
              <span className="text-lg relative z-10">
                {isPlaying ? '⏸️' : '▶️'}
              </span>
            </Button>
            
            <Button
              onClick={onPlayNext}
              size="sm"
              className="rounded-full w-10 h-10 p-0 btn-glass"
            >
              <span>⏭️</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
