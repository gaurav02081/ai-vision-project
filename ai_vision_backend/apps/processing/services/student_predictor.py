import numpy as np
import math


class StudentPerformancePredictor:
    """
    Pure-numpy Logistic Regression that predicts PASS/FAIL.
    No scikit-learn dependency.
    """

    def __init__(self):
        self.weights = None
        self.bias = 0.0
        self.mean = None
        self.std = None
        self._train()

    def _sigmoid(self, z):
        return 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))

    def _generate_synthetic_data(self, n=500):
        rng = np.random.RandomState(42)
        study_hours = rng.uniform(0.5, 10, n)
        attendance = rng.uniform(30, 100, n)
        gpa = rng.uniform(1.0, 4.0, n)
        assignments = rng.uniform(20, 100, n)
        sleep_hours = rng.uniform(3, 10, n)

        score = (
            study_hours * 0.25
            + attendance * 0.03
            + gpa * 0.8
            + assignments * 0.02
            + sleep_hours * 0.15
            + rng.normal(0, 0.5, n)
        )

        threshold = np.percentile(score, 35)
        labels = (score >= threshold).astype(int)
        X = np.column_stack([study_hours, attendance, gpa, assignments, sleep_hours])
        return X, labels

    def _train(self):
        X, y = self._generate_synthetic_data()

        # StandardScaler equivalent
        self.mean = X.mean(axis=0)
        self.std = X.std(axis=0)
        self.std[self.std == 0] = 1.0
        X_scaled = (X - self.mean) / self.std

        # Gradient descent logistic regression
        n_samples, n_features = X_scaled.shape
        self.weights = np.zeros(n_features)
        self.bias = 0.0
        lr = 0.1

        for _ in range(1000):
            z = X_scaled @ self.weights + self.bias
            pred = self._sigmoid(z)
            dw = (1 / n_samples) * (X_scaled.T @ (pred - y))
            db = (1 / n_samples) * np.sum(pred - y)
            self.weights -= lr * dw
            self.bias -= lr * db

    def predict(self, study_hours, attendance, gpa, assignments, sleep_hours):
        features = np.array([[study_hours, attendance, gpa, assignments, sleep_hours]])
        features_scaled = (features - self.mean) / self.std
        z = features_scaled @ self.weights + self.bias
        prob_pass = float(self._sigmoid(z[0]))
        prob_fail = 1.0 - prob_pass
        prediction = 1 if prob_pass >= 0.5 else 0

        return {
            'prediction': 'PASS' if prediction == 1 else 'FAIL',
            'probability': round((prob_pass if prediction == 1 else prob_fail) * 100, 2),
            'pass_probability': round(prob_pass * 100, 2),
            'fail_probability': round(prob_fail * 100, 2),
        }


_predictor = None


def get_predictor():
    global _predictor
    if _predictor is None:
        _predictor = StudentPerformancePredictor()
    return _predictor
