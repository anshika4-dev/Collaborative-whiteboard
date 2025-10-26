# 🎨 Real-Time Collaborative Whiteboard

A web-based digital whiteboard where multiple users can draw together in real-time. Built with **Node.js, Express, and Socket.IO**.

This application provides a shared digital canvas, allowing for seamless brainstorming, sketching, and collaboration from anywhere in the world.  
It features a complete drawing toolkit and a responsive design that works on both desktop and mobile browsers.

---

## ✨ Features

- **Real-Time Collaboration**  
  All actions are broadcast instantly to every connected user using WebSockets.

- **Complete Drawing Toolkit**  
  - ✏️ **Pen & Eraser**: For freehand drawing and erasing  
  - 📐 **Shape Tools**: Draw perfect lines, rectangles, and circles  
  - 🪣 **Fill Tool (Paint Bucket)**: Fill enclosed areas with a single click  

- **Full Customization**  
  - 🎨 **Color Picker**: Select any color for your tools  
  - 📏 **Adjustable Tool Size**: Change thickness of pen, eraser, and shapes  

- **Session Persistence**  
  Your drawing is saved automatically in local storage—refresh without losing work.

- **Clear Canvas**  
  A one-click button to reset the whiteboard for everyone.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5 Canvas, CSS3, JavaScript (ES6+)  
- **Backend**: Node.js, Express.js  
- **Real-Time Engine**: Socket.IO  

---

## 🚀 Getting Started

Follow these instructions to set up the project on your local machine.

### ✅ Prerequisites
- Node.js (includes npm)  
- Git  

### ⚙️ Installation

1. Clone the repository
   git clone https://github.com/your-username/your-repository-name.git

2. Navigate to the project directory
   cd your-repository-name

3. Install dependencies
   npm install

4. Start the server
   node server.js

5. Open the application  
   Visit: http://localhost:3000 in your browser.

---

## 🎮 Usage

- Select a tool from the toolbar (pen, eraser, shapes, or fill).  
- Choose your desired color and size.  
- Click and drag on the canvas to draw.  
- Open multiple browser tabs/windows at http://localhost:3000 to test real-time collaboration.  

---

## 🌍 How to Share with Friends

To share your local whiteboard with others on a different network:  

1. Ensure your server is running:
   node server.js

2. In a new terminal, run:
   ngrok http 3000

3. Share the public ngrok URL (e.g. https://random-string.ngrok.io) with your friends.

---

## 📜 License

This project is licensed under the MIT License – see the LICENSE.md file for details.

---

