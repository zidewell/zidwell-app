import { cn } from '@/lib/utils';
import { JournalType } from './types';
import { User, Briefcase } from 'lucide-react';

interface JournalTabsProps {
  activeTab: JournalType;
  onTabChange: (tab: JournalType) => void;
}

export function JournalTabs({ activeTab, onTabChange }: JournalTabsProps) {
  return (
    <div className="flex gap-2 p-1 rounded-xl">
      <button
        onClick={() => onTabChange('personal')}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200'
        )}
        style={{
          backgroundColor: activeTab === 'personal' ? '#C29307' : 'transparent',
          color: activeTab === 'personal' ? '#26121c' : '#80746e',
          boxShadow: activeTab === 'personal' ? '0 4px 24px -8px rgba(38,33,28,0.1)' : 'none'
        }}
      >
        <User className="h-4 w-4" />
        Personal
      </button>
      <button
        onClick={() => onTabChange('business')}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200'
        )}
        style={{
          backgroundColor: activeTab === 'business' ? '#C29307' : 'transparent',
          color: activeTab === 'business' ? '#26121c' : '#80746e',
          boxShadow: activeTab === 'business' ? '0 4px 24px -8px rgba(38,33,28,0.1)' : 'none'
        }}
      >
        <Briefcase className="h-4 w-4" />
        Business
      </button>
    </div>
  );
}