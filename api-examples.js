/**
 * AJAX Examples for ResearchHub API
 * 
 * This file shows how to use the backend API from your frontend JavaScript
 * Copy and modify these functions based on your needs
 */

// ============================================
// 1. FETCH ALL PAPERS FOR A USER
// ============================================

/**
 * Load papers from backend for current user
 * 
 * @param {string} user - Username (default: 'admin')
 * @returns {Promise<Array>} - Array of paper objects
 */
async function fetchAllPapers(user = 'admin') {
    try {
        const response = await fetch(`api.php?action=list&user=${encodeURIComponent(user)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const papers = await response.json();
        console.log('Papers fetched:', papers);
        return papers;
        
    } catch (error) {
        console.error('Error fetching papers:', error);
        return [];
    }
}

// Usage:
// const papers = await fetchAllPapers('admin');
// papers.forEach(paper => console.log(paper.title));


// ============================================
// 2. UPLOAD A NEW PAPER
// ============================================

/**
 * Upload a new research paper to the database
 * 
 * @param {Object} paperData - Paper information
 * @returns {Promise<Object>} - Response from server
 */
async function uploadPaper(paperData) {
    const payload = {
        userOwner: paperData.user || 'admin',
        title: paperData.title,
        author: paperData.author,
        year: parseInt(paperData.year),
        domain: paperData.domain,
        timeToRead: paperData.timeToRead,
        difficulty: paperData.difficulty,
        shortSummary: paperData.shortSummary,
        detailedSummary: paperData.detailedSummary,
        keyPoints: paperData.keyPoints || [],
        status: 'Not Started',
        progress: 0
    };
    
    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('Paper uploaded successfully. ID:', result.data.id);
            return result;
        } else {
            console.error('Upload failed:', result.message);
            return result;
        }
        
    } catch (error) {
        console.error('Error uploading paper:', error);
        return { status: 'error', message: error.message };
    }
}

// Usage:
// const newPaper = {
//     user: 'admin',
//     title: 'Attention is All You Need',
//     author: 'Ashish Vaswani',
//     year: '2017',
//     domain: 'AI / Deep Learning',
//     timeToRead: '45 mins',
//     difficulty: 'Advanced',
//     shortSummary: 'A groundbreaking paper on transformers',
//     detailedSummary: 'Full analysis of transformer architecture...',
//     keyPoints: ['Attention mechanism', 'Parallelizable', 'SOTA results']
// };
// await uploadPaper(newPaper);


// ============================================
// 3. UPDATE PAPER STATUS AND PROGRESS
// ============================================

/**
 * Update paper reading status and progress
 * 
 * @param {number} paperId - Paper ID
 * @param {string} status - Status: 'Not Started', 'In Progress', or 'Completed'
 * @param {number} progress - Progress percentage (0-100)
 * @param {boolean} isFavorite - Whether paper is marked as favorite
 * @returns {Promise<Object>} - Response from server
 */
async function updatePaperStatus(paperId, status, progress = 0, isFavorite = false) {
    const payload = {
        action: 'update',
        id: paperId,
        status: status,
        progress: parseInt(progress),
        isFavorite: isFavorite
    };
    
    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('Paper updated successfully');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error updating paper:', error);
        return { status: 'error', message: error.message };
    }
}

// Usage:
// await updatePaperStatus(1, 'In Progress', 50, false);
// await updatePaperStatus(1, 'Completed', 100, true);


// ============================================
// 4. DELETE A PAPER
// ============================================

/**
 * Delete a paper from the database
 * 
 * @param {number} paperId - Paper ID to delete
 * @param {string} user - Username (for ownership verification)
 * @returns {Promise<Object>} - Response from server
 */
async function deletePaper(paperId, user = 'admin') {
    const payload = new URLSearchParams({
        id: paperId,
        user: user
    });
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('Paper deleted successfully');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error deleting paper:', error);
        return { status: 'error', message: error.message };
    }
}

// Usage:
// await deletePaper(1, 'admin');


// ============================================
// 5. EXAMPLE: COMPLETE WORKFLOW
// ============================================

async function exampleWorkflow() {
    console.log('=== ResearchHub API Workflow Example ===\n');
    
    // Step 1: Upload a paper
    console.log('Step 1: Uploading a new paper...');
    const newPaperResult = await uploadPaper({
        user: 'admin',
        title: 'Deep Learning for Natural Language Processing',
        author: 'Ian Goodfellow',
        year: 2016,
        domain: 'AI / Deep Learning',
        timeToRead: '60 mins',
        difficulty: 'Advanced',
        shortSummary: 'An overview of deep learning techniques',
        detailedSummary: 'This paper covers...',
        keyPoints: ['Neural Networks', 'RNNs', 'LSTMs']
    });
    
    if (newPaperResult.status !== 'success') {
        console.error('Failed to upload paper');
        return;
    }
    
    const paperId = newPaperResult.data.id;
    console.log(`✓ Paper created with ID: ${paperId}\n`);
    
    // Step 2: Fetch all papers
    console.log('Step 2: Fetching all papers...');
    const papers = await fetchAllPapers('admin');
    console.log(`✓ Found ${papers.length} papers\n`);
    papers.forEach(p => {
        console.log(`  - ${p.title} (${p.status})`);
    });
    
    // Step 3: Update paper status
    console.log(`\nStep 3: Updating paper #${paperId} status...`);
    await updatePaperStatus(paperId, 'In Progress', 25);
    console.log(`✓ Paper marked as "In Progress" with 25% progress\n`);
    
    // Step 4: Update progress further
    console.log(`Step 4: Updating progress to 75%...`);
    await updatePaperStatus(paperId, 'In Progress', 75);
    console.log(`✓ Progress updated\n`);
    
    // Step 5: Mark as completed
    console.log(`Step 5: Marking paper as completed...`);
    await updatePaperStatus(paperId, 'Completed', 100, true);
    console.log(`✓ Paper marked as completed and favorited\n`);
    
    // Step 6: Delete paper
    console.log(`Step 6: Deleting paper #${paperId}...`);
    await deletePaper(paperId, 'admin');
    console.log(`✓ Paper deleted\n`);
    
    console.log('=== Workflow Complete ===');
}

// Uncomment to run the example:
// exampleWorkflow();


// ============================================
// 6. INTEGRATION WITH HTML FORMS
// ============================================

/**
 * Handle form submission for uploading papers
 * Attach this to your form's submit event
 */
async function handleUploadFormSubmit(formElement) {
    const formData = new FormData(formElement);
    
    const paperData = {
        user: 'admin',  // Get from localStorage
        title: formData.get('title'),
        author: formData.get('author'),
        year: formData.get('year'),
        domain: formData.get('domain'),
        timeToRead: formData.get('timeToRead'),
        difficulty: formData.get('difficulty'),
        shortSummary: formData.get('shortSummary'),
        detailedSummary: formData.get('detailedSummary'),
        keyPoints: formData.get('keyPoints').split('\n').filter(k => k.trim())
    };
    
    const result = await uploadPaper(paperData);
    
    if (result.status === 'success') {
        alert('Paper uploaded successfully!');
        formElement.reset();
        // Redirect or refresh paper list
        window.location.href = 'papers.html';
    } else {
        alert(`Error: ${result.message}`);
    }
}

// Usage in HTML:
// <form id="uploadForm" onsubmit="async (e) => { e.preventDefault(); await handleUploadFormSubmit(this); }">
//     <input type="text" name="title" required>
//     <input type="text" name="author" required>
//     ...
// </form>

