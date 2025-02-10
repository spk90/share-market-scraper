const puppeteer = require("puppeteer");
const fs = require("fs");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const host = "0.0.0.0";

// Function to scrape data
async function scrapeProduct(url) {
  // Launch browser with required options
  const browser = await puppeteer.launch({
    headless: "new", // Use new headless mode
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url);

  try {
    // Wait for the table to load
    await page.waitForSelector(".table-responsive", { timeout: 10000 });

    // Get all the data from the trading table
    const data = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tr");
      return Array.from(rows, (row) => {
        const columns = row.querySelectorAll("td");
        return Array.from(columns, (column) => column.innerText);
      });
    });

    await browser.close();
    return data;
  } catch (error) {
    console.error("Error scraping:", error);
    await browser.close();
    return null;
  }
}

// Create HTML content
function generateHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Share Market Data</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                background-color: #f5f5f5;
            }
            h1 {
                color: #333;
                text-align: center;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            th {
                background-color: #2196F3;
                color: white;
                font-weight: bold;
            }
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            tr:hover {
                background-color: #f5f5f5;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            .timestamp {
                text-align: center;
                color: #666;
                margin-bottom: 20px;
            }
            #refreshButton {
                display: block;
                margin: 20px auto;
                padding: 10px 20px;
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            #refreshButton:hover {
                background-color: #1976D2;
            }
        </style>
        <script>
            function refreshData() {
                location.reload();
            }

            // Auto refresh every 1 minute
            setInterval(refreshData, 60000);
        </script>
    </head>
    <body>
        <div class="container">
            <h1>Share Market Live Data</h1>
            <button id="refreshButton" onclick="refreshData()">Refresh Data</button>
            <div class="timestamp">Last Updated: ${new Date().toLocaleString()}</div>
            <table>
                <tr>
                    <th>S.N</th>
                    <th>Symbol</th>
                    <th>LTP</th>
                    <th>Change</th>
                    <th>% Change</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Volume</th>
                    <th>Previous Closing</th>
                </tr>
                ${data
                  .map((row) =>
                    row.length > 0
                      ? `
                <tr>
                    <td>${row[0] || ""}</td>
                    <td>${row[1] || ""}</td>
                    <td>${row[2] || ""}</td>
                    <td>${row[3] || ""}</td>
                    <td>${row[4] || ""}</td>
                    <td>${row[5] || ""}</td>
                    <td>${row[6] || ""}</td>
                    <td>${row[7] || ""}</td>
                    <td>${row[8] || ""}</td>
                    <td>${row[9] || ""}</td>
                </tr>
                `
                      : ""
                  )
                  .join("")}
            </table>
        </div>
    </body>
    </html>
  `;
}

// Set up Express server
app.get("/", async (req, res) => {
  const data = await scrapeProduct("https://www.sharesansar.com/live-trading");
  if (data) {
    res.send(generateHTML(data));
  } else {
    res.send("Error fetching data");
  }
});

// Start server
app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
