import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler


class StudentPerformancePredictor:
    """
    Logistic Regression model that predicts PASS/FAIL
    based on student study behavior features.
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self._train()

    def _generate_synthetic_data(self, n=500):
        """Generate synthetic student data with realistic correlations."""
        rng = np.random.RandomState(42)

        study_hours = rng.uniform(0.5, 10, n)
        attendance = rng.uniform(30, 100, n)
        gpa = rng.uniform(1.0, 4.0, n)
        assignments = rng.uniform(20, 100, n)
        sleep_hours = rng.uniform(3, 10, n)

        # Score formula: weighted combination + noise
        score = (
            study_hours * 0.25
            + attendance * 0.03
            + gpa * 0.8
            + assignments * 0.02
            + sleep_hours * 0.15
            + rng.normal(0, 0.5, n)
        )

        # Threshold for pass/fail
        threshold = np.percentile(score, 35)
        labels = (score >= threshold).astype(int)

        X = np.column_stack([study_hours, attendance, gpa, assignments, sleep_hours])
        return X, labels

    def _train(self):
        X, y = self._generate_synthetic_data()
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        self.model = LogisticRegression(random_state=42, max_iter=1000)
        self.model.fit(X_scaled, y)

    def predict(self, study_hours, attendance, gpa, assignments, sleep_hours):
        features = np.array([[study_hours, attendance, gpa, assignments, sleep_hours]])
        features_scaled = self.scaler.transform(features)
        prediction = self.model.predict(features_scaled)[0]
        probability = self.model.predict_proba(features_scaled)[0]

        return {
            'prediction': 'PASS' if prediction == 1 else 'FAIL',
            'probability': round(float(probability[prediction]) * 100, 2),
            'pass_probability': round(float(probability[1]) * 100, 2),
            'fail_probability': round(float(probability[0]) * 100, 2),
        }


# Singleton instance — trained once at import time
_predictor = None


def get_predictor():
    global _predictor
    if _predictor is None:
        _predictor = StudentPerformancePredictor()
    return _predictor
