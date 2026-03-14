import numpy as np
import time


class MonteCarloSimulator:
    """
    Geometric Brownian Motion Monte Carlo simulator.

    Price(t+1) = Price(t) * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
    where Z ~ N(0,1)
    """

    def run_simulation(self, start_price, annual_drift, annual_volatility,
                       horizon_days, num_simulations=10000):
        """
        Run GBM Monte Carlo simulation.

        Returns dict with simulation results and sampled paths.
        """
        t_start = time.time()

        mu_daily = annual_drift / 252
        sigma_daily = annual_volatility / np.sqrt(252)
        dt = 1  # one trading day

        # Pre-allocate price matrix: (num_simulations, horizon_days + 1)
        prices = np.zeros((num_simulations, horizon_days + 1))
        prices[:, 0] = start_price

        # Vectorised GBM step
        z = np.random.standard_normal((num_simulations, horizon_days))
        drift_component = (mu_daily - 0.5 * sigma_daily ** 2) * dt
        diffusion_component = sigma_daily * np.sqrt(dt) * z

        log_returns = drift_component + diffusion_component
        cumulative = np.cumsum(log_returns, axis=1)
        prices[:, 1:] = start_price * np.exp(cumulative)

        final_prices = prices[:, -1]
        processing_time = round(time.time() - t_start, 4)

        # Percentiles
        percentiles = {
            'P5': float(np.percentile(final_prices, 5)),
            'P10': float(np.percentile(final_prices, 10)),
            'P25': float(np.percentile(final_prices, 25)),
            'P50': float(np.percentile(final_prices, 50)),
            'P75': float(np.percentile(final_prices, 75)),
            'P90': float(np.percentile(final_prices, 90)),
            'P95': float(np.percentile(final_prices, 95)),
        }

        # Confidence band paths (percentile at each time step)
        band_indices = [5, 25, 50, 75, 95]
        bands = {}
        for p in band_indices:
            bands[f'P{p}'] = np.percentile(prices, p, axis=0).tolist()
        mean_path = np.mean(prices, axis=0).tolist()

        # Sample paths for chart rendering (cap at 200)
        sample_count = min(200, num_simulations)
        sample_indices = np.random.choice(num_simulations, sample_count, replace=False)
        sample_paths = prices[sample_indices].tolist()

        return {
            'start_price': float(start_price),
            'expected_price': float(np.mean(final_prices)),
            'median_price': float(np.median(final_prices)),
            'std_dev': float(np.std(final_prices)),
            'min_price': float(np.min(final_prices)),
            'max_price': float(np.max(final_prices)),
            'percentiles': percentiles,
            'bands': bands,
            'mean_path': mean_path,
            'sample_paths': sample_paths,
            'num_simulations': num_simulations,
            'horizon_days': horizon_days,
            'annual_drift': float(annual_drift),
            'annual_volatility': float(annual_volatility),
            'daily_drift': float(mu_daily),
            'daily_volatility': float(sigma_daily),
            'processing_time': processing_time,
        }

    def get_paths_3d(self, start_price, annual_drift, annual_volatility,
                     horizon_days, num_simulations=10000, sample_count=500):
        """
        Generate sampled paths formatted for 3D visualisation.
        Returns x (day), y (sim index), z (price), colour arrays.
        """
        t_start = time.time()

        mu_daily = annual_drift / 252
        sigma_daily = annual_volatility / np.sqrt(252)

        prices = np.zeros((num_simulations, horizon_days + 1))
        prices[:, 0] = start_price

        z = np.random.standard_normal((num_simulations, horizon_days))
        drift = (mu_daily - 0.5 * sigma_daily ** 2)
        log_returns = drift + sigma_daily * z
        cumulative = np.cumsum(log_returns, axis=1)
        prices[:, 1:] = start_price * np.exp(cumulative)

        # Sample paths
        sample_count = min(sample_count, num_simulations)
        indices = np.random.choice(num_simulations, sample_count, replace=False)
        sampled = prices[indices]

        final_prices = sampled[:, -1]

        # Build flat arrays for scatter3d
        x_days = []
        y_sims = []
        z_prices = []
        colors = []

        for i in range(sample_count):
            gained = final_prices[i] > start_price
            for d in range(horizon_days + 1):
                x_days.append(d)
                y_sims.append(i)
                z_prices.append(float(sampled[i, d]))
                colors.append('gain' if gained else 'loss')

        # Mean, P5, P95 paths across all simulations
        mean_path = np.mean(prices, axis=0).tolist()
        p5_path = np.percentile(prices, 5, axis=0).tolist()
        p95_path = np.percentile(prices, 95, axis=0).tolist()

        return {
            'x': x_days,
            'y': y_sims,
            'z': z_prices,
            'colors': colors,
            'mean_path': mean_path,
            'p5_path': p5_path,
            'p95_path': p95_path,
            'start_price': float(start_price),
            'sample_count': sample_count,
            'horizon_days': horizon_days,
            'processing_time': round(time.time() - t_start, 4),
        }
