
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import json
import numpy as np
import re

app = FastAPI()

# Pydantic 模型用於請求體驗證
class PassengerData(BaseModel):
    Pclass: int
    Sex: str
    Age: float
    SibSp: int
    Parch: int
    Fare: float
    Embarked: str
    Name: str

# 啟動時載入模型和元資料
model = joblib.load('titanic_best_model.pkl')
with open('model_metadata.json', 'r', encoding='utf-8') as f:
    metadata = json.load(f)

@app.post('/predict')
async def predict_survival(data: PassengerData):
    try:
        # 前處理（與 preprocess_and_predict 相同邏輯）
        title_match = re.search(r' ([A-Za-z]+)\.', data.Name)
        title = title_match.group(1) if title_match else 'Mr'
        title_encoded = metadata['title_mapping'].get(title, 4)
        
        sex_encoded = 1 if data.Sex == 'female' else 0
        
        emb_map = {'S': 0, 'C': 1, 'Q': 2}
        embarked_encoded = emb_map.get(data.Embarked, 0)
        
        family_size = data.SibSp + data.Parch + 1
        is_alone = 1 if family_size == 1 else 0
        
        age = data.Age if data.Age else metadata['age_median']
        if age <= 5: age_band = 0
        elif age <= 12: age_band = 1
        elif age <= 18: age_band = 2
        elif age <= 35: age_band = 3
        elif age <= 60: age_band = 4
        else: age_band = 5

        is_child = 1 if age < 12 else 0
        
        fare = data.Fare
        fare_log = np.log1p(fare)
        if fare <= 7.91: fare_band = 0
        elif fare <= 14.45: fare_band = 1
        elif fare <= 31.0: fare_band = 2
        else: fare_band = 3
        
        name_length = len(data.Name)

        # 組裝特徵向量
        feature_vector = [[
            data.Pclass, sex_encoded, age, data.SibSp, data.Parch,
            fare, embarked_encoded, title_encoded, family_size, is_alone,
            age_band, is_child, fare_band, fare_log, name_length
        ]]

        # 預測
        prediction = model.predict(feature_vector)[0]
        probability = model.predict_proba(feature_vector)[0]

        return {
            'prediction': 'Survived' if prediction == 1 else 'Not Survived',
            'probability_survived': round(float(probability[1]), 4),
            'probability_not_survived': round(float(probability[0]), 4)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get('/health')
async def health_check():
    return {'status': 'healthy', 'model': metadata['model_name']}
