import { useState, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Plot from "react-plotly.js";
import Footer from "./Footer";
import apiService from "../services/apiService";

// ─── Sub-components ────────────────────────────────────────────────────────────

function MonteCarloForm({ onSubmit, onCsvSubmit, loading }) {
  const [mode, setMode] = useState("manual"); // "manual" or "csv"
  const [csvFile, setCsvFile] = useState(null);
  const fileInputRef = useRef(null);

  const [params, setParams] = useState({
    start_price: 24158,
    annual_drift: 0.09,
    annual_volatility: 0.22,
    horizon_days: 30,
    num_simulations: 10000,
  });

  const handleChange = (field, value) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "csv") {
      if (!csvFile) return;
      onCsvSubmit(csvFile, Number(params.horizon_days), Number(params.num_simulations));
    } else {
      onSubmit({
        ...params,
        start_price: Number(params.start_price),
        annual_drift: Number(params.annual_drift),
        annual_volatility: Number(params.annual_volatility),
        horizon_days: Number(params.horizon_days),
        num_simulations: Number(params.num_simulations),
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setCsvFile(file);
  };

  const downloadSample = () => {
    const link = document.createElement("a");
    link.href = "/assets/sensex_sample.csv";
    link.download = "sensex_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const manualFields = [
    { key: "start_price", label: "Starting Price", step: "1", min: "0.01" },
    { key: "annual_drift", label: "Annual Drift (e.g. 0.09 = 9%)", step: "0.01" },
    { key: "annual_volatility", label: "Annual Volatility (e.g. 0.22 = 22%)", step: "0.01", min: "0.001" },
  ];

  const commonFields = [
    { key: "horizon_days", label: "Horizon (trading days)", step: "1", min: "1", max: "504" },
    { key: "num_simulations", label: "Simulations", step: "1000", min: "1000", max: "50000" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex rounded overflow-hidden border border-gray-700">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 py-1.5 text-xs font-medium transition ${
            mode === "manual"
              ? "bg-cyan-600 text-white"
              : "bg-[#0f172a] text-gray-400 hover:text-gray-200"
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("csv")}
          className={`flex-1 py-1.5 text-xs font-medium transition ${
            mode === "csv"
              ? "bg-cyan-600 text-white"
              : "bg-[#0f172a] text-gray-400 hover:text-gray-200"
          }`}
        >
          CSV Upload
        </button>
      </div>

      {mode === "csv" ? (
        <>
          {/* Download Sample */}
          <button
            type="button"
            onClick={downloadSample}
            className="w-full py-2 rounded border border-cyan-700 text-cyan-400 text-xs font-medium hover:bg-cyan-900/30 transition flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Sample Data
          </button>

          {/* CSV Upload */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Upload CSV (Date, Price)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-2.5 rounded border text-sm font-medium transition ${
                csvFile
                  ? "border-green-700 bg-green-900/20 text-green-400"
                  : "border-gray-700 bg-[#0f172a] text-gray-400 hover:border-gray-500"
              }`}
            >
              {csvFile ? csvFile.name : "Choose CSV File..."}
            </button>
          </div>
        </>
      ) : (
        <>
          {manualFields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
              <input
                type="number"
                step={f.step}
                min={f.min}
                max={f.max}
                value={params[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          ))}
        </>
      )}

      {/* Common fields for both modes */}
      {commonFields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
          <input
            type="number"
            step={f.step}
            min={f.min}
            max={f.max}
            value={params[f.key]}
            onChange={(e) => handleChange(f.key, e.target.value)}
            className="w-full bg-[#0f172a] border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={loading || (mode === "csv" && !csvFile)}
        className={`w-full py-2.5 rounded font-semibold text-sm transition ${
          loading || (mode === "csv" && !csvFile)
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-cyan-600 hover:bg-cyan-500 text-white"
        }`}
      >
        {loading ? "Simulating..." : "Run Simulation"}
      </button>
    </form>
  );
}

function SimulationChart({ data }) {
  if (!data) return null;

  const days = Array.from({ length: data.horizon_days + 1 }, (_, i) => i);

  // Confidence bands
  const traces = [];

  // P5-P95 band
  if (data.bands) {
    traces.push({
      x: [...days, ...days.slice().reverse()],
      y: [...data.bands.P95, ...data.bands.P5.slice().reverse()],
      fill: "toself",
      fillcolor: "rgba(0,180,255,0.08)",
      line: { color: "transparent" },
      name: "P5–P95",
      hoverinfo: "skip",
    });

    // P25-P75 band
    traces.push({
      x: [...days, ...days.slice().reverse()],
      y: [...data.bands.P75, ...data.bands.P25.slice().reverse()],
      fill: "toself",
      fillcolor: "rgba(0,180,255,0.18)",
      line: { color: "transparent" },
      name: "P25–P75",
      hoverinfo: "skip",
    });
  }

  // Sample paths (thin lines)
  if (data.sample_paths) {
    const maxPaths = Math.min(100, data.sample_paths.length);
    for (let i = 0; i < maxPaths; i++) {
      const path = data.sample_paths[i];
      const gained = path[path.length - 1] > data.start_price;
      traces.push({
        x: days,
        y: path,
        mode: "lines",
        line: {
          color: gained ? "rgba(0,255,100,0.06)" : "rgba(255,50,50,0.06)",
          width: 0.5,
        },
        showlegend: false,
        hoverinfo: "skip",
      });
    }
  }

  // Mean path
  if (data.mean_path) {
    traces.push({
      x: days,
      y: data.mean_path,
      mode: "lines",
      line: { color: "#00D4FF", width: 3 },
      name: "Mean Path",
    });
  }

  // Current price line
  traces.push({
    x: [0, data.horizon_days],
    y: [data.start_price, data.start_price],
    mode: "lines",
    line: { color: "rgba(255,255,255,0.4)", width: 1, dash: "dash" },
    name: "Start Price",
  });

  return (
    <Plot
      data={traces}
      layout={{
        paper_bgcolor: "#0b0f14",
        plot_bgcolor: "#0b0f14",
        font: { color: "#e5e7eb", family: "monospace", size: 11 },
        xaxis: { title: "Trading Day", gridcolor: "#1e293b", zeroline: false },
        yaxis: { title: "Price", gridcolor: "#1e293b", zeroline: false },
        margin: { t: 30, r: 20, b: 50, l: 60 },
        legend: { x: 0, y: 1.1, orientation: "h", font: { size: 10 } },
        showlegend: true,
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", height: "400px" }}
    />
  );
}

function HistogramChart({ data }) {
  if (!data?.sample_paths) return null;

  const finalPrices = data.sample_paths.map((p) => p[p.length - 1]);
  const colors = finalPrices.map((p) =>
    p < data.start_price * 0.95
      ? "#ef4444"
      : p > data.start_price * 1.05
      ? "#22c55e"
      : "#3b82f6"
  );

  return (
    <Plot
      data={[
        {
          x: finalPrices,
          type: "histogram",
          nbinsx: 60,
          marker: { color: "#00D4FF", opacity: 0.7 },
          name: "Final Price Distribution",
        },
      ]}
      layout={{
        paper_bgcolor: "#0b0f14",
        plot_bgcolor: "#0b0f14",
        font: { color: "#e5e7eb", family: "monospace", size: 11 },
        xaxis: { title: "Final Price", gridcolor: "#1e293b" },
        yaxis: { title: "Count", gridcolor: "#1e293b" },
        margin: { t: 30, r: 20, b: 50, l: 60 },
        shapes: [
          {
            type: "line",
            x0: data.start_price,
            x1: data.start_price,
            y0: 0,
            y1: 1,
            yref: "paper",
            line: { color: "#fff", width: 1.5, dash: "dash" },
          },
          {
            type: "line",
            x0: data.expected_price,
            x1: data.expected_price,
            y0: 0,
            y1: 1,
            yref: "paper",
            line: { color: "#00D4FF", width: 1.5, dash: "dot" },
          },
        ],
        annotations: [
          {
            x: data.start_price,
            y: 1,
            yref: "paper",
            text: "Start",
            showarrow: false,
            font: { color: "#fff", size: 10 },
            yshift: 10,
          },
          {
            x: data.expected_price,
            y: 1,
            yref: "paper",
            text: "Expected",
            showarrow: false,
            font: { color: "#00D4FF", size: 10 },
            yshift: 10,
          },
        ],
        showlegend: false,
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", height: "300px" }}
    />
  );
}

function ProbabilityCards({ data }) {
  if (!data?.probabilities) return null;

  const p = data.probabilities;
  const r = data.risk_metrics;

  const cards = [
    { label: "Price Increase", value: p.price_increase, bullish: true },
    { label: "Price Decrease", value: p.price_decrease, bullish: false },
    { label: "Gain > 2%", value: p.gain_2pct, bullish: true },
    { label: "Loss > 2%", value: p.loss_2pct, bullish: false },
    { label: "Gain > 5%", value: p.gain_5pct, bullish: true },
    { label: "Loss > 5%", value: p.loss_5pct, bullish: false },
    { label: "Gain > 10%", value: p.gain_10pct, bullish: true },
    { label: "Loss > 10%", value: p.loss_10pct, bullish: false },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-100 mb-3">Probability Dashboard</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-lg p-3 border text-center ${
              c.bullish
                ? "bg-green-900/20 border-green-800/40"
                : "bg-red-900/20 border-red-800/40"
            }`}
          >
            <div className="text-xs text-gray-400 mb-1">{c.label}</div>
            <div
              className={`text-xl font-bold ${
                c.bullish ? "text-green-400" : "text-red-400"
              }`}
            >
              {c.value?.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
      {r && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">VaR 95%</div>
            <div className="text-lg font-bold text-yellow-400">{r.var_95?.toFixed(2)}</div>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">VaR 99%</div>
            <div className="text-lg font-bold text-yellow-400">{r.var_99?.toFixed(2)}</div>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">CVaR 95%</div>
            <div className="text-lg font-bold text-yellow-400">
              {r.expected_shortfall_95?.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SensitivityGrid({ data }) {
  if (!data?.grid) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-100 mb-3">Parameter Sensitivity Grid</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-gray-400 p-2 border-b border-gray-800">Vol \ Drift</th>
              {data.drift_labels.map((dl) => (
                <th key={dl} className="text-center text-gray-400 p-2 border-b border-gray-800">
                  {dl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.grid.map((row, ri) => (
              <tr key={ri}>
                <td className="text-gray-300 p-2 border-b border-gray-800 font-medium">
                  {data.vol_labels[ri]}
                </td>
                {row.map((cell, ci) => {
                  const isBase = ri === 1 && ci === 1;
                  return (
                    <td
                      key={ci}
                      className={`p-2 border-b border-gray-800 text-center ${
                        isBase ? "ring-1 ring-cyan-500 bg-cyan-900/20" : ""
                      }`}
                    >
                      <div className="text-gray-100 font-semibold">
                        {cell.expected_price?.toFixed(0)}
                      </div>
                      <div
                        className={`text-xs ${
                          cell.prob_gain > 55
                            ? "text-green-400"
                            : cell.prob_gain < 45
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        P(gain) {cell.prob_gain?.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {cell.p5?.toFixed(0)} – {cell.p95?.toFixed(0)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Simulation3DViewer({ data }) {
  if (!data) return null;

  const days = Array.from({ length: data.horizon_days + 1 }, (_, i) => i);

  const gainX = [], gainY = [], gainZ = [];
  const lossX = [], lossY = [], lossZ = [];

  for (let i = 0; i < data.x.length; i++) {
    if (data.colors[i] === "gain") {
      gainX.push(data.x[i]);
      gainY.push(data.y[i]);
      gainZ.push(data.z[i]);
    } else {
      lossX.push(data.x[i]);
      lossY.push(data.y[i]);
      lossZ.push(data.z[i]);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-100 mb-3">3D Simulation Paths</h3>
      <p className="text-xs text-gray-500 mb-2">Drag to rotate / Scroll to zoom</p>
      <Plot
        data={[
          {
            type: "scatter3d",
            mode: "markers",
            x: gainX,
            y: gainY,
            z: gainZ,
            marker: { size: 1.2, color: "rgba(0,255,100,0.08)", opacity: 0.08 },
            name: "Gain paths",
            hoverinfo: "skip",
          },
          {
            type: "scatter3d",
            mode: "markers",
            x: lossX,
            y: lossY,
            z: lossZ,
            marker: { size: 1.2, color: "rgba(255,50,50,0.08)", opacity: 0.08 },
            name: "Loss paths",
            hoverinfo: "skip",
          },
          {
            type: "scatter3d",
            mode: "lines",
            x: days,
            y: Array(days.length).fill(Math.floor(data.sample_count / 2)),
            z: data.mean_path,
            line: { color: "#00D4FF", width: 6 },
            name: "Mean",
          },
          {
            type: "scatter3d",
            mode: "lines",
            x: days,
            y: Array(days.length).fill(Math.floor(data.sample_count * 0.98)),
            z: data.p95_path,
            line: { color: "#22c55e", width: 3, dash: "dash" },
            name: "P95",
          },
          {
            type: "scatter3d",
            mode: "lines",
            x: days,
            y: Array(days.length).fill(Math.floor(data.sample_count * 0.02)),
            z: data.p5_path,
            line: { color: "#ef4444", width: 3, dash: "dash" },
            name: "P5",
          },
        ]}
        layout={{
          paper_bgcolor: "#0b0f14",
          font: { color: "#e5e7eb", family: "monospace", size: 10 },
          scene: {
            bgcolor: "#030610",
            xaxis: { title: "Day", gridcolor: "#1a2332", color: "#9ca3af" },
            yaxis: { title: "Sim #", gridcolor: "#1a2332", color: "#9ca3af" },
            zaxis: { title: "Price", gridcolor: "#1a2332", color: "#9ca3af" },
            camera: { eye: { x: 1.8, y: 1.2, z: 0.9 } },
          },
          margin: { t: 10, r: 10, b: 10, l: 10 },
          legend: { x: 0, y: 1, font: { size: 10 } },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", height: "500px" }}
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MonteCarloPage() {
  const [activeTab, setActiveTab] = useState("simulation");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [simData, setSimData] = useState(null);
  const [probData, setProbData] = useState(null);
  const [sensitivityData, setSensitivityData] = useState(null);
  const [data3D, setData3D] = useState(null);
  const [estimatedParams, setEstimatedParams] = useState(null);

  const [lastParams, setLastParams] = useState(null);

  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const handleRunSimulation = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setLastParams(params);
    setEstimatedParams(null);

    try {
      // Run simulation + probabilities in parallel
      const [simResult, probResult] = await Promise.all([
        apiService.runSimulation(params),
        apiService.getSimulationProbabilities(params),
      ]);
      setSimData(simResult);
      setProbData(probResult);

      // Reset other tabs so they re-fetch if visited
      setSensitivityData(null);
      setData3D(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCsvSimulation = useCallback(async (file, horizonDays, numSimulations) => {
    setLoading(true);
    setError(null);
    setEstimatedParams(null);

    try {
      const result = await apiService.csvSimulate(file, horizonDays, numSimulations);
      setSimData(result.simulation);
      setProbData(result.probabilities);
      setEstimatedParams(result.estimated_params);
      setLastParams({
        start_price: result.estimated_params.start_price,
        annual_drift: result.estimated_params.annual_drift,
        annual_volatility: result.estimated_params.annual_volatility,
        horizon_days: horizonDays,
        num_simulations: numSimulations,
      });
      setSensitivityData(null);
      setData3D(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadSensitivity = useCallback(async () => {
    if (!lastParams || sensitivityData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.runSensitivityAnalysis({
        start_price: lastParams.start_price,
        horizon_days: lastParams.horizon_days,
        volatility_levels: [
          lastParams.annual_volatility * 0.5,
          lastParams.annual_volatility,
          lastParams.annual_volatility * 1.5,
        ],
        drift_levels: [
          -Math.abs(lastParams.annual_drift),
          lastParams.annual_drift,
          lastParams.annual_drift * 2,
        ],
        vol_labels: ["Low Vol", "Base Vol", "High Vol"],
        drift_labels: ["Bearish", "Neutral", "Bullish"],
        num_simulations: 5000,
      });
      setSensitivityData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lastParams, sensitivityData]);

  const handleLoad3D = useCallback(async () => {
    if (!lastParams || data3D) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getSimulationPaths3D({
        ...lastParams,
        sample_count: 500,
      });
      setData3D(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lastParams, data3D]);

  const tabs = [
    { key: "simulation", label: "Simulation" },
    { key: "probability", label: "Probability" },
    { key: "sensitivity", label: "Sensitivity" },
    { key: "3d", label: "3D View" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#0b0f14] text-gray-100 px-2 sm:px-3 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center py-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Vision Lab</h1>
          <p className="text-gray-400">Real-Time Computer Vision in Action</p>
        </div>
        <div className="text-xl font-semibold text-white tracking-wide">
          SIMULATION LAB
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="px-3 py-2 rounded-md border border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="grid grid-cols-12 gap-6 mt-8 flex-1">
        {/* Sidebar */}
        <aside className="col-span-2">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">Features</h2>
          <nav className="space-y-1">
            <Link
              to="/features/object-detection"
              className={`block px-3 py-2 rounded-md ${
                isActive("/features/object-detection")
                  ? "bg-gray-800 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Object Detection
            </Link>
            <Link
              to="/features/facial-recognition"
              className={`block px-3 py-2 rounded-md ${
                isActive("/features/facial-recognition")
                  ? "bg-gray-800 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Facial Recognition
            </Link>
            <Link
              to="/features/gesture-control"
              className={`block px-3 py-2 rounded-md ${
                isActive("/features/gesture-control")
                  ? "bg-gray-800 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Gesture Control
            </Link>
            <Link
              to="/features/image-segmentation"
              className={`block px-3 py-2 rounded-md ${
                isActive("/features/image-segmentation")
                  ? "bg-gray-800 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Image Segmentation
            </Link>
            <Link
              to="/features/monte-carlo"
              className={`block px-3 py-2 rounded-md ${
                isActive("/features/monte-carlo")
                  ? "bg-gray-800 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Monte Carlo Sim
            </Link>
          </nav>

          {/* Parameter Form */}
          <div className="mt-6 p-4 rounded-lg border border-gray-800 bg-[#111827]">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              GBM Parameters
            </h3>
            <MonteCarloForm onSubmit={handleRunSimulation} onCsvSubmit={handleCsvSimulation} loading={loading} />
          </div>
        </aside>

        {/* Main Panel */}
        <section className="col-span-10 p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "sensitivity") handleLoadSensitivity();
                  if (tab.key === "3d") handleLoad3D();
                }}
                className={`px-4 py-2 text-sm font-medium rounded-t transition ${
                  activeTab === tab.key
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {!simData && !loading && (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg">Configure parameters and run a simulation</p>
              <p className="text-sm mt-1">
                Uses Geometric Brownian Motion with{" "}
                <span className="text-cyan-400 font-mono">
                  P(t+1) = P(t) * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
                </span>
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Running simulations...</p>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {!loading && simData && (
            <>
              {activeTab === "simulation" && (
                <div className="space-y-6">
                  {/* Estimated params from CSV */}
                  {estimatedParams && (
                    <div className="bg-cyan-900/15 border border-cyan-800/40 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-cyan-400 mb-2">Parameters Estimated from CSV</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Start Price: </span>
                          <span className="text-gray-100 font-medium">{estimatedParams.start_price?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Annual Drift: </span>
                          <span className="text-gray-100 font-medium">{(estimatedParams.annual_drift * 100)?.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Annual Vol: </span>
                          <span className="text-gray-100 font-medium">{(estimatedParams.annual_volatility * 100)?.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Data Points: </span>
                          <span className="text-gray-100 font-medium">{estimatedParams.data_points}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                      { label: "Expected", value: simData.expected_price?.toFixed(2), color: "text-cyan-400" },
                      { label: "Median", value: simData.median_price?.toFixed(2), color: "text-gray-100" },
                      { label: "P5", value: simData.percentiles?.P5?.toFixed(2), color: "text-red-400" },
                      { label: "P95", value: simData.percentiles?.P95?.toFixed(2), color: "text-green-400" },
                      { label: "Std Dev", value: simData.std_dev?.toFixed(2), color: "text-yellow-400" },
                      { label: "Time", value: `${simData.processing_time}s`, color: "text-gray-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#0f172a] rounded-lg p-3 border border-gray-800">
                        <div className="text-xs text-gray-500">{s.label}</div>
                        <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <SimulationChart data={simData} />
                  <HistogramChart data={simData} />
                </div>
              )}

              {activeTab === "probability" && (
                <ProbabilityCards data={probData} />
              )}

              {activeTab === "sensitivity" && (
                sensitivityData ? (
                  <SensitivityGrid data={sensitivityData} />
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Loading sensitivity analysis...
                  </p>
                )
              )}

              {activeTab === "3d" && (
                data3D ? (
                  <Simulation3DViewer data={data3D} />
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Loading 3D paths...
                  </p>
                )
              )}
            </>
          )}
        </section>
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}
