import numpy as np
from .monte_carlo import MonteCarloSimulator


class SensitivityAnalyzer:
    """Run Monte Carlo across a parameter grid and return comparative results."""

    def __init__(self):
        self.simulator = MonteCarloSimulator()

    def run_grid(self, start_price, horizon_days,
                 volatility_levels, drift_levels,
                 vol_labels=None, drift_labels=None,
                 num_simulations=5000):
        """
        Run simulations for every combination of volatility and drift.

        volatility_levels: list of annual volatility values (e.g. [0.12, 0.20, 0.30])
        drift_levels: list of annual drift values (e.g. [-0.05, 0.09, 0.15])

        Returns a grid of summary results.
        """
        if vol_labels is None:
            vol_labels = [f'{v*100:.0f}%' for v in volatility_levels]
        if drift_labels is None:
            drift_labels = [f'{d*100:.1f}%' for d in drift_levels]

        grid = []

        for vi, vol in enumerate(volatility_levels):
            row = []
            for di, drift in enumerate(drift_levels):
                result = self.simulator.run_simulation(
                    start_price=start_price,
                    annual_drift=drift,
                    annual_volatility=vol,
                    horizon_days=horizon_days,
                    num_simulations=num_simulations,
                )

                final_prices = [p[-1] for p in result['sample_paths']]
                final_arr = np.array(final_prices)
                n = len(final_arr)

                row.append({
                    'vol_label': vol_labels[vi],
                    'drift_label': drift_labels[di],
                    'annual_volatility': float(vol),
                    'annual_drift': float(drift),
                    'expected_price': result['expected_price'],
                    'median_price': result['median_price'],
                    'p5': result['percentiles']['P5'],
                    'p95': result['percentiles']['P95'],
                    'prob_gain': float(np.sum(final_arr > start_price) / n * 100),
                    'prob_loss': float(np.sum(final_arr < start_price) / n * 100),
                    'std_dev': result['std_dev'],
                    'mean_path': result['mean_path'],
                    'bands': result['bands'],
                })
            grid.append(row)

        return {
            'start_price': float(start_price),
            'horizon_days': horizon_days,
            'vol_labels': vol_labels,
            'drift_labels': drift_labels,
            'grid': grid,
        }
