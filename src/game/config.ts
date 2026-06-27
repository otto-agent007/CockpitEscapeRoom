export const PROJECT_NAME = 'CockpitEscapeRoom'

export const personalization = {
  captainDisplayName: 'Pop T',
  homeBaseAirport: 'MEM',
  startingAircraft: 'McDonnell Douglas DC-9',
  exactDc9Variant: 'TBD — confirm before final cockpit modeling',
  laterAircraft: 'Airbus',
  exactAirbusModel: 'TBD — required before the Airbus First-Officer cockpit is modeled',
  airlineContext: 'Northwest-era Memphis hub operation',
  rewardVehicle: 'Red Tesla Model Y',
  rewardPlateIdeas: ['CAPT DAD', 'DC9 2 EV', 'MEM FLYR', 'MARS 09'],
} as const

export const firstOfficerFlow = {
  controlIds: ['sidestick', 'thrust', 'gear', 'radio', 'altitude'] as const,
  controlCards: ['SIDESTICK', 'THRUST', 'GEAR', 'RADIO', 'ALTITUDE', 'CLOCK'] as const,
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
  controlHints: {
    sidestick: 'Nice. That’s the sidestick.',
    thrust: 'Correct. Thrust controls power.',
    gear: 'Good catch. That handles the gear.',
    radio: 'Right. That’s the radio panel.',
    altitude: 'Correct. That’s where altitude is read.',
  } as const,
  clockQuestion: 'How many flight hours are needed for a standard ATP certificate?',
  clockAnswer: '1500',
  clockFeedback: 'ATP milestone recognized: 1500.',
  firstCompleteBanner: 'FIRST-OFFICER MODE COMPLETE',
  lockerAccessText: 'Locker access granted.',
} as const

export const lockerFlow = {
  requiredInteractionIds: ['watch', 'baseball', 'nameplate', 'routeStrip', 'checklist'] as const,
  interactions: {
    watch: {
      label: 'Nice watch',
      question: 'How many right-seat hours before captain upgrade?',
      answer: '1000',
      feedback: 'Experience recognized: 1000.',
      hover: ['Something rests in the shadows.', 'Complete the locker inspection first.'],
      reveal: 'Final locker item revealed.',
      trigger: 'Clock and route clues point toward legacy access.',
    },
    baseball: {
      label: 'Baseball',
      question:
        'Before the captain wore wings, he wore a glove. Which future Pro Football Hall of Famer from Chaffey High crossed paths with him?',
      answer: 'Anthony Muñoz',
      feedback: 'Memory recognized: Anthony Muñoz.',
      hover: ['Something rests in the shadows.', 'Complete the locker inspection first.'],
      reveal: 'Route awareness logged.',
      trigger: 'Captain memory thread is now stronger.',
    },
    nameplate: {
      label: 'Pop T nameplate',
      question: 'Tap to read the nameplate.',
      answer: '',
      feedback: 'Pop T recognized.',
      hover: ['Something rests in the shadows.', 'Complete the locker inspection first.'],
      reveal: 'Identity cue confirmed.',
      trigger: 'Nameplate recognition complete.',
    },
    routeStrip: {
      label: 'Northwest-era route strip',
      question: 'Inspect the route strip.',
      answer: '',
      feedback: 'Route awareness logged.',
      hover: ['Something rests in the shadows.', 'Complete the locker inspection first.'],
      reveal: 'The legacy route clue is now connected.',
      trigger: 'Route memory is now active.',
    },
    checklist: {
      label: 'Folded checklist card',
      question: 'Arrange the ceremonial order: Power, Lights, Route, Crew, Release.',
      answer: 'POWER,LIGHTS,ROUTE,CREW,RELEASE',
      feedback: 'Checklist rhythm recognized.',
      hover: ['Something rests in the shadows.', 'Complete the locker inspection first.'],
      reveal: 'Checklist rhythm recognized.',
      trigger: 'Locker rhythm sequence is complete.',
    },
  } as const,
  hatText: {
    hiddenText: 'Something rests in the shadows.',
    foundText: 'Captain’s hat recognized.',
    unlockText: 'Captain’s hat recognized.',
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
  title: 'Cockpit Escape Room',
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
export type LockerInteraction = (typeof lockerFlow.requiredInteractionIds)[number]
export type LegacyRouteOption = (typeof dc9LegacyFlow.routePuzzleOptions)[number]
