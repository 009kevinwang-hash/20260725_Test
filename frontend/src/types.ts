export interface PassengerData {
  Pclass: number;
  Sex: string;
  Age: number;
  SibSp: number;
  Parch: number;
  Fare: number;
  Embarked: string;
  Name: string;
}

export interface PredictionResult {
  prediction: string;
  probability_survived: number;
  probability_not_survived: number;
}

export interface HealthStatus {
  status: string;
  model: string;
}
