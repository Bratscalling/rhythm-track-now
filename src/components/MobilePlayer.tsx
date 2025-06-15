
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoData } from '@/types/playlist';

interface MobilePlayerProps {
  currentVideo: VideoData;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
}

export const MobilePlayer = ({
  currentVideo,
  isPlaying,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
}: MobilePlayerProps) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-3 z-50">
      <div className="flex items-center space-x-3">
        {/* Song Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <img
            src={currentVideo.thumbnail}
            alt={currentVideo.title}
            className="w-12 h-9 object-cover rounded"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-white text-sm line-clamp-1">
              {currentVideo.title}
            </h4>
            <p className="text-gray-300 text-xs line-clamp-1">
              {currentVideo.channel}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-1">
          <Button
            onClick={onPlayPrevious}
            size="sm"
            variant="ghost"
            className="rounded-full p-2 text-white hover:bg-white/20"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={onTogglePlayPause}
            size="sm"
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 p-2"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            onClick={onPlayNext}
            size="sm"
            variant="ghost"
            className="rounded-full p-2 text-white hover:bg-white/20"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
