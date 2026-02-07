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
  const cleanupRefsRef = useRef<(() => void)[]>([]);

  // Initialize and check browser support
  useEffect(() => {
    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    setIsInitializing(true);
    
    // Process content for highlighting
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

        // Create highlighted version of content with spans
        await createHighlightedContent();
        setIsContentReady(true);
        
      } catch (error) {
        console.error("Error processing content:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    processContent();

    return () => {
      // Cleanup all event listeners
      cleanupRefsRef.current.forEach(cleanup => cleanup());
      cleanupRefsRef.current = [];
      
      // Cancel any ongoing speech
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [content]);

  // Create highlighted content with word spans
  const createHighlightedContent = async () => {
    // Simple HTML content with word spans
    const createWordSpans = (html: string) => {
      // First, extract text nodes and wrap words
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      let wordIndex = 0;
      const wordSpans: string[] = [];

      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.trim()) {
          const words = node.textContent.split(/(\s+)/);
          
          words.forEach((word, i) => {
            if (word.trim()) {
              wordSpans.push(`<span 
                data-word-index="${wordIndex}" 
                class="audio-word transition-all duration-300 ease-in-out inline-block"
                style="padding: 1px 2px; margin: 0 1px; border-radius: 2px;"
              >${word}</span>`);
              wordIndex++;
            } else if (word) {
              wordSpans.push(word); // Preserve whitespace
            }
          });
        }
      }

      return wordSpans.join('');
    };

    const highlighted = createWordSpans(content);
    setHighlightedContent(highlighted);

    // Wait for DOM to update
    setTimeout(() => {
      if (contentContainerRef.current) {
        // Collect all word spans
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
      span.classList.remove(
        'word-active', 
        'word-next-1', 
        'word-next-2', 
        'word-next-3'
      );
      span.style.backgroundColor = '';
      span.style.color = '';
      span.style.fontWeight = '';
    });

    // Highlight current word
    const currentSpan = wordSpansRef.current[wordIndex];
    if (currentSpan) {
      currentSpan.classList.add('word-active');
      currentSpan.style.backgroundColor = '#C29307';
      currentSpan.style.color = 'white';
      currentSpan.style.fontWeight = '600';
      currentSpan.style.padding = '2px 6px';
      currentSpan.style.margin = '0 2px';
      currentSpan.style.borderRadius = '4px';
      currentSpan.style.boxShadow = '0 2px 4px rgba(194, 147, 7, 0.3)';
      
      // Scroll into view
      currentSpan.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }

    // Highlight next few words with decreasing intensity
    for (let i = 1; i <= 3; i++) {
      const nextSpan = wordSpansRef.current[wordIndex + i];
      if (nextSpan) {
        nextSpan.classList.add(`word-next-${i}`);
        const opacity = 0.5 - (i * 0.1);
        nextSpan.style.backgroundColor = `rgba(194, 147, 7, ${opacity})`;
        nextSpan.style.padding = '1px 4px';
        nextSpan.style.margin = '0 1px';
        nextSpan.style.borderRadius = '3px';
      }
    }
  };

  // Reset all highlights
  const resetHighlights = () => {
    wordSpansRef.current.forEach(span => {
      span.classList.remove(
        'word-active', 
        'word-next-1', 
        'word-next-2', 
        'word-next-3'
      );
      span.style.backgroundColor = '';
      span.style.color = '';
      span.style.fontWeight = '';
      span.style.padding = '';
      span.style.margin = '';
      span.style.borderRadius = '';
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
      // Add gold background to content container
      if (contentContainerRef.current) {
        contentContainerRef.current.style.backgroundColor = 'rgba(194, 147, 7, 0.05)';
        contentContainerRef.current.style.transition = 'background-color 0.3s ease';
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(0);
      resetHighlights();
      if (contentContainerRef.current) {
        contentContainerRef.current.style.backgroundColor = '';
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      resetHighlights();
      if (contentContainerRef.current) {
        contentContainerRef.current.style.backgroundColor = '';
      }
      alert("There was an error with text-to-speech. Please try again.");
    };

    utterance.onpause = () => {
      setIsPlaying(false);
    };

    utterance.onresume = () => {
      setIsPlaying(true);
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
      contentContainerRef.current.style.backgroundColor = '';
    }
  };

  // Calculate progress
  const progress = totalWordsRef.current > 0 
    ? (currentWordIndex / totalWordsRef.current) * 100 
    : 0;

  // Format time
  const getEstimatedTime = () => {
    const wordsPerMinute = 150 * playbackRate;
    const remainingWords = totalWordsRef.current - currentWordIndex;
    const minutes = remainingWords / wordsPerMinute;
    const totalMinutes = totalWordsRef.current / wordsPerMinute;
    
    return {
      current: Math.floor((currentWordIndex / wordsPerMinute) * 60),
      total: Math.floor(totalMinutes * 60)
    };
  };

  const time = getEstimatedTime();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isSupported) {
    return (
      <div className="bg-[#C29307]/10 border border-[#C29307]/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="w-4 h-4 text-[#C29307]" />
          <span className="text-sm font-medium text-[#C29307]">Listen to this article</span>
        </div>
        <div className="text-center py-4 text-sm text-muted-foreground">
          <p>Text-to-speech is not supported in your browser.</p>
          <p className="text-xs mt-1">Please use Chrome, Edge, or Safari for this feature.</p>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="bg-[#C29307]/10 border border-[#C29307]/20 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-6 h-6 text-[#C29307] animate-spin" />
          <span className="text-sm font-medium text-[#C29307]">Preparing audio player...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audio Controls */}
      <div className="bg-[#C29307]/10 border border-[#C29307]/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-[#C29307] rounded-lg">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium text-[#C29307]">Listen to this article</span>
            <p className="text-xs text-[#C29307]/70 mt-0.5">Words will be highlighted in gold as they're read</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#C29307] hover:bg-[#C29307]/10 hover:text-[#C29307]"
              onClick={skipBackward}
              disabled={!isPlaying}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 rounded-full bg-[#C29307] hover:bg-[#C29307]/90 text-white"
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
              className="h-8 w-8 text-[#C29307] hover:bg-[#C29307]/10 hover:text-[#C29307]"
              onClick={skipForward}
              disabled={!isPlaying}
            >
              <RotateCw className="w-4 h-4" />
            </Button>

            <div className="flex-1">
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                className="cursor-pointer [&>span]:bg-[#C29307] rounded-b-full"
                onValueChange={(value) => {
                  const newProgress = value[0];
                  const newWordIndex = Math.floor((newProgress / 100) * totalWordsRef.current);
                  setCurrentWordIndex(newWordIndex);
                  highlightWord(newWordIndex);
                }}
              />
            </div>

            <span className="text-xs font-medium text-[#C29307] min-w-[60px]">
              {formatTime(time.current)} / {formatTime(time.total)}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs font-medium border-[#C29307] text-[#C29307] hover:bg-[#C29307]/10"
              onClick={changePlaybackRate}
            >
              {playbackRate}x
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-[#C29307]">
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
              className="h-6 px-2 text-xs text-[#C29307] hover:bg-[#C29307]/10 hover:text-[#C29307]"
              onClick={stopSpeech}
              disabled={!isPlaying}
            >
              <StopCircle className="w-3 h-3 mr-1" />
              Stop
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#C29307] animate-pulse' : 'bg-gray-300'}`} />
            <span className={isPlaying ? 'text-[#C29307] font-medium' : 'text-gray-500'}>
              {isPlaying ? 'Playing...' : 'Ready to play'}
            </span>
          </div>

        
        </div>
      </div>

    

      {/* Custom Styles for Highlighting */}
      <style jsx>{`
        .word-active {
          position: relative;
          z-index: 10;
        }
        
        .word-active::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: rgba(194, 147, 7, 0.2);
          border-radius: 6px;
          z-index: -1;
          animation: ripple 1s ease-in-out infinite;
        }
        
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }
        
        /* Gold gradient when playing */
        ${isPlaying ? `
          [ref="contentContainerRef"] {
            background: linear-gradient(135deg, 
              rgba(194, 147, 7, 0.03) 0%, 
              rgba(194, 147, 7, 0.01) 100%
            ) !important;
          }
        ` : ''}
      `}</style>
    </div>
  );
};

export default AudioPlayer;