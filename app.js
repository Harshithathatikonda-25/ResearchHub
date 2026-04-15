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

// Global state cache to limit network requests while browsing
window.appState = {
    papers: null
};

// Async fetch papers from backend API
async function loadPapersFromBackend() {
    try {
        const user = getCurrentUser();
        const res = await fetch(`http://localhost/research/api.php?user=${user}`);
        if (!res.ok) throw new Error("Failed to fetch");
        window.appState.papers = await res.json();
        return window.appState.papers;
    } catch (e) {
        console.error("Database error, falling back to empty list.", e);
        showToast("Error connecting to database. Please run setup.", true);
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
        const res = await fetch("http://localhost/research/api.php", {
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

        await fetch("http://localhost/research/api.php", {
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

function renderAppShell() {
    if(document.querySelector('.app-layout')) return;

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
        if(node.tagName === 'SCRIPT' && node.innerHTML.includes('checkAuth')) return false;
        if(node.tagName === 'SCRIPT' && node.innerHTML.includes('renderAppShell')) return false;
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
