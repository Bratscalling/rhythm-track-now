
import { useState } from 'react';
import { TrendingUp, Clock, Heart, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useListeningHistory } from '@/hooks/useListeningHistory';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { VideoData } from '@/types/playlist';

interface StatsAndHistoryProps {
  onPlaySong: (song: VideoData) => void;
}

export const StatsAndHistory = ({ onPlaySong }: StatsAndHistoryProps) => {
  const { user } = useAuth();
  const { getMostPlayed, getRecentlyPlayed, clearHistory } = useListeningHistory(user?.id);
  const { favorites } = useFavorites(user?.id);

  const mostPlayed = getMostPlayed();
  const recentlyPlayed = getRecentlyPlayed();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Music Stats</h2>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
          <TabsTrigger value="recent" className="data-[state=active]:bg-white/20">
            <Clock className="w-4 h-4 mr-2" />
            Recently Played
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-white/20">
            <Heart className="w-4 h-4 mr-2" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="top" className="data-[state=active]:bg-white/20">
            <TrendingUp className="w-4 h-4 mr-2" />
            Most Played
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Recently Played ({recentlyPlayed.length})</span>
                {recentlyPlayed.length > 0 && (
                  <Button
                    onClick={clearHistory}
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Clear History
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentlyPlayed.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No listening history yet</p>
              ) : (
                <div className="space-y-3">
                  {recentlyPlayed.map((item, index) => (
                    <div
                      key={`recent-${item.id}-${index}`}
                      className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => onPlaySong(item)}
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-12 h-9 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
                        <p className="text-gray-300 text-xs">{item.channel}</p>
                        <p className="text-gray-400 text-xs">
                          Played {item.playCount} time{item.playCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-gray-400 text-xs">{item.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Your Favorites ({favorites.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No favorite songs yet</p>
              ) : (
                <div className="space-y-3">
                  {favorites.map((song, index) => (
                    <div
                      key={`fav-${song.id}`}
                      className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => onPlaySong(song)}
                    >
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-12 h-9 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{song.title}</h4>
                        <p className="text-gray-300 text-xs">{song.channel}</p>
                      </div>
                      <Heart className="w-4 h-4 text-red-500 fill-current" />
                      <span className="text-gray-400 text-xs">{song.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Most Played Songs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mostPlayed.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No play statistics yet</p>
              ) : (
                <div className="space-y-3">
                  {mostPlayed.map((item, index) => (
                    <div
                      key={`top-${item.id}`}
                      className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => onPlaySong(item)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-12 h-9 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
                        <p className="text-gray-300 text-xs">{item.channel}</p>
                        <p className="text-yellow-400 text-xs font-medium">
                          {item.playCount} plays
                        </p>
                      </div>
                      <span className="text-gray-400 text-xs">{item.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
