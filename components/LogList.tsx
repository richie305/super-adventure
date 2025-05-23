import React from 'react';
import { LogItem } from './LogItem';
import { LogEntry } from '../types';

interface LogListProps {
  entries: LogEntry[];
  onEditEntry: (entry: LogEntry) => void;
  onDeleteEntry: (id: string) => void;
  isLoading?: boolean; // Optional: to indicate if list-affecting operations are in progress
}

export const LogList: React.FC<LogListProps> = ({ entries, onEditEntry, onDeleteEntry, isLoading }) => {
  // If it's not loading and there are no entries, then show the message.
  // Avoids showing "No activities" during the initial load.
  if (!isLoading && entries.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-xl p-8 text-center text-slate-500">
        <p className="text-xl mb-2">🐾 No activities logged yet.</p>
        <p>Use the form above to add your dog's first activity!</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-semibold text-slate-700 mb-6 text-center">Activity Log</h2>
      {/* Optional: Show a subtle loading indicator for the list if desired during updates */}
      {/* {isLoading && entries.length > 0 && (
        <div className="text-center text-slate-500 py-2">Updating...</div>
      )} */}
      {entries.map((entry) => (
        <LogItem 
            key={entry.id} 
            entry={entry} 
            onEdit={() => onEditEntry(entry)}
            onDelete={() => onDeleteEntry(entry.id)}
        />
      ))}
    </section>
  );
};
