import React, { useState } from 'react';
import { Users, Calculator } from 'lucide-react';

const LabourTurnover: React.FC = () => {
  const [employeesLeft, setEmployeesLeft] = useState<string>('');
  const [averageEmployees, setAverageEmployees] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const left = parseFloat(employeesLeft);
    const average = parseFloat(averageEmployees);
    
    if (left >= 0 && average > 0) {
      const turnover = (left / average) * 100;
      setResult(turnover);
    }
  };

  const clear = () => {
    setEmployeesLeft('');
    setAverageEmployees('');
    setResult(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Labour Turnover</h3>
        </div>
        <p className="text-sm text-gray-600">Calculate the percentage of employees leaving over a period</p>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Employees Who Left
          </label>
          <input
            type="number"
            value={employeesLeft}
            onChange={(e) => setEmployeesLeft(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g. 12"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Average Number of Employees
          </label>
          <input
            type="number"
            value={averageEmployees}
            onChange={(e) => setAverageEmployees(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g. 100"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={calculate}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
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
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Result</h4>
            <p className="text-2xl font-bold text-blue-700">{result.toFixed(2)}%</p>
            <p className="text-sm text-blue-600 mt-1">
              Formula: (Employees Left ÷ Average Employees) × 100
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabourTurnover;