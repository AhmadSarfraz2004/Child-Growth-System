# AI-Based Child Growth Assessment, Recommendation & Weekly Progress Monitoring System

## Project Overview

This project is an AI-based web application designed to help parents monitor and assess the growth status of their children. Parents can create an account, manage their profile, add multiple children, enter growth-related data, and receive AI-based growth predictions with personalized recommendations.

The system also provides weekly routine tracking, where parents can enter a child’s daily routine for one week. Based on this data, the AI system analyzes whether the child’s progress is improving, showing no significant change, or getting worse.

A Super Admin dashboard is also included to view overall system statistics such as total registered users, total children, growth status counts, and weekly progress statistics. The admin does not access personal child details.

---

## Project Title

**AI-Based Child Growth Assessment, Recommendation & Weekly Progress Monitoring System**

---

## Main Features

### Parent/User Features

- User registration and login
- Manage parent profile
- Add multiple child profiles
- Enter child growth data
- Get AI-based growth status prediction
- Get personalized recommendations
- Enter weekly child routine
- Track weekly progress
- View child growth history and previous records

### AI Features

- Growth status prediction
- Weekly progress prediction
- Recommendation generation

### Super Admin Features

- View total registered users
- View total child profiles
- View growth status statistics
- View weekly progress statistics
- View system-level dashboard analytics
- No access to personal child details

---

## AI Prediction Outputs

### Growth Status Prediction

The system predicts one of the following growth statuses:

- Underdeveloped
- Normal Growth
- Above Average

### Weekly Progress Prediction

The system predicts one of the following weekly progress statuses:

- Improving
- No Significant Change
- Getting Worse

### Recommendation Categories

The system provides recommendations such as:

- Improve Nutrition
- Improve Sleep
- Increase Physical Activity
- Reduce Screen Time
- Increase Water Intake
- Maintain Current Routine
- Consult Pediatrician
- Weight Management

---

## Tech Stack

### Frontend

- React.js
- React Router
- Axios
- Chart.js or Recharts

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- CORS
- dotenv

### AI Service

- Python
- Google Colab
- Scikit-learn
- Pandas
- NumPy
- FastAPI or Flask
- Pickle model files

### Database

- MongoDB Local / MongoDB Atlas

---

## AI Service And Backend Prediction Test

### Install dependencies

```bash
cd ai-service
python -m pip install -r requirements.txt

cd ../backend
npm install
```

### Run AI service

```bash
cd ai-service
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Run backend

```bash
cd backend
npm run dev
```

### Test AI service directly

```text
POST http://localhost:8000/predict/growth-status
```

```json
{
  "age": 5,
  "gender": "Male",
  "height": 110,
  "weight": 18,
  "bmi": 14.9
}
```

### Predict and save record through backend

```text
POST http://localhost:5000/api/growth/predict
Authorization: Bearer <your_login_token>
Content-Type: application/json
```

```json
{
  "age": 5,
  "gender": "Male",
  "height": 110,
  "weight": 18,
  "bmi": 14.9
}
```

Expected response:

```json
{
  "success": true,
  "message": "Growth status predicted and saved successfully",
  "data": {
    "growthStatus": "Normal Growth",
    "record": {
      "_id": "mongo_record_id_here",
      "age": 5,
      "gender": "Male",
      "height": 110,
      "weight": 18,
      "bmi": 14.9,
      "growthStatus": "Normal Growth",
      "createdAt": "date_here"
    }
  }
}
```

### Get growth history

```text
GET http://localhost:5000/api/growth/history
Authorization: Bearer <your_login_token>
```

Expected response:

```json
{
  "success": true,
  "message": "Growth history fetched successfully",
  "data": [
    {
      "_id": "record_id",
      "age": 5,
      "gender": "Male",
      "height": 110,
      "weight": 18,
      "bmi": 14.9,
      "growthStatus": "Normal Growth",
      "createdAt": "date_here"
    }
  ]
}
```

### Get one child's growth history

```text
GET http://localhost:5000/api/growth/history/<childId>
Authorization: Bearer <your_login_token>
```

---

## Project Structure

```text
Child-Growth-System/
│
├── frontend/
│
├── backend/
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │
│   ├── middleware/
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Child.js
│   │   ├── GrowthRecord.js
│   │   ├── WeeklyRoutineRecord.js
│   │   └── RecommendationRecord.js
│   │
│   ├── routes/
│   │
│   ├── services/
│   │
│   ├── utils/
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── ai-service/
│
├── docs/
│
└── README.md
