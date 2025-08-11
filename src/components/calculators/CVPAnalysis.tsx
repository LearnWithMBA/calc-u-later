import React, { useState } from 'react';
import { BarChart3, Calculator } from 'lucide-react';

const CVPAnalysis: React.FC = () => {
  const [fixedCosts, setFixedCosts] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [variableCostPerUnit, setVariableCostPerUnit] = useState<string>('');
  const [targetProfit, setTargetProfit] = useState<string>('');
  const [currentSales, setCurrentSales] = useState<string>('');
  const [result, setResult] = useState<{
    contribution: number;
    contributionRatio: number;
    breakevenPoint: number;
    targetSales: number;
    currentProfit?: number;
    marginOfSafety?: number;
  } | null>(null);

  const calculate = () => {
    const fc = parseFloat(fixedCosts);
    const sp = parseFloat(sellingPrice);
    const vc = parseFloat(variableCostPerUnit);
    const tp = parseFloat(targetProfit) || 0;
    const cs = parseFloat(currentSales) || 0;
    
    if (fc >= 0 && sp > 0 && vc >= 0 && sp > vc) {
      const contribution = sp - vc;
      const contributionRatio = (contribution / sp) * 100;
      const breakevenPoint = fc / contribution;
      const targetSales = (fc + tp) / contribution;
      const currentProfit = cs > 0 ? (cs * contribution) - fc : undefined;
      const marginOfSafety = cs > 0 ? cs - breakevenPoint : undefined;
      
      setResult({
        contribution,
        contributionRatio,
        breakevenPoint: Math.ceil(breakevenPoint),
        targetSales: Math.ceil(targetSales),
        currentProfit,
        marginOfSafety
      });
    }
  };

  const clear = () => {
    setFixedCosts('');
    setSellingPrice('');
    setVariableCostPerUnit('');
    setTargetProfit('');
    setCurrentSales('');
    setResult(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">CVP Analysis</h3>
        </div>
        <p className="text-sm text-gray-600">Cost-Volume-Profit analysis with detailed insights</p>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fixed Costs (£)
            </label>
            <input
              type="number"
              value={fixedCosts}
              onChange={(e) => setFixedCosts(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g. 50000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price Per Unit (£)
            </label>
            <input
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g. 25.00"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g. 15.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Profit (£) - Optional
            </label>
            <input
              type="number"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g. 20000"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Sales (units) - Optional
            </label>
            <input
              type="number"
              value={currentSales}
              onChange={(e) => setCurrentSales(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g. 6000"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={calculate}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
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
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h4 className="font-medium text-indigo-900 mb-3">CVP Analysis Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-indigo-700">Contribution per unit:</span>
                  <span className="font-semibold">£{result.contribution.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-700">Contribution ratio:</span>
                  <span className="font-semibold">{result.contributionRatio.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-700">Breakeven point:</span>
                  <span className="font-semibold">{result.breakevenPoint} units</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-indigo-700">Target sales:</span>
                  <span className="font-semibold">{result.targetSales} units</span>
                </div>
                {result.currentProfit !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Current profit:</span>
                    <span className="font-semibold">£{result.currentProfit.toFixed(2)}</span>
                  </div>
                )}
                {result.marginOfSafety !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Margin of safety:</span>
                    <span className="font-semibold">{result.marginOfSafety.toFixed(0)} units</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVPAnalysis;