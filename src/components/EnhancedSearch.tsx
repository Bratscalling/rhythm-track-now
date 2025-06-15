
import { useState, useRef, useEffect } from 'react';
import { Search, History, X, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useAuth } from '@/hooks/useAuth';

interface EnhancedSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const EnhancedSearch = ({ searchQuery, setSearchQuery, onSearch, isLoading }: EnhancedSearchProps) => {
  const { user } = useAuth();
  const { searchHistory, addToHistory, removeFromHistory, clearHistory } = useSearchHistory(user?.id);
  const [showHistory, setShowHistory] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    setIsVoiceSupported(
      'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    );
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
      setShowHistory(false);
      onSearch();
    }
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
    // Trigger search with the selected query
    setTimeout(() => onSearch(), 100);
  };

  const handleVoiceSearch = () => {
    if (!isVoiceSupported) return;

    const SpeechRecognitionConstructor = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      // Auto-search after voice input
      setTimeout(() => {
        addToHistory(transcript);
        onSearch();
      }, 500);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="max-w-2xl mx-auto relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          ref={searchRef}
          type="text"
          placeholder="Search for songs, artists, or albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          onFocus={() => setShowHistory(true)}
          className="pl-12 pr-32 py-4 text-lg bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-full backdrop-blur-sm focus:bg-white/20 transition-all duration-300"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isVoiceSupported && (
            <Button
              onClick={handleVoiceSearch}
              disabled={isListening}
              size="sm"
              className={`rounded-full p-2 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Mic className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-gray-700 z-50">
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-sm font-medium text-gray-300">Recent Searches</span>
              <Button
                onClick={clearHistory}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white p-1 h-auto"
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-1">
              {searchHistory.map((query, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer group"
                >
                  <div
                    className="flex items-center flex-1"
                    onClick={() => handleHistoryClick(query)}
                  >
                    <History className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-white">{query}</span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(query);
                    }}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 p-1 h-auto text-gray-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close history */}
      {showHistory && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};
