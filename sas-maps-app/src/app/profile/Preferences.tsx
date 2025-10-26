export interface UserPreferences {
  partySize: 'solo' | 'couple' | 'small-group' | 'large-group';
  vibeType: 'chill' | 'moderate' | 'lively' | 'party';
  priceRange: 'budget' | 'moderate' | 'high-end' | 'luxury';
  musicPreference: 'live-music' | 'dj' | 'background-music' | 'quiet';
  venueType: 'food-and-drink' | 'entretainment' | 'sport' ;
}

export const defaultPreferences: UserPreferences = {
  partySize: 'couple',
  vibeType: 'moderate',
  priceRange: 'moderate',
  musicPreference: 'background-music',
  venueType: 'food-and-drink'
};