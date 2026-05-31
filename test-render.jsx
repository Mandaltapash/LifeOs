import React from 'react';
import { renderToString } from 'react-dom/server';
import Habits from './src/pages/Habits.jsx';
import Notes from './src/pages/Notes.jsx';

try {
  console.log("Rendering Habits...");
  renderToString(<Habits />);
  console.log("Habits rendered successfully.");
} catch (e) {
  console.error("Error rendering Habits:", e);
}

try {
  console.log("Rendering Notes...");
  renderToString(<Notes />);
  console.log("Notes rendered successfully.");
} catch (e) {
  console.error("Error rendering Notes:", e);
}
