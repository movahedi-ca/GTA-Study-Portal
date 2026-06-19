/**
 * GTA College Programs Guide
 * Client-Side Application Logic
 */

const initApp = () => {
    initTheme();
    initDisclaimer();
    fetchAndRenderPrograms();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

let programsData = [];
let campusesSet = new Set();

// Theme Management
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    // Safe storage access to prevent iframe cross-origin SecurityErrors
    const safeGetItem = (storage, key) => {
        try { return storage.getItem(key); } catch (e) { return null; }
    };
    const safeSetItem = (storage, key, value) => {
        try { storage.setItem(key, value); } catch (e) {}
    };

    // Check local storage or system preference
    const savedTheme = safeGetItem(localStorage, 'theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
            safeSetItem(localStorage, 'theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
            safeSetItem(localStorage, 'theme', 'light');
        }
    };

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setTheme(true);
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setTheme(!isDark);
    });
}

// Disclaimer Dismissal
function initDisclaimer() {
    const banner = document.getElementById('disclaimer-banner');
    const dismissBtn = document.getElementById('dismiss-banner');
    
    // Check session storage (reappears each session per reqs)
    try {
        if (sessionStorage.getItem('disclaimerDismissed')) {
            if (banner) banner.classList.add('dismissed');
        }
    } catch (e) { /* ignore security error in iframes */ }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            if (banner) banner.classList.add('dismissed');
            try { sessionStorage.setItem('disclaimerDismissed', 'true'); } catch (e) {}
        });
    }
}

// Data Fetching and Initialization
async function fetchAndRenderPrograms() {
    try {
        const response = await fetch('programs.json');
        if (!response.ok) throw new Error('Data load failed');
        
        const data = await response.json();
        programsData = data.programs;
        const excludedData = data.excluded || [];
        
        extractCampuses();
        renderAppendix(excludedData);
        generateJSONLD();
        
        setupIntersectionObserver();
        
        // Initial render
        filterAndRender();
        initFilterListeners();
        
        // Hide initial loader
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => loader.remove(), 500);
        }
        
    } catch (error) {
        document.getElementById('programs-grid').innerHTML = 
            `<div class="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200">Error loading programs data. Please ensure you are serving this via a local server (e.g., live server) or check console for details.</div>`;
        console.error(error);
        
        const loader = document.getElementById('initial-loader');
        if (loader) loader.remove();
    }
}

// Dynamic Campus Extraction
function extractCampuses() {
    programsData.forEach(p => {
        // Handle comma separated campuses ("Davis, Trafalgar")
        const split = p.campus.split(',').map(c => c.trim());
        split.forEach(c => campusesSet.add(c));
    });
    
    const campusFilter = document.getElementById('campus-filter');
    Array.from(campusesSet).sort().forEach(campus => {
        const option = document.createElement('option');
        option.value = campus;
        option.textContent = campus;
        campusFilter.appendChild(option);
    });
}

// Filtering Logic
function initFilterListeners() {
    const elements = ['search-input', 'college-filter', 'campus-filter', 'credential-filter', 'cip-filter', 'intake-filter'];
    elements.forEach(id => {
        document.getElementById(id).addEventListener('input', filterAndRender);
    });
}

function filterAndRender() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const college = document.getElementById('college-filter').value;
    const campus = document.getElementById('campus-filter').value;
    const credential = document.getElementById('credential-filter').value;
    const cipPrefix = document.getElementById('cip-filter').value;
    const intake = document.getElementById('intake-filter').value;

    const filtered = programsData.filter(p => {
        // Text search across title and description
        const textMatch = p.title.toLowerCase().includes(search) || p.description.toLowerCase().includes(search);
        
        const collegeMatch = college === 'all' || p.college === college;
        const campusMatch = campus === 'all' || p.campus.includes(campus);
        const credentialMatch = credential === 'all' || p.credential === credential;
        const cipMatch = cipPrefix === 'all' || p.cip_code.startsWith(cipPrefix);
        const intakeMatch = intake === 'all' || (p.intakes && p.intakes.includes(intake));

        return textMatch && collegeMatch && campusMatch && credentialMatch && cipMatch && intakeMatch;
    });

    renderGrid(filtered);
    
    document.getElementById('results-count').textContent = `Showing ${filtered.length} program${filtered.length !== 1 ? 's' : ''}`;
}

// Rendering
function getCollegeColors(collegeName) {
    // Return CSS border colors for themes
    const name = collegeName.toLowerCase();
    if (name.includes('sheridan')) return { border: 'var(--color-sheridan)', bg: 'rgba(0, 90, 156, 0.1)', text: 'var(--color-sheridan)' };
    if (name.includes('seneca')) return { border: 'var(--color-seneca)', bg: 'rgba(211, 47, 47, 0.1)', text: 'var(--color-seneca)' };
    if (name.includes('humber')) return { border: 'var(--color-humber)', bg: 'rgba(0, 76, 108, 0.1)', text: 'var(--color-humber)' };
    if (name.includes('george brown')) return { border: 'var(--color-georgebrown)', bg: 'rgba(0, 45, 98, 0.1)', text: 'var(--color-georgebrown)' };
    if (name.includes('centennial')) return { border: 'var(--color-centennial)', bg: 'rgba(0, 100, 0, 0.1)', text: 'var(--color-centennial)' };
    return { border: 'var(--border-color)', bg: 'transparent', text: 'inherit' };
}

function buildCIPLink(cipCode) {
    // Base classification per requirements
    // Deep links could be constructed, but using the base with the code shown is requested pattern if ambiguous
    const baseUrl = "https://www23.statcan.gc.ca/imdb/p3VD.pl?Function=getVD&TVD=1366022";
    return `<a href="${baseUrl}" target="_blank" rel="noopener" class="cip-link" aria-label="StatCan CIP 2021 Reference for ${cipCode}">${cipCode}</a>`;
}

function renderGrid(programs) {
    const grid = document.getElementById('programs-grid');
    grid.innerHTML = '';
    
    if (programs.length === 0) {
        grid.innerHTML = `
            <div class="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                <svg class="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <h3 class="text-sm font-bold text-slate-800 mb-1">No programs found</h3>
                <p class="text-xs text-slate-500 max-w-sm">We couldn't find any programs matching your current filters. Try adjusting your search or clearing the filters.</p>
            </div>
        `;
        return;
    }

    programs.forEach((p, index) => {
        const colors = getCollegeColors(p.college);
        const card = document.createElement('article');
        card.className = 'program-card';
        card.style.borderTopColor = colors.border;
        card.style.transitionDelay = `${(index % 12) * 50}ms`;
        
        // Generate anchor ID for clean URLs
        const safeId = `${p.college.toLowerCase().replace(/\s+/g, '-')}-${p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        card.id = safeId;

        const programNameEl = p.url && p.url !== 'Unknown' 
            ? `<a href="${p.url}" target="_blank" rel="noopener" style="color: inherit; text-decoration: none;"><span class="hover-underline">${p.title}</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px; vertical-align: middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>`
            : p.title;

        card.innerHTML = `
            <div class="card-header">
                <div class="college-badge" style="background-color: ${colors.bg}; color: ${colors.text}; border-color: ${colors.border}40;">
                    ${p.college}
                </div>
                <h3>${programNameEl}</h3>
                
                <div class="meta-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>${p.campus}</span>
                </div>
                
                <div class="meta-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                    <span>${p.credential} (${p.duration})</span>
                </div>

                <div class="meta-row" style="margin-top: 0.5rem;">
                    <span class="status-pill">${p.pgwp_status} Profile</span>
                    <span style="margin-left: auto;">CIP: ${buildCIPLink(p.cip_code)}</span>
                </div>
            </div>
            
            <div class="card-body">
                <p class="desc">${p.description}</p>
                
                <button class="details-toggle" aria-expanded="false" aria-controls="details-${safeId}">
                    View Full Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                
                <div id="details-${safeId}" class="details-content">
                    <div class="details-inner">
                        <h4>Admission Requirements</h4>
                        <ul>
                            ${p.admission_requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                        
                        <h4>Career Outlook</h4>
                        <p style="margin-bottom: 0.5rem;"><strong>Sample Roles:</strong> ${p.career_outlook.titles.join(', ')}</p>
                        <p>${p.career_outlook.outlook}</p>
                        
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 0.5rem;">
                            Data Verified: ${p.last_verified}
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
        if (observer) {
            observer.observe(card);
        }
        
        // Accordion functionality
        const toggleBtn = card.querySelector('.details-toggle');
        const content = card.querySelector('.details-content');
        const svg = toggleBtn.querySelector('svg');
        
        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                content.classList.remove('expanded');
                toggleBtn.setAttribute('aria-expanded', 'false');
                svg.style.transform = 'rotate(0deg)';
            } else {
                content.classList.add('expanded');
                toggleBtn.setAttribute('aria-expanded', 'true');
                svg.style.transform = 'rotate(180deg)';
            }
        });
    });

    // Re-trigger intersection observers
    if (observer) {
        document.querySelectorAll('.program-card').forEach(el => observer.observe(el));
    }
}

function renderAppendix(excludedPrograms) {
    const list = document.getElementById('excluded-list');
    if (!excludedPrograms || excludedPrograms.length === 0) {
        list.innerHTML = '<li><span class="reason">No exclusions noted in this dataset.</span></li>';
        return;
    }
    
    excludedPrograms.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${p.title}</strong> (${p.college}) <span class="reason">${p.reason}</span>`;
        list.appendChild(li);
    });
}

// Intersection Observer for Scroll Fade-Ins
let observer;
function setupIntersectionObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);
}

// Generate JSON-LD Structured Data
function generateJSONLD() {
    const container = document.getElementById('structured-data-container');
    const coursesLD = programsData.map(p => {
        return {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": p.title,
            "description": p.description,
            "provider": {
                "@type": "CollegeOrUniversity",
                "name": p.college,
                "sameAs": p.college === 'Sheridan' ? "https://www.sheridancollege.ca" : 
                          p.college === 'Seneca' ? "https://www.senecapolytechnic.ca" :
                          p.college === 'Humber' ? "https://humber.ca" : "https://www.georgebrown.ca"
            },
            "educationalCredentialAwarded": p.credential,
            "occupationalCredentialAwarded": "PGWP Eligible",
            "timeRequired": p.duration
        };
    });

    const scriptContext = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": coursesLD.map((course, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": course
        }))
    };

    container.textContent = JSON.stringify(scriptContext);
}
