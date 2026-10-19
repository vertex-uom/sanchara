// Today's front-desk counts for one property, as returned by the API.
export type TodayAtAGlance = {
  arrivals: number;
  departures: number;
  inHouse: number;
  unitsAvailableTonight: number;
  noShows: number;
};
