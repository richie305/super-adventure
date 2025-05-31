import React, { useState, useCallback, useEffect } from 'react';
import { LogEntryForm } from './components/LogEntryForm';
import { LogList } from './components/LogList';
import { LogEntry, LogEntryData, LogType, BathroomActivity, MealSubtype } from './types';
import { db, Timestamp, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from './firebaseClient'; // Added serverTimestamp

/**
 * @file App.tsx
 * @description This file defines the main application component (`App`).
 * The `App` component is responsible for managing the state of log entries,
 * handling CRUD operations (Create, Read, Update, Delete) for these entries with Firebase Firestore,
 * and rendering the user interface for logging and viewing activities.
 * It includes features like fetching, displaying, adding, editing, and deleting log entries,
 * as well as a summary view of recent activities.
 */

const App: React.FC = () => {
  /**
   * @state `logEntries` - Holds an array of `LogEntry` objects.
   * @description Stores all the log entries fetched from Firestore. Used to display the list of activities.
   */
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  /**
   * @state `editingEntry` - Holds a `LogEntry` object or `null`.
   * @description Stores the log entry currently being edited by the user. If `null`, no entry is being edited.
   */
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  /**
   * @state `isLoading` - Holds a boolean value.
   * @description Indicates whether data is currently being fetched or saved. Used to show loading indicators in the UI.
   */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /**
   * @state `error` - Holds a string message or `null`.
   * @description Stores any error message that occurs during data operations. Displayed to the user if not `null`.
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * @function fetchLogEntries
   * @description Fetches log entries from the Firebase Firestore database.
   * It queries the 'log_entries' collection, orders them by timestamp in descending order,
   * and updates the `logEntries` state.
   * It also manages the `isLoading` and `error` states during the fetch operation.
   */
  const fetchLogEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const logEntriesCollection = collection(db, 'log_entries');
      const q = query(logEntriesCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const entries: LogEntry[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(), // Convert Firestore Timestamp to JS Date
          type: data.type as LogType,
          activity: data.activity as BathroomActivity | undefined,
          poopSubtype: data.poopSubtype,
          notes: data.notes,
          mealSubtype: data.mealSubtype as MealSubtype | undefined,
          foodType: data.foodType,
        };
      });
      setLogEntries(entries);
    } catch (err: any) {
      console.error("Error fetching log entries from Firebase:", err);
      setError(`Failed to load activities: ${err.message || 'Ensure Firebase configuration is correct.'}`);
      setLogEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * @effect
   * @description This `useEffect` hook is responsible for fetching the initial log entries when the component mounts.
   * It calls `fetchLogEntries` to load data from Firestore.
   * The dependency array `[fetchLogEntries]` ensures this effect runs if `fetchLogEntries` changes,
   * which typically happens if its own dependencies change, maintaining data consistency.
   */
  useEffect(() => {
    fetchLogEntries();
  }, [fetchLogEntries]);

  /**
   * @function saveLogEntry
   * @description Saves or updates a log entry in Firebase Firestore.
   * If `idToUpdate` is provided, it updates the existing entry; otherwise, it adds a new entry.
   * It converts JavaScript `Date` objects to Firestore `Timestamp` objects before saving.
   * For new entries without a specific timestamp, it uses `serverTimestamp()`.
   * Undefined fields are removed from the data before saving.
   * It handles loading states and updates the `error` state in case of failure.
   * After a successful save, it refreshes the log entries.
   * @param {LogEntryData} entryData - The data for the log entry to be saved.
   * @param {string} [idToUpdate] - Optional. The ID of the log entry to update. If undefined, a new entry is created.
   */
  const saveLogEntry = useCallback(async (entryData: LogEntryData, idToUpdate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const logEntriesCollection = collection(db, 'log_entries');

      // Prepare data, converting JS Date to Firestore Timestamp if necessary
      const dataToSave: any = { ...entryData };
      if (entryData.timestamp instanceof Date) {
        dataToSave.timestamp = Timestamp.fromDate(entryData.timestamp);
      } else if (!idToUpdate) { // For new entries, if no specific timestamp, use server timestamp
        dataToSave.timestamp = serverTimestamp();
      }
      // Clear out undefined fields explicitly to avoid issues with Firestore
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });


      if (idToUpdate) {
        // Update existing entry
        const entryRef = doc(db, 'log_entries', idToUpdate);
        // If timestamp is not being explicitly updated, don't include it in the update payload
        // to preserve the original serverTimestamp or user-set value.
        if (!(entryData.timestamp instanceof Date)) {
            delete dataToSave.timestamp;
        }
        await updateDoc(entryRef, dataToSave);
      } else {
        // Add new entry
        await addDoc(logEntriesCollection, dataToSave);
      }
      setEditingEntry(null);
      fetchLogEntries(); // Refresh list after save
    } catch (err: any) {
      console.error("Error saving log entry to Firebase:", err);
      setError(`Failed to save activity: ${err.message || 'Ensure Firebase configuration is correct.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLogEntries]);

  /**
   * @function handleSetEditingEntry
   * @description Sets the `editingEntry` state to the provided log entry and scrolls the form into view.
   * This function is typically called when a user clicks an "edit" button on a log entry.
   * Scrolling ensures the form is visible for editing.
   * @param {LogEntry | null} entry - The log entry to be edited, or `null` to clear the editing state.
   */
  const handleSetEditingEntry = useCallback((entry: LogEntry | null) => {
    setEditingEntry(entry);
    if (entry) {
      const formElement = document.getElementById('log-entry-form-section');
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  /**
   * @function handleDeleteEntry
   * @description Deletes a log entry from Firebase Firestore using its ID.
   * After successful deletion, it updates the `logEntries` state to remove the deleted entry
   * and clears `editingEntry` if the deleted entry was being edited.
   * It manages loading and error states during the deletion process.
   * @param {string} idToDelete - The ID of the log entry to be deleted.
   */
  const handleDeleteEntry = useCallback(async (idToDelete: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const entryRef = doc(db, 'log_entries', idToDelete);
      await deleteDoc(entryRef);

      setLogEntries(prevEntries => prevEntries.filter(entry => entry.id !== idToDelete));
      if (editingEntry && editingEntry.id === idToDelete) {
        setEditingEntry(null);
      }
    } catch (err: any) {
      console.error("Error deleting log entry from Firebase:", err);
      setError(`Failed to delete activity: ${err.message || 'Ensure Firebase configuration is correct.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [editingEntry]);

  const sortedEntries = logEntries;

  /**
   * @function formatTimeAgo
   * @description Formats a given JavaScript `Date` object into a human-readable relative time string (e.g., "5 minutes ago", "2 days ago").
   * It calculates the difference between the current time and the provided date and returns
   * a string representing this duration in years, months, days, hours, minutes, or seconds.
   * For very recent times (less than 10 seconds), it returns "just now".
   * @param {Date} date - The date to format.
   * @returns {string} A string representing the relative time ago.
   */
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    if (seconds < 10) return "just now";
    return Math.floor(seconds) + " seconds ago";
  };

  const lastMeal = sortedEntries.find(entry => entry.type === LogType.Meal);
  const lastPee = sortedEntries.find(entry => entry.type === LogType.Bathroom && (entry.activity === BathroomActivity.Pee || entry.activity === BathroomActivity.Both));
  const lastPoopEntry = sortedEntries.find(entry => entry.type === LogType.Bathroom && (entry.activity === BathroomActivity.Poop || entry.activity === BathroomActivity.Both));


  return (
    <div className="bg-gradient-to-br from-sky-100 to-indigo-200 min-h-screen text-slate-800 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-slate-700">
          <span role="img" aria-label="lightbulb emoji" className="mr-2">💡</span>
          Positive Insights
        </h1>
        <p className="text-slate-600 mt-2 text-lg">Tracking daily moments and activities for a better understanding.</p>
      </header>

      <main className="w-full max-w-2xl space-y-8">
        {error && (
          <section className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error message">
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </section>
        )}

        <section id="log-entry-form-section" aria-labelledby="form-heading">
            <LogEntryForm
                onSaveEntry={saveLogEntry}
                editingEntry={editingEntry}
                onCancelEdit={() => setEditingEntry(null)}
            />
        </section>

        {isLoading && !logEntries.length && (
          <div className="text-center py-10">
            <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-600 mt-2">Loading activities...</p>
          </div>
        )}

        {(!isLoading || logEntries.length > 0) && (lastMeal || lastPee || lastPoopEntry) && (
            <section className="bg-white/80 backdrop-blur-md shadow-xl rounded-xl p-6" aria-labelledby="summary-heading">
                <h2 id="summary-heading" className="text-2xl font-semibold text-slate-700 mb-4">Quick Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-500">Last Meal <span role="img" aria-label="food bowl">🍲</span></p>
                        <p className="text-lg font-medium text-sky-600">{lastMeal ? formatTimeAgo(lastMeal.timestamp) : 'N/A'}</p>
                        {lastMeal && (<p className="text-xs text-slate-500">({lastMeal.mealSubtype === MealSubtype.Given ? "Given" : "Stolen"}: {lastMeal.foodType || 'Food'})</p>)}
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Last Pee <span role="img" aria-label="drop">💧</span></p>
                        <p className="text-lg font-medium text-amber-600">{lastPee ? formatTimeAgo(lastPee.timestamp) : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Last Poop <span role="img" aria-label="poop">💩</span></p>
                        <p className="text-lg font-medium text-orange-600">{lastPoopEntry ? formatTimeAgo(lastPoopEntry.timestamp) : 'N/A'}</p>
                         {lastPoopEntry && lastPoopEntry.poopSubtype && (<p className="text-xs text-slate-500">({lastPoopEntry.poopSubtype.charAt(0) + lastPoopEntry.poopSubtype.slice(1).toLowerCase()})</p>)}
                    </div>
                </div>
            </section>
        )}

        {(!isLoading || logEntries.length > 0) && (
          <LogList
              entries={sortedEntries}
              onEditEntry={handleSetEditingEntry}
              onDeleteEntry={handleDeleteEntry}
              isLoading={isLoading && logEntries.length > 0}
          />
        )}
      </main>
      <footer className="mt-12 text-center text-slate-500 text-sm">
        <p>Made with ❤️ for happy insights!</p>
        <p>Entries can be saved in Firebase when configured.</p>
      </footer>
    </div>
  );
};

export default App;