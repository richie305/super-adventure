import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LogItem } from './LogItem';
import { LogEntry, LogType, BathroomActivity, MealSubtype, PoopSubtype } from '../types';

// Mock handler functions
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();

// --- Mock Entries ---

const mockMealEntry: LogEntry = {
  id: 'meal1',
  timestamp: new Date('2023-01-01T08:30:00Z'),
  type: LogType.Meal,
  mealSubtype: MealSubtype.Given,
  foodType: 'Kibble',
  notes: 'Ate all of it.',
};

const mockMealEntryNoNotes: LogEntry = {
  id: 'meal2',
  timestamp: new Date('2023-01-01T18:00:00Z'),
  type: LogType.Meal,
  mealSubtype: MealSubtype.Stolen,
  foodType: 'Chicken',
  // notes is undefined
};

const mockPeeEntry: LogEntry = {
  id: 'pee1',
  timestamp: new Date('2023-01-01T09:00:00Z'),
  type: LogType.Bathroom,
  activity: BathroomActivity.Pee,
  // notes for bathroom entries are not displayed by LogItem
};

const mockPoopEntry: LogEntry = {
  id: 'poop1',
  timestamp: new Date('2023-01-01T13:00:00Z'),
  type: LogType.Bathroom,
  activity: BathroomActivity.Poop,
  poopSubtype: PoopSubtype.Normal,
};

const mockPoopEntryNoSubtype: LogEntry = {
    id: 'poop2',
    timestamp: new Date('2023-01-02T07:00:00Z'),
    type: LogType.Bathroom,
    activity: BathroomActivity.Poop,
    // poopSubtype is undefined
};


const mockBothEntry: LogEntry = {
  id: 'both1',
  timestamp: new Date('2023-01-01T15:00:00Z'),
  type: LogType.Bathroom,
  activity: BathroomActivity.Both,
  poopSubtype: PoopSubtype.Small,
};

const mockBathroomGeneralEntry: LogEntry = {
    id: 'bathGeneral1',
    timestamp: new Date('2023-01-02T10:00:00Z'),
    type: LogType.Bathroom,
    // activity is undefined
};


const defaultProps = {
  onEdit: mockOnEdit,
  onDelete: mockOnDelete,
};

describe('LogItem', () => {
  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  describe('Rendering', () => {
    it('should render a Meal entry correctly with all details', () => {
      render(<LogItem {...defaultProps} entry={mockMealEntry} />);
      expect(screen.getByLabelText('Meal')).toBeInTheDocument(); // Icon
      expect(screen.getByText(/Meal \(Given: Kibble\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Notes: Ate all of it./i)).toBeInTheDocument();
      expect(screen.getByText(/8:30 AM/i)).toBeInTheDocument(); // Formatted time
      expect(screen.getByText(/Jan 1/i)).toBeInTheDocument(); // Formatted date, simplified check
    });

    it('should render a Meal entry correctly when notes are missing', () => {
      render(<LogItem {...defaultProps} entry={mockMealEntryNoNotes} />);
      expect(screen.getByLabelText('Meal')).toBeInTheDocument();
      expect(screen.getByText(/Meal \(Stolen: Chicken\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/Notes:/i)).not.toBeInTheDocument(); // Notes should not be rendered
      expect(screen.getByText(/6:00 PM/i)).toBeInTheDocument();
    });

    it('should render a Pee entry correctly', () => {
      render(<LogItem {...defaultProps} entry={mockPeeEntry} />);
      expect(screen.getByLabelText('Pee')).toBeInTheDocument();
      expect(screen.getByText(/Pee Break/i)).toBeInTheDocument();
      // Bathroom notes are not displayed by LogItem, so no assertion for notes.
      expect(screen.getByText(/9:00 AM/i)).toBeInTheDocument();
    });

    it('should render a Poop entry correctly with subtype', () => {
      render(<LogItem {...defaultProps} entry={mockPoopEntry} />);
      expect(screen.getByLabelText('Poop')).toBeInTheDocument();
      expect(screen.getByText(/Poop Break \(Normal\)/i)).toBeInTheDocument();
      expect(screen.getByText(/1:00 PM/i)).toBeInTheDocument();
    });

    it('should render a Poop entry correctly without subtype', () => {
      render(<LogItem {...defaultProps} entry={mockPoopEntryNoSubtype} />);
      expect(screen.getByLabelText('Poop')).toBeInTheDocument();
      expect(screen.getByText(/^Poop Break$/i)).toBeInTheDocument(); // Should not show subtype if undefined
      expect(screen.queryByText(/\(.*\)/i)).not.toBeInTheDocument(); // No parentheses for subtype
    });

    it('should render a Both (Pee and Poop) entry correctly with poop subtype', () => {
      render(<LogItem {...defaultProps} entry={mockBothEntry} />);
      expect(screen.getByLabelText('Pee and Poop')).toBeInTheDocument();
      expect(screen.getByText(/Pee & Poop Break \(Poop: Small\)/i)).toBeInTheDocument();
      expect(screen.getByText(/3:00 PM/i)).toBeInTheDocument();
    });

    it('should render a general Bathroom entry correctly when activity is undefined', () => {
      render(<LogItem {...defaultProps} entry={mockBathroomGeneralEntry} />);
      expect(screen.getByLabelText('Bathroom')).toBeInTheDocument(); // General bathroom icon
      // Target the heading specifically for "Bathroom Break" title
      expect(screen.getByRole('heading', { name: /^Bathroom Break$/i, level: 3 })).toBeInTheDocument();
      // Should also render "General bathroom break." as per LogItem logic
      expect(screen.getByText(/General bathroom break./i)).toBeInTheDocument();
    });

    it('should display edit and delete buttons', () => {
      render(<LogItem {...defaultProps} entry={mockMealEntry} />);
      expect(screen.getByRole('button', { name: /edit entry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete entry/i })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onEdit when the edit button is clicked', async () => {
      render(<LogItem {...defaultProps} entry={mockMealEntry} />);
      const user = userEvent.setup();

      const editButton = screen.getByRole('button', { name: /edit entry/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      // LogItem's onEdit prop is called with no arguments, it's the LogList that passes the entry.
      // So we check if it's called. The parent LogList test checks if it's called WITH the entry.
      // However, if LogItem itself was responsible for passing the entry:
      // expect(mockOnEdit).toHaveBeenCalledWith(mockMealEntry);
    });

    it('should call onDelete when the delete button is clicked', async () => {
      render(<LogItem {...defaultProps} entry={mockMealEntry} />);
      const user = userEvent.setup();

      const deleteButton = screen.getByRole('button', { name: /delete entry/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      // Similar to onEdit, LogItem's onDelete is called with no args.
      // LogList is responsible for passing the ID.
      // If LogItem itself passed the ID:
      // expect(mockOnDelete).toHaveBeenCalledWith(mockMealEntry.id);
    });
  });
});
