
import { useState } from 'react';
import { Plus, Music, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VideoData } from '@/types/playlist';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PlaylistDialogProps {
  song?: VideoData;
  children: React.ReactNode;
}

export const PlaylistDialog = ({ song, children }: PlaylistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { user } = useAuth();
  const { playlists, createPlaylist, addSongToPlaylist } = usePlaylist(user?.id);
  const { toast } = useToast();

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    const playlist = createPlaylist(newPlaylistName.trim(), newPlaylistDescription.trim());
    
    if (song) {
      addSongToPlaylist(playlist.id, song);
      toast({
        title: "Success",
        description: `Created "${playlist.name}" and added "${song.title}"`,
      });
    } else {
      toast({
        title: "Success",
        description: `Created playlist "${playlist.name}"`,
      });
    }

    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setShowCreateForm(false);
    setOpen(false);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (!song) return;
    
    addSongToPlaylist(playlistId, song);
    const playlist = playlists.find(p => p.id === playlistId);
    
    toast({
      title: "Added to Playlist",
      description: `"${song.title}" added to "${playlist?.name}"`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            {song ? 'Add to Playlist' : 'Manage Playlists'}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {song 
              ? `Add "${song.title}" to a playlist or create a new one.`
              : 'Create and manage your playlists.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Playlists */}
          {playlists.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-200">Your Playlists</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{playlist.name}</h4>
                      <p className="text-sm text-gray-400">{playlist.songs.length} songs</p>
                    </div>
                    {song && (
                      <Button
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        size="sm"
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      >
                        Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Playlist */}
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Playlist
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="playlist-name" className="text-sm font-medium text-gray-200">
                  Playlist Name
                </Label>
                <Input
                  id="playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="playlist-description" className="text-sm font-medium text-gray-200">
                  Description (Optional)
                </Label>
                <Input
                  id="playlist-description"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Enter description..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePlaylist}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  Create
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
