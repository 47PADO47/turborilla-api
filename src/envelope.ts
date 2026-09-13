import { ENVELOPE_DEFAULTS } from "./constants";
import type { GameDefinition } from "./games/definition";
import type { Credentials } from "./types/credentials";
import type { JsonValue } from "./types/response";

export interface EnvelopeDefaults {
  version: string;
  gameVersion: string;
  platform: string;
  language: string;
}

/** Per-client overrides of the static envelope fields, plus any extra top-level field. */
export interface EnvelopeOverrides extends Partial<EnvelopeDefaults> {
  [key: string]: JsonValue | undefined;
}

/** The JSON document posted (form-encoded under `json=`) to every backend endpoint. */
export interface Envelope extends EnvelopeDefaults {
  // oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- extras are JSON values, but `data: object` forces the index type to widen
  [key: string]: unknown;
  game: string;
  userId?: string;
  password?: string;
  data: object;
}

export interface BuildEnvelopeInput {
  game: GameDefinition;
  /** Endpoint payload, sent under `data`. */
  data?: object | undefined;
  /** When absent the request is a guest request and carries no `userId` at all. */
  credentials?: Credentials | undefined;
  overrides?: EnvelopeOverrides | undefined;
}

export const buildEnvelope = (input: BuildEnvelopeInput): Envelope => {
  const { credentials, data = {}, game, overrides } = input;

  const envelope: Envelope = {
    ...ENVELOPE_DEFAULTS,
    ...game.envelope,
    ...overrides,
    data,
    game: `${game.id}-release`,
  };

  if (credentials) {
    envelope.userId = credentials.userId;
    if (credentials.password !== undefined) {
      envelope.password = credentials.password;
    }
  }

  return envelope;
};

/** Encodes an envelope as the `json=<urlencoded json>` form body the backend expects. */
export const encodeBody = (envelope: Envelope): string =>
  `json=${encodeURIComponent(JSON.stringify(envelope))}`;
