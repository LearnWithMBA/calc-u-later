import React, { useState } from 'react';
import { TrendingUp, Calculator } from 'lucide-react';

interface RatioResults {
  profitability: {
    gpMargin: number;
    npMargin: number;
    expenseToRevenue: number;
    operatingProfitMargin: number;
    operatingProfit: number;
  };
  liquidity: {
    currentRatio: number;
    acidTestRatio: number;
  };
  efficiency: {
    inventoryTurnover: number;
    tradePayablesDays: number;
    tradeReceivablesDays: number;
    inventoryDays: number;
    cashConversionCycle: number;
  };
  returns: {
    roce: number;
    roe: number;
    capitalEmployedTurnover: number;
  };
  gearing: {
    gearingRatio: number;
    capitalEmployed: number;
  };
  investment: {
    dividendYield: number;
    eps: number;
    peRatio: number;
    dividendCover: number;
  };
}

const FinancialRatios: React.FC = () => {
  // Income Statement inputs
  const [revenue, setRevenue] = useState<string>('');
  const [grossProfit, setGrossProfit] = useState<string>('');
  const [netProfit, setNetProfit] = useState<string>('');
  const [totalExpenses, setTotalExpenses] = useState<string>('');

  // Balance Sheet inputs
  const [currentAssets, setCurrentAssets] = useState<string>('');
  const [inventory, setInventory] = useState<string>('');
  const [currentLiabilities, setCurrentLiabilities] = useState<string>('');
  const [totalDebt, setTotalDebt] = useState<string>('');
  const [totalEquity, setTotalEquity] = useState<string>('');
  const [tradeReceivables, setTradeReceivables] = useState<string>('');
  const [tradePayables, setTradePayables] = useState<string>('');
  const [capitalEmployed, setCapitalEmployed] = useState<string>(''); // NEW
  const [costOfGoodsSold, setCostOfGoodsSold] = useState<string>('');

  // Investment inputs
  const [sharesOutstanding, setSharesOutstanding] = useState<string>('');
  const [sharePrice, setSharePrice] = useState<string>('');
  const [dividendPerShare, setDividendPerShare] = useState<string>('');

  const [result, setResult] = useState<RatioResults | null>(null);

  const calculate = () => {
    const rev = parseFloat(revenue) || 0;
    const gp = parseFloat(grossProfit) || 0;
    const np = parseFloat(netProfit) || 0;
    const expenses = parseFloat(totalExpenses) || 0;
    const ca = parseFloat(currentAssets) || 0;
    const inv = parseFloat(inventory) || 0;
    const cl = parseFloat(currentLiabilities) || 0;
    const debt = parseFloat(totalDebt) || 0;
    const equity = parseFloat(totalEquity) || 0;
    const receivables = parseFloat(tradeReceivables) || 0;
    const payables = parseFloat(tradePayables) || 0;
    const cogs = parseFloat(costOfGoodsSold) || 0;
    const ce = parseFloat(capitalEmployed) || 0; // NEW
    const shares = parseFloat(sharesOutstanding) || 0;
    const price = parseFloat(sharePrice) || 0;
    const dividend = parseFloat(dividendPerShare) || 0;

    // Derived
    const operatingProfit = gp - expenses; // EBIT
    const inventoryTurnover = inv > 0 ? cogs / inv : 0;
    const inventoryDays = cogs > 0 && inv > 0 ? (365 * inv) / cogs : 0;
    const tradePayablesDays = payables > 0 && cogs > 0 ? (payables / cogs) * 365 : 0;
    const tradeReceivablesDays = receivables > 0 && rev > 0 ? (receivables / rev) * 365 : 0;
    const cashConversionCycle = inventoryDays + tradeReceivablesDays - tradePayablesDays;

    const results: RatioResults = {
      profitability: {
        gpMargin: rev > 0 ? (gp / rev) * 100 : 0,
        npMargin: rev > 0 ? (np / rev) * 100 : 0,
        expenseToRevenue: rev > 0 ? (expenses / rev) * 100 : 0,
        operatingProfitMargin: rev > 0 ? (operatingProfit / rev) * 100 : 0,
        operatingProfit,
      },
      liquidity: {
        currentRatio: cl > 0 ? ca / cl : 0,
        acidTestRatio: cl > 0 ? (ca - inv) / cl : 0,
      },
      efficiency: {
        inventoryTurnover,
        tradePayablesDays,
        tradeReceivablesDays,
        inventoryDays,
        cashConversionCycle,
      },
      returns: {
        roce: ce > 0 ? (operatingProfit / ce) * 100 : 0,
        roe: equity > 0 ? (np / equity) * 100 : 0,
        capitalEmployedTurnover: ce > 0 ? rev / ce : 0,
      },
      gearing: {
        gearingRatio: (debt + equity) > 0 ? (debt / (debt + equity)) * 100 : 0,
        capitalEmployed: ce,
      },
      investment: {
        dividendYield: price > 0 ? (dividend / price) * 100 : 0,
        eps: shares > 0 ? np / shares : 0,
        peRatio: shares > 0 && np > 0 ? price / (np / shares) : 0,
        dividendCover: dividend > 0 && shares > 0 ? (np / shares) / dividend : 0,
      },
    };

    setResult(results);
  };

  const clear = () => {
    setRevenue('');
    setGrossProfit('');
    setNetProfit('');
    setTotalExpenses('');
    setCurrentAssets('');
    setInventory('');
    setCurrentLiabilities('');
    setTotalDebt('');
    setTotalEquity('');
    setTradeReceivables('');
    setTradePayables('');
    setCapitalEmployed(''); // NEW
    setCostOfGoodsSold('');
    setSharesOutstanding('');
    setSharePrice('');
    setDividendPerShare('');
    setResult(null);
  };

  const fmt = (n: number, digits = 2) => (isFinite(n) ? n.toFixed(digits) : 'N/A');

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <TrendingUp className="h-6 w-6 text-orange-600" />
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900">Financial Ratios</h3>
        </div>
        <p className="text-sm md:text-base text-gray-600">Calculate key financial ratios for business analysis</p>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 space-y-8">
        {/* Income Statement Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 text-xs md:text-sm uppercase tracking-wide text-orange-700">
            Income Statement Data
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Revenue (£)</label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 1000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gross Profit (£)</label>
              <input
                type="number"
                value={grossProfit}
                onChange={(e) => setGrossProfit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 400000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Net Profit (£)</label>
              <input
                type="number"
                value={netProfit}
                onChange={(e) => setNetProfit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Expenses (£)</label>
              <input
                type="number"
                value={totalExpenses}
                onChange={(e) => setTotalExpenses(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 250000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost of Goods Sold (£)</label>
              <input
                type="number"
                value={costOfGoodsSold}
                onChange={(e) => setCostOfGoodsSold(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 600000"
              />
            </div>
          </div>
        </div>

        {/* Balance Sheet Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 text-xs md:text-sm uppercase tracking-wide text-orange-700">
            Balance Sheet Data
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Assets (£)</label>
              <input
                type="number"
                value={currentAssets}
                onChange={(e) => setCurrentAssets(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 300000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inventory (£)</label>
              <input
                type="number"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Liabilities (£)</label>
              <input
                type="number"
                value={currentLiabilities}
                onChange={(e) => setCurrentLiabilities(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Debt (£)</label>
              <input
                type="number"
                value={totalDebt}
                onChange={(e) => setTotalDebt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 200000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Equity (£)</label>
              <input
                type="number"
                value={totalEquity}
                onChange={(e) => setTotalEquity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 500000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trade Receivables (£)</label>
              <input
                type="number"
                value={tradeReceivables}
                onChange={(e) => setTradeReceivables(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 80000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trade Payables (£)</label>
              <input
                type="number"
                value={tradePayables}
                onChange={(e) => setTradePayables(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 60000"
              />
            </div>
            {/* NEW: Capital Employed */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Capital Employed (£)</label>
              <input
                type="number"
                value={capitalEmployed}
                onChange={(e) => setCapitalEmployed(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 700000"
              />
            </div>
          </div>
        </div>

        {/* Investment Data Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 text-xs md:text-sm uppercase tracking-wide text-orange-700">
            Investment Data
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shares Outstanding</label>
              <input
                type="number"
                value={sharesOutstanding}
                onChange={(e) => setSharesOutstanding(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Share Price (£)</label>
              <input
                type="number"
                step="0.01"
                value={sharePrice}
                onChange={(e) => setSharePrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 5.50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dividend per Share (£)</label>
              <input
                type="number"
                step="0.01"
                value={dividendPerShare}
                onChange={(e) => setDividendPerShare(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g. 0.25"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={calculate}
            className="flex-1 bg-orange-600 text-white py-2.5 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="h-5 w-5" />
            <span>Calculate Ratios</span>
          </button>
          <button
            onClick={clear}
            className="sm:w-auto w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-6">
            {/* Profitability */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-3">Profitability</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-orange-600 mb-1">Gross Profit Margin</div>
                  <div className="text-xl font-bold text-orange-700">{fmt(result.profitability.gpMargin)}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-orange-600 mb-1">Operating Profit Margin</div>
                  <div className="text-xl font-bold text-orange-700">{fmt(result.profitability.operatingProfitMargin)}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-orange-600 mb-1">Net Profit Margin</div>
                  <div className="text-xl font-bold text-orange-700">{fmt(result.profitability.npMargin)}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-orange-600 mb-1">Expense to Revenue</div>
                  <div className="text-xl font-bold text-orange-700">{fmt(result.profitability.expenseToRevenue)}%</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-orange-900">
                Operating Profit (EBIT): <span className="font-semibold">£{fmt(result.profitability.operatingProfit)}</span>
              </div>
            </div>

            {/* Liquidity */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Liquidity</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-blue-600 mb-1">Current Ratio</div>
                  <div className="text-xl font-bold text-blue-700">{fmt(result.liquidity.currentRatio)}:1</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-blue-600 mb-1">Acid Test Ratio</div>
                  <div className="text-xl font-bold text-blue-700">{fmt(result.liquidity.acidTestRatio)}:1</div>
                </div>
              </div>
            </div>

            {/* Efficiency */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">Efficiency</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-green-600 mb-1">Inventory Turnover</div>
                  <div className="text-xl font-bold text-green-700">{fmt(result.efficiency.inventoryTurnover)}x</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-green-600 mb-1">Inventory Days</div>
                  <div className="text-xl font-bold text-green-700">{fmt(result.efficiency.inventoryDays, 0)} days</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-green-600 mb-1">Trade Payables Days</div>
                  <div className="text-xl font-bold text-green-700">{fmt(result.efficiency.tradePayablesDays, 0)} days</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-green-600 mb-1">Trade Receivables Days</div>
                  <div className="text-xl font-bold text-green-700">{fmt(result.efficiency.tradeReceivablesDays, 0)} days</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-green-600 mb-1">Cash Conversion Cycle</div>
                  <div className="text-xl font-bold text-green-700">{fmt(result.efficiency.cashConversionCycle, 0)} days</div>
                </div>
              </div>
            </div>

            {/* Returns */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-3">Returns</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-yellow-700 mb-1">ROCE</div>
                  <div className="text-xl font-bold text-yellow-800">{fmt(result.returns.roce)}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-yellow-700 mb-1">ROE</div>
                  <div className="text-xl font-bold text-yellow-800">{fmt(result.returns.roe)}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-yellow-700 mb-1">Capital Employed Turnover</div>
                  <div className="text-xl font-bold text-yellow-800">{fmt(result.returns.capitalEmployedTurnover)}x</div>
                </div>
              </div>
            </div>

            {/* Gearing */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-3">Gearing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-purple-600 mb-1">Gearing Ratio</div>
                  <div className="text-xl font-bold text-purple-700">{fmt(result.gearing.gearingRatio)}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-purple-600 mb-1">Capital Employed</div>
                  <div className="text-xl font-bold text-purple-700">£{fmt(result.gearing.capitalEmployed)}</div>
                </div>
              </div>
            </div>

            {/* Investment */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-900 mb-3">Investment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-indigo-600 mb-1">Dividend Yield</div>
                  <div className="text-xl font-bold text-indigo-700">{fmt(result.investment.dividendYield)}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-indigo-600 mb-1">EPS</div>
                  <div className="text-xl font-bold text-indigo-700">£{fmt(result.investment.eps)}</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-indigo-600 mb-1">P/E Ratio</div>
                  <div className="text-xl font-bold text-indigo-700">
                    {isFinite(result.investment.peRatio) ? fmt(result.investment.peRatio) : 'N/A'}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm text-indigo-600 mb-1">Dividend Cover</div>
                  <div className="text-xl font-bold text-indigo-700">
                    {isFinite(result.investment.dividendCover) ? `${fmt(result.investment.dividendCover)}x` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialRatios;
