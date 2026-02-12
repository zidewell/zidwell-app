"use client"
import { format } from 'date-fns';
// import { ThemeToggle } from './ThemeToggle';
import { JournalTabs } from './JournalTabs';
import { useJournal } from '@/app/context/JournalContext';

export function JournalHeader() {
  const { activeJournalType, setActiveJournalType } = useJournal();
  const today = new Date();
  
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium" style={{ color: '#80746e' }}>
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {getGreeting()}
          </h1>
          <p style={{ color: '#80746e' }}>
            Let's reflect on your finances today.
          </p>
        </div>
        {/* <ThemeToggle /> */}
      </div>

      <JournalTabs 
        activeTab={activeJournalType} 
        onTabChange={setActiveJournalType} 
      />
    </header>
  );
}