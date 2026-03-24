export type TripPriority =
  | 'best_yield'
  | 'lowest_cost'
  | 'most_pto'
  | 'least_pto';

export interface TripPlannerRequest {
  departure: string;
  destination: string;
  pto_days_remaining: number;
  max_flight_budget?: number;
  company_holidays?: string[];
  preferred_months?: number[];
  priority?: TripPriority;
}

export interface UserPreferences {
  pto_days_remaining: number | null;
  max_flight_budget: number | null;
  default_departure: string | null;
  default_destination: string | null;
  company_holidays: string[];
  preferred_months: number[];
}

export interface FlightOption {
  airline: string;
  estimated_flight_cost: number;
  layovers: number;
  departs_at: string;
  returns_at: string;
}

export interface TripRecommendation {
  rank: 1 | 2 | 3 | 4 | 5;
  start_date: string;
  end_date: string;
  total_days_off: number;
  pto_days_used: number;
  yield_score: number;
  best_flight: FlightOption;
  reasoning: string;
}

export interface TripPlannerResponse {
  thread_id: string;
  request: TripPlannerRequest;
  recommendations: TripRecommendation[];
  generated_at: string;
}

export interface RankConfig {
  label: string;
  rank: string;
  headerBg: string;
  badgeStyle: string;
  priceStyle: string;
  accentBar: string;
  pillBg: string;
}

export interface StatPillProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  pillBg: string;
}

export type PlanningStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuthUser {
  email: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
  ) => Promise<void>;
  logout: () => void;
}

export interface TripPlannerUIState {
  status: PlanningStatus;
  response: TripPlannerResponse | null;
  error: string | null;
}

export interface SavedTripCreate {
  departure: string;
  destination: string;
  recommendation: TripRecommendation;
}

export interface SavedTrip {
  id: number;
  departure: string;
  destination: string;
  start_date: string;
  end_date: string;
  pto_days_used: number;
  total_days_off: number;
  recommendation: TripRecommendation;
  saved_at: string;
}

export interface SavedTripListRead {
  trips: SavedTrip[];
  pto_days_remaining: number | null;
}
