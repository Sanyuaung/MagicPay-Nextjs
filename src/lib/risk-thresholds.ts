export type RiskThresholds = {
  highAmount: number;
  agingPendingHours: number;
  frequentRequesterCount: number;
};

const DEFAULT_THRESHOLDS: RiskThresholds = {
  highAmount: 500000,
  agingPendingHours: 48,
  frequentRequesterCount: 3,
};

function parsePositiveNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function getRiskThresholdsFromUrl(url: URL): RiskThresholds {
  return {
    highAmount: parsePositiveNumber(
      url.searchParams.get("riskHighAmount"),
      DEFAULT_THRESHOLDS.highAmount,
    ),
    agingPendingHours: parsePositiveNumber(
      url.searchParams.get("riskAgingHours"),
      DEFAULT_THRESHOLDS.agingPendingHours,
    ),
    frequentRequesterCount: parsePositiveNumber(
      url.searchParams.get("riskFrequentCount"),
      DEFAULT_THRESHOLDS.frequentRequesterCount,
    ),
  };
}

export function getDefaultRiskThresholds(): RiskThresholds {
  return DEFAULT_THRESHOLDS;
}
