import numpy as np


class ProbabilityAnalyzer:
    """Compute probability metrics from Monte Carlo simulation results."""

    def compute_probabilities(self, start_price, final_prices, custom_levels=None):
        """
        Given an array of final simulated prices, compute key probabilities.

        custom_levels: list of price levels to compute P(above) for.
        """
        final = np.array(final_prices)
        n = len(final)

        results = {
            'total_simulations': n,
            'probabilities': {
                'price_increase': float(np.sum(final > start_price) / n * 100),
                'price_decrease': float(np.sum(final < start_price) / n * 100),
                'gain_2pct': float(np.sum(final > start_price * 1.02) / n * 100),
                'loss_2pct': float(np.sum(final < start_price * 0.98) / n * 100),
                'gain_5pct': float(np.sum(final > start_price * 1.05) / n * 100),
                'loss_5pct': float(np.sum(final < start_price * 0.95) / n * 100),
                'gain_10pct': float(np.sum(final > start_price * 1.10) / n * 100),
                'loss_10pct': float(np.sum(final < start_price * 0.90) / n * 100),
            },
            'risk_metrics': {
                'var_95': float(start_price - np.percentile(final, 5)),
                'var_99': float(start_price - np.percentile(final, 1)),
                'expected_shortfall_95': float(
                    start_price - np.mean(final[final <= np.percentile(final, 5)])
                ),
                'max_drawdown_median': float(
                    (start_price - np.percentile(final, 50)) / start_price * 100
                ) if np.percentile(final, 50) < start_price else 0.0,
            },
            'custom_levels': [],
        }

        if custom_levels:
            for level in custom_levels:
                level_val = float(level)
                results['custom_levels'].append({
                    'level': level_val,
                    'prob_above': float(np.sum(final > level_val) / n * 100),
                    'prob_below': float(np.sum(final < level_val) / n * 100),
                })

        return results

    def compute_from_simulation(self, sim_results, custom_levels=None):
        """
        Convenience wrapper: re-run minimal sim to extract final prices,
        or accept pre-computed sample_paths.
        """
        start_price = sim_results['start_price']
        # Extract final prices from sample paths
        final_prices = [path[-1] for path in sim_results['sample_paths']]
        return self.compute_probabilities(start_price, final_prices, custom_levels)
