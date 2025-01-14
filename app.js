const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const pdf = require('html-pdf');
const htmlToImage = require('node-html-to-image');
const SpellCorrector = require('spelling-corrector');

const app = express();
const spellCorrector = new SpellCorrector();
spellCorrector.loadDictionary();

const MILEAGE_RATE = 0.56; // Example rate per mile
const WEAR_AND_TEAR = 0.1; // Example wear and tear rate

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(fileUpload());
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/get-estimate', async (req, res) => {
    try {
        const { companyName, companyAddress, companyPhone, companyEmail, clientName, clientAddress, estimateDate, numberOfJobs, mileage, gasPrice } = req.body;
        const jobs = req.body;
        let jobDetails = [];

        for (let i = 0; i < numberOfJobs; i++) {
            const jobDescription = spellCorrector.correct(jobs[`jobDescription${i}`]);
            const materialCost = parseFloat(jobs[`materialCost${i}`]);
            const hourlyRate = parseFloat(jobs[`hourlyRate${i}`]);
            const hours = parseFloat(jobs[`hours${i}`]);
            const comments = spellCorrector.correct(jobs[`comments${i}`]);

            jobDetails.push({
                description: jobDescription,
                materialCost: materialCost,
                hourlyRate: hourlyRate,
                hours: hours,
                comments: comments
            });
        }

        const totalMaterialCost = jobDetails.reduce((sum, job) => sum + job.materialCost, 0);
        const totalLaborCost = jobDetails.reduce((sum, job) => sum + job.hourlyRate * job.hours, 0);

        const mileageParsed = parseFloat(mileage) || 0; // Ensure mileage is parsed correctly
        const gasPriceParsed = parseFloat(gasPrice) || 0; // Ensure gas price is parsed correctly
        const mileageCost = mileageParsed * MILEAGE_RATE;
        const gasCost = mileageParsed * gasPriceParsed;
        const wearAndTearCost = totalMaterialCost * WEAR_AND_TEAR;
        const bufferCost = mileageCost + gasCost + wearAndTearCost;
        const bufferPerJob = bufferCost / jobDetails.length;

        jobDetails = jobDetails.map(job => {
            job.bufferedLaborCost = job.hourlyRate * job.hours + bufferPerJob;
            return job;
        });

        const totalBufferedLaborCost = jobDetails.reduce((sum, job) => sum + job.bufferedLaborCost, 0);
        const totalCost = totalMaterialCost + totalBufferedLaborCost;

        // console.log('Total Material Cost:', totalMaterialCost);
        // console.log('Total Labor Cost:', totalLaborCost);
        // console.log('Mileage Cost:', mileageCost);
        // console.log('Gas Cost:', gasCost);
        // console.log('Wear and Tear Cost:', wearAndTearCost);
        // console.log('Buffer Cost:', bufferCost);
        // console.log('Total Buffered Labor Cost:', totalBufferedLaborCost);
        // console.log('Total Cost:', totalCost);
        // console.log('Job Details with Buffer:', jobDetails);

        const companyLogo = req.files && req.files.companyLogo ? `data:image/jpeg;base64,${req.files.companyLogo.data.toString('base64')}` : null;

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Estimate</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f9f9f9;
                        color: #333;
                        margin: 0;
                        box-sizing: border-box;
                    }
                    .letterhead {
                        width: 100%;
                        background-color: #fff;
                        page-break-inside: avoid;
                        overflow: hidden;                       
                    }
                    .letterhead header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                        padding: 10px 20px;
                    }
                    .logo img {
                        max-width: 300px;
                    }
                    .company-details {
                        text-align: right;
                    }
                    .company-details h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #333;
                    }
                    .company-details p {
                        margin: 5px 0;
                        color: #555;
                    }
                    main {
                        margin-bottom: 20px;
                        padding: 10px 20px;
                    }
                    h2 {
                        font-size: 20px;
                        margin-bottom: 10px;
                        text-align: center;
                    }
                    .estimate-details {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                    }
                    .estimate-details p {
                        margin: 5px 0;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        margin-bottom: 20px;
                    }
                    .items-table th, .items-table td {
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                        font-size: 14px;
                        word-wrap: break-word;
                    }
                    .items-table th {
                        background-color: #f5f5f5;
                    }
                    .total-cost {
                        text-align: right;
                        margin-top: 20px;
                    }
                    .total-cost h3 {
                        margin: 0;
                        font-size: 18px;
                        color: #333;
                    }
                    .total-cost p {
                        margin: 5px 0;
                        font-size: 16px;
                        color: #555;
                    }
                    footer {
                        text-align: center;
                        margin-top: 20px;
                        border-top: 2px solid #000;
                        padding-top: 10px;
                        padding: 10px 20px;
                    }
                    footer p {
                        margin: 5px 0;
                        color: #555;
                    }
                    footer .legal-disclaimer {
                        font-size: 12px;
                        color: #999;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="letterhead">
                    <header>
                        <div class="logo">
                            ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo">` : ''}
                        </div>
                        <div class="company-details">
                            <h1>${companyName}</h1>
                            <p>${companyAddress}</p>
                            <p>Phone: ${companyPhone} | Email: ${companyEmail}</p>
                        </div>
                    </header>
                    <main>
                        <h2>Estimate</h2>
                        <div class="estimate-details">
                            <div class="estimate-info">
                                <p><strong>Date:</strong> ${estimateDate}</p>
                            </div>
                            <div class="client-info">
                                <p><strong>Client Name:</strong> ${clientName}</p>
                                <p><strong>Address:</strong> ${clientAddress}</p>
                            </div>
                        </div>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Material Cost ($)</th>
                                    <th>Labor Cost ($)</th>
                                    <th>Comments</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${jobDetails.map(job => `
                                    <tr>
                                        <td>${job.description}</td>
                                        <td>${job.materialCost.toFixed(2)}</td>
                                        <td>${job.bufferedLaborCost.toFixed(2)}</td>
                                        <td>${job.comments}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="total-cost">
                            <h3>Total Estimate</h3>
                            <p>Total Material Cost: $${totalMaterialCost.toFixed(2)}</p>
                            <p>Total Labor Cost: $${totalBufferedLaborCost.toFixed(2)}</p>
                            <p>Total Cost: $${totalCost.toFixed(2)}</p>
                        </div>
                    </main>
                    <footer>
                        <p>Thank you for your business!</p>
                        <p>Payment terms: 50% deposit required to start work, balance due upon completion.</p>
                        <p class="legal-disclaimer">Note: The days quoted are an estimated time. Factors like rain and other unforeseen circumstances can affect the timeframe.</p>
                    </footer>
                </div>
            </body>
            </html>
        `;


        const pdfFilename = `estimate_${Date.now()}.pdf`;
        const imageFilename = `estimate_${Date.now()}.png`;

        pdf.create(htmlContent).toFile(path.join(uploadsDir, pdfFilename), async (err, result) => {
            if (err) {
                console.error("PDF creation error:", err);
                return res.status(500).send(err);
            }
            console.log("PDF created:", result.filename);

            await htmlToImage({
                output: path.join(uploadsDir, imageFilename),
                html: htmlContent
            }).then(() => {
                console.log("Image created:", imageFilename);
                res.json({ pdfFilename: pdfFilename, imageFilename: imageFilename, jobs: jobDetails, totalCost: totalCost });
            }).catch(err => {
                console.error("Image creation error:", err);
                res.status(500).send(err);
            });
        });
    } catch (err) {
        console.error("Error processing estimate:", err);
        res.status(500).send(err);
    }
});

app.get('/download-pdf', (req, res) => {
    const { file } = req.query;
    const filePath = path.join(uploadsDir, file);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.get('/download-image', (req, res) => {
    const { file } = req.query;
    const filePath = path.join(uploadsDir, file);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
