
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
        <Card className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 border-0 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
          <div 
            className="w-full h-full flex items-center justify-center text-white text-2xl"
            onClick={onToggleMinimize}
          >
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
      <Card className="bg-gray-900/95 backdrop-blur-sm border-gray-700 shadow-2xl">
        <div className="p-4">
          {/* Header with drag handle */}
          <div 
            className="flex items-center justify-between mb-3 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onToggleMinimize}
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
              >
                <VolumeX className="w-3 h-3" />
              </Button>
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Song Info */}
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              className="w-12 h-9 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-sm line-clamp-1">
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
              variant="ghost"
              className="rounded-full w-8 h-8 p-0 text-white hover:bg-white/20"
            >
              <span>⏮️</span>
            </Button>
            
            <Button
              onClick={onTogglePlayPause}
              size="sm"
              className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 w-10 h-10 p-0"
            >
              <span className="text-lg">
                {isPlaying ? '⏸️' : '▶️'}
              </span>
            </Button>
            
            <Button
              onClick={onPlayNext}
              size="sm"
              variant="ghost"
              className="rounded-full w-8 h-8 p-0 text-white hover:bg-white/20"
            >
              <span>⏭️</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
