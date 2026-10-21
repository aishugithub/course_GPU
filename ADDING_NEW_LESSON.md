# Adding a New Lesson — 2 Steps Only

## Step 1 — Add to config/course.config.js
Add one line inside the correct module's units array:
  { unitId: "Unit2_5", title: "Your Lesson Title" },

## Step 2 — Drop the JSX file
Create: src/lessons/Unit2_5.jsx

Every lesson must use this exact signature:
  export default function Unit2_5({ student, onUnitComplete }) {
    // student = { rollNo, name, batch }
    // Call onUnitComplete() when quiz is fully done
    // Never import api.js or gas.config.js
  }

## Step 3 — Push to deploy
  git add .
  git commit -m "added Unit 2.5"
  git push origin main
