import React from 'react';
import ExpectedValues from './calculators/ExpectedValues';
import InvestmentAppraisal from './calculators/InvestmentAppraisal';
import CriticalPath from './calculators/CriticalPath';
import FinancialRatios from './calculators/FinancialRatios';

const A2Business: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">A2 Business Studies</h2>
        <p className="text-lg text-gray-600">Advanced calculations for A2 level mastery</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <ExpectedValues />
        <InvestmentAppraisal />
        <FinancialRatios />
      </div>
      <div className="grid grid-cols-1 gap-8">
        <CriticalPath />
      </div>
    </div>
  );
};

export default A2Business;