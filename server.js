import express from 'express';
import cron from 'node-cron';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path'
import { dirname } from 'path';
import url from 'url';
import cors from 'cors';

const whitelist = ['http://localhost:3000']; // assuming front-end application is running on localhost port 3000

const corsOptions = {
  origin: function (origin, callback) {
    // if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    // } else {
      // callback(new Error('Not allowed by CORS'))
    // }
  }
}



const app = express();
const port = 3001; // Customize as needed
app.use(bodyParser.json());
app.use(cors(corsOptions));

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



app.post("/generate-pdf", async (req, res) => {
  const data = req.body;
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

  try {
    console.log("Generating PDF with data:", data);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let html = "anaf.html"
    if (data.invoiceToCompany === "elite") {
      html = "elite.html"
    }

    await page.goto("file://" + path.join(__dirname, html), {
      waitUntil: "networkidle0",
    });

    await page.evaluate((data) => {
      document.getElementById('title').innerText = data.title;
      document.getElementById('invoiceNo').innerText = data.invoiceNo;
      document.getElementById('invoiceDescription').innerText = data.invoiceDescription;
      document.getElementById('totalAmount').innerText = data.totalAmount;
      document.getElementById('totalAmountExclVAT').innerText = data.totalAmountExclVAT;
      document.getElementById('expense').innerText = data.expense;
      document.getElementById('netEarning').innerText = data.netEarning;
      document.getElementById('percentage').innerText = data.percentage;
      document.getElementById('createdAt').innerText = data.createdAt;
      document.getElementById('fromCompany').innerText = data.invoiceForCompany;
      document.getElementById('toCompany').innerText = data.invoiceToCompany;
    }, data);

    // Custom delay function
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length,
    });

    res.send(pdf);
  } catch (error) {
    res.status(500).send("Error generating PDF: " + error.message);
  }
});


// Start the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:3000`);
});
