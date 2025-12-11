# YakTime - Healthcare App

A healthcare web application for managing daily supplements and tracking weight changes.

## Features

- User registration and login/logout (password hash+salt processing)
- Weight recording and history viewing
- Target weight setting and tracking
- Supplement list creation and management
- Food nutrition check using USDA FoodData Central API

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **View Engine**: EJS
- **Authentication**: Express Session
- **Password Security**: bcrypt (hash + salt)

## Installation and Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

**Important:** Before running the application, create the database user:
```sql
CREATE USER 'health_app'@'localhost' IDENTIFIED BY 'qwertyuiop';
GRANT ALL PRIVILEGES ON health.* TO 'health_app'@'localhost';
FLUSH PRIVILEGES;
```

The database and tables will be automatically created when you start the server.


### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
HEALTH_HOST=localhost
HEALTH_USER=health_app
HEALTH_PASSWORD=qwertyuiop
HEALTH_DATABASE=health

```

**Note:** The database user `health_app` with password `qwertyuiop` should be created before running the application. The database `health` will be created automatically if it doesn't exist.

### 4. Run Server

```bash
npm start
```

Development mode (with nodemon):

```bash
npm run dev
```

Once the server is running, you can access the application at `http://localhost:8000`.

## Project Structure

```
week10-yaktime/
├── config/
│   └── database.js          # Database connection configuration
├── database/
│   └── insert_test_data.sql # Test data insertion script
├── middleware/
│   └── auth.js             # Authentication middleware
├── public/
│   └── css/
│       └── style.css       # Stylesheet
├── routes/
│   ├── auth.js             # Authentication routes (register, login, logout)
│   ├── dashboard.js        # Dashboard route
│   ├── weight.js           # Weight management route
│   ├── supplements.js      # Supplement management route
│   └── nutrition.js       # Nutrition check route
├── utils/
│   ├── password.js         # Password hashing utility
│   └── usda.js             # USDA API utility
├── views/
│   ├── partials/
│   │   ├── header.ejs      # Header partial template
│   │   └── footer.ejs      # Footer partial template
│   ├── dashboard.ejs       # Dashboard page
│   ├── login.ejs           # Login page
│   ├── register.ejs        # Registration page
│   ├── supplements.ejs     # Supplement management page
│   ├── weight.ejs          # Weight management page
│   ├── nutrition.ejs       # Nutrition check page
│   └── nutrition-favorites.ejs # Saved foods page
├── .env                    # Environment variables
├── .gitignore
├── package.json
├── README.md
└── index.js                # Main server file
```

## Database Schema

### users
- User information (id, username, email, password_hash, salt)

### weight_records
- Weight records (id, user_id, weight, record_date)

### goals
- Goals (id, user_id, target_weight, target_date)

### supplements
- Supplement information (id, user_id, supplement_name, dosage, frequency, notes)

### favorite_foods
- Saved favorite foods (id, user_id, fdc_id, food_name, nutrition_data, created_at)

## Security Features

- Passwords are stored using bcrypt with hash + salt method
- Session-based authentication is used
- Prepared Statements are used to prevent SQL Injection

## Usage

1. **Register**: Create a new account at `/register`
2. **Login**: Login at `/login`
3. **Dashboard**: View all information on the dashboard after logging in
4. **Weight Management**: Record weight and set goals at `/weight`
5. **Supplement Management**: Add, edit, and delete supplements at `/supplements`
6. **Nutrition Check**: Search for foods and check nutritional information at `/nutrition`

