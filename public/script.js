document.addEventListener('DOMContentLoaded', () => {
    const previewButton = document.getElementById('preview-button');
    const editButton = document.getElementById('edit-button');
    const estimateForm = document.getElementById('estimate-form');
    const loadingBar = document.getElementById('loading-bar');
    const estimateResult = document.getElementById('estimate-result');
    const numberOfJobsInput = document.getElementById('numberOfJobs');
    const jobsDiv = document.getElementById('jobs');

    // Add jobs input fields dynamically
    numberOfJobsInput.addEventListener('input', updateJobs);

    previewButton.addEventListener('click', async () => {
        loadingBar.style.display = 'block';
        const formData = new FormData(estimateForm);

        try {
            const response = await fetch('/get-estimate', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                displayPdfInIframe(url);
            } else {
                console.error('Failed to generate estimate');
            }
        } catch (error) {
            console.error('Error:', error);
        }

        loadingBar.style.display = 'none';
        toggleButtons(true);
    });

    editButton.addEventListener('click', () => {
        toggleButtons(false);
    });

    function displayPdfInIframe(url) {
        estimateResult.innerHTML = `<iframe src="${url}" width="100%" height="600px"></iframe>`;
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

    function updateJobs() {
        const numberOfJobs = parseInt(numberOfJobsInput.value, 10);
        jobsDiv.innerHTML = '';
        for (let i = 0; i < numberOfJobs; i++) {
            jobsDiv.innerHTML += `
                <div class="form-group">
                    <label for="jobDescription${i}">🔧 Job ${i + 1} Description:</label>
                    <input type="text" id="jobDescription${i}" name="jobDescription${i}" required>
                </div>
                <div class="form-group">
                    <label for="materialCost${i}">💵 Material Cost ($):</label>
                    <input type="number" id="materialCost${i}" name="materialCost${i}" required>
                </div>
                <div class="form-group">
                    <label for="hourlyRate${i}">💲 Hourly Rate ($):</label>
                    <input type="number" id="hourlyRate${i}" name="hourlyRate${i}" required>
                </div>
                <div class="form-group">
                    <label for="hours${i}">⏳ Total Hours:</label>
                    <input type="number" id="hours${i}" name="hours${i}" required>
                </div>
                <div class="form-group">
                    <label for="comments${i}">📝 Comments:</label>
                    <textarea id="comments${i}" name="comments${i}"></textarea>
                </div>
            `;
        }
    }

    // Set the default date to today
    document.getElementById('estimateDate').valueAsDate = new Date();
});
