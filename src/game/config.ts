export const PROJECT_NAME = 'CockpitEscapeRoom'

export const personalization = {
  captainDisplayName: 'Pop T',
  homeBaseAirport: 'MEM',
  startingAircraft: 'McDonnell Douglas DC-9',
  // Confirmed production target (docs/GAME_DESIGN.md); DC-9-51 artifacts are historical/compat reference only.
  exactDc9Variant: 'McDonnell Douglas DC-9-50',
  laterAircraft: 'Airbus',
  // Confirmed production target (docs/GAME_DESIGN.md).
  exactAirbusModel: 'Airbus A320',
  airlineContext: 'Northwest-era Memphis hub operation',
  rewardVehicle: 'Red Tesla Model Y',
  rewardPlateIdeas: ['CAPT DAD', 'DC9 2 EV', 'MEM FLYR', 'MARS 09'],
} as const

export const firstOfficerFlow = {
  controlIds: ['sidestick', 'thrust', 'gear', 'radio', 'altitude'] as const,
  decoyIds: ['leftPanelKnobs', 'rightDisplay', 'sideConsole', 'windshieldLights'] as const,
  controlCards: ['SIDESTICK', 'THRUST', 'GEAR', 'RADIO', 'ALTITUDE'] as const,
  controlMatch: {
    sidestick: 'SIDESTICK',
    thrust: 'THRUST',
    gear: 'GEAR',
    radio: 'RADIO',
    altitude: 'ALTITUDE',
  } as const,
  controlLabels: {
    sidestick: 'Sidestick',
    thrust: 'Thrust levers',
    gear: 'Gear lever',
    radio: 'Radio panel',
    altitude: 'Altitude area',
  } as const,
  controlDescriptions: {
    sidestick: 'Used to guide the aircraft.',
    thrust: 'Controls engine power.',
    gear: 'Controls landing gear position.',
    radio: 'Used for communication.',
    altitude: 'Shows how high the aircraft is.',
  } as const,
  decoyLabels: {
    leftPanelKnobs: 'Left panel knobs',
    rightDisplay: 'Right display screen',
    sideConsole: 'Side console switches',
    windshieldLights: 'Windshield light switches',
  } as const,
  controlHints: {
    sidestick: 'Nice. That’s the sidestick.',
    thrust: 'Correct. Thrust controls power.',
    gear: 'Good catch. That handles the gear.',
    radio: 'Right. That’s the radio panel.',
    altitude: 'Correct. That’s where altitude is read.',
  } as const,
  clockQuestion:
    'What is the minimum total flight time (hours) required to qualify for a standard Airline Transport Pilot certificate?',
  clockAnswer: '1500',
  clockAnswers: ['1500', '1500hour', '1500hours'] as const,
  clockFeedback: 'Airline Transport Pilot milestone recognized.',
  knowledgeLoggedText: 'First-Officer knowledge logged.',
  firstCompleteBanner: 'FIRST-OFFICER MODE COMPLETE',
  lockerAccessText: 'Locker access granted.',
} as const

export const lockerFlow = {
  memoryIds: ['watch', 'baseball', 'wings', 'chargingBull'] as const,
  // The remaining order will be authored after the Tripo props are imported and reviewed.
  authoredSequence: ['watch'] as const,
  questionIds: ['watch', 'baseball'] as const,
  inspectionIds: ['wings', 'chargingBull'] as const,
  introText: 'Before you can sit in the captain’s seat, you must understand the Captain’s journey…',
  openingInstruction: 'Begin with the pilot watch.',
  firstMemoryCompleteText: 'The first memory is logged. The next keepsake remains in shadow.',
  memories: {
    watch: {
      label: 'Pilot watch',
      eyebrow: 'Time and experience',
      question:
        'The Rolex GMT-Master was originally developed in 1954 in collaboration with Pan American World Airways to help commercial pilots combat ___ ___ on long-haul transatlantic flights',
      choices: ['Brain fog', 'Motion sickness', 'Sleep deprivation', 'Jet lag'] as const,
      acceptedAnswers: ['jet lag'] as const,
      feedback: 'Correct: the GMT-Master helped pilots track time across zones and manage jet lag.',
      retry: 'Not quite. Think about what happens after crossing several time zones.',
      strongerHint: 'The answer describes the body clock falling out of sync after rapid travel.',
      story: 'Long days, changing time zones, and the experience earned one flight at a time.',
    },
    baseball: {
      label: 'Baseball',
      eyebrow: 'Before the captain wore wings',
      question:
        'Before the captain wore wings, he wore a glove. Which future Pro Football Hall of Famer from Chaffey High crossed paths with him?',
      acceptedAnswers: ['Anthony Muñoz', 'Anthony Munoz', 'Muñoz', 'Munoz'] as const,
      feedback: 'Memory recognized: Anthony Muñoz.',
      retry: 'That name is not the one attached to this baseball memory. Try again.',
      strongerHint: 'Think of the Hall of Fame offensive tackle whose first name is Anthony.',
      story: 'Before airline wings, there was a glove, a field, and a remarkable Chaffey High connection.',
    },
    wings: {
      label: 'Airline wings',
      eyebrow: 'Second in command',
      feedback: 'The wings remember preparation, teamwork, and earned responsibility.',
      story: 'Every captain first learns how to support a crew, share judgment, and be ready when greater responsibility arrives.',
    },
    chargingBull: {
      label: 'Charging Bull',
      eyebrow: 'Patience and judgment',
      feedback: 'Investment wisdom remembered.',
      story: '[PERSONALIZE] Add Pop T’s exact investing advice here. The intended theme is patience, discipline, and thinking beyond the next headline.',
    },
  } as const,
  hatText: {
    hiddenText: 'A dark silhouette waits on the upper shelf.',
    revealText: 'Four memories align. The upper cubby opens.',
    foundText: 'Captain’s hat recognized.',
    promotionText: 'Promotion available.',
    captainModeText: 'POP T CAPTAIN MODE UNLOCKED',
    completeText: 'Locker scene complete.',
  } as const,
} as const

export const dc9LegacyFlow = {
  title: 'POP T CAPTAIN MODE',
  subtitle: 'Legacy checklist ready.',
  checklistOrder: ['battery', 'navigation', 'cabin'] as const,
  routePuzzleAnswers: ['LIT', 'JAN', 'BHM'],
  routePuzzleOptions: [
    { code: 'LIT', city: 'Little Rock' },
    { code: 'JAN', city: 'Jackson' },
    { code: 'BHM', city: 'Birmingham' },
    { code: 'LAX', city: 'Los Angeles' },
    { code: 'SEA', city: 'Seattle' },
    { code: 'AMS', city: 'Amsterdam' },
  ],
  completionText: 'Legacy authorization confirmed.',
  routeQuestion: 'Select three short-haul route codes that belong to the MEM legacy funnel.',
} as const

export const gameCopy = {
  title: "The Captain's Key",
  subtitle: 'First-Officer onboarding in Airbus, then the DC-9 legacy reveal.',
  premise:
    'The game is a personalized tribute. Start in a modern Airbus coaching loop, discover the locker story, then unlock Pop T Captain Mode in the DC-9.',
  rewardTitle: 'Ground Transport Upgrade Authorized',
  rewardVehicleLine: 'The red Tesla Model Y is unlocked.',
  finalMessage:
    'Happy Father’s Day, Pop T. Built for calm hands, strong memory, and the joy of flying forward together.',
  captainReward: 'Legacy hangar release authorized.',
  marsRank: 'Commander, Mars Transport Division',
  progressLabel: 'Stage',
  hiddenEasterEgg: {
    title: 'Mars diversion accepted.',
    message: 'The final game will hide this trigger behind the completed ending.',
  },
  briefInstructions: 'Start in Airbus First-Officer Mode, complete the locker reveal, then enter Pop T Captain Mode.',
} as const

export type FirstOfficerControl = (typeof firstOfficerFlow.controlIds)[number]
export type FirstOfficerDecoy = (typeof firstOfficerFlow.decoyIds)[number]
export type LockerMemoryId = (typeof lockerFlow.memoryIds)[number]
export type LockerQuestionId = (typeof lockerFlow.questionIds)[number]
export type LockerInspectionId = (typeof lockerFlow.inspectionIds)[number]
export type LegacyRouteOption = (typeof dc9LegacyFlow.routePuzzleOptions)[number]
