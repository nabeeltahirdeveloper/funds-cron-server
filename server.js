import express from 'express';
import cron from 'node-cron';
import fetch from 'node-fetch';

const app = express();
const port = 3001; // Customize as needed

// Simple Hello World route
app.get('/', (req, res) => {
  res.send('This is nodejs server for funds reimbursement!');
});

// Schedule a job to run on the 1st of every month at 00:00 (midnight)
cron.schedule('0 0 1 * *', async () => {

  console.log('Running scheduled task: calling external API on the 1st of the month.');

  try {
    const response = await fetch('https://funds-reimbursement.vercel.app/api/leaves/leavesUpdate', { method: 'POST' });
    const data = await response.json();
    console.log('API Response:', data.message);
  } catch (error) {
    console.error('Error calling the API:', error);
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:3000`);
});
