import React from 'react';
import LabourTurnover from './calculators/LabourTurnover';
import MarketShare from './calculators/MarketShare';
import Breakeven from './calculators/Breakeven';
import CVPAnalysis from './calculators/CVPAnalysis';

const ASBusiness: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AS Business Studies</h2>
        <p className="text-lg text-gray-600">Essential calculations for AS level success</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LabourTurnover />
        <MarketShare />
        <Breakeven />
        <CVPAnalysis />
      </div>
    </div>
  );
};

export default ASBusiness;