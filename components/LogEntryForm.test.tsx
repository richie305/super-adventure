import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LogEntryForm } from './LogEntryForm';
import { LogType, BathroomActivity, MealSubtype, PoopSubtype, LogEntryData, LogEntry } from '../types'; // Assuming types.ts is in the parent directory

// Mock the onSaveEntry and onCancelEdit functions
const mockOnSaveEntry = vi.fn();
const mockOnCancelEdit = vi.fn();

const defaultProps = {
  onSaveEntry: mockOnSaveEntry,
  editingEntry: null,
  onCancelEdit: mockOnCancelEdit,
};

describe('LogEntryForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockOnSaveEntry.mockClear();
    mockOnCancelEdit.mockClear();
  });

  describe('Rendering', () => {
    it('should render correctly in initial (new entry) state', () => {
      render(<LogEntryForm {...defaultProps} />);

      expect(screen.getByText(/Activity Type/i)).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /activity type bathroom/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /activity type meal/i })).toBeInTheDocument();

      // Default is Bathroom
      expect(screen.getByRole('radio', { name: /activity type bathroom/i })).toBeChecked();
      // NO general notes field, NO specific bathroom notes input in new mode as per component code
      // NO timestamp input for new entries as per component code
      expect(screen.getByRole('button', { name: /Log Activity/i })).toBeInTheDocument();

      // Bathroom fields should be visible
      expect(screen.getByText(/Bathroom Details/i)).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Bathroom activity pee/i })).toBeInTheDocument(); // Default bathroom activity

      // Meal fields should initially be hidden
      expect(screen.queryByLabelText(/Food Type/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: /Meal subtype given/i })).not.toBeInTheDocument();
    });

    it('should render correctly when editing an entry (Meal)', () => {
      const editingMealEntry: LogEntry = {
        id: 'meal1',
        type: LogType.Meal,
        mealSubtype: MealSubtype.Stolen,
        foodType: 'Test Food',
        notes: 'Stolen from counter',
        timestamp: new Date(2023, 0, 15, 10, 30),
      };
      render(<LogEntryForm {...defaultProps} editingEntry={editingMealEntry} />);

      expect(screen.getByRole('radio', { name: /activity type meal/i })).toBeChecked();
      expect(screen.getByLabelText(/Food Type/i)).toHaveValue('Test Food');
      expect(screen.getByRole('radio', { name: /Meal subtype stolen/i })).toBeChecked();
      expect(screen.getByLabelText(/Additional Meal Notes/i)).toHaveValue('Stolen from counter');

      expect(screen.getByLabelText(/Date/i)).toHaveValue('2023-01-15');
      expect(screen.getByLabelText(/Time/i)).toHaveValue('10:30');

      expect(screen.getByRole('button', { name: /Update Activity/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should render correctly when editing an entry (Bathroom)', () => {
      const editingBathroomEntry: LogEntry = {
        id: 'bath1',
        type: LogType.Bathroom,
        activity: BathroomActivity.Poop,
        poopSubtype: PoopSubtype.Normal,
        notes: 'Regular poop', // Note: component doesn't render a field for bathroom notes.
        timestamp: new Date(2023, 0, 16, 8, 0),
      };
      render(<LogEntryForm {...defaultProps} editingEntry={editingBathroomEntry} />);

      expect(screen.getByRole('radio', { name: /activity type bathroom/i })).toBeChecked();
      expect(screen.getByText(/Bathroom Details/i)).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Bathroom activity poop/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /Poop subtype normal/i })).toBeChecked();
      // No input field for bathroom notes is rendered by the component.
      // So, we cannot check its value directly. If notes were displayed some other way, we'd test that.

      expect(screen.getByLabelText(/Date/i)).toHaveValue('2023-01-16');
      expect(screen.getByLabelText(/Time/i)).toHaveValue('08:00');

      expect(screen.getByRole('button', { name: /Update Activity/i })).toBeInTheDocument();
    });
  });

  describe('Input Changes', () => {
    it('should update text input fields when user types', async () => {
      render(<LogEntryForm {...defaultProps} />);
      // Default is Bathroom. As per component code, no specific "Bathroom Notes" textarea is rendered directly.
      // The notes from editingEntry.notes are used if type is Bathroom, but no direct input in new/default mode.
      // So, this part of the test for Bathroom notes is removed.

      // Switch to Meal to test Food Type and Meal Notes
      await fireEvent.click(screen.getByRole('radio', { name: /activity type meal/i }));

      const foodTypeInput = screen.getByLabelText(/Food Type/i);
      await userEvent.clear(foodTypeInput); // Clear existing value before typing
      await userEvent.type(foodTypeInput, 'Chicken');
      expect(foodTypeInput).toHaveValue('Chicken');

      const mealNotesInput = screen.getByLabelText(/Additional Meal Notes/i);
      await userEvent.type(mealNotesInput, 'Test meal notes');
      expect(mealNotesInput).toHaveValue('Test meal notes');
    });

    // Test for updating timestamp in new entry mode is removed as the field doesn't exist.

    it('should update date and time when editing an entry', async () => {
      const editingMealEntry: LogEntry = {
        id: 'meal1', type: LogType.Meal, mealSubtype: MealSubtype.Stolen,
        foodType: 'Test Food', notes: 'Initial', timestamp: new Date(2023, 0, 15, 10, 30),
      };
      render(<LogEntryForm {...defaultProps} editingEntry={editingMealEntry} />);

      const dateInput = screen.getByLabelText(/Date/i) as HTMLInputElement;
      await fireEvent.change(dateInput, { target: { value: '2023-01-17' } });
      expect(dateInput.value).toBe('2023-01-17');

      const timeInput = screen.getByLabelText(/Time/i) as HTMLInputElement;
      await fireEvent.change(timeInput, { target: { value: '11:45' } });
      expect(timeInput.value).toBe('11:45');
    });

    it('should show Bathroom-specific fields by default and when LogType is changed to Bathroom', async () => {
      render(<LogEntryForm {...defaultProps} />);
      // Default is Bathroom, so fields are already visible
      expect(screen.getByText(/Bathroom Details/i)).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Bathroom activity pee/i })).toBeInTheDocument();

      // Click Meal then back to Bathroom to test transition
      await fireEvent.click(screen.getByRole('radio', { name: /activity type meal/i }));
      expect(screen.queryByText(/Bathroom Details/i)).not.toBeInTheDocument();

      await fireEvent.click(screen.getByRole('radio', { name: /activity type bathroom/i }));
      expect(screen.getByText(/Bathroom Details/i)).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Bathroom activity pee/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Bathroom activity poop/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Bathroom activity both/i })).toBeInTheDocument();

      await fireEvent.click(screen.getByRole('radio', { name: /Bathroom activity poop/i }));
      expect(screen.getByRole('radio', { name: /Poop subtype normal/i })).toBeInTheDocument();
    });

    it('should show Meal-specific fields and hide Bathroom fields when LogType is changed to Meal', async () => {
      render(<LogEntryForm {...defaultProps} />);
      // Default is Bathroom, so its fields are visible
      expect(screen.getByText(/Bathroom Details/i)).toBeInTheDocument();

      // Change to Meal type
      await fireEvent.click(screen.getByRole('radio', { name: /activity type meal/i }));

      expect(screen.getByLabelText(/Food Type/i)).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Meal subtype given/i })).toBeInTheDocument();
      expect(screen.queryByText(/Bathroom Details/i)).not.toBeInTheDocument();
    });

    it('should update activity selection when user clicks on bathroom activity radios', async () => {
        render(<LogEntryForm {...defaultProps} />);
        // Already in Bathroom mode by default

        const peeRadio = screen.getByRole('radio', { name: /Bathroom activity pee/i });
        const poopRadio = screen.getByRole('radio', { name: /Bathroom activity poop/i });

        await fireEvent.click(peeRadio);
        expect(peeRadio).toBeChecked();
        expect(poopRadio).not.toBeChecked();
        expect(screen.queryByRole('radio', { name: /Poop subtype normal/i })).not.toBeInTheDocument();

        await fireEvent.click(poopRadio);
        expect(poopRadio).toBeChecked();
        expect(peeRadio).not.toBeChecked();
        expect(screen.getByRole('radio', { name: /Poop subtype normal/i })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSaveEntry with correct data for a new Meal entry', async () => {
      render(<LogEntryForm {...defaultProps} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('radio', { name: /activity type meal/i }));

      const foodTypeInput = screen.getByLabelText(/Food Type/i);
      await userEvent.clear(foodTypeInput); // Clear default "Kibble"
      await user.type(foodTypeInput, 'Kibble'); // Type "Kibble"
      await user.click(screen.getByRole('radio', { name: /Meal subtype given/i }));
      await user.type(screen.getByLabelText(/Additional Meal Notes/i), 'Morning meal');

      // No timestamp input for new entry in the form.
      await user.click(screen.getByRole('button', { name: /Log Activity/i }));

      expect(mockOnSaveEntry).toHaveBeenCalledTimes(1);
      expect(mockOnSaveEntry).toHaveBeenCalledWith(
        {
          type: LogType.Meal,
          foodType: 'Kibble',
          mealSubtype: MealSubtype.Given,
          notes: 'Morning meal',
          activity: undefined,
          poopSubtype: undefined,
        },
        undefined // idToUpdate is undefined for new entries
      );
    });

    it('should call onSaveEntry with correct data for a new Bathroom entry', async () => {
      render(<LogEntryForm {...defaultProps} />); // Default is Bathroom
      const user = userEvent.setup();

      await user.click(screen.getByRole('radio', { name: /Bathroom activity poop/i }));
      await user.click(screen.getByRole('radio', { name: /Poop subtype normal/i }));

      await user.click(screen.getByRole('button', { name: /Log Activity/i }));

      expect(mockOnSaveEntry).toHaveBeenCalledTimes(1);
      expect(mockOnSaveEntry).toHaveBeenCalledWith(
        {
          type: LogType.Bathroom,
          activity: BathroomActivity.Poop,
          poopSubtype: PoopSubtype.Normal,
          foodType: undefined,
          mealSubtype: undefined,
        },
        undefined // idToUpdate is undefined for new entries
      );
    });

    it('should call onSaveEntry with ID and new timestamp when editing an entry', async () => {
      const initialTimestamp = new Date(2023, 0, 15, 10, 30, 25, 500); // Jan 15, 2023, 10:30:25.500
      const editingEntry: LogEntry = {
        id: 'editThisOne',
        type: LogType.Meal,
        mealSubtype: MealSubtype.Given,
        foodType: 'Old Food',
        notes: 'Initial notes',
        timestamp: initialTimestamp,
      };
      render(<LogEntryForm {...defaultProps} editingEntry={editingEntry} />);
      const user = userEvent.setup();

      const notesInput = screen.getByLabelText(/Additional Meal Notes/i);
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated notes');

      const dateToSet = '2023-01-17';
      const timeToSet = '11:45';
      await fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: dateToSet } });
      await fireEvent.change(screen.getByLabelText(/Time/i), { target: { value: timeToSet } });

      await user.click(screen.getByRole('button', { name: /Update Activity/i }));

      expect(mockOnSaveEntry).toHaveBeenCalledTimes(1);

      // Construct expected timestamp carefully, preserving original seconds/milliseconds
      // as per LogEntryForm's handleSubmit logic.
      const expectedTimestamp = new Date(dateToSet + 'T' + timeToSet);
      expectedTimestamp.setSeconds(initialTimestamp.getSeconds());
      expectedTimestamp.setMilliseconds(initialTimestamp.getMilliseconds());

      expect(mockOnSaveEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Updated notes',
          type: editingEntry.type,
          foodType: editingEntry.foodType,
          mealSubtype: editingEntry.mealSubtype,
          timestamp: expectedTimestamp,
        }),
        editingEntry.id
      );
    });

    it('should call onCancelEdit when Cancel button is clicked during an edit', async () => {
      const editingEntry: LogEntry = {
        id: 'edit1',
        type: LogType.Meal,
        mealSubtype: MealSubtype.Given,
        foodType: 'Some Food',
        notes: 'Some notes',
        timestamp: new Date(),
      };
      render(<LogEntryForm {...defaultProps} editingEntry={editingEntry} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnCancelEdit).toHaveBeenCalledTimes(1);
      expect(mockOnSaveEntry).not.toHaveBeenCalled();
    });

    it('should submit with default Food Type if Food Type field is cleared for Meal entry', async () => {
        render(<LogEntryForm {...defaultProps} />);
        const user = userEvent.setup();
        await user.click(screen.getByRole('radio', { name: /activity type meal/i }));

        const foodTypeInput = screen.getByLabelText(/Food Type/i);
        await user.clear(foodTypeInput); // Clear the input

        await user.click(screen.getByRole('button', { name: /Log Activity/i }));
        expect(mockOnSaveEntry).toHaveBeenCalledTimes(1);
        // The component logic defaults foodType to 'Kibble' if it's submitted as empty string.
        expect(mockOnSaveEntry).toHaveBeenCalledWith(
            expect.objectContaining({ foodType: 'Kibble' }), // Ensures foodType is Kibble due to form logic
            undefined // idToUpdate is undefined
        );
    });

    it('should submit with default Bathroom selections if not changed', async () => {
        render(<LogEntryForm {...defaultProps} />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: /Log Activity/i }));
        expect(mockOnSaveEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                type: LogType.Bathroom,
                activity: BathroomActivity.Pee,
            }),
            undefined // idToUpdate is undefined
        );

        mockOnSaveEntry.mockClear();

        await user.click(screen.getByRole('radio', {name: /Bathroom activity poop/i}));
        await user.click(screen.getByRole('button', { name: /Log Activity/i }));
        expect(mockOnSaveEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                type: LogType.Bathroom,
                activity: BathroomActivity.Poop,
                poopSubtype: PoopSubtype.Normal,
            }),
            undefined // idToUpdate is undefined
        );
    });
  });
});
