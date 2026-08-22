export declare const DC9_FLIGHT_DECK_CONTROL_NODES: string[]
export declare const DC9_FLIGHT_DECK_INSTRUMENT_NODES: string[]
export declare const DC9_FLIGHT_DECK_REQUIRED_NODES: string[]

export interface Dc9FlightDeckGuardedInstrument {
  id: string
  center: [number, number, number]
  radius: number
  nodes: string[]
}

export declare const DC9_FLIGHT_DECK_INSTRUMENTS: Dc9FlightDeckGuardedInstrument[]

export declare function validateDc9FlightDeckContract(json: unknown): string[]
