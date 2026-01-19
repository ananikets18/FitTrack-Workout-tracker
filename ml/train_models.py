"""
ML Model Training Pipeline for FitTrack
========================================
This script trains machine learning models using collected user data.

Requirements:
- Python 3.8+
- scikit-learn
- pandas
- numpy
- joblib (for model serialization)

Install: pip install scikit-learn pandas numpy joblib supabase

Usage:
    python train_models.py --model workout_success
    python train_models.py --model recovery_time
    python train_models.py --model weight_progression
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error, r2_score
import joblib
import json
from datetime import datetime
import argparse

# ============================================
# 1. WORKOUT SUCCESS PREDICTOR
# ============================================

class WorkoutSuccessPredictor:
    """
    Predicts whether a user will complete their planned workout
    based on sleep, nutrition, and fatigue data.
    
    Model: Random Forest Classifier
    Target: workout_completed (binary: 0 or 1)
    """
    
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.feature_names = [
            'sleep_hours',
            'sleep_quality',
            'calories',
            'protein',
            'fatigue_score',
            'days_since_rest',
            'planned_volume',
            'readiness_score',
            'injury_risk_score'
        ]
    
    def prepare_data(self, df):
        """Prepare features and target from dataframe"""
        X = df[self.feature_names].fillna(df[self.feature_names].median())
        y = df['workout_completed'].astype(int)
        return X, y
    
    def train(self, df):
        """Train the model"""
        X, y = self.prepare_data(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\n{'='*50}")
        print("WORKOUT SUCCESS PREDICTOR - Training Results")
        print(f"{'='*50}")
        print(f"Accuracy: {accuracy:.2%}")
        print(f"Training samples: {len(X_train)}")
        print(f"Test samples: {len(X_test)}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, 
                                    target_names=['Failed', 'Completed']))
        
        # Feature importance
        importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nFeature Importance:")
        print(importance.to_string(index=False))
        
        return {
            'accuracy': accuracy,
            'feature_importance': importance.to_dict('records')
        }
    
    def predict(self, features):
        """Predict workout completion probability"""
        features_scaled = self.scaler.transform([features])
        probability = self.model.predict_proba(features_scaled)[0][1]
        return {
            'will_complete': probability > 0.5,
            'probability': float(probability),
            'confidence': abs(probability - 0.5) * 2  # 0 to 1
        }
    
    def save(self, path='models/workout_success_model.pkl'):
        """Save model to disk"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'trained_at': datetime.now().isoformat()
        }, path)
        print(f"\n✅ Model saved to {path}")


# ============================================
# 2. RECOVERY TIME PREDICTOR
# ============================================

class RecoveryTimePredictor:
    """
    Predicts personalized recovery time for each muscle group
    based on workout intensity, sleep, and nutrition.
    
    Model: Random Forest Regressor
    Target: actual_recovery_days (continuous)
    """
    
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.feature_names = [
            'workout_volume',
            'workout_intensity',
            'sleep_quality',
            'nutrition_quality'
        ]
        # One-hot encode muscle groups
        self.muscle_groups = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core']
    
    def prepare_data(self, df):
        """Prepare features with one-hot encoding"""
        # One-hot encode muscle groups
        muscle_dummies = pd.get_dummies(df['muscle_group'], prefix='muscle')
        
        # Combine features
        X = pd.concat([
            df[self.feature_names].fillna(df[self.feature_names].median()),
            muscle_dummies
        ], axis=1)
        
        y = df['actual_recovery_days']
        
        return X, y
    
    def train(self, df):
        """Train the model"""
        X, y = self.prepare_data(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"\n{'='*50}")
        print("RECOVERY TIME PREDICTOR - Training Results")
        print(f"{'='*50}")
        print(f"R² Score: {r2:.3f}")
        print(f"RMSE: {np.sqrt(mse):.2f} days")
        print(f"Training samples: {len(X_train)}")
        
        return {
            'r2_score': r2,
            'rmse': np.sqrt(mse)
        }
    
    def predict(self, features):
        """Predict recovery time"""
        features_scaled = self.scaler.transform([features])
        days = self.model.predict(features_scaled)[0]
        return {
            'recovery_days': float(days),
            'recovery_hours': float(days * 24)
        }
    
    def save(self, path='models/recovery_time_model.pkl'):
        """Save model"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'muscle_groups': self.muscle_groups,
            'trained_at': datetime.now().isoformat()
        }, path)
        print(f"\n✅ Model saved to {path}")


# ============================================
# 3. WEIGHT PROGRESSION PREDICTOR
# ============================================

class WeightProgressionPredictor:
    """
    Predicts optimal weight increase for each exercise
    based on user's history and current performance.
    
    Model: Random Forest Regressor
    Target: optimal_weight_increase (continuous)
    """
    
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=8,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.feature_names = [
            'previous_weight',
            'reps_achieved',
            'target_reps',
            'form_quality'
        ]
    
    def prepare_data(self, df):
        """Prepare features"""
        # Only use successful progressions for training
        df_success = df[df['successful'] == True].copy()
        
        X = df_success[self.feature_names].fillna(df_success[self.feature_names].median())
        y = df_success['weight_increase']
        
        return X, y
    
    def train(self, df):
        """Train the model"""
        X, y = self.prepare_data(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"\n{'='*50}")
        print("WEIGHT PROGRESSION PREDICTOR - Training Results")
        print(f"{'='*50}")
        print(f"R² Score: {r2:.3f}")
        print(f"RMSE: {np.sqrt(mse):.2f} kg")
        print(f"Training samples: {len(X_train)}")
        
        return {
            'r2_score': r2,
            'rmse': np.sqrt(mse)
        }
    
    def predict(self, features):
        """Predict optimal weight increase"""
        features_scaled = self.scaler.transform([features])
        increase = self.model.predict(features_scaled)[0]
        return {
            'recommended_increase': float(increase),
            'new_weight': float(features[0] + increase)
        }
    
    def save(self, path='models/weight_progression_model.pkl'):
        """Save model"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'trained_at': datetime.now().isoformat()
        }, path)
        print(f"\n✅ Model saved to {path}")


# ============================================
# MAIN TRAINING SCRIPT
# ============================================

def load_data_from_csv(filepath):
    """Load training data from CSV"""
    return pd.read_csv(filepath)

def train_workout_success_model(data_path):
    """Train workout success predictor"""
    print("\n🤖 Training Workout Success Predictor...")
    df = load_data_from_csv(data_path)
    
    predictor = WorkoutSuccessPredictor()
    metrics = predictor.train(df)
    predictor.save()
    
    return predictor, metrics

def train_recovery_model(data_path):
    """Train recovery time predictor"""
    print("\n🤖 Training Recovery Time Predictor...")
    df = load_data_from_csv(data_path)
    
    predictor = RecoveryTimePredictor()
    metrics = predictor.train(df)
    predictor.save()
    
    return predictor, metrics

def train_progression_model(data_path):
    """Train weight progression predictor"""
    print("\n🤖 Training Weight Progression Predictor...")
    df = load_data_from_csv(data_path)
    
    predictor = WeightProgressionPredictor()
    metrics = predictor.train(df)
    predictor.save()
    
    return predictor, metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train FitTrack ML Models')
    parser.add_argument('--model', type=str, required=True,
                       choices=['workout_success', 'recovery_time', 'weight_progression', 'all'],
                       help='Which model to train')
    parser.add_argument('--data', type=str, required=True,
                       help='Path to training data CSV file')
    
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print("FitTrack ML Model Training Pipeline")
    print(f"{'='*60}")
    
    if args.model == 'workout_success' or args.model == 'all':
        train_workout_success_model(args.data)
    
    if args.model == 'recovery_time' or args.model == 'all':
        train_recovery_model(args.data)
    
    if args.model == 'weight_progression' or args.model == 'all':
        train_progression_model(args.data)
    
    print(f"\n{'='*60}")
    print("✅ Training Complete!")
    print(f"{'='*60}\n")
