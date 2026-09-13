import { BMX2 } from "./games/bmx2";
import { MX2 } from "./games/mx2";

export {
  Assets,
  type AssetsOptions,
  dailyDashMonthPath,
  dailyDashPath,
  type FetchLike,
} from "./assets";
export {
  type ClientOptions,
  type EndpointRequest,
  TurborillaClient,
} from "./client";
export {
  DEFAULT_ASSETS_BASE_URL,
  DEFAULT_BASE_URL,
  ENVELOPE_DEFAULTS,
} from "./constants";
export {
  buildEnvelope,
  encodeBody,
  type Envelope,
  type EnvelopeOverrides,
} from "./envelope";
export {
  TurborillaError,
  type TurborillaErrorCode,
  type TurborillaErrorDetails,
} from "./errors";
export { BMX2, type Bmx2Game, bmx2Game } from "./games/bmx2";
export {
  baseUserDataSections,
  type GameDefinition,
  type SectionKey,
} from "./games/definition";
export { MX2, type Mx2Game, mx2Game } from "./games/mx2";
export type * from "./types/assets";
export type * from "./types/credentials";
export type * from "./types/endpoints";
export type * from "./types/response";

/**
 * Stateless clients for every supported game. User endpoints take
 * `credentials` per call; public endpoints and `assets` need none.
 */
const turborilla = {
  // oxlint-disable-next-line no-inline-comments -- `#__PURE__` must sit right before the expression for bundlers to drop it when unused
  bmx2: /*#__PURE__*/ new BMX2(),
  // oxlint-disable-next-line no-inline-comments -- same as above
  mx2: /*#__PURE__*/ new MX2(),
};

export default turborilla;
