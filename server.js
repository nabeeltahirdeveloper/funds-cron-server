import express from 'express';
import cron from 'node-cron';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import hummus from 'hummus';
import memoryStreams from 'memory-streams';
import url from 'url';

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
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.post('/generate-invoice-pdf', async (req, res) => {
  const data = req.body; // Assuming data is an array of invoice objects

  try {
    console.log("Generating PDF with data:", data);
    const invoiceData = data.invoiceData;
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const requestType = data.invoiceType;

    // Combine all invoices into a single PDF
    const pdfBuffers = [];

    let html = `anaf-${requestType}.html`;
    for (let i = 0; i < invoiceData.length; i++) {
      let invoice = invoiceData[i];
      if (data.company?.toLowerCase() === "elite") {
        html =  `elite-${requestType}.html`;
      } else {
        html =  `anaf-${requestType}.html`;
      }

      await page.goto("file://" + path.join(__dirname, html), {
        waitUntil: "networkidle0",
      });

      // Custom delay function
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds to ensure the page is fully loaded

      if (requestType === "invoices") {
      await page.evaluate((invoice) => {
        const setText = (id, text) => {
          const element = document.getElementById(id);
          if (element) {
            element.innerText = text;
          } else {
            console.log(`Element with ID ${id} not found`);
          }
        };

        setText('title', invoice.Title);
        setText('invoiceNo', invoice.InvoiceNo);
        setText('invoiceDescription', invoice.InvoiceDescription);
        setText('totalAmount', invoice.TotalAmount);
        setText('totalAmountExclVAT', invoice.TotalAmountExclVAT);
        setText('expense', invoice.Expense);
        setText('netEarning', invoice.NetEarning);
        setText('percentage', invoice.Percentage);
        setText('createdAt', invoice.CreatedAt);
        setText('fromCompany', invoice.InvoiceForCompany);
        setText('toCompany', invoice.InvoiceToCompany);
        setText('dateOfInvoice', invoice.DateOfInvoice);

        // Log current HTML
        console.log(document.documentElement.outerHTML);
      }, invoice);
    }
    else if (requestType === "passouts") {
      await page.evaluate((invoice) => {
        const setText = (id, text) => {
          const element = document.getElementById(id);
          if (element) {
            element.innerText = text;
          } else {
            console.log(`Element with ID ${id} not found`);
          }
        };

          setText("ManagerApprove", invoice.ManagerApprove,)
          setText("Name",invoice.Name,)
          setText("PassOutTotalHours",invoice.PassOutTotalHours,)
          setText("Reason",invoice.Reason,)
          setText("Status",invoice.Status,)
          setText("TimeFrom",invoice.TimeFrom,)
          setText("TimeTo",invoice.TimeTo,)
          setText("Username",invoice.Username,)
          setText("CreatedAt",invoice.CreatedAt,)
        

        // Log current HTML
        console.log(document.documentElement.outerHTML);
      }, invoice);
    }
    else if (requestType === "leaves") {
      await page.evaluate((invoice) => {
        const setText = (id, text) => {
          const element = document.getElementById(id);
          if (element) {
            element.innerText = text;
          } else {
            console.log(`Element with ID ${id} not found`);
          }
        };

          setText("ManagerApprove", invoice.ManagerApprove)
          setText("LeaveType",invoice.LeaveType)
          setText("NumberOfDays",invoice.NumberOfDays)
          setText("Reason",invoice.Reason)
          setText("Status",invoice.Status)
          setText("CreatedAt",invoice.CreatedAt)
          setText("DateFrom",invoice.DateFrom)
          setText("DateTo",invoice.DateTo)
        

        // Log current HTML
        console.log(document.documentElement.outerHTML);
      }, invoice);
    }
    else if (requestType === "cash") {
      await page.evaluate((invoice) => {
        const setText = (id, text) => {
          const element = document.getElementById(id);
          if (element) {
            element.innerText = text;
          } else {
            console.log(`Element with ID ${id} not found`);
          }
        };

          setText("Amount", invoice.Amount)
          setText("CreatedAt",invoice.CreatedAt)
          setText("ManagerApprove",invoice.ManagerApprove)
          setText("Status",invoice.Status)
          setText("Title",invoice.Title)
          setText("Type",invoice.Type)
          setText("Username",invoice.Username)
        

        // Log current HTML
        console.log(document.documentElement.outerHTML);
      }, invoice);
    }
      // Custom delay function
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      pdfBuffers.push(pdfBuffer);
    }

    await browser.close();

    // Combine PDFs into a single PDF
    const combinedPdf = combinePDFBuffers(pdfBuffers);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": combinedPdf.length,
    });

    res.send(combinedPdf);
  } catch (error) {
    res.status(500).send("Error generating PDF: " + error.message);
  }
});

// Function to combine PDFs using HummusJS
const combinePDFBuffers = (pdfBuffers) => {
  var outStream = new memoryStreams.WritableStream();
  try {
    var pdfWriter = hummus.createWriter(new hummus.PDFStreamForResponse(outStream));

    pdfBuffers.forEach((pdfBuffer, index) => {
      var pdfStream = new hummus.PDFRStreamForBuffer(pdfBuffer);
      pdfWriter.appendPDFPagesFromPDF(pdfStream);
    });

    pdfWriter.end();
    var newBuffer = outStream.toBuffer();
    outStream.end();
    return newBuffer;
  } catch (e) {
    outStream.end();
    throw new Error('Error during PDF combination: ' + e.message);
  }
};

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:3001`);
});