export const PROJECT_NAME = 'CockpitEscapeRoom'

export const personalization = {
  captainDisplayName: 'Pop T',
  homeBaseAirport: 'MEM',
  startingAircraft: 'McDonnell Douglas DC-9',
  // Owner-cleared exact production target; DC-9-51 artifacts are atmosphere references only.
  exactDc9Variant: 'McDonnell Douglas DC-9-32',
  laterAircraft: 'Airbus',
  // Confirmed production target (docs/GAME_DESIGN.md).
  exactAirbusModel: 'Airbus A320',
  airlineContext: 'Northwest-era Memphis hub operation',
  rewardVehicle: 'Red Tesla Model Y',
  rewardPlateIdeas: ['CAPT DAD', 'DC9 2 EV', 'MEM FLYR', 'MARS 09'],
} as const

export const airbusCaptainFlow = {
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
  knowledgeLoggedText: 'Captain knowledge logged.',
  firstCompleteBanner: 'POP T CAPTAIN MODE COMPLETE',
  lockerAccessText: 'Locker access granted.',
} as const

export const lockerFlow = {
  memoryIds: ['watch', 'baseball', 'chargingBull', 'wings'] as const,
  authoredSequence: ['watch', 'baseball', 'chargingBull', 'wings'] as const,
  questionIds: ['watch', 'baseball', 'chargingBull', 'wings'] as const,
  introText: 'Before you can sit in the captain’s seat, you must understand the Captain’s journey…',
  openingInstruction: 'Begin with the pilot watch.',
  memories: {
    watch: {
      label: 'Pilot watch',
      storyTitle: 'Rolex GMT-Master',
      eyebrow: 'Time and experience',
      answerMode: 'choice',
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
      storyTitle: 'Baseball',
      eyebrow: 'Before the captain wore wings',
      answerMode: 'choice',
      question: 'Which future Pro Football Hall of Famer from Chaffey High crossed paths with him?',
      choices: ['Anthony Muñoz', 'Orlando Pace', 'Johnathan Ogden', 'Art Shell'] as const,
      acceptedAnswers: ['Anthony Muñoz', 'Anthony Munoz', 'Muñoz', 'Munoz'] as const,
      feedback: 'Memory recognized: Anthony Muñoz.',
      retry: 'That name is not the one attached to this baseball memory. Try again.',
      strongerHint: 'Think of the Hall of Fame offensive tackle whose first name is Anthony.',
      story: 'Before the captain wore wings, he wore a glove.',
    },
    wings: {
      label: 'Airline wings',
      storyTitle: 'Aviation Traditions: “Breaking the Wings”',
      eyebrow: 'Second in command',
      answerMode: 'text',
      question:
        'In U.S. airline operations, what is the minimum amount of second-in-command experience commonly associated with qualifying to serve as captain?',
      acceptedAnswers: ['1000', '1000 hour', '1000 hours'] as const,
      feedback: 'Correct: 1,000 hours. The wings remember preparation, teamwork, and earned responsibility.',
      retry: 'Think in flight hours: it’s a round-number milestone between 500 and 1,500.',
      strongerHint: 'It’s a four-digit milestone below the 1,500-hour ATP requirement.',
      inputLabel: 'Answer in hours',
      story:
        'With this deep history came powerful superstitions. One of the most famous military traditions is the “Breaking of the Wings.” Upon graduating from flight school, a new pilot receives their very first pair of wings but is told never to wear them. Instead, they deliberately break the badge into two halves. The pilot keeps one half, and the other is given to a loved one or best friend for good luck. Superstition dictates that the two halves must never be reunited while the pilot is alive, otherwise, it invites bad luck.',
    },
    chargingBull: {
      label: 'Charging Bull',
      storyTitle: 'Charging Bull',
      eyebrow: 'Patience and judgment',
      answerMode: 'choice',
      question:
        "Which historical figure is most commonly credited with saying, 'Compound interest is the eighth wonder of the world. He who understands it, earns it... he who doesn't... pays it'?",
      choices: ['Warren Buffett', 'Benjamin Franklin', 'Albert Einstein', 'John D. Rockefeller'] as const,
      acceptedAnswers: ['Albert Einstein'] as const,
      feedback: 'Investment wisdom remembered.',
      retry: 'Not quite. Think of the physicist often associated with this quote.',
      strongerHint: 'The correct choice is the physicist, not the investors or Founding Father.',
      story:
        "The most iconic representation of a bull market is the famous Charging Bull statue located in New York City's Financial District. Designed by artist Arturo Di Modica, this bronze landmark symbolizes financial optimism, aggressive market growth, and economic prosperity.",
    },
  } as const,
  hatText: {
    revealText: 'Four memories align. The upper cubby opens.',
    foundText: 'Captain’s hat recognized.',
    promotionText: 'Promotion available.',
    captainModeText: 'POP T CAPTAIN MODE UNLOCKED',
    completeText: 'Locker scene complete.',
  } as const,
} as const

export const dc9LegacyFlow = {
  title: 'DC-9 FINAL FLIGHT LOG',
  subtitle: 'Legacy route record · home crew recognition · ceremonial shutdown',
  secureControlIds: ['apuBuses', 'apuMaster', 'battery'] as const,
  secureSequence: ['apuBuses', 'apuMaster', 'battery'] as const,
  secureControls: {
    apuBuses: {
      label: 'APU bus switches',
      shortLabel: 'APU buses',
      dataref: 'sim/cockpit2/electrical/APU_generator_on',
      initialValue: 1,
      targetValue: 0,
      procedureStep: 1,
    },
    apuMaster: {
      label: 'APU master switch',
      shortLabel: 'APU master',
      dataref: 'sim/cockpit2/electrical/APU_starter_switch',
      initialValue: 1,
      targetValue: 0,
      procedureStep: 2,
    },
    battery: {
      label: 'Battery switch',
      shortLabel: 'Battery',
      dataref: 'sim/cockpit/electrical/battery_on',
      initialValue: 1,
      targetValue: 0,
      procedureStep: 3,
    },
  },
  initialParkedState: {
    parkingBrake: 'set',
    fuelBoostPumps: 'off',
    apuBuses: 'on',
    apuMaster: 'run',
    battery: 'on',
  },
  routePuzzleAnswers: ['DTW', 'MSP', 'STL'] as const,
  routePuzzleOptions: [
    { code: 'DTW', city: 'Detroit', familiar: true },
    { code: 'MSP', city: 'Minneapolis–St. Paul', familiar: true },
    { code: 'STL', city: 'St. Louis', familiar: true },
    { code: 'BTR', city: 'Baton Rouge', familiar: false },
    { code: 'TYS', city: 'Knoxville', familiar: false },
    { code: 'AMS', city: 'Amsterdam', familiar: false },
  ] as const,
  routeQuestion: "Which three cities were familiar stops during Pop T's DC-9 years?",
  routeHints: [
    'Two were Northwest hubs and one was a familiar Midwestern stop.',
    'Think Michigan, Minnesota, and Missouri.',
  ] as const,
  routeFinalHintCodes: ['DTW', 'MSP', 'STL'] as const,
  routeCompletionText: 'Legacy routes recorded. A companion record is ready.',
  routeRetry: 'Those selections do not complete this legacy record. Your stamped routes remain recorded.',
  routeMileageHint: 'Think Michigan, Minnesota, and Missouri.',
  homeOperationsPages: [
    'The parallel operation — While Pop T kept passengers and crews on course, Momma Cheryl kept the family operation moving at home.',
    'The home crew — Momma Cheryl cared for and fed three children, keeping everyone prepared while travel carried Pop T away and home again.',
    'Keeping everyone moving — Sports practices and games, cheerleading practices and events, and the daily rhythm of three children all had to meet on time.',
    'The invisible record — School-clothes shopping, changing schedules, household needs, and unexpected problems were handled with steady judgment.',
    'Recognition — Pop T kept his passengers and crews on course. Momma Cheryl kept the family on course. Both were essential to bringing the crew home.',
  ] as const,
  keyEngravings: {
    front: "THE CAPTAIN'S KEY",
    reverse: 'POP T & MOMMA CHERYL',
  } as const,
  completionText: 'Routes recorded. Home crew recognized. Aircraft secured.',
  secureInstruction: 'Both legacy records are complete. Ceremonially secure the parked cockpit in order.',
  secureRetry: 'That step comes later. Complete the preceding checklist item first; recorded progress remains safe.',
  secureHint: 'Start with the paired APU bus switches, then follow the power source toward the battery.',
  atpQuestion:
    'What is the minimum total flight time (hours) required to qualify for a standard Airline Transport Pilot certificate?',
  atpAnswers: ['1500', '1500hour', '1500hours'] as const,
  atpFeedback: 'Airline Transport Pilot milestone recognized.',
  disclaimer: 'Commemorative, non-operational interaction in a safely parked cockpit.',
} as const

export const gameCopy = {
  title: "The Captain's Key",
  subtitle: 'DC-9 First-Officer legacy flight log, then Airbus Pop T Captain Mode.',
  premise:
    'The game is a personalized tribute. Begin in the DC-9 right seat, discover the locker story, then earn the Airbus A320 left-seat command view.',
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
  briefInstructions: 'Start with the DC-9 First-Officer Final Flight Log, complete the locker reveal, then enter Airbus A320 Pop T Captain Mode.',
} as const

export type AirbusControl = (typeof airbusCaptainFlow.controlIds)[number]
export type AirbusDecoy = (typeof airbusCaptainFlow.decoyIds)[number]
export type LockerMemoryId = (typeof lockerFlow.memoryIds)[number]
export type LockerQuestionId = (typeof lockerFlow.questionIds)[number]
export type LegacyRouteOption = (typeof dc9LegacyFlow.routePuzzleOptions)[number]
