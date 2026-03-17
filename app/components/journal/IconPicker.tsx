"use client"
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button'; 

const EMOJI_CATEGORIES = {
  'Money': ['💰', '💵', '💴', '💶', '💷', '🪙', '💳', '🏦', '💎', '📈', '📉', '💹'],
  'Food': ['🍽️', '🍔', '🍕', '🍜', '🍣', '🥗', '☕', '🍺', '🍷', '🧁', '🍰', '🥡'],
  'Transport': ['🚗', '🚕', '🚙', '🚌', '✈️', '🚂', '🛵', '🚲', '⛽', '🛞', '🚁', '🛳️'],
  'Home': ['🏠', '🏡', '🏢', '🛋️', '🛏️', '🪑', '🚿', '🔑', '🏗️', '🧹', '🪴', '💡'],
  'Tech': ['📱', '💻', '🖥️', '⌨️', '🖱️', '📡', '🔋', '💿', '🎮', '🕹️', '📺', '📷'],
  'Health': ['🏥', '💊', '🩺', '🩹', '💉', '🏃', '🧘', '🧴', '🦷', '👁️', '❤️', '🩻'],
  'Education': ['📚', '📖', '📝', '✏️', '🎓', '🎒', '📐', '🔬', '🔭', '🧪', '📓', '🏫'],
  'Work': ['💼', '📋', '📊', '📁', '🗂️', '📌', '✂️', '📎', '🖊️', '📤', '📥', '🗃️'],
  'Shopping': ['🛒', '🛍️', '🏬', '🎁', '👔', '👗', '👟', '👜', '💄', '🧥', '👕', '🩳'],
  'Family': ['👨‍👩‍👧‍👦', '👨‍👩‍👧', '👨‍👩‍👦', '👩‍👧', '👨‍👦', '👶', '🧒', '👵', '👴', '🧑‍🤝‍🧑', '💑', '💏'],
  'Other': ['📦', '🏷️', '🎯', '⭐', '🌟', '🔥', '❄️', '🌈', '🎨', '🎭', '🎪', '🎉'],
};

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Money');

  const handleSelect = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-16 text-xl p-0 dark:bg-gray-700 dark:border-gray-600', className)}
          style={{
            backgroundColor: '#fcfbf9',
            borderColor: '#e6dfd6'
          }}
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 z-50 dark:bg-gray-800 dark:border-gray-700" 
        align="start"
        style={{
          backgroundColor: '#fcfbf9',
          borderColor: '#e6dfd6'
        }}
      >
        <div className="p-3 space-y-3">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'px-2 py-1 text-xs rounded-md transition-colors'
                )}
                style={{
                  backgroundColor: activeCategory === category ? '#2b825b' : '#f5f1ea',
                  color: activeCategory === category ? '#ffffff' : '#80746e'
                }}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Icons grid */}
          <div className="grid grid-cols-6 gap-1.5">
            {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleSelect(icon)}
                className={cn(
                  'w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all'
                )}
                style={{
                  backgroundColor: value === icon ? 'rgba(43, 130, 91, 0.2)' : 'transparent',
                  border: value === icon ? '2px solid #2b825b' : 'none'
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}