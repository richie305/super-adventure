import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LogList } from './LogList'; // Assuming LogList.tsx is in the same directory
import { LogEntry, LogType, BathroomActivity, MealSubtype, PoopSubtype } from '../types'; // Assuming types.ts is in the parent directory

// Mock handler functions
const mockOnEditEntry = vi.fn();
const mockOnDeleteEntry = vi.fn();

// Mock entries
const mockEntries: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date('2023-01-01T10:00:00Z'),
    type: LogType.Meal,
    mealSubtype: MealSubtype.Given,
    foodType: 'Kibble',
    notes: 'Breakfast',
  },
  {
    id: '2',
    timestamp: new Date('2023-01-01T12:30:00Z'),
    type: LogType.Bathroom,
    activity: BathroomActivity.Poop,
    poopSubtype: PoopSubtype.Normal,
    notes: 'Afternoon poop',
  },
  {
    id: '3',
    timestamp: new Date('2023-01-01T18:00:00Z'),
    type: LogType.Meal,
    mealSubtype: MealSubtype.Stolen,
    foodType: 'Chicken',
    notes: 'Dinner - stolen from table!',
  },
];

const defaultProps = {
  entries: mockEntries,
  onEditEntry: mockOnEditEntry,
  onDeleteEntry: mockOnDeleteEntry,
  isLoading: false,
};

describe('LogList', () => {
  beforeEach(() => {
    mockOnEditEntry.mockClear();
    mockOnDeleteEntry.mockClear();
  });

  describe('Rendering', () => {
    it('should render a list of entries correctly', () => {
      render(<LogList {...defaultProps} />);

      // Check if all entries are rendered based on LogItem formatting
      expect(screen.getByText(/Notes: Breakfast/i)).toBeInTheDocument();
      expect(screen.getByText(/Meal \(Given: Kibble\)/i)).toBeInTheDocument();
      // Bathroom notes ("Afternoon poop") are not rendered by LogItem
      expect(screen.queryByText('Afternoon poop')).not.toBeInTheDocument();
      expect(screen.getByText(/Poop Break \(Normal\)/i)).toBeInTheDocument(); // PoopSubtype is part of title
      expect(screen.getByText(/Notes: Dinner - stolen from table!/i)).toBeInTheDocument();
      expect(screen.getByText(/Meal \(Stolen: Chicken\)/i)).toBeInTheDocument();

      // Check for edit and delete buttons for each entry
      expect(screen.getAllByRole('button', { name: /edit entry/i })).toHaveLength(mockEntries.length);
      expect(screen.getAllByRole('button', { name: /delete entry/i })).toHaveLength(mockEntries.length);
    });

    it('should display a message when there are no entries', () => {
      render(<LogList {...defaultProps} entries={[]} />);
      expect(screen.getByText(/No activities logged yet./i)).toBeInTheDocument();
      expect(screen.queryByText(/Notes: Breakfast/i)).not.toBeInTheDocument();
    });

    it('should render correctly when isLoading is true and entries are empty (no specific loading message)', () => {
      render(<LogList {...defaultProps} isLoading={true} entries={[]} />);
      expect(screen.getByText(/Activity Log/i)).toBeInTheDocument(); // Title should still be there
      expect(screen.queryByText(/No activities logged yet./i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Notes: Breakfast/i)).not.toBeInTheDocument(); // No entries
    });

    it('should show entries correctly when isLoading is true (no "loading more" message as it is commented out)', () => {
      render(<LogList {...defaultProps} isLoading={true} />);

      expect(screen.getByText(/Notes: Breakfast/i)).toBeInTheDocument();
      expect(screen.getByText(/Poop Break \(Normal\)/i)).toBeInTheDocument();

      // The "Loading more activities..." text is commented out in LogList.tsx
      expect(screen.queryByText(/Loading more activities.../i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Updating.../i)).not.toBeInTheDocument(); // Also checking for the commented out "Updating..."
    });
  });

  describe('Interactions', () => {
    it('should call onEditEntry with the correct entry when an edit button is clicked', async () => {
      render(<LogList {...defaultProps} />);
      const user = userEvent.setup();

      // Get all edit buttons. Let's click the first one.
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(mockOnEditEntry).toHaveBeenCalledTimes(1);
      expect(mockOnEditEntry).toHaveBeenCalledWith(mockEntries[0]);
    });

    it('should call onDeleteEntry with the correct ID when a delete button is clicked', async () => {
      render(<LogList {...defaultProps} />);
      const user = userEvent.setup();

      // Get all delete buttons. Let's click the second one.
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[1]);

      expect(mockOnDeleteEntry).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteEntry).toHaveBeenCalledWith(mockEntries[1].id);
    });
  });
});
