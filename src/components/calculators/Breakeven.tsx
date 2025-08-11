import React, { useState } from 'react';
import { Target, Calculator } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
  Legend,
  Label,
} from 'recharts';

const currency = (n: number) =>
  `£${(Number.isFinite(n) ? n : 0).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Breakeven: React.FC = () => {
  const [fixedCosts, setFixedCosts] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [variableCostPerUnit, setVariableCostPerUnit] = useState<string>('');
  const [actualSales, setActualSales] = useState<string>(''); // units

  const [result, setResult] = useState<{
    breakevenUnits: number;
    breakevenUnitsExact: number;
    breakevenRevenue: number;
    contribution: number;
    contributionMargin: number; // decimal, e.g. 0.4 = 40%
    marginOfSafetyUnits?: number;
    marginOfSafetyRevenue?: number;
    actualSalesUnits?: number;
    actualRevenue?: number;
  } | null>(null);

  const calculate = () => {
    const fc = parseFloat(fixedCosts);
    const sp = parseFloat(sellingPrice);
    const vc = parseFloat(variableCostPerUnit);
    const as = parseFloat(actualSales) || 0; // units

    if (isFinite(fc) && isFinite(sp) && isFinite(vc) && fc >= 0 && sp > 0 && vc >= 0 && sp > vc) {
      const contribution = sp - vc; // per unit
      const beUnitsExact = fc / contribution;
      const beUnits = Math.ceil(beUnitsExact); // display as whole units

      const cmr = contribution / sp; // contribution margin ratio
      const beRevenue = cmr > 0 ? fc / cmr : NaN; // equivalent: fc * sp / (sp - vc)

      const actualRevenue = as > 0 ? as * sp : undefined;
      const mosUnits = as > 0 ? as - beUnitsExact : undefined; // can be < 0 if below BE
      const mosRevenue = as > 0 ? (as * sp) - beRevenue : undefined;

      setResult({
        breakevenUnits: beUnits,
        breakevenUnitsExact: beUnitsExact,
        breakevenRevenue: beRevenue,
        contribution,
        contributionMargin: cmr,
        marginOfSafetyUnits: mosUnits,
        marginOfSafetyRevenue: mosRevenue,
        actualSalesUnits: as > 0 ? as : undefined,
        actualRevenue,
      });
    } else {
      setResult(null);
    }
  };

  const clear = () => {
    setFixedCosts('');
    setSellingPrice('');
    setVariableCostPerUnit('');
    setActualSales('');
    setResult(null);
  };

  // Build chart data after a successful calculation
  const buildChartData = () => {
    if (!result) return [] as Array<{ units: number; revenue: number; totalCost: number }>;

    const fc = parseFloat(fixedCosts);
    const sp = parseFloat(sellingPrice);
    const vc = parseFloat(variableCostPerUnit);

    if (!isFinite(fc) || !isFinite(sp) || !isFinite(vc) || sp <= vc) return [];

    const maxCandidate = Math.max(
      Math.ceil(result.breakevenUnitsExact * 1.25),
      Math.ceil((result.actualSalesUnits ?? 0) * 1.25),
      10
    );

    // Make the x-range a bit "nice"
    const nice = (n: number) => {
      if (n <= 50) return Math.ceil(n / 10) * 10;
      if (n <= 200) return Math.ceil(n / 20) * 20;
      if (n <= 1000) return Math.ceil(n / 50) * 50;
      return Math.ceil(n / 100) * 100;
    };
    const maxUnits = nice(maxCandidate);

    const step = Math.max(1, Math.floor(maxUnits / 30)); // ~30 points

    const data: Array<{ units: number; revenue: number; totalCost: number }> = [];
    for (let u = 0; u <= maxUnits; u += step) {
      const revenue = sp * u;
      const totalCost = fc + vc * u;
      data.push({ units: u, revenue, totalCost });
    }

    // Ensure we include exact break-even and actual sales points if they fall between steps
    const maybePush = (u: number) => {
      const exists = data.some((d) => Math.abs(d.units - u) < 1e-6);
      if (!exists && u >= 0 && u <= maxUnits) {
        data.push({ units: u, revenue: sp * u, totalCost: fc + vc * u });
      }
    };

    maybePush(result.breakevenUnitsExact);
    if (result.actualSalesUnits) maybePush(result.actualSalesUnits);

    // Sort by units (we may have appended out-of-order)
    data.sort((a, b) => a.units - b.units);

    return data;
  };

  const chartData = buildChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const rev = payload.find((p: any) => p.dataKey === 'revenue')?.value ?? 0;
    const tc = payload.find((p: any) => p.dataKey === 'totalCost')?.value ?? 0;
    return (
      <div className="bg-white/95 backdrop-blur border border-purple-200 rounded-md p-2 shadow">
        <div className="text-xs text-gray-500">Units: {label.toLocaleString('en-GB')}</div>
        <div className="text-sm text-purple-700">Revenue: <span className="font-semibold">{currency(rev)}</span></div>
        <div className="text-sm text-purple-700">Total cost: <span className="font-semibold">{currency(tc)}</span></div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <Target className="h-6 w-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Breakeven Analysis</h3>
        </div>
        <p className="text-sm text-gray-600">Calculate breakeven point (units & revenue) and margin of safety (units & £) — now with a chart</p>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fixed Costs (£)
          </label>
          <input
            type="number"
            value={fixedCosts}
            onChange={(e) => setFixedCosts(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="e.g. 50000"
            min="0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price Per Unit (£)
            </label>
            <input
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="e.g. 25.00"
              min="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variable Cost Per Unit (£)
            </label>
            <input
              type="number"
              step="0.01"
              value={variableCostPerUnit}
              onChange={(e) => setVariableCostPerUnit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="e.g. 15.00"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Actual Sales (units) - Optional
          </label>
          <input
            type="number"
            value={actualSales}
            onChange={(e) => setActualSales(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="e.g. 6000"
            min="0"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={calculate}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
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
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-3">Results</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-purple-700">Contribution per unit:</span>
                <span className="font-semibold">{currency(result.contribution)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Contribution margin ratio:</span>
                <span className="font-semibold">{(result.contributionMargin * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Breakeven point (units):</span>
                <span className="font-semibold">{result.breakevenUnits} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Breakeven revenue:</span>
                <span className="font-semibold">{currency(result.breakevenRevenue)}</span>
              </div>

              {typeof result.marginOfSafetyUnits === 'number' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Margin of safety (units):</span>
                    <span className="font-semibold">{result.marginOfSafetyUnits.toFixed(0)} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Margin of safety (£):</span>
                    <span className="font-semibold">{currency(result.marginOfSafetyRevenue ?? 0)}</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-purple-600 mt-2">
              Formulas: BE(units) = Fixed Costs ÷ (SP − VC) • BE(revenue) = Fixed Costs ÷ Contribution Margin Ratio • MOS(£) = Actual Revenue − BE(revenue)
            </p>

            {chartData.length > 0 && (
              <div className="mt-6 bg-white border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">Breakeven Chart</span>
                  <span className="text-xs text-gray-500">Revenue vs Total Cost</span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="units" type="number" tickFormatter={(v) => v.toLocaleString('en-GB')}>
                        <Label value="Units" offset={-5} position="insideBottom" />
                      </XAxis>
                      <YAxis tickFormatter={(v) => `£${Number(v).toLocaleString('en-GB')}`}> 
                        <Label value="£" angle={-90} position="insideLeft" />
                      </YAxis>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />

                      <Line type="monotone" name="Revenue" dataKey="revenue" dot={false} strokeWidth={2} />
                      <Line type="monotone" name="Total cost" dataKey="totalCost" dot={false} strokeWidth={2} />

                      {/* Break-even vertical line */}
                      <ReferenceLine x={result.breakevenUnitsExact} strokeDasharray="4 4" strokeOpacity={0.8}>
                        <Label value={`BE ≈ ${result.breakevenUnitsExact.toFixed(2)} units`} position="top" />
                      </ReferenceLine>

                      {/* Actual sales marker */}
                      {typeof result.actualSalesUnits === 'number' && typeof result.actualRevenue === 'number' && (
                        <ReferenceDot x={result.actualSalesUnits} y={result.actualRevenue} r={5} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Breakeven;
