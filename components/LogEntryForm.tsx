
import React, { useState, useEffect, FormEvent } from 'react';
import { LogType, BathroomActivity, LogEntryData, LogEntry, MealSubtype, PoopSubtype } from '../types';

interface LogEntryFormProps {
  onSaveEntry: (entryData: LogEntryData, idToUpdate?: string) => void;
  editingEntry: LogEntry | null;
  onCancelEdit: () => void;
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatTimeForInput = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const LogEntryForm: React.FC<LogEntryFormProps> = ({ onSaveEntry, editingEntry, onCancelEdit }) => {
  const [entryType, setEntryType] = useState<LogType>(LogType.Bathroom);
  const [bathroomActivity, setBathroomActivity] = useState<BathroomActivity>(BathroomActivity.Pee);
  const [poopSubtype, setPoopSubtype] = useState<PoopSubtype>(PoopSubtype.Normal);
  const [mealNotes, setMealNotes] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [mealSubtype, setMealSubtype] = useState<MealSubtype>(MealSubtype.Given);
  const [foodType, setFoodType] = useState<string>('Kibble');

  useEffect(() => {
    if (editingEntry) {
      setEntryType(editingEntry.type);
      if (editingEntry.type === LogType.Bathroom) {
        setBathroomActivity(editingEntry.activity || BathroomActivity.Pee);
        setPoopSubtype(editingEntry.poopSubtype || PoopSubtype.Normal);
        // Reset meal specifics
        setMealNotes('');
        setMealSubtype(MealSubtype.Given);
        setFoodType('Kibble');
      } else if (editingEntry.type === LogType.Meal) {
        setMealNotes(editingEntry.notes || '');
        setMealSubtype(editingEntry.mealSubtype || MealSubtype.Given);
        setFoodType(editingEntry.foodType || 'Kibble');
        // Reset bathroom specifics
        setBathroomActivity(BathroomActivity.Pee);
        setPoopSubtype(PoopSubtype.Normal);
      }
      setEditDate(formatDateForInput(editingEntry.timestamp));
      setEditTime(formatTimeForInput(editingEntry.timestamp));
    } else {
      // Reset form to default when not editing or after cancel/save
      setEntryType(LogType.Bathroom);
      setBathroomActivity(BathroomActivity.Pee);
      setPoopSubtype(PoopSubtype.Normal);
      setMealNotes('');
      setEditDate(''); 
      setEditTime('');
      setMealSubtype(MealSubtype.Given);
      setFoodType('Kibble');
    }
  }, [editingEntry]);

  const handleEntryTypeChange = (newType: LogType) => {
    setEntryType(newType);
    // Reset specific fields when type changes
    if (newType === LogType.Bathroom) {
      setMealNotes('');
      setMealSubtype(MealSubtype.Given);
      setFoodType('Kibble');
      // Keep bathroomActivity as is, or default
      setPoopSubtype(PoopSubtype.Normal); // Default poop subtype
    } else { // Meal
      setBathroomActivity(BathroomActivity.Pee); // Default bathroom activity
      setPoopSubtype(PoopSubtype.Normal); // Default poop subtype
    }
  };

  const handleBathroomActivityChange = (newActivity: BathroomActivity) => {
    setBathroomActivity(newActivity);
    if (newActivity === BathroomActivity.Pee) {
      setPoopSubtype(PoopSubtype.Normal); // Reset if only Pee
    }
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const currentFormData: LogEntryData = { type: entryType };

    if (entryType === LogType.Bathroom) {
      currentFormData.activity = bathroomActivity;
      if (bathroomActivity === BathroomActivity.Poop || bathroomActivity === BathroomActivity.Both) {
        currentFormData.poopSubtype = poopSubtype;
      }
    } else if (entryType === LogType.Meal) {
      currentFormData.mealSubtype = mealSubtype;
      currentFormData.foodType = foodType.trim() === '' ? 'Kibble' : foodType.trim();
      currentFormData.notes = mealNotes.trim();
    }

    if (editingEntry && editDate && editTime) {
        const [hours, minutes] = editTime.split(':').map(Number);
        const newTimestamp = new Date(editDate); 
        newTimestamp.setHours(hours); 
        newTimestamp.setMinutes(minutes); 
        newTimestamp.setSeconds(editingEntry.timestamp.getSeconds()); 
        newTimestamp.setMilliseconds(editingEntry.timestamp.getMilliseconds()); 
        currentFormData.timestamp = newTimestamp;
    }

    onSaveEntry(currentFormData, editingEntry ? editingEntry.id : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md shadow-xl rounded-xl p-6 space-y-6">
      <h2 id="form-heading" className="text-2xl font-semibold text-slate-700 mb-1 text-center">
        {editingEntry ? 'Edit Activity' : 'Log New Activity'}
      </h2>
      
      {editingEntry && (
        <fieldset className="border border-slate-300 p-4 rounded-md">
            <legend className="text-md font-semibold text-slate-600 px-2">Log Time</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="editDate" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                        type="date"
                        id="editDate"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
                        aria-label="Edit date"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="editTime" className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                    <input 
                        type="time"
                        id="editTime"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
                        aria-label="Edit time"
                        required
                    />
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-2">Original: {editingEntry.timestamp.toLocaleString()}</p>
        </fieldset>
      )}

      <div>
        <label className="block text-lg font-semibold text-slate-700 mb-2">Activity Type</label>
        <div className="flex space-x-3">
          {(Object.values(LogType) as LogType[]).map((type) => (
            <label key={type} className="flex-1">
              <input
                type="radio"
                name="entryType"
                value={type}
                checked={entryType === type}
                onChange={() => handleEntryTypeChange(type)}
                className="sr-only peer"
                aria-label={`Activity type ${type.toLowerCase()}`}
              />
              <div className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-center text-slate-600 cursor-pointer peer-checked:border-sky-500 peer-checked:text-sky-600 peer-checked:font-semibold hover:bg-slate-50 transition-colors">
                {type === LogType.Bathroom ? '🚽 Bathroom' : '🍲 Meal'}
              </div>
            </label>
          ))}
        </div>
      </div>

      {entryType === LogType.Bathroom && (
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">Bathroom Details</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.values(BathroomActivity) as BathroomActivity[]).map((activity) => (
                <label key={activity}>
                  <input
                    type="radio"
                    name="bathroomActivity"
                    value={activity}
                    checked={bathroomActivity === activity}
                    onChange={() => handleBathroomActivityChange(activity)}
                    className="sr-only peer"
                    aria-label={`Bathroom activity ${activity.toLowerCase()}`}
                  />
                  <div className="px-3 py-3 bg-white border-2 border-slate-300 rounded-lg text-center text-slate-600 cursor-pointer peer-checked:border-sky-500 peer-checked:text-sky-600 peer-checked:font-semibold hover:bg-slate-50 transition-colors">
                    {activity === BathroomActivity.Pee ? '💧 Pee' : activity === BathroomActivity.Poop ? '💩 Poop' : '💧💩 Both'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {(bathroomActivity === BathroomActivity.Poop || bathroomActivity === BathroomActivity.Both) && (
            <div>
              <label className="block text-lg font-semibold text-slate-700 mb-2">Poop Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.values(PoopSubtype) as PoopSubtype[]).map((subType) => (
                  <label key={subType}>
                    <input
                      type="radio"
                      name="poopSubtype"
                      value={subType}
                      checked={poopSubtype === subType}
                      onChange={() => setPoopSubtype(subType)}
                      className="sr-only peer"
                      aria-label={`Poop subtype ${subType.toLowerCase()}`}
                    />
                    <div className="px-3 py-3 bg-white border-2 border-slate-300 rounded-lg text-center text-slate-600 cursor-pointer peer-checked:border-amber-500 peer-checked:text-amber-600 peer-checked:font-semibold hover:bg-slate-50 transition-colors">
                      {subType.charAt(0) + subType.slice(1).toLowerCase()}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {entryType === LogType.Meal && (
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">Meal Type</label>
            <div className="flex space-x-3">
              {(Object.values(MealSubtype) as MealSubtype[]).map((subType) => (
                <label key={subType} className="flex-1">
                  <input
                    type="radio"
                    name="mealSubtype"
                    value={subType}
                    checked={mealSubtype === subType}
                    onChange={() => setMealSubtype(subType)}
                    className="sr-only peer"
                    aria-label={`Meal subtype ${subType.toLowerCase()}`}
                  />
                  <div className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-center text-slate-600 cursor-pointer peer-checked:border-sky-500 peer-checked:text-sky-600 peer-checked:font-semibold hover:bg-slate-50 transition-colors">
                    {subType === MealSubtype.Given ? 'Given' : 'Stolen'}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="foodType" className="block text-lg font-semibold text-slate-700 mb-2">
              Food Type
            </label>
            <input
              type="text"
              id="foodType"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              placeholder="e.g., Kibble (default)"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
              aria-label="Food Type"
            />
          </div>
          <div>
            <label htmlFor="mealNotes" className="block text-lg font-semibold text-slate-700 mb-2">
              Additional Meal Notes (optional)
            </label>
            <textarea
              id="mealNotes"
              value={mealNotes}
              onChange={(e) => setMealNotes(e.target.value)}
              placeholder="e.g., 1 cup, ate slowly"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
              rows={2}
              aria-label="Additional Meal Notes"
            ></textarea>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row sm:gap-3">
        <button
          type="submit"
          className="w-full sm:flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors text-lg shadow-md hover:shadow-lg"
          aria-live="polite"
        >
          {editingEntry ? 'Update Activity' : 'Log Activity'}
        </button>
        {editingEntry && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="w-full mt-3 sm:mt-0 sm:flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors text-lg"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
