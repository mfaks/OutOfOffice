export type TripStyle = 'long' | 'short';

export interface TripPlannerRequest {
  departure: string;
  destination: string;
  pto_days_remaining: number;
  max_flight_budget?: number;
  trip_style?: TripStyle;
  company_holidays?: string[];
}

export interface FlightOption {
  airline: string;
  estimated_flight_cost: number;
  layovers: number;
  departs_at: string;
  returns_at: string;
}

export interface TripRecommendation {
  rank: 1 | 2 | 3;
  start_date: string;
  end_date: string;
  total_days_off: number;
  pto_days_used: number;
  yield_score: number;
  best_flight: FlightOption;
  reasoning: string;
}

export interface TripPlannerResponse {
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

export interface TripPlannerUIState {
  status: PlanningStatus;
  response: TripPlannerResponse | null;
  error: string | null;
}
