export const PROJECT_NAME = 'CockpitEscapeRoom'

export const personalization = {
  captainDisplayName: 'Dad',
  homeBaseAirport: 'MEM',
  startingAircraft: 'McDonnell Douglas DC-9',
  exactDc9Variant: 'TBD — confirm before final cockpit modeling',
  laterAircraft: 'Airbus',
  exactAirbusModel: 'TBD — required before the Airbus bonus cockpit is modeled',
  airlineContext: 'Northwest-era Memphis hub operation',
  rewardVehicle: 'Red Tesla Model Y',
  rewardPlateIdeas: ['CAPT DAD', 'DC9 2 EV', 'MEM FLYR', 'MARS 09'],
} as const

export const dc9Atmosphere = {
  hub: 'MEM',
  feederAirportCodes: ['LIT', 'JAN', 'BHM', 'BTR', 'SHV', 'MOB', 'STL', 'BNA', 'SDF', 'IND'],
  routePuzzleAnswers: ['LIT', 'JAN', 'BHM'],
  routePuzzleOptions: [
    { code: 'LIT', city: 'Little Rock' },
    { code: 'JAN', city: 'Jackson' },
    { code: 'BHM', city: 'Birmingham' },
    { code: 'LAX', city: 'Los Angeles' },
    { code: 'SEA', city: 'Seattle' },
    { code: 'AMS', city: 'Amsterdam' },
  ],
  environmentalDetails: [
    'Memphis route strips and Concourse B atmosphere',
    'Northwest-inspired silver-and-red era details without copying protected brand artwork',
    'Analog instrumentation, mechanical switches, worn panel paint, and restrained annunciator lighting',
    'A busy bank-of-flights feeling used as atmosphere rather than a history exam',
  ],
} as const

export const gameCopy = {
  title: 'Cockpit Escape Room',
  subtitle: 'A DC-9 legacy flight with an Airbus bonus mission',
  premise:
    'The aircraft is safely parked for a commemorative flight. The family crew must restore a fictional legacy lockout using lessons, routes, and memories associated with an expert captain.',
  finalMessage:
    'From the DC-9 to the Airbus, great pilots adapt, stay calm, and guide the crew home.',
  captainReward: 'Ground transport upgrade authorized: red Model Y unlocked.',
  marsRank: 'Commander, Mars Transport Division',
} as const
