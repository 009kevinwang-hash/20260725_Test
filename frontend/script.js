
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictionForm');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // 阻止表單默認提交行為

        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // 處理特殊資料類型
        data.Pclass = parseInt(data.Pclass);
        data.Age = parseFloat(data.Age);
        data.SibSp = parseInt(data.SibSp);
        data.Parch = parseInt(data.Parch);
        data.Fare = parseFloat(data.Fare);

        resultDiv.innerHTML = '<p>正在預測中...</p>';
        resultDiv.style.backgroundColor = '#e9ecef';
        resultDiv.style.color = '#333';

        try {
            // 替換為您的 FastAPI 部署 URL
            // 如果在本地測試，可以使用 'http://127.0.0.1:8000/predict'
            // 如果部署到 Render，使用 Render 提供的外部 URL
            const response = await fetch('https://titanic-fastapi-backend.onrender.com/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '預測失敗，請檢查輸入。');
            }

            const result = await response.json();
            const predictionText = result.prediction === 'Survived' ? '存活' : '死亡';
            const probability = (result.probability_survived * 100).toFixed(2);

            resultDiv.innerHTML = `<p>預測結果: <b>${predictionText}</b> (機率: ${probability}%)</p>`;
            if (result.prediction === 'Survived') {
                resultDiv.style.backgroundColor = '#d4edda'; // 淺綠色
                resultDiv.style.color = '#155724'; // 深綠色
            } else {
                resultDiv.style.backgroundColor = '#f8d7da'; // 淺紅色
                resultDiv.style.color = '#721c24'; // 深紅色
            }

        } catch (error) {
            console.error('API 呼叫錯誤:', error);
            resultDiv.innerHTML = `<p style="color: red;">錯誤: ${error.message}</p>`;
            resultDiv.style.backgroundColor = '#f8d7da';
            resultDiv.style.color = '#721c24';
        }
    });

    resultDiv.innerHTML = '<p>請輸入乘客資訊並點擊預測。</p>';
});
