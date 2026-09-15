import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score

# Ensure the model directory exists
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "backend", "model")
os.makedirs(MODEL_DIR, exist_ok=True)

# Load data
DATA_PATH = os.path.join(BASE_DIR, "data", "delaney_solubility_with_descriptors.csv")
df = pd.read_csv(DATA_PATH)

X = df.drop('logS', axis=1)
y = df['logS']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=100)

# Define models
models = {
    "lr": {
        "name": "Linear Regression",
        "model": LinearRegression(),
        "filename": "linear_regression_model.pkl"
    },
    "rf": {
        "name": "Random Forest",
        "model": RandomForestRegressor(max_depth=10, n_estimators=100, random_state=100),
        "filename": "random_forest_model.pkl"
    },
    "gb": {
        "name": "Gradient Boosting",
        "model": GradientBoostingRegressor(n_estimators=100, random_state=100),
        "filename": "gradient_boosting_model.pkl"
    }
}

# Cross validation setup
kf = KFold(n_splits=5, shuffle=True, random_state=100)

print("Training Models and Evaluating...\n")

for key, config in models.items():
    model = config["model"]
    name = config["name"]
    filename = config["filename"]
    
    # Cross validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=kf, scoring='r2')
    print(f"[{name}]")
    print(f"  CV R2 Scores: {cv_scores}")
    print(f"  CV Mean R2: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})")
    
    # Train on full train set and test on test set
    model.fit(X_train, y_train)
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    
    print(f"  Train R2: {train_r2:.4f}")
    print(f"  Test R2:  {test_r2:.4f}")
    
    # Save the model
    save_path = os.path.join(MODEL_DIR, filename)
    joblib.dump(model, save_path)
    print(f"  Saved model to {save_path}\n")

print("All models trained and saved successfully.")
