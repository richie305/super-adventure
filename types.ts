
export enum LogType {
  Bathroom = 'BATHROOM',
  Meal = 'MEAL',
}

export enum BathroomActivity {
  Pee = 'PEE',
  Poop = 'POOP',
  Both = 'BOTH',
}

export enum MealSubtype {
  Given = 'GIVEN',
  Stolen = 'STOLEN',
}

export enum PoopSubtype {
  Small = 'SMALL',
  Normal = 'NORMAL',
  Huge = 'HUGE',
  Sick = 'SICK',
}

export interface LogEntryData {
  type: LogType;
  activity?: BathroomActivity; // For bathroom
  poopSubtype?: PoopSubtype; // For bathroom poop/both
  notes?: string; // General notes, or specific meal notes
  timestamp?: Date; // Added to allow editing the timestamp
  mealSubtype?: MealSubtype; // For meal: Given or Stolen
  foodType?: string; // For meal: e.g., Kibble, Wet Food
}

export interface LogEntry extends LogEntryData {
  id: string;
  timestamp: Date;
}
