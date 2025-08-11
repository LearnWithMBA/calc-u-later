import React, { useEffect, useState } from "react";
import { DollarSign, Calculator, Plus, Trash2, BarChart, TrendingUp } from "lucide-react";

interface CashFlow {
  id: number;
  year: number;
  amount: string;
}

interface PaybackResult {
  years: number;
  months: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Utility: build a dense timeline from year 1..maxYear (fill missing with 0)
function buildTimeline(cashFlows: CashFlow[]): number[] {
  const byYear = new Map<number, number>();
  for (const cf of cashFlows) {
    const amt = parseFloat(cf.amount);
    if (!isFinite(amt)) continue;
    byYear.set(cf.year, (byYear.get(cf.year) ?? 0) + amt);
  }
  const maxYear = Math.max(0, ...Array.from(byYear.keys()));
  const timeline: number[] = [];
  for (let y = 1; y <= maxYear; y++) timeline.push(byYear.get(y) ?? 0);
  return timeline;
}

function npv(rate: number, initial: number, timeline: number[]): number {
  let res = -initial;
  const dfBase = 1 + rate;
  for (let i = 0; i < timeline.length; i++) {
    res += timeline[i] / Math.pow(dfBase, i + 1);
  }
  return res;
}

// Robust IRR using bracketing + bisection. Returns NaN if no bracket found.
function irrBisection(initial: number, timeline: number[]): number {
  if (timeline.length === 0) return NaN;

  // Need at least one positive inflow after the initial outflow; otherwise IRR can't exist.
  if (!timeline.some((v) => v > 0)) return NaN;

  const f = (r: number) => npv(r, initial, timeline);

  let lo = -0.9999; // cannot discount at -100%
  let hi = 1.0; // start at 100%
  let nLo = f(lo);
  let nHi = f(hi);

  // Expand high bound up to 10,000% if needed
  while (nLo * nHi > 0 && hi < 100) {
    hi *= 2;
    nHi = f(hi);
  }

  // If still no bracket (e.g., non-monotonic NPV), try a coarse grid
  if (nLo * nHi > 0) {
    const grid = [-0.99, -0.5, -0.2, -0.1, 0, 0.05, 0.1, 0.2, 0.5, 1, 2, 3, 5, 10, 20, 50, 100];
    for (let i = 0; i < grid.length - 1; i++) {
      const a = grid[i], b = grid[i + 1];
      const fa = f(a), fb = f(b);
      if (!isFinite(fa) || !isFinite(fb)) continue;
      if (Math.abs(fa) < 1e-10) return a;
      if (fa * fb <= 0) {
        lo = a; hi = b; nLo = fa; nHi = fb; break;
      }
    }
    if (nLo * nHi > 0) return NaN; // couldn't bracket anywhere
  }

  // Bisection
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const nMid = f(mid);
    if (Math.abs(nMid) < 1e-8) return mid;
    if (nLo * nMid <= 0) { hi = mid; nHi = nMid; } else { lo = mid; nLo = nMid; }
  }
  return (lo + hi) / 2;
}

function paybackPlain(initial: number, timeline: number[]): PaybackResult | null {
  let cumulative = -initial;
  for (let i = 0; i < timeline.length; i++) {
    const cf = timeline[i];
    const prev = cumulative;
    cumulative += cf;
    if (cumulative >= 0) {
      if (cf <= 0) return null; // can't recover within a non-positive year
      const fraction = -prev / cf; // portion of the year needed (0..1]
      let months = Math.round(fraction * 12);
      let years = i; // full years completed before recovery
      if (months >= 12) { years += 1; months = 0; }
      return { years, months };
    }
  }
  return null;
}

function paybackDiscounted(initial: number, timeline: number[], rate: number): PaybackResult | null {
  let cumulative = -initial;
  for (let i = 0; i < timeline.length; i++) {
    const df = Math.pow(1 + rate, i + 1);
    const disc = timeline[i] / df;
    const prev = cumulative;
    cumulative += disc;
    if (cumulative >= 0) {
      if (disc <= 0) return null;
      const fraction = -prev / disc;
      let months = Math.round(fraction * 12);
      let years = i;
      if (months >= 12) { years += 1; months = 0; }
      return { years, months };
    }
  }
  return null;
}

function arr(initial: number, timeline: number[]): number {
  const totalProfit = timeline.reduce((s, v) => s + v, 0) - initial;
  const avg = timeline.length > 0 ? totalProfit / timeline.length : 0;
  return (avg / initial) * 100;
}

const InvestmentAppraisal: React.FC = () => {
  const [initialInvestment, setInitialInvestment] = useState<string>("");
  const [discountRate, setDiscountRate] = useState<string>("");
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([
    { id: 1, year: 1, amount: "" },
    { id: 2, year: 2, amount: "" },
    { id: 3, year: 3, amount: "" },
  ]);
  const [result, setResult] = useState<{
    npv: number;
    irr: number; // percent
    paybackPeriod: PaybackResult | null;
    discountedPaybackPeriod: PaybackResult | null;
    arr: number; // percent
    presentValues: Array<{ year: number; cashFlow: number; presentValue: number }>;
    accept: boolean;
    usedRatePct: number;
  } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const newErrors: { [key: string]: string } = {};

    const init = parseFloat(initialInvestment);
    if (!initialInvestment || !isFinite(init) || init <= 0) {
      newErrors.initialInvestment = "Valid investment required (> 0)";
    }

    const dr = parseFloat(discountRate);
    if (!discountRate || !isFinite(dr) || dr < 0) {
      newErrors.discountRate = "Valid discount rate required (≥ 0)";
    }

    cashFlows.forEach((cf, idx) => {
      if (cf.year < 1 || !Number.isFinite(cf.year)) {
        newErrors[`year-${idx}`] = "Year must be ≥ 1";
      }
      if (cf.amount.trim() === "" || isNaN(parseFloat(cf.amount))) {
        newErrors[`cashFlow-${idx}`] = "Valid amount required";
      }
    });

    // Ensure unique years
    const years = cashFlows.map((c) => c.year);
    const dup = years.find((y, i) => years.indexOf(y) !== i);
    if (dup !== undefined) newErrors.years = "Duplicate years detected";

    setErrors(newErrors);
  }, [initialInvestment, discountRate, cashFlows]);

  const addCashFlow = () => {
    const nextYear = (cashFlows.length ? Math.max(...cashFlows.map((cf) => cf.year)) : 0) + 1;
    const newId = (cashFlows.length ? Math.max(...cashFlows.map((cf) => cf.id)) : 0) + 1;
    setCashFlows([...cashFlows, { id: newId, year: nextYear, amount: "" }]);
  };

  const removeCashFlow = (id: number) => {
    if (cashFlows.length > 1) setCashFlows(cashFlows.filter((cf) => cf.id !== id));
  };

  const updateCashFlowAmount = (id: number, amount: string) => {
    setCashFlows(cashFlows.map((cf) => (cf.id === id ? { ...cf, amount } : cf)));
  };

  const updateCashFlowYear = (id: number, year: number) => {
    setCashFlows(cashFlows.map((cf) => (cf.id === id ? { ...cf, year } : cf)));
  };

  const calculate = () => {
    if (Object.keys(errors).length > 0) return;

    const initial = parseFloat(initialInvestment);
    const usedRatePct = clamp(parseFloat(discountRate), 0, 100);
    const rate = usedRatePct / 100; // decimal 0..1

    // Sort by year, then build dense timeline 1..maxYear
    const sorted = [...cashFlows].sort((a, b) => a.year - b.year);
    const timeline = buildTimeline(sorted);

    // Present values (by actual year index)
    let npvVal = -initial;
    const presentValues = sorted.map((cf) => {
      const cashFlow = parseFloat(cf.amount);
      const discountFactor = Math.pow(1 + rate, cf.year);
      const presentValue = cashFlow / discountFactor;
      npvVal += presentValue;
      return { year: cf.year, cashFlow, presentValue };
    });

    const irrRate = irrBisection(initial, timeline); // decimal
    const irrPct = isFinite(irrRate) ? irrRate * 100 : NaN;
    const paybackPeriod = paybackPlain(initial, timeline);
    const discountedPaybackPeriod = paybackDiscounted(initial, timeline, rate);
    const arrPct = arr(initial, timeline);

    // Decision logic: NPV-first; ensure positive NPV yields ACCEPT even if IRR is undefined.
    const accept = npvVal >= 0 || (isFinite(irrPct) && irrPct > usedRatePct);

    setResult({
      npv: npvVal,
      irr: irrPct,
      paybackPeriod,
      discountedPaybackPeriod,
      arr: arrPct,
      presentValues,
      accept,
      usedRatePct,
    });
  };

  const clear = () => {
    setInitialInvestment("");
    setDiscountRate("");
    setCashFlows([
      { id: 1, year: 1, amount: "" },
      { id: 2, year: 2, amount: "" },
      { id: 3, year: 3, amount: "" },
    ]);
    setResult(null);
    setErrors({});
  };

  const formatPayback = (payback: PaybackResult | null): string => {
    if (!payback) return "Never recovers";
    const y = payback.years;
    const m = payback.months;
    return `${y} year${y !== 1 ? "s" : ""} ${m} month${m !== 1 ? "s" : ""}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300 max-w-4xl mx-auto">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">Advanced Investment Appraisal</h3>
        </div>
        <p className="text-sm text-gray-600">NPV, IRR, Payback Period, Discounted Payback & ARR</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Initial Investment (£)</label>
              {errors.initialInvestment && (
                <span className="text-xs text-red-500">{errors.initialInvestment}</span>
              )}
            </div>
            <input
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.initialInvestment ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g. 100000"
              min="0.01"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Discount Rate (%)</label>
              {errors.discountRate && (
                <span className="text-xs text-red-500">{errors.discountRate}</span>
              )}
            </div>
            <input
              type="number"
              step="0.1"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.discountRate ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g. 10"
              min="0"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 mb-3">Cash Flows (£)</h4>
            {errors.years && <span className="text-xs text-red-500">{errors.years}</span>}
          </div>
          <div className="space-y-3">
            {cashFlows.map((cashFlow, index) => (
              <div key={cashFlow.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Year</label>
                  <input
                    type="number"
                    min={1}
                    value={cashFlow.year}
                    onChange={(e) =>
                      updateCashFlowYear(cashFlow.id, parseInt(e.target.value || "1", 10))
                    }
                    className="w-20 px-2 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    title="Year number (≥ 1)"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={cashFlow.amount}
                    onChange={(e) => updateCashFlowAmount(cashFlow.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      errors[`cashFlow-${index}`] ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Cash flow amount (can be negative)"
                  />
                  {errors[`cashFlow-${index}`] && (
                    <p className="mt-1 text-xs text-red-500">{errors[`cashFlow-${index}`]}</p>
                  )}
                </div>
                {cashFlows.length > 1 && (
                  <button
                    onClick={() => removeCashFlow(cashFlow.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove cash flow"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addCashFlow}
            className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Another Year</span>
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={calculate}
            disabled={Object.keys(errors).length > 0}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              Object.keys(errors).length > 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Calculate</span>
          </button>
          <button
            onClick={clear}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>

        {result && (
          <div className="mt-6 p-5 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-4 text-lg">Investment Appraisal Results</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                  <BarChart className="h-4 w-4" />
                  <div className="text-sm font-medium">Net Present Value</div>
                </div>
                <div className={`text-xl font-bold ${result.npv >= 0 ? "text-green-700" : "text-red-600"}`}>
                  £{result.npv.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {result.npv >= 0 ? "Profitable" : "Not Profitable"}
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <div className="text-sm font-medium">Internal Rate of Return</div>
                </div>
                <div className="text-xl font-bold text-green-700">
                  {isFinite(result.irr) ? `${result.irr.toFixed(2)}%` : "N/A"}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {isFinite(result.irr)
                    ? result.irr > result.usedRatePct
                      ? "Above discount rate"
                      : "Below discount rate"
                    : "No real IRR"}
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <div className="text-sm font-medium">Accounting Rate of Return</div>
                </div>
                <div className="text-xl font-bold text-green-700">
                  {isFinite(result.arr) ? `${result.arr.toFixed(2)}%` : "N/A"}
                </div>
                <div className="mt-1 text-xs text-gray-500">Average Annual Return</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="text-sm text-green-600 font-medium mb-2">Payback Period</div>
                <div className="text-lg font-bold text-green-700">{formatPayback(result.paybackPeriod)}</div>
                <div className="mt-1 text-xs text-gray-500">Without discounting</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="text-sm text-green-600 font-medium mb-2">Discounted Payback</div>
                <div className="text-lg font-bold text-green-700">{formatPayback(result.discountedPaybackPeriod)}</div>
                <div className="mt-1 text-xs text-gray-500">With {result.usedRatePct}% discount rate</div>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="font-medium text-green-800 mb-3 text-sm">Present Value Breakdown:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.presentValues
                  .slice()
                  .sort((a, b) => a.year - b.year)
                  .map((pv, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                      <span className="text-green-700 font-medium">Year {pv.year}</span>
                      <div className="text-right">
                        <div className="text-green-700">
                          Cash Flow: £{pv.cashFlow.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-green-900 font-medium">
                          PV: £{pv.presentValue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-4 border-t border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-medium">Investment Recommendation:</span>
                <span
                  className={`px-3 py-1 rounded-full font-semibold text-sm ${
                    result.accept ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {result.accept ? "ACCEPT PROJECT" : "REJECT PROJECT"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentAppraisal;
