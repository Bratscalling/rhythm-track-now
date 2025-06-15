
import { useState } from 'react';
import { Music, Play, Trash2, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePlaylist } from '@/hooks/usePlaylist';
import { PlaylistDialog } from './PlaylistDialog';
import { useToast } from '@/hooks/use-toast';
import { VideoData } from '@/types/playlist';
import { useAuth } from '@/hooks/useAuth';

interface PlaylistManagerProps {
  onPlayPlaylist?: (songs: VideoData[], startIndex?: number) => void;
}

export const PlaylistManager = ({ onPlayPlaylist }: PlaylistManagerProps) => {
  const { user } = useAuth();
  const { playlists, deletePlaylist, removeSongFromPlaylist, setCurrentPlaylist } = usePlaylist(user?.id);
  const { toast } = useToast();
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);

  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    deletePlaylist(playlistId);
    toast({
      title: "Playlist Deleted",
      description: `"${playlistName}" has been deleted`,
    });
  };

  const handlePlayPlaylist = (songs: VideoData[], playlistName: string, startIndex = 0) => {
    if (songs.length === 0) {
      toast({
        title: "Empty Playlist",
        description: "This playlist doesn't have any songs yet",
        variant: "destructive",
      });
      return;
    }

    onPlayPlaylist?.(songs, startIndex);
    toast({
      title: "Playing Playlist",
      description: `Now playing "${playlistName}"`,
    });
  };

  const handleRemoveSong = (playlistId: string, songId: string, songTitle: string) => {
    removeSongFromPlaylist(playlistId, songId);
    toast({
      title: "Song Removed",
      description: `"${songTitle}" removed from playlist`,
    });
  };

  if (playlists.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Playlists Yet</h3>
        <p className="text-gray-400 mb-6">Create your first playlist to organize your favorite songs</p>
        <PlaylistDialog>
          <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </PlaylistDialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Playlists ({playlists.length})</h2>
        <PlaylistDialog>
          <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
            <Plus className="w-4 h-4 mr-2" />
            New Playlist
          </Button>
        </PlaylistDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist) => (
          <Card key={playlist.id} className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1">{playlist.name}</h3>
                  {playlist.description && (
                    <p className="text-gray-300 text-sm mb-2">{playlist.description}</p>
                  )}
                  <p className="text-gray-400 text-sm">{playlist.songs.length} songs</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handlePlayPlaylist(playlist.songs, playlist.name)}
                    size="sm"
                    disabled={playlist.songs.length === 0}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 p-2"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                    size="sm"
                    variant="destructive"
                    className="p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Songs List */}
              {playlist.songs.length > 0 && (
                <div className="space-y-2">
                  {playlist.songs.slice(0, 3).map((song, index) => (
                    <div
                      key={`${playlist.id}-${song.id}`}
                      className="flex items-center space-x-3 p-2 bg-white/5 rounded cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handlePlayPlaylist(playlist.songs, playlist.name, index)}
                    >
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-8 h-6 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{song.title}</p>
                        <p className="text-gray-400 text-xs truncate">{song.channel}</p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSong(playlist.id, song.id, song.title);
                        }}
                        size="sm"
                        variant="ghost"
                        className="p-1 h-auto text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {playlist.songs.length > 3 && (
                    <p className="text-center text-gray-400 text-xs">
                      +{playlist.songs.length - 3} more songs
                    </p>
                  )}
                </div>
              )}

              {playlist.songs.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No songs added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
