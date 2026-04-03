import cron from "node-cron";
import type { SourceAdapter } from "../adapters/interface.js";
import { runAdapter } from "./runner.js";
import { runStatusLifecycle } from "./status-lifecycle.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("scheduler");

interface ScheduleEntry {
  adapter: SourceAdapter;
  cronExpr: string;
}

const DEFAULT_SCHEDULES: Record<string, string> = {
  who_don: "0 */6 * * *",
  disease_sh: "0 * * * *",
  delphi_epidata: "0 4 * * *",
  cdc_socrata: "0 5 * * *",
  global_health: "0 6 * * *",
};

const ENV_KEYS: Record<string, string> = {
  who_don: "POLL_WHO_DON",
  disease_sh: "POLL_DISEASE_SH",
  delphi_epidata: "POLL_DELPHI",
  cdc_socrata: "POLL_CDC_SOCRATA",
  global_health: "POLL_GLOBAL_HEALTH",
};

export function startScheduler(adapters: SourceAdapter[]): void {
  const entries: ScheduleEntry[] = adapters.map((adapter) => ({
    adapter,
    cronExpr:
      process.env[ENV_KEYS[adapter.source]] ??
      DEFAULT_SCHEDULES[adapter.source] ??
      "0 * * * *",
  }));

  for (const { adapter, cronExpr } of entries) {
    if (!cron.validate(cronExpr)) {
      log.error({ source: adapter.source, cronExpr }, "Invalid cron expression, skipping");
      continue;
    }

    cron.schedule(cronExpr, () => {
      runAdapter(adapter).catch((err) => {
        log.error({ err, source: adapter.source }, "Scheduled poll crashed");
      });
    });

    log.info(
      { source: adapter.source, cron: cronExpr },
      `Scheduled ${adapter.name}`,
    );
  }

  // Status lifecycle daily job
  const lifecycleCron = process.env.STATUS_LIFECYCLE_CRON ?? "0 3 * * *";
  cron.schedule(lifecycleCron, () => {
    runStatusLifecycle().catch((err) => {
      log.error({ err }, "Status lifecycle job crashed");
    });
  });

  log.info({ cron: lifecycleCron }, "Scheduled status lifecycle job");
}
