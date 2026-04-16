// app.js

function checkAuth() {
    if (!localStorage.getItem("loggedIn")) {
        window.location.href = "login.html";
    }
}

function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}

function getCurrentUser() {
    return localStorage.getItem("currentUser") || "admin";
}

function normalizeStatus(status) {
    const value = String(status || "").trim().toLowerCase();
    if (value === "not started" || value === "not_started" || value === "notstarted") return "Not Started";
    if (value === "in progress" || value === "in_progress" || value === "inprogress") return "In Progress";
    if (value === "completed") return "Completed";
    return status;
}

function getStatusKey(status) {
    return String(normalizeStatus(status) || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function formatProgress(progress) {
    let num = Number(progress);
    if (Number.isNaN(num)) return 0;
    if (num > 0 && num <= 1) return Math.round(num * 100);
    if (num > 100) return Math.round(num);
    return num;
}

function cleanPapersData(papers) {
    if (!Array.isArray(papers)) return [];
    return papers.filter(paper => {
        if (!paper || typeof paper !== 'object') return false;
        const hasTitle = typeof paper.title === 'string' && paper.title.trim().length > 0;
        const hasAuthor = typeof paper.author === 'string' && paper.author.trim().length > 0;
        return hasTitle || hasAuthor;
    });
}

// Global state cache to limit network requests while browsing
window.appState = {
    papers: null
};

function getApiUrl() {
    return new URL('api.php', window.location.href).href;
}

// Async fetch papers from backend API
async function loadPapersFromBackend() {
    try {
        const user = getCurrentUser();
        const res = await fetch(`${getApiUrl()}?user=${encodeURIComponent(user)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const papers = await res.json();
        window.appState.papers = cleanPapersData(papers);
        return window.appState.papers;
    } catch (e) {
        console.error("Database error, falling back to empty list.", e);
        showToast("Error connecting to backend. Make sure PHP is running.", true);
        return [];
    }
}

// Get papers (sync facade expecting cache to be warmed up)
// Returns the cached list. Make sure to await loadPapersFromBackend() before calling this.
function getPapers() {
    return window.appState.papers || [];
}

// Save a newly uploaded paper
async function savePapers(papersArrayOrNewPaperObject) {
    // If it's a new paper object instead of array
    let newPaper = papersArrayOrNewPaperObject;
    if (Array.isArray(papersArrayOrNewPaperObject)) {
       newPaper = papersArrayOrNewPaperObject[0]; // the newly added item is at index 0 from upload.html
    }
    newPaper.userOwner = getCurrentUser();
    
    try {
        const res = await fetch(getApiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPaper)
        });
        const result = await res.json();
        if(result.status === "success") {
           // Reload cache
           await loadPapersFromBackend();
        }
    } catch(e) { console.error(e); }
}

// Update an existing paper's reading progress or favorite status
async function updatePaperStatus(id, newStatus, newProgress, isFavorite, tier = undefined) {
    try {
        let payload = {
            action: "update",
            id: id,
            status: newStatus,
            progress: newProgress,
            isFavorite: isFavorite
        };
        if (tier !== undefined) {
            payload.tier = tier;
        }

        await fetch(getApiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        // Reload cache after update
        await loadPapersFromBackend();
    } catch(e) { console.error(e); }
}

function getStats() {
    const papers = getPapers();
    const total = papers.length;
    const completed = papers.filter(p => p.status === "Completed").length;
    const inProgress = papers.filter(p => p.status === "In Progress").length;
    const notStarted = papers.filter(p => p.status === "Not Started").length;
    return { total, completed, inProgress, notStarted };
}

function getRecentlyViewedPapers() {
    const data = localStorage.getItem("recently_viewed_" + getCurrentUser());
    let parsed = data ? JSON.parse(data) : [];
    // Self-healing: Remove legacy entries that don't have timestamps
    parsed = parsed.filter(p => p.lastViewed);
    
    // Self-healing: Remove duplicates by title in case they got stuck
    let uniqueTitles = new Set();
    let uniqueParsed = [];
    for(let p of parsed) {
        let titleLower = p.title.toLowerCase();
        if(!uniqueTitles.has(titleLower)) {
            uniqueTitles.add(titleLower);
            uniqueParsed.push(p);
        }
    }
    
    // Save the cleaned up version back
    localStorage.setItem("recently_viewed_" + getCurrentUser(), JSON.stringify(uniqueParsed));
    return uniqueParsed;
}

function clearRecentlyViewedIfNoPapers() {
    if (Array.isArray(window.appState.papers) && window.appState.papers.length === 0) {
        localStorage.removeItem('recently_viewed_' + getCurrentUser());
    }
}

function addRecentlyViewed(paper) {
    let recent = getRecentlyViewedPapers();
    recent = recent.filter(p => p.id !== paper.id);
    
    // Inject a timestamp right before saving to local storage
    let viewRecord = Object.assign({}, paper);
    viewRecord.lastViewed = Date.now();
    
    recent.unshift(viewRecord);
    if (recent.length > 5) recent.pop();
    localStorage.setItem("recently_viewed_" + getCurrentUser(), JSON.stringify(recent));
}

function addRecentItem(paper) {
    addRecentlyViewed(paper);
    renderRecentItems('recentlyViewedContainer');
}

function removeRecentItem(id) {
    const user = getCurrentUser();
    const updated = getRecentlyViewedPapers().filter(item => Number(item.id) !== Number(id));
    localStorage.setItem("recently_viewed_" + user, JSON.stringify(updated));
    renderRecentItems('recentlyViewedContainer');
}

function renderRecentItems(containerId = 'recentlyViewedContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const papers = getRecentlyViewedPapers();
    container.innerHTML = '';

    if (papers.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-title">No recently viewed files</div></div>`;
        return;
    }

    papers.forEach(paper => {
        const summary = paper.shortSummary || paper.author || 'No summary available.';
        container.innerHTML += `
            <div class="glass-card" style="padding: 1rem; position: relative;">
                <button type="button" onclick="removeRecentItem(${paper.id})" style="position: absolute; top: 0.75rem; right: 0.75rem; border: none; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 1rem;">
                    ❌
                </button>
                <h4 style="color: #fff; margin-top: 0;">${paper.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.8rem;">${summary}</p>
                <a href="paperdetails.html?id=${paper.id}" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;">Details</a>
            </div>
        `;
    });
}

function renderAppShell() {
    if (document.querySelector('.app-layout') || document.querySelector('.sidebar')) return;

    const bodyChildren = Array.from(document.body.childNodes);
    const layout = document.createElement('div');
    layout.className = 'app-layout';

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="brand-area">
            <div class="brand-title">ResearchHub</div>
            <div class="brand-tagline">Personal Paper Manager</div>
        </div>
        <div class="nav-menu">
            <a href="index.html" class="nav-link ${location.pathname.includes('index.html') ? 'active' : ''}">📊 Dashboard</a>
            <a href="papers.html" class="nav-link ${location.pathname.includes('papers.html') ? 'active' : ''}">📚 Library</a>
            <a href="upload.html" class="nav-link ${location.pathname.includes('upload.html') ? 'active' : ''}">⬆️ Upload</a>
        </div>
        <div class="logout-area">
            <button class="btn btn-secondary" style="width:100%" onclick="logout()">🚪 Logout</button>
        </div>
    `;

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    const user = getCurrentUser();
    const header = document.createElement('div');
    header.className = 'top-header';
    header.innerHTML = `
        <div class="header-search">
             <div style="font-size:0.8rem; color:var(--success);">🟢 MySQL Database Connected</div>
        </div>
        <div class="user-profile">
            <span style="color:var(--text-muted)">Welcome, <span style="color:#fff">${user}</span></span>
            <div class="avatar">${user.charAt(0).toUpperCase()}</div>
        </div>
    `;

    mainContent.appendChild(header);

    const contentNodes = bodyChildren.filter(node => {
        if (node.tagName === 'SCRIPT' && node.innerHTML.includes('checkAuth')) return false;
        if (node.tagName === 'SCRIPT' && node.innerHTML.includes('renderAppShell')) return false;
        return true;
    });

    contentNodes.forEach(node => mainContent.appendChild(node));

    layout.appendChild(sidebar);
    layout.appendChild(mainContent);

    document.body.innerHTML = '';
    document.body.appendChild(layout);
}

function showToast(message, isError = false) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    if(isError) toast.style.borderLeftColor = 'var(--danger)';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
