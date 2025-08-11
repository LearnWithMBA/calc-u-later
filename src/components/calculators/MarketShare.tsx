import React, { useState } from 'react';
import { PieChart, Calculator } from 'lucide-react';

const MarketShare: React.FC = () => {
  const [companySales, setCompanySales] = useState<string>('');
  const [totalMarketSales, setTotalMarketSales] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const company = parseFloat(companySales);
    const total = parseFloat(totalMarketSales);
    
    if (company >= 0 && total > 0 && company <= total) {
      const marketShare = (company / total) * 100;
      setResult(marketShare);
    }
  };

  const clear = () => {
    setCompanySales('');
    setTotalMarketSales('');
    setResult(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <PieChart className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">Market Share</h3>
        </div>
        <p className="text-sm text-gray-600">Calculate company's percentage share of total market</p>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Sales (£)
          </label>
          <input
            type="number"
            value={companySales}
            onChange={(e) => setCompanySales(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="e.g. 250000"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Market Sales (£)
          </label>
          <input
            type="number"
            value={totalMarketSales}
            onChange={(e) => setTotalMarketSales(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="e.g. 1000000"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={calculate}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
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
        
        {result !== null && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Result</h4>
            <p className="text-2xl font-bold text-green-700">{result.toFixed(2)}%</p>
            <p className="text-sm text-green-600 mt-1">
              Formula: (Company Sales ÷ Total Market Sales) × 100
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketShare;