import { cn } from '@/lib/utils';
import { JournalType } from './types';
import { User, Briefcase } from 'lucide-react';

interface JournalTabsProps {
  activeTab: JournalType;
  onTabChange: (tab: JournalType) => void;
}

export function JournalTabs({ activeTab, onTabChange }: JournalTabsProps) {
  return (
    <div className="flex gap-2 p-1 rounded-xl dark:bg-gray-700">
   
      <button
        onClick={() => onTabChange('business')}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200'
        )}
        style={{
          backgroundColor: activeTab === 'business' ? '#2b825b' : 'transparent',
          color: activeTab === 'business' ? '#ffffff' : '#80746e',
          boxShadow: activeTab === 'business' ? '0 4px 24px -8px rgba(43,130,91,0.2)' : 'none'
        }}
      >
        <Briefcase className="h-4 w-4" />
        Business
      </button>
         <button
        onClick={() => onTabChange('personal')}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200'
        )}
        style={{
          backgroundColor: activeTab === 'personal' ? '#2b825b' : 'transparent',
          color: activeTab === 'personal' ? '#ffffff' : '#80746e',
          boxShadow: activeTab === 'personal' ? '0 4px 24px -8px rgba(43,130,91,0.2)' : 'none'
        }}
      >
        <User className="h-4 w-4" />
        Personal
      </button>
    </div>
  );
}