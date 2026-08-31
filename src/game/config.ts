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
  qualificationIntro: {
    eyebrow: 'Crew qualification · drag and drop',
    instruction: 'Start by dragging each label card onto its matching cockpit control.',
    alternate: 'No mouse? Tap or click a card, then tap its glowing target.',
    completionNote: 'Five correct placements open the Storm Line flight.',
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
  controlCheck: {
    eyebrow: 'Right seat · before the log',
    title: 'Flight controls — free and correct',
    intro:
      'Every leg started the same way. Parked at the gate with the checklist open, the crew walked each control to its stops and felt it come back. Take the right seat and do it once more.',
    instructions:
      'Arrow keys move the yoke, W and S walk the thrust levers, A and D work the rudder pedals. You can also hold the buttons here, or drag the yoke itself.',
    groupLabels: {
      yoke: 'Control column and wheel',
      rudder: 'Rudder pedals',
      thrust: 'Thrust levers',
    } as const,
    items: {
      yokeAft: { label: 'Column full aft', detail: 'Pull the yoke back to the stop.' },
      yokeForward: { label: 'Column full forward', detail: 'Push the yoke all the way forward.' },
      wheelLeft: { label: 'Wheel full left', detail: 'Roll the wheel left to the stop.' },
      wheelRight: { label: 'Wheel full right', detail: 'Roll the wheel right to the stop.' },
      rudderLeft: { label: 'Left pedal full travel', detail: 'Walk the left pedal all the way forward.' },
      rudderRight: { label: 'Right pedal full travel', detail: 'Walk the right pedal all the way forward.' },
      thrustAdvance: { label: 'Levers full forward', detail: 'Advance both thrust levers to the stop.' },
      thrustClosed: { label: 'Levers closed', detail: 'Bring both levers all the way back to idle.' },
    } as const,
    completionText:
      'Controls free and correct. The panel settles, and the six dials he flew by are waiting to be read.',
    disclaimer: 'The aircraft is parked and powered down. Nothing here commands the aeroplane.',
  } as const,
  instrumentScan: {
    eyebrow: 'Right seat · instrument scan',
    title: 'The scan he flew by',
    intro:
      'No screens, no map, no magenta line. Six dials in a fixed pattern, read in the same order every minute of every flight. Find each one as it is called.',
    instruction: 'Click the gauge in the cockpit, or choose it from the list.',
    prompts: {
      airspeed: {
        question: 'Which gauge shows how fast the aircraft is moving through the air?',
        reading: 'Airspeed, in knots. The first number called on every takeoff roll.',
        feedback: 'Correct — the airspeed indicator. Watch it run up and settle.',
        retry: 'Not that one. Look to the inboard side of the panel, left of the big attitude ball.',
        strongerHint: 'It sits at the top-left of the basic T, nearest the centre of the cockpit.',
      },
      attitude: {
        question: 'Which instrument shows the aircraft’s pitch and bank against the horizon?',
        reading: 'Attitude director indicator. A lit ball that stays level while the aeroplane moves around it.',
        feedback: 'Correct — the attitude director indicator. The horizon rolls and re-levels.',
        retry: 'Not that one. It is the largest dial in front of the right seat.',
        strongerHint: 'Top-centre of the basic T, directly under the glareshield — the big ball.',
      },
      altimeter: {
        question: 'Which gauge shows how high the aircraft is above sea level?',
        reading: 'Altimeter, in feet, set against the barometric pressure of the day.',
        feedback: 'Correct — the altimeter. The needle winds up through two thousand feet and back.',
        retry: 'Not that one. Look outboard, to the right of the attitude ball.',
        strongerHint: 'Top-right of the basic T, beside the window post.',
      },
      heading: {
        question: 'Which instrument shows the heading the aircraft is pointing, with the course to fly?',
        reading: 'Horizontal situation indicator. A rotating compass card with the selected course laid over it.',
        feedback: 'Correct — the horizontal situation indicator. The card swings round to a new heading.',
        retry: 'Not that one. It sits below the attitude ball, at the bottom of the T.',
        strongerHint: 'Bottom-centre of the basic T: the round compass card.',
      },
      verticalSpeed: {
        question: 'Which gauge shows how quickly the aircraft is climbing or descending?',
        reading: 'Vertical speed, in feet per minute. Five hundred a minute on a gentle descent.',
        feedback: 'Correct — the vertical speed indicator. The needle lifts to a thousand up and settles.',
        retry: 'Not that one. It is the outboard dial, furthest from the cockpit centreline.',
        strongerHint: 'Far right of the right-seat panel, outboard of the altimeter.',
      },
      epr: {
        question: 'The JT8Ds were set by a pressure ratio, not by fan speed. Which pair of gauges is it?',
        reading: 'Engine pressure ratio — the DC-9 thrust reference, one gauge per engine.',
        feedback: 'Correct — the EPR gauges. Both needles spool up together and come back.',
        retry: 'Not that one. Look to the engine stack in the centre of the panel, between the two seats.',
        strongerHint: 'Centre panel, the top pair of engine dials above the N1 and EGT rows.',
      },
    } as const,
    completionText: 'Scan complete. The panel is read, the ramp is clear, and Memphis is waiting outside.',
    disclaimer: 'A power-on self-test on a parked aeroplane. The needles are showing what they can do, not what the aircraft is doing.',
  } as const,
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
  routeIntro:
    'The flight is flown and the crew is recognized. A narrow paper strip clipped to the column is still blank — the routes he flew, waiting to be logged.',
  routeCompletionText: 'Legacy routes recorded. The log is closed and the aircraft can be put to bed.',
  routeRetry: 'Those selections do not complete this legacy record. Your stamped routes remain recorded.',
  routeMileageHint: 'Think Michigan, Minnesota, and Missouri.',
  homeOperationsPages: [
    'The parallel operation — While Pop T kept passengers and crews on course, Momma Cheryl kept the family operation moving at home.',
    'The home crew — Momma Cheryl kept three kids fed, prepared, and on schedule while travel carried Pop T away and home again.',
    'Keeping everyone moving — Sports practices and games, cheerleading practices and events, and the daily rhythm of three children all had to meet on time.',
    'The invisible record — School-clothes shopping, changing schedules, household needs, and unexpected problems were handled.',
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
} as const

export const gameCopy = {
  title: "The Captain's Key",
  subtitle: 'DC-9 First-Officer legacy flight log, then Airbus Pop T Captain Mode.',
  premise:
    'The game is a personalized tribute. Begin in the DC-9 right seat, discover the locker story, then earn the Airbus A320 left-seat command view.',
  rewardTitle: 'Ground Transport Upgrade Authorized',
  rewardVehicleLine: 'The red Tesla Model Y is unlocked.',
  finalMessage:
    'Happy Father’s Day, Pop T. From the baseball field to the captain’s seat, from the DC-9 to the Airbus, you showed us how preparation, calm judgment, teamwork, and leadership can carry a family anywhere. This game was built from the lessons you gave us. Your crew loves you.',
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
