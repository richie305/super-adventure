
import React from 'react';
import { LogEntry, LogType, BathroomActivity, MealSubtype, PoopSubtype } from '../types';

interface LogItemProps {
  entry: LogEntry;
  onEdit: () => void;
  onDelete: () => void;
}

const ActivityIcon: React.FC<{ type: LogType, activity?: BathroomActivity }> = ({ type, activity }) => {
  if (type === LogType.Meal) {
    return <span className="text-3xl mr-3" role="img" aria-label="Meal">🍲</span>;
  }
  if (type === LogType.Bathroom) {
    if (activity === BathroomActivity.Pee) return <span className="text-3xl mr-3" role="img" aria-label="Pee">💧</span>;
    if (activity === BathroomActivity.Poop) return <span className="text-3xl mr-3" role="img" aria-label="Poop">💩</span>;
    if (activity === BathroomActivity.Both) return <span className="text-3xl mr-3" role="img" aria-label="Pee and Poop">💧💩</span>;
    return <span className="text-3xl mr-3" role="img" aria-label="Bathroom">🚽</span>;
  }
  return null;
};

const ActivityTitle: React.FC<{ entry: LogEntry }> = ({ entry }) => {
    if (entry.type === LogType.Meal) {
        let mealDesc = "Meal";
        if (entry.mealSubtype) {
            mealDesc += ` (${entry.mealSubtype === MealSubtype.Given ? 'Given' : 'Stolen'}`;
            if (entry.foodType) {
                mealDesc += `: ${entry.foodType}`;
            }
            mealDesc += ')';
        } else if (entry.foodType) {
             mealDesc += ` (${entry.foodType})`;
        }
        return <span className="font-semibold text-emerald-700">{mealDesc}</span>;
    }
    if (entry.type === LogType.Bathroom) {
        let bathroomDesc = "";
        let colorClass = "text-blue-700"; // Default for general bathroom

        if (entry.activity === BathroomActivity.Pee) {
            bathroomDesc = "Pee Break";
            colorClass = "text-sky-700";
        } else if (entry.activity === BathroomActivity.Poop) {
            bathroomDesc = "Poop Break";
            colorClass = "text-orange-700";
            if (entry.poopSubtype) {
                bathroomDesc += ` (${entry.poopSubtype.charAt(0) + entry.poopSubtype.slice(1).toLowerCase()})`;
            }
        } else if (entry.activity === BathroomActivity.Both) {
            bathroomDesc = "Pee & Poop Break";
            colorClass = "text-purple-700";
            if (entry.poopSubtype) {
                 bathroomDesc += ` (Poop: ${entry.poopSubtype.charAt(0) + entry.poopSubtype.slice(1).toLowerCase()})`;
            }
        } else {
            bathroomDesc = "Bathroom Break";
        }
        return <span className={`font-semibold ${colorClass}`}>{bathroomDesc}</span>;
    }
    return null;
}


export const LogItem: React.FC<LogItemProps> = ({ entry, onEdit, onDelete }) => {
  const formattedTime = entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = entry.timestamp.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-5 flex items-start space-x-4 border border-slate-200 hover:shadow-xl transition-shadow">
      <ActivityIcon type={entry.type} activity={entry.activity} />
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xl">
            <ActivityTitle entry={entry} />
          </h3>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <p className="text-sm text-slate-500 text-right">{formattedDate} at {formattedTime}</p>
            <button
              onClick={onEdit}
              className="text-slate-500 hover:text-sky-600 transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
              aria-label="Edit entry"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="text-slate-500 hover:text-red-600 transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Delete entry"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {entry.type === LogType.Meal && entry.notes && (
          <p className="text-slate-600 text-sm italic">Notes: {entry.notes}</p>
        )}
         {entry.type === LogType.Bathroom && !entry.activity && ( 
          <p className="text-slate-600 text-sm">General bathroom break.</p>
        )}
      </div>
    </div>
  );
};
