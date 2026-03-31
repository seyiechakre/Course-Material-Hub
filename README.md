# 📚 Course Material Hub

## 📖 Description
Course Material Hub is a full-stack web application developed to help students upload, manage, and download course-related materials efficiently.

The system provides user authentication, file uploads, and search functionality, allowing students to easily access academic resources in one place.

---

## ⚙️ Tech Stack
- Backend: Node.js, Express.js  
- Database: MongoDB (Mongoose)  
- Authentication: bcrypt, express-session  
- File Uploads: Multer  
- Frontend: HTML, CSS, JavaScript  

---

## ⚙️ Prerequisites
Make sure you have the following installed:

- Node.js (v18 or higher)
- MongoDB (running locally)
- Git

---

## 🚀 Installation Steps

1. Clone the repository:
git clone https://github.com/seyiechakre/Course-Material-Hub.git

2. Navigate to the backend folder:
cd Course-Material-Hub/backend

3. Install dependencies:
npm install

4. Start MongoDB:
Make sure MongoDB is running at:
mongodb://127.0.0.1:27017

5. Run the server:
node app.js

6. Open your browser and go to:
http://localhost:3000

---

## ✨ Features
- User Registration and Login  
- Secure authentication using bcrypt  
- Session management  
- Upload lecture files  
- Download files  
- Search by title or subject  
- Dashboard with user details  

---

## 📁 Project Structure

Course-Material-Hub/
│
├── backend/
│   ├── app.js
│   ├── package.json
│   ├── package-lock.json
│   ├── upload/
│   ├── usermodel.js
│   ├── filemodel.js
│   ├── downloadmodel.js
│
├── frontend/
│   ├── login.html
│   ├── register.html
│   ├── myprofile.html
│   ├── login.css
│   ├── register.css
│   ├── myprofile.css
│   ├── theme.js
│   ├── logo.png
│
└── README.md

---

## 🎥 Demo Video
Demo video will be added soon.

---

## 🔒 Notes
- node_modules is excluded using .gitignore  
- Uploaded files are stored in the upload folder  
- MongoDB must be running locally  
- Do not upload sensitive data like passwords or API keys  

---

## 🧠 Future Improvements
- Cloud storage integration  
- Better UI/UX  
- File categorization  
- Admin panel  

---

## 👨‍💻 Author
Seyievilie Chakre
