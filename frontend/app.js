// DOM Elements
const chartForm = document.getElementById('chartForm');
const promptInput = document.getElementById('prompt');
const chartTypeSelect = document.getElementById('chartType');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const charCount = document.querySelector('.char-count');

const resultSection = document.getElementById('resultSection');
const resultDiv = document.getElementById('result');
const chartTypeBadge = document.getElementById('chartTypeBadge');
const cachedBadge = document.getElementById('cachedBadge');
const timestamp = document.getElementById('timestamp');

const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');

// API Configuration
const API_BASE_URL = window.location.origin;
const API_ENDPOINT = `${API_BASE_URL}/api/generate`;

// Character counter
promptInput.addEventListener('input', () => {
    const length = promptInput.value.length;
    charCount.textContent = `${length} / 5000 characters`;
    
    if (length > 4500) {
        charCount.style.color = 'var(--warning-color)';
    } else {
        charCount.style.color = 'var(--text-secondary)';
    }
});

// Form submission handler
chartForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prompt = promptInput.value.trim();
    const chartType = chartTypeSelect.value;
    
    // Validation
    if (!prompt) {
        showError('Please enter a chart description');
        return;
    }
    
    if (prompt.length > 5000) {
        showError('Prompt is too long (max 5000 characters)');
        return;
    }
    
    // Hide previous results/errors
    hideError();
    hideResult();
    
    // Show loading state
    setLoading(true);
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                chartType: chartType !== 'auto' ? chartType : undefined
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `Server error: ${response.status}`);
        }
        
        // Display the result
        displayResult(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to generate chart description. Please try again.');
    } finally {
        setLoading(false);
    }
});

// Display result
function displayResult(data) {
    resultDiv.textContent = data.description;
    
    // Update chart type badge with null check
    const displayChartType = (data.chartType === 'auto' || !data.chartType) ? 'Auto-detected' : data.chartType;
    chartTypeBadge.textContent = displayChartType.charAt(0).toUpperCase() + displayChartType.slice(1);
    
    // Show cached badge if applicable
    if (data.cached) {
        cachedBadge.style.display = 'inline-block';
    } else {
        cachedBadge.style.display = 'none';
    }
    
    // Update timestamp
    const date = new Date(data.timestamp);
    timestamp.textContent = `Generated at ${date.toLocaleString()}`;
    
    // Show result section
    resultSection.style.display = 'block';
    
    // Smooth scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide error message
function hideError() {
    errorSection.style.display = 'none';
}

// Hide result
function hideResult() {
    resultSection.style.display = 'none';
}

// Set loading state
function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        btnLoader.style.alignItems = 'center';
        btnLoader.style.justifyContent = 'center';
        btnLoader.style.gap = '0.5rem';
    } else {
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// Check API health on load
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('API Health:', data);
    } catch (error) {
        console.warn('Could not check API health:', error);
    }
}

// Initialize
checkHealth();
