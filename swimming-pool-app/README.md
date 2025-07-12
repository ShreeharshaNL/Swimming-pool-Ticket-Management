# 🏊‍♂️ AquaPass - Swimming Pool Management System

A modern, full-stack web application for managing swimming pool access with digital QR codes, secure payments, and real-time attendance tracking.

## 🚀 Features

- **Digital QR Codes**: Replace physical tickets with secure, unique QR codes
- **Flexible Pass Types**: Daily, monthly, and yearly subscription plans
- **Secure Payments**: Integrated with Stripe for safe online transactions
- **Real-time Verification**: Staff can scan QR codes to verify pool access
- **User Dashboard**: Users can view their passes and QR codes
- **Attendance Tracking**: Track pool entries and user analytics
- **Responsive Design**: Modern UI that works on all devices
- **Authentication**: Secure user registration and login system

## 🛠️ Tech Stack

### Frontend
- **React.js** - Modern JavaScript framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **Stripe Elements** - Payment processing
- **CSS3** - Modern styling with gradients and animations

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MySQL** - Database for storing user data and passes
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **QRCode** - QR code generation
- **Stripe** - Payment processing

## 🔧 Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
# Configure .env file with your database and Stripe keys
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. Database Setup
```bash
# Create database using schema.sql
mysql -u root -p < database/schema.sql
```

## 📱 Usage

1. **Register/Login**: Create account or sign in
2. **Browse Passes**: View available pass types
3. **Purchase Pass**: Select and pay for a pass
4. **Get QR Code**: Receive unique QR code
5. **Pool Entry**: Show QR code to staff
6. **QR Scanner**: Staff can scan codes at `/qr-scanner`

## 🔐 Security Features

- Password hashing with bcrypt
- JWT authentication
- Secure payment processing
- Input validation
- CORS protection

Built with ❤️ for modern swimming pool management