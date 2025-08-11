import React, { useMemo, useState } from 'react';
import { Network, Calculator, Plus, Trash2 } from 'lucide-react';

interface ActivityInput {
  id: string;
  name: string;
  duration: string; // UI only, parsed later
  predecessors: string[];
}

interface ActivityCalc {
  id: string;
  name: string;
  duration: number;
  preds: string[];
  succs: string[];
  es: number; // earliest start
  ef: number; // earliest finish (internal only)
  lf: number; // latest finish
  ls: number; // latest start (internal only)
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
}

interface CPAResult {
  activities: Array<{
    id: string;
    name: string;
    duration: number;
    est: number; // expose ES only
    lft: number; // expose LF only
    totalFloat: number;
    freeFloat: number;
    isCritical: boolean;
  }>;
  criticalPath: string[];
  projectDuration: number;
  warnings: string[];
}

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function topoSort(nodes: string[], edges: [string, string][]): { order: string[]; hasCycle: boolean } {
  const inDeg = new Map<string, number>(nodes.map(n => [n, 0]));
  const adj = new Map<string, string[]>(nodes.map(n => [n, []]));
  for (const [u, v] of edges) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u)!.push(v);
    inDeg.set(v, (inDeg.get(v) ?? 0) + 1);
  }
  const q: string[] = [];
  for (const n of nodes) if ((inDeg.get(n) ?? 0) === 0) q.push(n);
  const order: string[] = [];
  while (q.length) {
    const u = q.shift()!;
    order.push(u);
    for (const v of adj.get(u) ?? []) {
      inDeg.set(v, (inDeg.get(v) ?? 0) - 1);
      if ((inDeg.get(v) ?? 0) === 0) q.push(v);
    }
  }
  return { order, hasCycle: order.length !== nodes.length };
}

const CriticalPath: React.FC = () => {
  const [activities, setActivities] = useState<ActivityInput[]>([
    { id: 'A', name: '', duration: '', predecessors: [] },
    { id: 'B', name: '', duration: '', predecessors: [] }
  ]);
  const [result, setResult] = useState<CPAResult | null>(null);

  const addActivity = () => {
    const nextIndex = activities.length;
    const nextLetter = letters[nextIndex] ?? `N${nextIndex+1}`;
    setActivities(prev => ([...prev, { id: nextLetter, name: '', duration: '', predecessors: [] }]));
  };

  const removeActivity = (id: string) => {
    if (activities.length <= 2) return;
    setActivities(prev => {
      const filtered = prev.filter(a => a.id !== id);
      return filtered.map(a => ({ ...a, predecessors: a.predecessors.filter(p => p !== id) }));
    });
  };

  const updateActivity = (id: string, field: keyof ActivityInput, value: any) => {
    setActivities(prev => prev.map(a => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const updatePredecessors = (id: string, predecessorId: string, checked: boolean) => {
    setActivities(prev => prev.map(a => {
      if (a.id !== id) return a;
      const set = new Set(a.predecessors);
      if (checked) set.add(predecessorId); else set.delete(predecessorId);
      return { ...a, predecessors: Array.from(set) };
    }));
  };

  const calculate = () => {
    const warnings: string[] = [];

    // Validate and normalize inputs
    const parsed = activities.map(a => ({
      id: a.id,
      name: a.name.trim(),
      duration: parseFloat(a.duration),
      predecessors: a.predecessors.filter(p => p !== a.id), // no self-edge
    }));

    const valid = parsed.filter(a => a.name !== '' && isFinite(a.duration) && a.duration > 0);
    if (valid.length < 2) {
      setResult(null);
      return;
    }

    // Drop references to missing/invalid predecessors
    const ids = new Set(valid.map(v => v.id));
    for (const v of valid) {
      const before = v.predecessors.length;
      v.predecessors = v.predecessors.filter(p => ids.has(p));
      if (v.predecessors.length !== before) warnings.push(`Activity ${v.id}: removed unknown predecessors.`);
    }

    // Build graph
    const nodes = valid.map(v => v.id);
    const edges: [string, string][] = [];
    for (const v of valid) for (const p of v.predecessors) edges.push([p, v.id]);

    const { order, hasCycle } = topoSort(nodes, edges);
    if (hasCycle) {
      setResult({ activities: [], criticalPath: [], projectDuration: 0, warnings: [
        'The network contains a cycle. Remove circular dependencies and try again.'
      ]});
      return;
    }

    // Index lookups
    const byId = new Map<string, ActivityCalc>();
    for (const v of valid) {
      byId.set(v.id, {
        id: v.id,
        name: v.name,
        duration: v.duration,
        preds: [...v.predecessors],
        succs: [],
        es: 0,
        ef: 0,
        lf: Infinity,
        ls: Infinity,
        totalFloat: 0,
        freeFloat: 0,
        isCritical: false,
      });
    }
    for (const [u, w] of edges) byId.get(u)!.succs.push(w);

    // Forward pass (ES/EF)
    for (const id of order) {
      const node = byId.get(id)!;
      node.es = Math.max(0, ...node.preds.map(p => byId.get(p)!.ef));
      node.ef = node.es + node.duration;
    }

    const projectDuration = Math.max(0, ...order.map(id => byId.get(id)!.ef));

    // Backward pass (LF/LS)
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      const node = byId.get(id)!;
      if (node.succs.length === 0) {
        node.lf = projectDuration;
      } else {
        node.lf = Math.min(...node.succs.map(s => byId.get(s)!.ls));
      }
      node.ls = node.lf - node.duration;
    }

    // Floats & critical path
    for (const id of order) {
      const n = byId.get(id)!;
      n.totalFloat = n.lf - n.ef; // or LS - ES
      if (n.succs.length) {
        const minSuccES = Math.min(...n.succs.map(s => byId.get(s)!.es));
        n.freeFloat = Math.max(0, minSuccES - n.ef);
      } else {
        n.freeFloat = Math.max(0, projectDuration - n.ef);
      }
      n.isCritical = Math.abs(n.totalFloat) < 1e-9;
    }

    // Reconstruct one critical path (follow critical successors in time order)
    const startCrit = order.filter(id => byId.get(id)!.isCritical && byId.get(id)!.es === 0)
                           .sort((a, b) => byId.get(a)!.ef - byId.get(b)!.ef)[0];
    const criticalPath: string[] = [];
    if (startCrit) {
      let cur: string | undefined = startCrit;
      while (cur) {
        criticalPath.push(cur);
        const node = byId.get(cur)!;
        const next = node.succs
          .filter(s => byId.get(s)!.isCritical && Math.abs(byId.get(s)!.es - node.ef) < 1e-9)
          .sort((a, b) => byId.get(a)!.ef - byId.get(b)!.ef)[0];
        cur = next;
      }
    }

    const activitiesOut: CPAResult['activities'] = order.map(id => {
      const n = byId.get(id)!;
      return {
        id: n.id,
        name: n.name,
        duration: n.duration,
        est: n.es,
        lft: n.lf,
        totalFloat: n.totalFloat,
        freeFloat: n.freeFloat,
        isCritical: n.isCritical,
      };
    });

    setResult({ activities: activitiesOut, criticalPath, projectDuration, warnings });
  };

  const clear = () => {
    setActivities([
      { id: 'A', name: '', duration: '', predecessors: [] },
      { id: 'B', name: '', duration: '', predecessors: [] }
    ]);
    setResult(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <Network className="h-6 w-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Critical Path Analysis</h3>
        </div>
        <p className="text-sm text-gray-600">Compute ES, LF, floats, project duration & critical path</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Project Activities</h4>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-800">Activity {activity.id}</h5>
                  {activities.length > 2 && (
                    <button
                      onClick={() => removeActivity(activity.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove activity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Activity Name</label>
                    <input
                      type="text"
                      value={activity.name}
                      onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="e.g. Design Phase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration (days)</label>
                    <input
                      type="number"
                      min="1"
                      value={activity.duration}
                      onChange={(e) => updateActivity(activity.id, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Predecessors (must finish before this)</label>
                  <div className="flex flex-wrap gap-2">
                    {activities.filter(a => a.id !== activity.id).map(predActivity => (
                      <label key={predActivity.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activity.predecessors.includes(predActivity.id)}
                          onChange={(e) => updatePredecessors(activity.id, predActivity.id, e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Activity {predActivity.id}</span>
                      </label>
                    ))}
                    {activities.filter(a => a.id !== activity.id).length === 0 && (
                      <span className="text-gray-400 text-sm">No other activities available</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addActivity}
            className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Another Activity</span>
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={calculate}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Calculator className="h-4 w-4" />
            <span>Calculate CPA</span>
          </button>
          <button
            onClick={clear}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>

        {result && (
          <div className="mt-6 space-y-4">
            {result.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                {result.warnings.map((w, i) => (<div key={i}>• {w}</div>))}
              </div>
            )}

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-purple-900">Project Summary</h4>
                <span className="text-2xl font-bold text-purple-700">{result.projectDuration} days</span>
              </div>
              <div className="text-sm text-purple-700">
                <strong>Critical Path:</strong> {result.criticalPath.length ? result.criticalPath.join(' → ') : 'Not found'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">Activity</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Duration</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">EST</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">LFT</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Total Float</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Free Float</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {result.activities.map((a) => (
                    <tr key={a.id} className={a.isCritical ? 'bg-red-50' : ''}>
                      <td className="border border-gray-300 px-3 py-2">
                        <div className="font-medium">{a.id}</div>
                        <div className="text-xs text-gray-600">{a.name}</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{a.duration}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{a.est}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{a.lft}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{a.totalFloat}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{a.freeFloat}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{a.isCritical ? (
                        <span className="text-red-600 font-semibold">Yes</span>) : (<span className="text-gray-400">No</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-600">
              <p><strong>EST:</strong> Earliest Start Time | <strong>LFT:</strong> Latest Finish Time</p>
              <p><strong>Total Float:</strong> Maximum delay without affecting project duration | <strong>Free Float:</strong> Delay without affecting immediate successors</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriticalPath;
