import type { SourceAdapter } from "./interface.js";
import { whoDonAdapter } from "./who-don.js";
import { diseaseShAdapter } from "./disease-sh.js";
import { cdcSocrataAdapter } from "./cdc-socrata.js";
import { delphiAdapter } from "./delphi-epidata.js";
import { globalHealthAdapter } from "./global-health.js";

export const allAdapters: SourceAdapter[] = [
  whoDonAdapter,
  diseaseShAdapter,
  cdcSocrataAdapter,
  delphiAdapter,
  globalHealthAdapter,
];

export {
  whoDonAdapter,
  diseaseShAdapter,
  cdcSocrataAdapter,
  delphiAdapter,
  globalHealthAdapter,
};

export type { SourceAdapter, NormalizedEvent, FetchResult, TimeSeriesEntry } from "./interface.js";
