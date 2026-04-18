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
    // All papers are stored under "admin" — use this as the data key
    return "admin";
}

function getDisplayUser() {
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
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid response");
        window.appState.papers = cleanPapersData(data);
        return window.appState.papers;
    } catch (e) {
        console.error("Backend error:", e);
        if (window.appState.papers === null) {
            // Only show toast if this is not a retry (first load failure)
            showToast("Could not reach backend. Check PHP server is running.", true);
        }
        window.appState.papers = window.appState.papers || [];
        return window.appState.papers;
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

    // Heal missing timestamps — assign now so they aren't dropped
    parsed = parsed.map(p => {
        if (!p.lastViewed) p.lastViewed = Date.now();
        return p;
    });

    // Remove duplicates by id, keep most recent
    const seen = new Set();
    parsed = parsed.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
    });

    localStorage.setItem("recently_viewed_" + getCurrentUser(), JSON.stringify(parsed));
    return parsed;
}

function clearRecentlyViewedIfNoPapers() {
    // Only clear if papers are confirmed loaded AND truly empty
    if (Array.isArray(window.appState.papers) && window.appState.papers.length === 0) {
        // Don't wipe — user may have just logged in fresh. Only clear if no papers at all.
        // localStorage.removeItem('recently_viewed_' + getCurrentUser());
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
        const timeAgo = paper.lastViewed ? new Date(paper.lastViewed).toLocaleString() : '';
        const prog = formatProgress(paper.progress);
        container.innerHTML += `
            <div class="recommendation-card" style="position: relative; padding: 1rem 1.2rem;">
                <button type="button" onclick="removeRecentItem(${paper.id})" style="position: absolute; top: 0.6rem; right: 0.6rem; border: none; background: transparent; color: var(--text-soft); cursor: pointer; font-size: 0.85rem;" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
                <div class="rec-title" style="padding-right: 1.5rem; margin-bottom: 0.4rem;">${paper.title}</div>
                ${timeAgo ? `<div style="font-size: 0.72rem; color: var(--text-soft);">${timeAgo}</div>` : ''}
                <div style="margin-top: 0.6rem; display: flex; align-items: center; gap: 0.6rem;">
                    <div style="flex:1; background: var(--bg-muted); border-radius: 999px; height: 6px; overflow: hidden;">
                        <div style="width:${prog}%; height:100%; background: linear-gradient(90deg, var(--accent), var(--accent-alt)); border-radius: inherit;"></div>
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent); min-width: 2.5rem; text-align: right;">${prog}%</span>
                </div>
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
        <div class="header-left"></div>
        <div class="user-profile">
            <span style="color:var(--text-muted)">Welcome, <span style="color:var(--text)">${user}</span></span>
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

// ===== THEME (light / dark) =====
function getTheme() {
    return localStorage.getItem('theme') || 'light';
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    // Update every toggle button icon on the page
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
}

// Apply saved theme immediately (before paint)
applyTheme(getTheme());
document.addEventListener('DOMContentLoaded', () => applyTheme(getTheme()));
