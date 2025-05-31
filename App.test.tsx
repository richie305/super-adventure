import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import App, { formatTimeAgo } from './App';
import { LogType, BathroomActivity, MealSubtype, PoopSubtype } from './types'; // Added PoopSubtype

// Mock firebase/app to control initializeApp and provide a more complete app mock
vi.mock('firebase/app', () => {
  const mockApp = {
    name: 'mock-app',
    options: {}, // Mocked options
    automaticDataCollectionEnabled: false,
    getProvider: vi.fn(() => ({
      getImmediate: vi.fn(),
    })),
    // Add other methods/properties if Firebase services need them
  };
  return {
    initializeApp: vi.fn(() => mockApp),
    getApp: vi.fn(() => mockApp), // If getApp is used
    // Add other app-level exports if App.tsx or firebaseClient.ts uses them directly
    // e.g., deleteApp: vi.fn()
  };
});

// Attempt to ensure firebaseClient is mocked first and comprehensively
vi.mock('./firebaseClient', () => ({
  db: {},
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 }),
    now: () => ({ toDate: () => new Date(), seconds: new Date().getTime() / 1000, nanoseconds: 0 }),
  },
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => 'mockedServerTimestamp'),
}));

// Mock other Firebase services that might be causing issues
vi.mock('@firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({
    // Return a basic mock object for the Analytics service
    // Add any methods that might be called on the analytics instance in firebaseClient.ts
    // For now, an empty object might suffice if no methods are called on it directly in firebaseClient.ts
    // after initialization.
  })),
  logEvent: vi.fn(),
}));

vi.mock('@firebase/installations', () => ({
  getInstallations: vi.fn(() => ({
    getId: vi.fn().mockResolvedValue('mock-installation-id'),
  })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({
    // Return a basic mock object for the Firestore service
  })),
  // Add other exports from 'firebase/firestore' if they are used directly in firebaseClient.ts
  // For example, if firebaseClient.ts does `import { Timestamp } from 'firebase/firestore'`,
  // then those need to be mocked here. If they are only used via the exports of
  // `./firebaseClient` (like `Timestamp` is in `App.tsx`), then the mock of `./firebaseClient` handles them.
  // Based on App.tsx, it seems most granular firestore functions are re-exported by firebaseClient.
  // However, getFirestore itself is a primary export.
  Timestamp: { // Re-adding common ones here in case firebaseClient itself uses them from 'firebase/firestore'
    fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 }),
    now: () => ({ toDate: () => new Date(), seconds: new Date().getTime() / 1000, nanoseconds: 0 }),
  },
  collection: vi.fn(),
  doc: vi.fn(),
  // etc. for other Firestore exports if needed.
}));

describe('formatTimeAgo', () => {
  const now = new Date();

  it('should format time correctly for seconds', () => {
    const secondsAgo = new Date(now.getTime() - 15 * 1000);
    expect(formatTimeAgo(secondsAgo)).toBe('15 seconds ago');
    const justNow = new Date(now.getTime() - 5 * 1000);
    expect(formatTimeAgo(justNow)).toBe('just now');
  });

  it('should format time correctly for minutes', () => {
    const minutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    expect(formatTimeAgo(minutesAgo)).toBe('2 minutes ago');
  });

  it('should format time correctly for hours', () => {
    const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    expect(formatTimeAgo(hoursAgo)).toBe('3 hours ago');
  });

  it('should format time correctly for days', () => {
    const daysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(daysAgo)).toBe('4 days ago');
  });

  it('should format time correctly for months', () => {
    // Approximate months as 30 days for testing simplicity
    const monthsAgo = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(monthsAgo)).toBe('2 months ago');
  });

  it('should format time correctly for years', () => {
    // Approximate years as 365 days for testing simplicity
    const yearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(yearsAgo)).toBe('2 years ago');
  });
});

describe('App component - fetchLogEntries', () => {
  // mockGetDocs is now part of the top-level mock, but we can still control its behavior per test
  // by re-assigning it or using vi.mocked an
  // For simplicity, we'll use vi.mocked if needed or rely on the setup in beforeEach.

  beforeEach(() => {
    // Reset mocks before each test, especially for functions whose behavior might change
    vi.mocked(require('./firebaseClient').getDocs).mockReset();
    vi.mocked(require('./firebaseClient').addDoc).mockReset();
    vi.mocked(require('./firebaseClient').updateDoc).mockReset();
    vi.mocked(require('./firebaseClient').deleteDoc).mockReset();
    // Re-mock getDocs for fetchLogEntries if necessary, or set a default behavior
    vi.mocked(require('./firebaseClient').getDocs).mockResolvedValue({ docs: [] }); // Default to empty
  });

  it('should fetch and display log entries', async () => {
    const mockGetDocs = require('./firebaseClient').getDocs; // Get the mocked function
    const mockEntries = [
      { id: '1', timestamp: new Date(), type: LogType.Meal, mealSubtype: MealSubtype.Given, foodType: 'Kibble' },
      { id: '2', timestamp: new Date(), type: LogType.Bathroom, activity: BathroomActivity.Pee },
    ];
    const mockQuerySnapshot = {
      docs: mockEntries.map(entry => ({
        id: entry.id,
        data: () => ({ ...entry, timestamp: { toDate: () => entry.timestamp } }), // Mock Firestore Timestamp behavior
      })),
    };
    mockGetDocs.mockResolvedValueOnce(mockQuerySnapshot); // Use mockResolvedValueOnce if behavior changes per test

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Kibble')).toBeInTheDocument();
      expect(screen.getByText(/Pee/)).toBeInTheDocument(); // Simple check for activity
    });
    expect(mockGetDocs).toHaveBeenCalledTimes(1); // Initial fetch
  });

  it('should display error message if fetching entries fails', async () => {
    const mockGetDocs = require('./firebaseClient').getDocs;
    const errorMessage = 'Failed to fetch';
    mockGetDocs.mockRejectedValueOnce(new Error(errorMessage)); // Use mockRejectedValueOnce

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`Failed to load activities: ${errorMessage}`))).toBeInTheDocument();
    });
    expect(mockGetDocs).toHaveBeenCalledTimes(1); // Ensure it was called
  });
});

describe('App component - saveLogEntry', () => {
  // Mocks are now top-level, get them via require
  // const mockAddDoc = require('./firebaseClient').addDoc;
  // const mockUpdateDoc = require('./firebaseClient').updateDoc;
  // const mockGetDocs = require('./firebaseClient').getDocs;


  beforeEach(() => {
    // Reset relevant mocks before each test in this suite
    vi.mocked(require('./firebaseClient').addDoc).mockReset();
    vi.mocked(require('./firebaseClient').updateDoc).mockReset();
    vi.mocked(require('./firebaseClient').getDocs).mockReset().mockResolvedValue({ docs: [] }); // Default for fetchLogEntries
  });

  it('should create a new log entry and refresh list', async () => {
    const mockAddDoc = require('./firebaseClient').addDoc;
    const mockGetDocs = require('./firebaseClient').getDocs;
    mockAddDoc.mockResolvedValue({ id: 'newEntryId' });
    const newEntryData = { type: LogType.Meal, mealSubtype: MealSubtype.Given, foodType: 'Test Food' };

    render(<App />);
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(1)); // Initial fetch

    const foodTypeInput = screen.getByLabelText(/Food Type/i);
    await userEvent.type(foodTypeInput, newEntryData.foodType);
    const mealTypeRadio = screen.getByLabelText(new RegExp(LogType.Meal, "i"));
    await fireEvent.click(mealTypeRadio);
    const mealSubtypeGivenRadio = screen.getByLabelText(new RegExp(MealSubtype.Given, "i"));
    await fireEvent.click(mealSubtypeGivenRadio);
    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(), // Collection ref is mocked
        expect.objectContaining({
          ...newEntryData,
          timestamp: expect.anything(),
        })
      );
    });
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(2)); // After save
  });

  it('should update an existing log entry and refresh list', async () => {
    const mockUpdateDoc = require('./firebaseClient').updateDoc;
    const mockGetDocs = require('./firebaseClient').getDocs;
    const existingEntry = {
      id: 'existingId',
      timestamp: new Date(Date.now() - 100000),
      type: LogType.Bathroom,
      activity: BathroomActivity.Pee,
    };
    mockGetDocs.mockResolvedValueOnce({ // For initial load
      docs: [{ id: existingEntry.id, data: () => ({ ...existingEntry, timestamp: { toDate: () => existingEntry.timestamp }}) }],
    });
    mockUpdateDoc.mockResolvedValue({});

    render(<App />);
    await waitFor(() => screen.getByText(/Pee/i));

    const editButton = screen.getByRole('button', { name: /edit/i });
    await fireEvent.click(editButton);

    const notesInput = screen.getByLabelText(/Notes/i);
    const updatedNotes = "Updated notes for test";
    await userEvent.clear(notesInput);
    await userEvent.type(notesInput, updatedNotes);
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(), // Doc ref is mocked
        expect.objectContaining({ notes: updatedNotes })
      );
    });
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(2)); // Initial + after update
  });

  it('should display error message if saving an entry fails', async () => {
    const mockAddDoc = require('./firebaseClient').addDoc;
    const mockGetDocs = require('./firebaseClient').getDocs;
    const errorMessage = 'Failed to save';
    mockAddDoc.mockRejectedValue(new Error(errorMessage));

    render(<App />);
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(1)); // Initial fetch

    const mealTypeRadio = screen.getByLabelText(new RegExp(LogType.Meal, "i"));
    await fireEvent.click(mealTypeRadio);
    const foodTypeInput = screen.getByLabelText(/Food Type/i);
    await userEvent.type(foodTypeInput, "Error Test Food");
    const mealSubtypeGivenRadio = screen.getByLabelText(new RegExp(MealSubtype.Given, "i"));
    await fireEvent.click(mealSubtypeGivenRadio);
    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`Failed to save activity: ${errorMessage}`))).toBeInTheDocument();
    });
  });
});

describe('App component - handleDeleteEntry', () => {
  const mockDeleteDoc = vi.fn();
  const mockGetDocs = vi.fn(); // To mock fetchLogEntries or direct state update

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mock('./firebaseClient', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        deleteDoc: mockDeleteDoc,
        getDocs: mockGetDocs, // For fetchLogEntries if it's called
        db: {},
        collection: vi.fn(() => 'mockedCollection'),
        doc: vi.fn((db, collectionName, id) => `mockedDocRef-${id}`), // Ensure ID is passed to mock
        orderBy: vi.fn(),
        query: vi.fn(),
        Timestamp: { fromDate: (date: Date) => date },
      };
    });

    // Setup mockGetDocs to return a default list for fetchLogEntries
    // This helps in verifying that the list is "refreshed" or item is removed
    const initialEntries = [
      { id: '1', timestamp: new Date(), type: LogType.Meal, foodType: 'Food to keep' },
      { id: 'deleteMe', timestamp: new Date(), type: LogType.Bathroom, activity: BathroomActivity.Pee, notes: 'Entry to delete' },
    ];
    mockGetDocs.mockResolvedValue({
      docs: initialEntries.map(entry => ({
        id: entry.id,
        data: () => ({ ...entry, timestamp: { toDate: () => entry.timestamp } }),
      })),
    });
  });

  it('should delete an entry and remove it from the list', async () => {
    mockDeleteDoc.mockResolvedValue({});
    const entryIdToDelete = 'deleteMe';

    render(<App />);

    // Wait for initial entries to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByText('Entry to delete')).toBeInTheDocument();
    });

    // Find the delete button for the specific entry and click it
    // This assumes LogList renders items with a delete button
    // We need to ensure the delete button for 'deleteMe' entry is clicked.
    // This might require a more specific selector if multiple delete buttons are present.
    // For example, by finding the list item first, then the delete button within it.
    const deleteButton = screen.getAllByRole('button', { name: /delete/i }).find(button => {
        // This is a bit of a hack; ideally, the button would have a more specific aria-label or test-id
        // For now, let's assume it's the one associated with 'Entry to delete'
        // This could be improved by structuring LogItem to make this easier
        const listItem = button.closest('article'); // Assuming each entry is an article
        return listItem && listItem.textContent?.includes('Entry to delete');
    });

    if (!deleteButton) {
        throw new Error("Delete button for 'Entry to delete' not found. Test setup might need adjustment for LogItem structure.");
    }

    await fireEvent.click(deleteButton);


    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDeleteDoc).toHaveBeenCalledWith(`mockedDocRef-${entryIdToDelete}`);
    });

    // Check that the entry is removed from the UI
    // This relies on the state update removing the item, not necessarily a re-fetch
    await waitFor(() => {
      expect(screen.queryByText('Entry to delete')).not.toBeInTheDocument();
    });
     // And that other entries are still present
    expect(screen.getByText('Food to keep')).toBeInTheDocument();
  });

  it('should display error message if deleting an entry fails', async () => {
    const errorMessage = 'Failed to delete';
    mockDeleteDoc.mockRejectedValue(new Error(errorMessage));
    const entryIdToDelete = 'deleteMe';

    render(<App />);

    // Wait for initial entries
    await waitFor(() => {
      expect(screen.getByText('Entry to delete')).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByRole('button', { name: /delete/i }).find(button => {
        const listItem = button.closest('article');
        return listItem && listItem.textContent?.includes('Entry to delete');
    });
     if (!deleteButton) {
        throw new Error("Delete button for 'Entry to delete' not found for error test.");
    }

    await fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalledWith(`mockedDocRef-${entryIdToDelete}`);
      expect(screen.getByText(new RegExp(`Failed to delete activity: ${errorMessage}`))).toBeInTheDocument();
    });
    // Ensure the item was not removed from the list on error
    expect(screen.getByText('Entry to delete')).toBeInTheDocument();
  });
});

describe('App component - saveLogEntry', () => {
  const mockAddDoc = vi.fn();
  const mockUpdateDoc = vi.fn();
  const mockGetDocs = vi.fn(); // To mock fetchLogEntries called after save

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mock('./firebaseClient', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        addDoc: mockAddDoc,
        updateDoc: mockUpdateDoc,
        getDocs: mockGetDocs, // Used by fetchLogEntries
        db: {},
        collection: vi.fn(() => 'mockedCollection'), // Return a string or simple object for collection
        doc: vi.fn(() => 'mockedDocRef'), // Return a string or simple object for doc
        orderBy: vi.fn(),
        query: vi.fn(),
        Timestamp: {
          fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 }), // More complete mock
          now: () => ({ toDate: () => new Date(), seconds: new Date().getTime() / 1000, nanoseconds: 0 })
        },
        serverTimestamp: vi.fn(() => 'mockedServerTimestamp') // Mock serverTimestamp
      };
    });

    // Setup mockGetDocs to return an empty list by default for fetchLogEntries
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('should create a new log entry and refresh list', async () => {
    mockAddDoc.mockResolvedValue({ id: 'newEntryId' });
    const newEntryData = { type: LogType.Meal, mealSubtype: MealSubtype.Given, foodType: 'Test Food' };

    render(<App />);
    // Wait for initial fetch to complete if any
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(1));


    // Simulate filling and submitting the form
    // This requires LogEntryForm to be integrated or a direct call to saveLogEntry if possible
    // For simplicity, we'll assume a way to call saveLogEntry directly or via a simplified form interaction
    // This part might need adjustment based on how LogEntryForm calls onSaveEntry

    // Let's find the food type input and fill it
    const foodTypeInput = screen.getByLabelText(/Food Type/i); // Assuming LogEntryForm has such a label
    await userEvent.type(foodTypeInput, newEntryData.foodType);

    // Select meal type
    const mealTypeRadio = screen.getByLabelText(new RegExp(LogType.Meal, "i"));
    await fireEvent.click(mealTypeRadio);

    // Select meal subtype (Given)
    const mealSubtypeGivenRadio = screen.getByLabelText(new RegExp(MealSubtype.Given, "i"));
    await fireEvent.click(mealSubtypeGivenRadio);


    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      // Check if addDoc was called with data that includes a serverTimestamp or a converted client timestamp
      expect(mockAddDoc).toHaveBeenCalledWith(
        'mockedCollection', // As collection() is mocked to return this
        expect.objectContaining({
          ...newEntryData,
          // Timestamp will be either a serverTimestamp or a client-side generated one
          // If client-side, it would be a Firestore Timestamp object.
          // If server-side, it would be the result of serverTimestamp()
          timestamp: expect.anything(), // Loosened check for timestamp due to variability
        })
      );
    });

    // fetchLogEntries is called after save
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(2));
  });

  it('should update an existing log entry and refresh list', async () => {
    const existingEntry = {
      id: 'existingId',
      timestamp: new Date(Date.now() - 100000), // Some time ago
      type: LogType.Bathroom,
      activity: BathroomActivity.Pee,
    };
    // Initial fetch includes the entry to be edited
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: existingEntry.id, data: () => ({ ...existingEntry, timestamp: { toDate: () => existingEntry.timestamp }}) }],
    });
    mockUpdateDoc.mockResolvedValue({});


    render(<App />);
    await waitFor(() => screen.getByText(/Pee/i)); // Wait for the initial entry to be displayed

    // Simulate clicking edit on the existing entry
    // This requires LogList to render items that have an edit button
    // And that button, when clicked, calls onEditEntry with the entry data
    const editButton = screen.getByRole('button', { name: /edit/i }); // Assuming an edit button
    await fireEvent.click(editButton);

    // Form should be populated with existingEntry's data.
    // Change something, e.g., notes
    const notesInput = screen.getByLabelText(/Notes/i);
    const updatedNotes = "Updated notes for test";
    await userEvent.clear(notesInput);
    await userEvent.type(notesInput, updatedNotes);

    const saveButton = screen.getByRole('button', { name: /Save Changes/i }); // Or whatever the save button is named in edit mode
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'mockedDocRef', // As doc() is mocked to return this
        expect.objectContaining({ notes: updatedNotes })
      );
    });
    // fetchLogEntries is called after update
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(2)); // Initial fetch + fetch after update
  });


  it('should display error message if saving an entry fails', async () => {
    const errorMessage = 'Failed to save';
    mockAddDoc.mockRejectedValue(new Error(errorMessage)); // Or mockUpdateDoc for update scenario

    render(<App />);
    // Wait for initial fetch
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalledTimes(1));

    // Simulate adding a new entry
    const mealTypeRadio = screen.getByLabelText(new RegExp(LogType.Meal, "i"));
    await fireEvent.click(mealTypeRadio);
    const foodTypeInput = screen.getByLabelText(/Food Type/i);
    await userEvent.type(foodTypeInput, "Error Test Food");
    const mealSubtypeGivenRadio = screen.getByLabelText(new RegExp(MealSubtype.Given, "i"));
    await fireEvent.click(mealSubtypeGivenRadio);


    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`Failed to save activity: ${errorMessage}`))).toBeInTheDocument();
    });
  });
});
