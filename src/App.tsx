import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import ASBusiness from './components/ASBusiness';
import A2Business from './components/A2Business';
import logo from './assets/logo.png'; // make sure logo.png is in src/assets

function App() {
  const [activeTab, setActiveTab] = useState<'as' | 'a2'>('as');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Left side: Calculator icon + title */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calc-u-later</h1>
                <p className="text-sm text-gray-600">A-Level Business &amp; Economics Calculator</p>
              </div>
            </div>

            {/* Right side: larger logo + name */}
            <div className="flex items-center space-x-4">
              <img
                src={logo}
                alt="Logo"
                className="h-16 w-16 object-contain"
              />
              <span className="text-base font-medium text-gray-700">
                Made by Muhammad Burhan Azhar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="flex">
            <button
              onClick={() => setActiveTab('as')}
              className={`flex-1 py-4 px-6 text-center font-medium rounded-l-xl transition-all duration-200 ${
                activeTab === 'as'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              AS Business Studies
            </button>
            <button
              onClick={() => setActiveTab('a2')}
              className={`flex-1 py-4 px-6 text-center font-medium rounded-r-xl transition-all duration-200 ${
                activeTab === 'a2'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              A2 Business Studies
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'as' ? <ASBusiness /> : <A2Business />}
        </div>
      </div>
    </div>
  );
}

export default App;
