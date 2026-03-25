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

export interface FlightOption {
  airline: string;
  estimated_flight_cost: number;
  layovers: number;
  outbound_departs_at: string;
  outbound_arrives_at: string;
  return_departs_at: string;
  return_arrives_at: string;
}

export interface DayItinerary {
  date: string;
  note: string;
  activities: string[];
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
  itinerary: DayItinerary[];
}

export interface TripPlannerResponse {
  thread_id: string;
  request: TripPlannerRequest;
  recommendations: TripRecommendation[];
  generated_at: string;
}

export interface RankConfig {
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
