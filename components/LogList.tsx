import React from 'react';
import { LogItem } from './LogItem';
import { LogEntry } from '../types';

/**
 * @interface LogListProps
 * @description Defines the props for the `LogList` component.
 */
interface LogListProps {
  /** @property {LogEntry[]} entries - An array of log entries to be displayed. */
  entries: LogEntry[];
  /** @property {(entry: LogEntry) => void} onEditEntry - Callback function invoked when an edit action is triggered for an entry in the list. Passes the full entry to be edited. */
  onEditEntry: (entry: LogEntry) => void;
  /** @property {(id: string) => void} onDeleteEntry - Callback function invoked when a delete action is triggered for an entry in the list. Passes the ID of the entry to be deleted. */
  onDeleteEntry: (id: string) => void;
  /** @property {boolean} [isLoading] - Optional. Indicates if data affecting the list (e.g., fetching, deleting) is currently being processed. Used to conditionally render UI elements like "No activities logged yet". */
  isLoading?: boolean; // Optional: to indicate if list-affecting operations are in progress
}

/**
 * @component LogList
 * @description Renders a list of `LogItem` components based on the provided `entries`.
 * It handles the display for scenarios where no entries exist (showing a message to guide the user)
 * or when data might be loading (by optionally preventing the "No activities" message from showing prematurely).
 * Each `LogItem` is passed callbacks for edit and delete actions.
 * @param {LogListProps} props - The props for the component.
 */
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
