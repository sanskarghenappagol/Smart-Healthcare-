import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Terminal, Play, CheckCircle, Database, Code, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';

export const DbmsQueryLab: React.FC = () => {
  const [queries, setQueries] = useState<any[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('cte_doctor_ranking');
  const [customSql, setCustomSql] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getDbmsQueries().then(data => {
      setQueries(data);
      if (data.length > 0) {
        setSelectedQueryId(data[0].id);
        setCustomSql(data[0].sql);
      }
    }).catch(console.error);
  }, []);

  const handleSelectQuery = (qId: string) => {
    setSelectedQueryId(qId);
    const q = queries.find(item => item.id === qId);
    if (q) {
      setCustomSql(q.sql);
      setResult(null);
      setError(null);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runDbmsQuery({
        query_id: selectedQueryId || undefined,
        custom_sql: customSql || undefined
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Query execution error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(customSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentQueryObj = queries.find(q => q.id === selectedQueryId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>PES University CSE · Evaluation Feature #10</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              DBMS Query Lab (CTEs, Joins, Subqueries &amp; Functions)
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Execute live Common Table Expressions (CTEs), window ranking functions (DENSE_RANK), multi-table relational joins, correlated subqueries, and deterministic SQL functions directly against the live MySQL server.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecute}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running MySQL...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute on Live MySQL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Query Selector Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Select Advanced DBMS Query Category
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {queries.map(q => (
            <button
              key={q.id}
              onClick={() => handleSelectQuery(q.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedQueryId === q.id
                  ? 'bg-sky-50/50 border-sky-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider block">
                  {q.category}
                </span>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {q.title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                {q.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* SQL Editor / Viewer */}
      <div className="bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-400">
            <Code className="w-4 h-4 text-sky-400" />
            <span>MySQL SQL Query (Live Editable for Evaluators)</span>
          </div>
          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy SQL'}</span>
          </button>
        </div>
        <textarea
          value={customSql}
          onChange={e => setCustomSql(e.target.value)}
          rows={10}
          className="w-full p-4 font-mono text-xs bg-slate-950 text-sky-300 border-0 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed resize-y"
          placeholder="Enter custom SELECT query or edit above CTE..."
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Result Display */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900">Live Result Set Returned from MySQL</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
              <span>Rows Returned: <strong className="text-slate-800">{result.rowCount}</strong></span>
              <span>·</span>
              <span>Execution Time: <strong className="text-emerald-600">{result.executionTimeMs} ms</strong></span>
            </div>
          </div>

          {result.rows && result.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    {Object.keys(result.rows[0]).map(col => (
                      <th key={col} className="py-2.5 px-3 font-mono text-[11px]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.rows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.entries(row).map(([k, val]: any, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-3 text-slate-800 font-mono text-[11px] whitespace-nowrap">
                          {val === null || val === undefined ? (
                            <span className="text-slate-300 italic">NULL</span>
                          ) : typeof val === 'number' ? (
                            <span className="tabular-nums font-semibold">{val}</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Query executed successfully, but returned 0 rows.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
