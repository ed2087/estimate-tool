document.addEventListener('DOMContentLoaded', () => {
    const numberOfJobsInput = document.getElementById('numberOfJobs');
    const jobsDiv = document.getElementById('jobs');
    const estimateForm = document.getElementById('estimate-form');
    const loadingBar = document.getElementById('loading-bar');
    const previewButton = document.getElementById('preview-button');
    const editButton = document.getElementById('edit-button');
    const estimateResult = document.getElementById('estimate-result');

    numberOfJobsInput.addEventListener('input', updateJobs);
    estimateForm.addEventListener('input', updateEstimate);

    previewButton.addEventListener('click', async () => {
        loadingBar.style.display = 'block';
        const formData = new FormData(estimateForm);
        formData.append('preview', true);

        const response = await fetch('/get-estimate', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        loadingBar.style.display = 'none';

        displayResults(result, true);
        toggleButtons(true);
    });

    editButton.addEventListener('click', () => {
        toggleButtons(false);
    });

    function updateJobs() {
        const numberOfJobs = numberOfJobsInput.value;
        jobsDiv.innerHTML = '';
        for (let i = 0; i < numberOfJobs; i++) {
            jobsDiv.innerHTML += `
                <h3>Job ${i + 1}</h3>
                <label for="jobDescription${i}">Job Description:</label>
                <input type="text" id="jobDescription${i}" name="jobDescription${i}" required><br>
                <label for="materialCost${i}">Material Cost ($):</label>
                <input type="number" id="materialCost${i}" name="materialCost${i}" required><br>
                <label for="hourlyRate${i}">Hourly Rate ($):</label>
                <input type="number" id="hourlyRate${i}" name="hourlyRate${i}" required><br>
                <label for="hours${i}">Total Hours:</label>
                <input type="number" id="hours${i}" name="hours${i}" required><br>
                <label for="comments${i}">Comments:</label>
                <textarea id="comments${i}" name="comments${i}"></textarea><br><br>
            `;
        }
        updateEstimate();
    }

    function updateEstimate() {
        const jobElements = jobsDiv.querySelectorAll('div');
        let totalMaterialCost = 0;
        let totalLaborCost = 0;
        let jobDetails = '';

        jobElements.forEach((jobElement, index) => {
            const description = document.getElementById(`jobDescription${index}`)?.value || '';
            const materialCost = parseFloat(document.getElementById(`materialCost${index}`)?.value) || 0;
            const hourlyRate = parseFloat(document.getElementById(`hourlyRate${index}`)?.value) || 0;
            const hours = parseFloat(document.getElementById(`hours${index}`)?.value) || 0;
            const comments = document.getElementById(`comments${index}`)?.value || '';

            totalMaterialCost += materialCost;
            totalLaborCost += hourlyRate * hours;

            jobDetails += `
                <div class="job">
                    <h2>Job ${index + 1}: ${description}</h2>
                    <p>Material Cost: $${materialCost.toFixed(2)}</p>
                    <p>Labor Cost: $${(hourlyRate * hours).toFixed(2)}</p>
                    <p>Comments: ${comments}</p>
                </div>
            `;
        });

        const mileage = parseFloat(document.getElementById('mileage')?.value) || 0;
        const gasPrice = parseFloat(document.getElementById('gasPrice')?.value) || 0;
        const mileageCost = mileage * 0.56;
        const gasCost = mileage * gasPrice;
        const wearAndTearCost = totalMaterialCost * 0.1;
        const bufferCost = mileageCost + gasCost + wearAndTearCost;
        const bufferPerJob = bufferCost / jobElements.length;

        const totalBufferedLaborCost = jobElements.reduce((sum, jobElement, index) => {
            const hourlyRate = parseFloat(document.getElementById(`hourlyRate${index}`)?.value) || 0;
            const hours = parseFloat(document.getElementById(`hours${index}`)?.value) || 0;
            const laborCost = hourlyRate * hours + bufferPerJob;
            return sum + laborCost;
        }, 0);

        const totalCost = totalMaterialCost + totalBufferedLaborCost;

        const estimateResultContent = `
            ${jobDetails}
            <div class="total">
                <h2>Total Estimate</h2>
                <p>Total Material Cost: $${totalMaterialCost.toFixed(2)}</p>
                <p>Total Labor Cost: $${totalBufferedLaborCost.toFixed(2)}</p>
                <p>Total Cost: $${totalCost.toFixed(2)}</p>
            </div>
        `;

        estimateResult.innerHTML = estimateResultContent;

        console.log('Total Material Cost:', totalMaterialCost);
        console.log('Total Labor Cost:', totalLaborCost);
        console.log('Mileage Cost:', mileageCost);
        console.log('Gas Cost:', gasCost);
        console.log('Wear and Tear Cost:', wearAndTearCost);
        console.log('Buffer Cost:', bufferCost);
        console.log('Total Buffered Labor Cost:', totalBufferedLaborCost);
        console.log('Total Cost:', totalCost);
    }

    function displayResults(result, isPreview = false) {
        estimateResult.innerHTML = '';

        if (isPreview) {
            const previewImage = new Image();
            previewImage.src = `/download-image?file=${result.imageFilename}`;
            estimateResult.appendChild(previewImage);

            const downloadLinkPdf = document.createElement('a');
            downloadLinkPdf.href = `/download-pdf?file=${result.pdfFilename}`;
            downloadLinkPdf.textContent = 'Download PDF';
            downloadLinkPdf.setAttribute('download', '');
            estimateResult.appendChild(downloadLinkPdf);
        }
    }

    function toggleButtons(isPreview) {
        if (isPreview) {
            previewButton.style.display = 'none';
            editButton.style.display = 'block';
            estimateForm.style.display = 'none';
        } else {
            previewButton.style.display = 'block';
            editButton.style.display = 'none';
            estimateForm.style.display = 'block';
            estimateResult.innerHTML = '';
        }
    }
});
