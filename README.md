# 🚀 LifeOS - Your Ultimate Personal Productivity Workspace

LifeOS is a modern, responsive, and feature-rich personal dashboard built with **React**, **Vite**, and **Tailwind CSS**. It is designed to help students, developers, and creators manage their schedules, track habits, review progress, build coding skills, and prepare for major exams (like GATE) with an integrated AI study assistant.

All your data is stored locally in your browser's `localStorage` via Zustand persist middleware. This means **your data never leaves your machine**—it is completely private, secure, and isolated to your device. If you share this project with friends, they will see their own fresh progress and tasks without ever seeing yours!

---

## ✨ Features

- **📊 Dynamic Dashboard**: A unified control center displaying your productivity score, daily motivational quotes, a customizable target countdown timer, and quick-add tasks.
- **📅 Daily Planner**: Time-block your day (study, coding, personal, projects) with visual categories and tracking.
- **✅ Advanced To-Do List**: Categorize tasks, set priority levels (high, medium, low), archive completed items, and track backlogs.
- **📚 Exam Prep Hub (e.g. GATE Prep)**: Monitor study hours, track lectures completed, log practice questions (PYQs) solved, and chart your progress in mock tests. (The exam name and target countdown is fully customizable!).
- **💻 Coding Progress Tracker**: Log daily DSA (Data Structures & Algorithms) and language practice, count active coding streaks, and analyze topic distribution.
- **🏋️ Fitness & Health Logger**: Log gym sessions, track water intake (glasses), sleep hours, and weight trends.
- **🎯 Habits Builder**: Track daily habits (e.g., wake up early, read, workout) with automatic streak calculations and visual performance charts.
- **⏱️ Focus Pomodoro Timer**: Dedicated focus blocks (25/5, 50/10, or custom minutes) that automatically log focus time into your stats.
- **📝 Notes & Documents**: Simple, beautiful text workspace to dump thoughts, concepts, or logs.
- **📋 Daily Review**: Conduct daily summaries logging your wins, blockers, and gratitude.
- **🤖 Gemini AI Productivity Assistant**: Get personalized schedule advice, syllabus break-downs, or motivation from a chatbot powered directly by Google's latest **Gemini 2.5 Flash** model (supports secure API key saving & visibility toggle).
- **📈 Personal Analytics**: Interactive charts showing your long-term study patterns, habit success rates, sleep trends, and coding progress.

---

## 🛠️ Technology Stack

- **Core**: React 19, Vite (Fast HMR)
- **Styling**: Tailwind CSS, Vanilla CSS variables, Framer Motion (smooth, native-feeling animations)
- **State Management**: Zustand (with Persist Middleware)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (fully responsive charts)
- **Helper Utilities**: Date-fns

---

## 🚀 Getting Started & Running Locally

Follow these steps to run the project on your local machine.

### Prerequisites

Ensure you have **Node.js** (v18 or higher) and **npm** installed. You can check this by running:
```bash
node -v
npm -v
```

### Installation

1. Clone or download the project files.
2. Open your terminal in the root directory of the project.
3. Install the dependencies:
```bash
npm install
```

### Running the App

Start the local development server:
```bash
npm run dev
```

Once started, the terminal will display the local URL (usually `http://localhost:5173` or `http://localhost:5174`). Open that URL in your browser to interact with LifeOS!

### Building for Production

To create an optimized production build (minified assets, optimized bundle):
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## 🤖 Configuring the AI Assistant

LifeOS integrates with Google Gemini to act as your personal coach. 

1. Go to the **AI Assistant** page from the sidebar.
2. Click the **Add Gemini API Key** button in the top right.
3. Paste your Gemini API key (starts with the new `AQ.` format or standard `AIzaSy`).
4. Click the Eye icon if you want to verify the key.
5. Click **Save Key**. It will be saved securely in your browser's local storage and used directly for API requests.

*Note: The assistant has been updated to use the active `gemini-2.5-flash` model, ensuring you do not run into quota limitations of the free tier.*

---

## 🌍 How to Share & Deploy

### Hosting Online (Free)

The easiest way to share this project with your friend is to deploy it to **Vercel** or **Netlify** so they can open it via a URL:

#### Deploy to Vercel (Recommended)
1. Push your project code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Click **Deploy**. Vercel will automatically build and host the website for you, providing a URL like `https://your-project.vercel.app`.

When your friend opens this URL, Vercel loads the static code. Since the application saves data locally in the client browser, your friend will see their own isolated dashboard, and you will see yours!

### Offline Sharing
If you want to send the folder directly:
1. Delete the `node_modules` and `dist` folders (to keep the zip file size small).
2. Compress the root directory into a `.zip` file.
3. Send it to your friend. They can unzip it, run `npm install`, and start it with `npm run dev`.
