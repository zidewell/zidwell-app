"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, StopCircle, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Slider } from "../../ui/slider";

interface AudioPlayerProps {
  content: string;
}

const AudioPlayer = ({ content }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSupported, setIsSupported] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [highlightedContent, setHighlightedContent] = useState<string>("");
  const [isContentReady, setIsContentReady] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const wordsArrayRef = useRef<string[]>([]);
  const totalWordsRef = useRef(0);
  const wordSpansRef = useRef<HTMLSpanElement[]>([]);

  // Initialize and check browser support
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    setIsInitializing(true);
    
    const processContent = async () => {
      try {
        // Strip HTML and prepare for speech
        const getPlainText = (html: string) => {
          const div = document.createElement("div");
          div.innerHTML = html;
          return div.textContent || div.innerText || "";
        };

        const plainText = getPlainText(content);
        wordsArrayRef.current = plainText.split(/\s+/).filter(word => word.length > 0);
        totalWordsRef.current = wordsArrayRef.current.length;

        // Create highlighted version
        createHighlightedContent();
        setIsContentReady(true);
        
      } catch (error) {
        console.error("Error processing content:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    processContent();

    return () => {
      // Cleanup
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [content]);

  // Create highlighted content
  const createHighlightedContent = () => {
    // Simple word wrapping for highlighting
    const words = content.split(/(\s+)/);
    let wordIndex = 0;
    const highlighted = words.map(word => {
      if (word.trim()) {
        const span = `<span 
          data-word-index="${wordIndex}" 
          class="audio-word inline-block transition-all duration-300"
          style="padding: 2px 1px; margin: 0 1px; border-radius: 3px;"
        >${word}</span>`;
        wordIndex++;
        return span;
      }
      return word;
    }).join('');

    setHighlightedContent(highlighted);

    // Wait for DOM to update
    setTimeout(() => {
      if (contentContainerRef.current) {
        const wordElements = Array.from(
          contentContainerRef.current.querySelectorAll('[data-word-index]')
        ) as HTMLSpanElement[];
        wordSpansRef.current = wordElements;
      }
    }, 100);
  };

  // Highlight specific word
  const highlightWord = (wordIndex: number) => {
    // Remove previous highlights
    wordSpansRef.current.forEach(span => {
      span.style.backgroundColor = '';
      span.style.color = '';
      span.style.fontWeight = '';
      span.style.boxShadow = '';
    });

    // Highlight current word
    const currentSpan = wordSpansRef.current[wordIndex];
    if (currentSpan) {
      currentSpan.style.backgroundColor = '#C29307';
      currentSpan.style.color = 'white';
      currentSpan.style.fontWeight = '600';
      currentSpan.style.boxShadow = '0 2px 4px rgba(194, 147, 7, 0.3)';
      
      // Smooth scroll
      currentSpan.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Reset all highlights
  const resetHighlights = () => {
    wordSpansRef.current.forEach(span => {
      span.style.backgroundColor = '';
      span.style.color = '';
      span.style.fontWeight = '';
      span.style.boxShadow = '';
    });
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!isSupported) {
      alert("Your browser doesn't support text-to-speech. Try using Chrome, Edge, or Safari.");
      return;
    }

    if (!isContentReady) {
      alert("Content is still loading. Please wait a moment.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused && utteranceRef.current) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        startSpeech();
      }
    }
  };

  // Start speech synthesis
  const startSpeech = () => {
    const getPlainText = (html: string) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    };

    const plainText = getPlainText(content);
    const utterance = new SpeechSynthesisUtterance(plainText);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en-US') || 
      voice.lang.includes('en-GB') ||
      voice.lang.includes('en')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = playbackRate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Track word boundaries for highlighting
    let wordIndex = 0;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        wordIndex++;
        setCurrentWordIndex(wordIndex);
        highlightWord(wordIndex);
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      if (contentContainerRef.current) {
        contentContainerRef.current.classList.add('bg-amber-50');
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(0);
      resetHighlights();
      if (contentContainerRef.current) {
        contentContainerRef.current.classList.remove('bg-amber-50');
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      resetHighlights();
      if (contentContainerRef.current) {
        contentContainerRef.current.classList.remove('bg-amber-50');
      }
      alert("There was an error with text-to-speech. Please try again.");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setCurrentWordIndex(0);
  };

  // Skip forward
  const skipForward = () => {
    if (!isPlaying) return;
    
    window.speechSynthesis.cancel();
    const newIndex = Math.min(currentWordIndex + 50, totalWordsRef.current - 1);
    setCurrentWordIndex(newIndex);
    highlightWord(newIndex);
    
    // Continue from new position
    const remainingText = wordsArrayRef.current.slice(newIndex).join(' ');
    const utterance = new SpeechSynthesisUtterance(remainingText);
    utterance.rate = playbackRate;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Skip backward
  const skipBackward = () => {
    if (!isPlaying) return;
    
    window.speechSynthesis.cancel();
    const newIndex = Math.max(currentWordIndex - 50, 0);
    setCurrentWordIndex(newIndex);
    highlightWord(newIndex);
    
    // Continue from new position
    const remainingText = wordsArrayRef.current.slice(newIndex).join(' ');
    const utterance = new SpeechSynthesisUtterance(remainingText);
    utterance.rate = playbackRate;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Change playback rate
  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    
    if (utteranceRef.current) {
      utteranceRef.current.rate = nextRate;
    }
  };

  // Stop speech
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentWordIndex(0);
    resetHighlights();
    if (contentContainerRef.current) {
      contentContainerRef.current.classList.remove('bg-amber-50');
    }
  };

  // Calculate progress
  const progress = totalWordsRef.current > 0 
    ? (currentWordIndex / totalWordsRef.current) * 100 
    : 0;

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEstimatedTime = () => {
    const wordsPerMinute = 150 * playbackRate;
    const estimatedSeconds = (totalWordsRef.current / wordsPerMinute) * 60;
    const currentSeconds = (currentWordIndex / totalWordsRef.current) * estimatedSeconds;
    return {
      current: Math.floor(currentSeconds),
      total: Math.floor(estimatedSeconds)
    };
  };

  const time = getEstimatedTime();

  if (!isSupported) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-600">Listen to this article</span>
        </div>
        <div className="text-center py-4 text-sm text-amber-700">
          <p>Text-to-speech is not supported in your browser.</p>
          <p className="text-xs mt-1">Please use Chrome, Edge, or Safari for this feature.</p>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
          <span className="text-sm font-medium text-amber-600">Preparing audio player...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audio Controls */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-amber-600 rounded-lg">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium text-amber-600">Listen to this article</span>
            <p className="text-xs text-amber-500 mt-0.5">Words will be highlighted in gold as they're read</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
              onClick={skipBackward}
              disabled={!isPlaying}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
              onClick={skipForward}
              disabled={!isPlaying}
            >
              <RotateCw className="w-4 h-4" />
            </Button>

            <div className="flex-1 px-2">
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                className="cursor-pointer"
                onValueChange={(value) => {
                  const newProgress = value[0];
                  const newWordIndex = Math.floor((newProgress / 100) * totalWordsRef.current);
                  setCurrentWordIndex(newWordIndex);
                  highlightWord(newWordIndex);
                }}
              />
            </div>

            <span className="text-xs font-medium text-amber-600 min-w-[60px] text-right">
              {formatTime(time.current)} / {formatTime(time.total)}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs font-medium border-amber-600 text-amber-600 hover:bg-amber-100"
              onClick={changePlaybackRate}
            >
              {playbackRate}x
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-amber-600 pt-2">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                Word: {currentWordIndex} / {totalWordsRef.current}
              </span>
              <span className="font-medium">
                Progress: {Math.round(progress)}%
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-100"
              onClick={stopSpeech}
              disabled={!isPlaying}
            >
              <StopCircle className="w-3 h-3 mr-1" />
              Stop
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs pt-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-amber-600 animate-pulse' : 'bg-gray-300'}`} />
            <span className={isPlaying ? 'text-amber-600 font-medium' : 'text-gray-500'}>
              {isPlaying ? 'Playing...' : 'Ready to play'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AudioPlayer;