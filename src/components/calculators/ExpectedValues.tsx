import React, { useMemo, useState } from "react";
import { TrendingUp, Calculator, Plus, Trash2, CheckCircle2, AlertTriangle, Sparkles, PoundSterling } from "lucide-react";

/**
 * Expected Value Decision Tool (Multi-Option) — with Costs
 * - Supports N options, each with N outcomes
 * - Each outcome has a probability (%) and payoff (GBP)
 * - Each option also has a *cost* that is subtracted from EMV to get Net EMV
 * - Probabilities must add to 100% *per option*
 * - Calculates EMV and Net EMV for each option and recommends the best by Net EMV
 *
 * Notes
 * - Uses TailwindCSS classes
 * - Icons from lucide-react
 */

interface OutcomeInput {
  id: number;
  payoff: string; // as text for easy editing
  probability: string; // percent, as text for easy editing
}

interface OptionInput {
  id: number;
  name: string;
  cost: string; // cost of choosing this option (GBP), as text for editing
  outcomes: OutcomeInput[];
}

interface OutcomeComputed {
  payoff: number;
  probability: number; // 0..1
  contribution: number; // payoff * probability
}

interface OptionComputed {
  id: number;
  name: string;
  cost: number; // GBP
  totalProbabilityPct: number; // 0..100
  emv: number; // expected payoff (before cost)
  netEmv: number; // emv - cost
  outcomes: OutcomeComputed[];
  isValid: boolean; // probs sum to ~100%
}

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 });

const withinTolerance = (sum: number, target = 100, tol = 0.05) => Math.abs(sum - target) <= tol;

const createBlankOutcome = (nextId: number): OutcomeInput => ({ id: nextId, payoff: "", probability: "" });
const createBlankOption = (nextId: number): OptionInput => ({
  id: nextId,
  name: `Option ${nextId}`,
  cost: "",
  outcomes: [createBlankOutcome(1), createBlankOutcome(2)],
});

const ExpectedValueDecision: React.FC = () => {
  const [options, setOptions] = useState<OptionInput[]>([createBlankOption(1), createBlankOption(2)]);

  const addOption = () => {
    const newId = (options.length ? Math.max(...options.map(o => o.id)) : 0) + 1;
    setOptions(prev => [...prev, createBlankOption(newId)]);
  };

  const removeOption = (id: number) => {
    if (options.length <= 1) return; // keep at least one option
    setOptions(prev => prev.filter(o => o.id !== id));
  };

  const renameOption = (id: number, name: string) => {
    setOptions(prev => prev.map(o => (o.id === id ? { ...o, name } : o)));
  };

  const setCost = (id: number, cost: string) => {
    setOptions(prev => prev.map(o => (o.id === id ? { ...o, cost } : o)));
  };

  const addOutcome = (optionId: number) => {
    setOptions(prev => prev.map(o => {
      if (o.id !== optionId) return o;
      const nextId = (o.outcomes.length ? Math.max(...o.outcomes.map(oc => oc.id)) : 0) + 1;
      return { ...o, outcomes: [...o.outcomes, createBlankOutcome(nextId)] };
    }));
  };

  const removeOutcome = (optionId: number, outcomeId: number) => {
    setOptions(prev => prev.map(o => {
      if (o.id !== optionId) return o;
      if (o.outcomes.length <= 2) return o; // keep at least two outcomes for meaning
      return { ...o, outcomes: o.outcomes.filter(oc => oc.id !== outcomeId) };
    }));
  };

  const updateOutcome = (
    optionId: number,
    outcomeId: number,
    field: "payoff" | "probability",
    value: string
  ) => {
    const cleaned = value; // allow negatives and decimals
    setOptions(prev => prev.map(o => {
      if (o.id !== optionId) return o;
      return {
        ...o,
        outcomes: o.outcomes.map(oc => (oc.id === outcomeId ? { ...oc, [field]: cleaned } : oc)),
      };
    }));
  };

  // Compute results live
  const computed: OptionComputed[] = useMemo(() => {
    return options.map(o => {
      const processed: OutcomeComputed[] = [];
      let totalProbPct = 0;
      let emv = 0;

      o.outcomes.forEach(oc => {
        const payoff = parseFloat(oc.payoff);
        const probPct = parseFloat(oc.probability);
        if (!isNaN(payoff) && !isNaN(probPct)) {
          const p = Math.max(0, Math.min(100, probPct)) / 100; // clamp 0..1 for contribution
          const contribution = payoff * p;
          processed.push({ payoff, probability: p, contribution });
          totalProbPct += probPct; // use raw sum for validity message
          emv += contribution;
        }
      });

      const cost = parseFloat(o.cost);
      const validCost = !isNaN(cost) ? cost : NaN;
      const netEmv = !isNaN(validCost) ? emv - validCost : NaN;
      const isValid = withinTolerance(totalProbPct);

      return {
        id: o.id,
        name: o.name.trim() || `Option ${o.id}`,
        cost: validCost,
        totalProbabilityPct: totalProbPct,
        emv,
        netEmv,
        outcomes: processed,
        isValid,
      };
    });
  }, [options]);

  const allHaveNumbers = useMemo(
    () => options.every(o => o.cost.trim() !== "" && o.outcomes.length >= 2 && o.outcomes.every(oc => oc.payoff.trim() !== "" && oc.probability.trim() !== "")),
    [options]
  );

  const allValid = useMemo(() => computed.every(c => c.isValid && c.outcomes.length >= 2 && !isNaN(c.cost)), [computed]);

  const best = useMemo(() => {
    if (!allValid) return null;
    if (computed.length === 0) return null;
    const sorted = [...computed].sort((a, b) => (b.netEmv || -Infinity) - (a.netEmv || -Infinity));
    const top = sorted[0];
    const ties = sorted.filter(o => Math.abs((o.netEmv ?? -Infinity) - (top.netEmv ?? -Infinity)) <= 1e-6);
    return { top, ties };
  }, [computed, allValid]);

  const clearAll = () => {
    setOptions([createBlankOption(1), createBlankOption(2)]);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Expected Value Decision Tool (with Costs)</h3>
        </div>
        <p className="text-sm text-gray-600">Add options and outcomes, ensure probabilities sum to 100% for each option. EMV (expected payoff) minus cost gives Net EMV.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Options List */}
        <div className="space-y-6">
          {options.map((opt) => {
            const comp = computed.find(c => c.id === opt.id)!;
            const isProbOk = withinTolerance(comp.totalProbabilityPct);
            const hasCost = opt.cost.trim() !== "" && !isNaN(parseFloat(opt.cost));

            return (
              <div key={opt.id} className="border rounded-lg overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
                      value={opt.name}
                      onChange={(e) => renameOption(opt.id, e.target.value)}
                      placeholder={`Option ${opt.id}`}
                    />
                    <div className="text-sm">
                      {isProbOk ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Probabilities sum to {comp.totalProbabilityPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          Sum is {comp.totalProbabilityPct.toFixed(1)}% (should be 100.0%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cost input */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Cost (£)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={opt.cost}
                        onChange={(e) => setCost(opt.id, e.target.value)}
                        className="w-40 pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 500"
                      />
                      <PoundSterling className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                    </div>
                    {!hasCost && <span className="text-xs text-red-600"></span>}
                  </div>

                  {options.length > 1 && (
                    <button
                      onClick={() => removeOption(opt.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors self-start md:self-auto"
                      title="Remove option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Outcomes for this option */}
                <div className="p-4 space-y-3">
                  {opt.outcomes.map((oc) => (
                    <div key={oc.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Payoff (£)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={oc.payoff}
                          onChange={(e) => updateOutcome(opt.id, oc.id, "payoff", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. 10000"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Probability (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={oc.probability}
                          onChange={(e) => updateOutcome(opt.id, oc.id, "probability", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. 30"
                        />
                      </div>

                      {opt.outcomes.length > 2 && (
                        <button
                          onClick={() => removeOutcome(opt.id, oc.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove outcome"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addOutcome(opt.id)}
                    className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Outcome</span>
                  </button>

                  {/* Summary for this option */}
                  <div className="mt-3 p-4 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-blue-700 font-medium">EMV (before cost) for {comp.name}:</span>
                      <span className="text-xl font-bold text-blue-700">{currency.format(isFinite(comp.emv) ? comp.emv : 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-blue-700">Cost:</span>
                      <span className="font-medium text-blue-900">{isNaN(comp.cost) ? "–" : currency.format(comp.cost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-blue-700">Total Probability:</span>
                      <span className={`font-semibold ${isProbOk ? "text-green-700" : "text-red-700"}`}>
                        {comp.totalProbabilityPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 mt-1 border-t">
                      <span className="text-blue-900 font-semibold">Net EMV:</span>
                      <span className="text-2xl font-extrabold text-blue-900">{isFinite(comp.netEmv) ? currency.format(comp.netEmv) : "–"}</span>
                    </div>

                    {comp.outcomes.length > 0 && (
                      <div className="mt-3 space-y-1 text-sm text-blue-800">
                        <div className="font-medium">Breakdown:</div>
                        {comp.outcomes.map((c, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {currency.format(c.payoff)} × {(c.probability * 100).toFixed(1)}%
                            </span>
                            <span>= {currency.format(c.contribution)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isProbOk && (
                      <p className="text-xs text-red-700 mt-2">Probabilities must add to 100% for a valid EMV.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Option button */}
        <button
          onClick={addOption}
          className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Another Option</span>
        </button>

        {/* Footer actions & Decision */}
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1 flex gap-3">
            <button
              onClick={() => { /* calculation is live, but keep for affordance */ }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Calculate</span>
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Decision Panel */}
          <div className="md:w-1/2 p-4 rounded-lg border bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-emerald-700" />
              <h4 className="font-semibold text-emerald-900">Decision</h4>
            </div>

            {!allHaveNumbers && (
              <p className="text-sm text-emerald-800">Enter payoffs, probabilities, and cost for all options to see a recommendation.</p>
            )}

            {allHaveNumbers && !allValid && (
              <p className="text-sm text-red-700">Fix probability sums so each option totals 100%.</p>
            )}

            {allHaveNumbers && allValid && best && (
              <div className="space-y-2">
                <p className="text-emerald-900 font-medium">
                  Recommended: <span className="font-bold">{best.top.name}</span> with Net EMV of {currency.format(best.top.netEmv)}
                </p>
                {best.ties && best.ties.length > 1 && (
                  <p className="text-sm text-emerald-800">Note: There is a tie on Net EMV between {best.ties.map(t => t.name).join(", ")}. Consider risk preferences.</p>
                )}
              </div>
            )}

            {/* Comparison Table */}
            <div className="mt-3 border-t pt-3">
              <div className="text-sm text-emerald-900 font-medium mb-1">EMV vs Cost vs Net EMV:</div>
              <div className="space-y-1">
                {computed.map(c => (
                  <div key={c.id} className={`grid grid-cols-3 gap-2 text-sm ${best && best.top.id === c.id && allValid ? "font-semibold" : ""}`}>
                    <span>{c.name}</span>
                    <span className="text-right">{currency.format(isFinite(c.emv) ? c.emv : 0)} − {isNaN(c.cost) ? "–" : currency.format(c.cost)}</span>
                    <span className="text-right">{isFinite(c.netEmv) ? currency.format(c.netEmv) : "–"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpectedValueDecision;
