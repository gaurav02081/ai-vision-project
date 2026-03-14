import io
import csv
import numpy as np
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .services.monte_carlo import MonteCarloSimulator
from .services.probability import ProbabilityAnalyzer
from .services.sensitivity import SensitivityAnalyzer


def parse_csv_prices(file_obj):
    """
    Parse a CSV file with Date,Price columns.
    Returns a list of closing prices in chronological order (oldest first).
    Handles prices with commas like "77,159.25".
    """
    content = file_obj.read()
    if isinstance(content, bytes):
        content = content.decode('utf-8')

    reader = csv.DictReader(io.StringIO(content))

    rows = []
    for row in reader:
        price_str = row.get('Price', '').strip().replace('"', '').replace(',', '')
        if price_str:
            try:
                rows.append(float(price_str))
            except ValueError:
                continue

    # CSV is typically newest-first; reverse to chronological order
    rows.reverse()
    return rows


def estimate_params_from_prices(prices):
    """
    Estimate GBM parameters (mu, sigma) from a list of chronological prices.
    Returns start_price, annual_drift, annual_volatility.
    """
    prices = np.array(prices)
    log_returns = np.diff(np.log(prices))

    mu_daily = float(np.mean(log_returns))
    sigma_daily = float(np.std(log_returns, ddof=1))

    return {
        'start_price': float(prices[-1]),
        'annual_drift': mu_daily * 252,
        'annual_volatility': sigma_daily * np.sqrt(252),
        'daily_drift': mu_daily,
        'daily_volatility': sigma_daily,
        'data_points': len(prices),
        'date_range_days': len(log_returns),
    }


class SimulationViewSet(viewsets.ViewSet):

    @action(detail=False, methods=['post'])
    def csv_simulate(self, request):
        """
        POST /api/simulation/csv_simulate/
        Upload a CSV file with Date,Price columns.
        Backend estimates mu/sigma from historical data and runs simulation.

        Form data:
            file: CSV file (required)
            horizon_days: int (default 30)
            num_simulations: int (default 10000, max 50000)
        """
        try:
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response({'error': 'No CSV file uploaded'},
                                status=status.HTTP_400_BAD_REQUEST)

            if not uploaded_file.name.lower().endswith('.csv'):
                return Response({'error': 'File must be a .csv'},
                                status=status.HTTP_400_BAD_REQUEST)

            horizon_days = int(request.POST.get('horizon_days', 30))
            num_simulations = min(int(request.POST.get('num_simulations', 10000)), 50000)

            # Parse CSV and estimate parameters
            prices = parse_csv_prices(uploaded_file)
            if len(prices) < 10:
                return Response({'error': 'CSV must contain at least 10 price rows'},
                                status=status.HTTP_400_BAD_REQUEST)

            estimated = estimate_params_from_prices(prices)

            # Run simulation with estimated params
            simulator = MonteCarloSimulator()
            sim_results = simulator.run_simulation(
                start_price=estimated['start_price'],
                annual_drift=estimated['annual_drift'],
                annual_volatility=estimated['annual_volatility'],
                horizon_days=horizon_days,
                num_simulations=num_simulations,
            )

            # Run probabilities
            mu_daily = estimated['annual_drift'] / 252
            sigma_daily = estimated['annual_volatility'] / np.sqrt(252)
            z = np.random.standard_normal((num_simulations, horizon_days))
            drift = (mu_daily - 0.5 * sigma_daily ** 2)
            log_returns = drift + sigma_daily * z
            cumulative = np.sum(log_returns, axis=1)
            final_prices = estimated['start_price'] * np.exp(cumulative)

            analyzer = ProbabilityAnalyzer()
            prob_results = analyzer.compute_probabilities(
                estimated['start_price'], final_prices
            )

            return Response({
                'status': 'completed',
                'estimated_params': estimated,
                'simulation': sim_results,
                'probabilities': prob_results,
            })

        except Exception as e:
            return Response({'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def run(self, request):
        """
        POST /api/simulation/run/
        Run a Monte Carlo GBM simulation.

        Body (JSON):
            start_price: float (required)
            annual_drift: float (required, e.g. 0.09 for 9%)
            annual_volatility: float (required, e.g. 0.22 for 22%)
            horizon_days: int (default 30)
            num_simulations: int (default 10000, max 50000)
        """
        try:
            data = request.data
            start_price = float(data.get('start_price', 0))
            annual_drift = float(data.get('annual_drift', 0))
            annual_volatility = float(data.get('annual_volatility', 0))
            horizon_days = int(data.get('horizon_days', 30))
            num_simulations = min(int(data.get('num_simulations', 10000)), 50000)

            if start_price <= 0:
                return Response({'error': 'start_price must be positive'},
                                status=status.HTTP_400_BAD_REQUEST)
            if annual_volatility <= 0:
                return Response({'error': 'annual_volatility must be positive'},
                                status=status.HTTP_400_BAD_REQUEST)
            if horizon_days < 1 or horizon_days > 504:
                return Response({'error': 'horizon_days must be between 1 and 504'},
                                status=status.HTTP_400_BAD_REQUEST)

            simulator = MonteCarloSimulator()
            results = simulator.run_simulation(
                start_price=start_price,
                annual_drift=annual_drift,
                annual_volatility=annual_volatility,
                horizon_days=horizon_days,
                num_simulations=num_simulations,
            )

            return Response({'status': 'completed', **results})

        except (ValueError, TypeError) as e:
            return Response({'error': f'Invalid parameter: {e}'},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def probabilities(self, request):
        """
        POST /api/simulation/probabilities/
        Run simulation and return probability dashboard data.

        Body (JSON):
            start_price, annual_drift, annual_volatility, horizon_days,
            num_simulations, custom_levels (optional list of price levels)
        """
        try:
            data = request.data
            start_price = float(data.get('start_price', 0))
            annual_drift = float(data.get('annual_drift', 0))
            annual_volatility = float(data.get('annual_volatility', 0))
            horizon_days = int(data.get('horizon_days', 30))
            num_simulations = min(int(data.get('num_simulations', 10000)), 50000)
            custom_levels = data.get('custom_levels', [])

            if start_price <= 0:
                return Response({'error': 'start_price must be positive'},
                                status=status.HTTP_400_BAD_REQUEST)

            # Run full simulation to get all final prices (not just sample)
            simulator = MonteCarloSimulator()
            mu_daily = annual_drift / 252
            sigma_daily = annual_volatility / np.sqrt(252)

            z = np.random.standard_normal((num_simulations, horizon_days))
            drift = (mu_daily - 0.5 * sigma_daily ** 2)
            log_returns = drift + sigma_daily * z
            cumulative = np.sum(log_returns, axis=1)
            final_prices = start_price * np.exp(cumulative)

            analyzer = ProbabilityAnalyzer()
            prob_results = analyzer.compute_probabilities(
                start_price, final_prices, custom_levels
            )

            return Response({'status': 'completed', **prob_results})

        except (ValueError, TypeError) as e:
            return Response({'error': f'Invalid parameter: {e}'},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def sensitivity(self, request):
        """
        POST /api/simulation/sensitivity/
        Run sensitivity grid analysis.

        Body (JSON):
            start_price: float
            horizon_days: int
            volatility_levels: list of floats (e.g. [0.12, 0.20, 0.30])
            drift_levels: list of floats (e.g. [-0.05, 0.09, 0.15])
            vol_labels: optional list of strings
            drift_labels: optional list of strings
            num_simulations: int (default 5000, max 20000)
        """
        try:
            data = request.data
            start_price = float(data.get('start_price', 0))
            horizon_days = int(data.get('horizon_days', 30))
            volatility_levels = [float(v) for v in data.get('volatility_levels', [0.12, 0.20, 0.30])]
            drift_levels = [float(d) for d in data.get('drift_levels', [-0.05, 0.09, 0.15])]
            vol_labels = data.get('vol_labels')
            drift_labels = data.get('drift_labels')
            num_simulations = min(int(data.get('num_simulations', 5000)), 20000)

            if start_price <= 0:
                return Response({'error': 'start_price must be positive'},
                                status=status.HTTP_400_BAD_REQUEST)

            analyzer = SensitivityAnalyzer()
            results = analyzer.run_grid(
                start_price=start_price,
                horizon_days=horizon_days,
                volatility_levels=volatility_levels,
                drift_levels=drift_levels,
                vol_labels=vol_labels,
                drift_labels=drift_labels,
                num_simulations=num_simulations,
            )

            return Response({'status': 'completed', **results})

        except (ValueError, TypeError) as e:
            return Response({'error': f'Invalid parameter: {e}'},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def paths3d(self, request):
        """
        POST /api/simulation/paths3d/
        Generate 3D scatter data for Monte Carlo paths.

        Body (JSON):
            start_price, annual_drift, annual_volatility, horizon_days,
            num_simulations (default 10000), sample_count (default 500, max 1000)
        """
        try:
            data = request.data
            start_price = float(data.get('start_price', 0))
            annual_drift = float(data.get('annual_drift', 0))
            annual_volatility = float(data.get('annual_volatility', 0))
            horizon_days = int(data.get('horizon_days', 30))
            num_simulations = min(int(data.get('num_simulations', 10000)), 50000)
            sample_count = min(int(data.get('sample_count', 500)), 1000)

            if start_price <= 0:
                return Response({'error': 'start_price must be positive'},
                                status=status.HTTP_400_BAD_REQUEST)

            simulator = MonteCarloSimulator()
            results = simulator.get_paths_3d(
                start_price=start_price,
                annual_drift=annual_drift,
                annual_volatility=annual_volatility,
                horizon_days=horizon_days,
                num_simulations=num_simulations,
                sample_count=sample_count,
            )

            return Response({'status': 'completed', **results})

        except (ValueError, TypeError) as e:
            return Response({'error': f'Invalid parameter: {e}'},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
