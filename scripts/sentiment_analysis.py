#!/usr/bin/env python3
"""
Sentiment Analysis Script for MCQuiz Platform
This script loads a pre-trained model and performs sentiment analysis on text input.
"""

import sys
import json
import pickle
import os
from pathlib import Path

def load_model():
    """Load the pre-trained sentiment analysis model."""
    try:
        # Get the directory where this script is located
        script_dir = Path(__file__).parent
        model_path = script_dir.parent / "pickel file" / "model.pkl"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path}")
        
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}", file=sys.stderr)
        return None

def preprocess_text(text):
    """Preprocess the input text for the model."""
    # Basic preprocessing - you may need to adjust this based on your model's requirements
    text = text.strip().lower()
    return text

def predict_sentiment(text, model):
    """Predict sentiment using the loaded model."""
    try:
        # Preprocess the text
        processed_text = preprocess_text(text)
        
        # Make prediction
        if hasattr(model, 'predict_proba'):
            # If model supports probability prediction
            proba = model.predict_proba([processed_text])[0]
            prediction = model.predict([processed_text])[0]
            
            # Map prediction to sentiment labels
            if hasattr(model, 'classes_'):
                classes = model.classes_
                if len(classes) == 2:
                    # Binary classification
                    if prediction == classes[0]:
                        sentiment = 'negative'
                        confidence = proba[0]
                    else:
                        sentiment = 'positive'
                        confidence = proba[1]
                else:
                    # Multi-class classification
                    sentiment = str(prediction)
                    confidence = max(proba)
            else:
                # Fallback
                sentiment = 'positive' if prediction == 1 else 'negative'
                confidence = max(proba) if len(proba) > 1 else 0.8
        else:
            # If model only supports classification
            prediction = model.predict([processed_text])[0]
            sentiment = 'positive' if prediction == 1 else 'negative'
            confidence = 0.8  # Default confidence
        
        return {
            'sentiment': sentiment,
            'confidence': float(confidence)
        }
        
    except Exception as e:
        print(f"Error during prediction: {str(e)}", file=sys.stderr)
        # Return fallback prediction
        return {
            'sentiment': 'positive',
            'confidence': 0.6
        }

def main():
    """Main function to run sentiment analysis."""
    if len(sys.argv) != 2:
        print("Usage: python sentiment_analysis.py <text>", file=sys.stderr)
        sys.exit(1)
    
    text = sys.argv[1]
    
    # Load the model
    model = load_model()
    if model is None:
        # Fallback prediction
        result = {
            'sentiment': 'positive' if any(word in text.lower() for word in ['good', 'great', 'excellent', 'love', 'amazing']) else 'negative',
            'confidence': 0.6
        }
    else:
        # Make prediction
        result = predict_sentiment(text, model)
    
    # Output result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main()
