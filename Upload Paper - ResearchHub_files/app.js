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

function getPapers() {
    const user = getCurrentUser();
    const data = localStorage.getItem("papers_" + user);
    if (!data) {
        // Initialize with recommended mock papers for demonstration
        const mockPapers = [
            {
                id: 1,
                title: "Attention Is All You Need",
                author: "Ashish Vaswani et al.",
                year: 2017,
                domain: "AI / Deep Learning",
                timeToRead: "45 mins",
                difficulty: "Advanced",
                status: "Completed",
                progress: 100,
                shortSummary: "Introduces the Transformer architecture based on attention mechanisms.",
                detailedSummary: "The Transformer architecture eschews recurrence in favor of self-attention, allowing for massive parallelization and state-of-the-art results on translation tasks. It relies entirely on an attention mechanism to draw global dependencies between input and output.",
                keyPoints: ["Replaces RNNs/LSTMs with self-attention", "Multi-head attention mechanism", "Highly parallelizable", "State-of-the-art in NLP"],
                isFavorite: true,
                timestamp: Date.now() - 100000
            },
            {
                id: 2,
                title: "Clean Code",
                author: "Robert C. Martin",
                year: 2008,
                domain: "Software Engineering",
                timeToRead: "2 hours",
                difficulty: "Beginner",
                status: "In Progress",
                progress: 40,
                shortSummary: "A guide to writing readable, maintainable, and clean software.",
                detailedSummary: "",
                keyPoints: [],
                isFavorite: false,
                timestamp: Date.now() - 50000
            }
        ];
        localStorage.setItem("papers_" + user, JSON.stringify(mockPapers));
        return mockPapers;
    }
    return JSON.parse(data);
}

function savePapers(papers) {
    const user = getCurrentUser();
    localStorage.setItem("papers_" + user, JSON.stringify(papers));
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
    return data ? JSON.parse(data) : [];
}

function addRecentlyViewed(paper) {
    let recent = getRecentlyViewedPapers();
    // remove if exists to push to front
    recent = recent.filter(p => p.id !== paper.id);
    recent.unshift(paper);
    if (recent.length > 5) recent.pop();
    localStorage.setItem("recently_viewed_" + getCurrentUser(), JSON.stringify(recent));
}

// Ensure the UI is rendered professionally
function renderAppShell() {
    // Prevent multiple renderings
    if(document.querySelector('.app-layout')) return;

    const bodyChildren = Array.from(document.body.childNodes);
    
    // Create new layout wrapper
    const layout = document.createElement('div');
    layout.className = 'app-layout';

    // Create Sidebar
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

    // Create Main Content
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Create Header
    const user = getCurrentUser();
    const header = document.createElement('div');
    header.className = 'top-header';
    header.innerHTML = `
        <div class="header-search"></div>
        <div class="user-profile">
            <span style="color:var(--text-muted)">Welcome, <span style="color:#fff">${user}</span></span>
            <div class="avatar">${user.charAt(0).toUpperCase()}</div>
        </div>
    `;

    mainContent.appendChild(header);

    // Filter out script tags used for rendering
    const contentNodes = bodyChildren.filter(node => {
        if(node.tagName === 'SCRIPT' && node.innerHTML.includes('checkAuth')) return false;
        if(node.tagName === 'SCRIPT' && node.innerHTML.includes('renderAppShell')) return false;
        return true;
    });

    contentNodes.forEach(node => mainContent.appendChild(node));

    layout.appendChild(sidebar);
    layout.appendChild(mainContent);

    // Clear body and append layout
    document.body.innerHTML = '';
    document.body.appendChild(layout);
}

// Show a toast message for actions
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
