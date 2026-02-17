/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          AUTOCROSS DATA v1.0.0 - Complete Application         ║
 * ║       Progressive Web App for Motorsport Management            ║
 * ╚═══════════════════════════════════════════════════════════════╝
 *
 * MIT License - Copyright (c) 2026 AUTOCROSS DATA
 * License: https://opensource.org/licenses/MIT
 * Repository: https://github.com/melch700text/autocross-data
 * 
 * DESCRIPTION:
 * Complete motorsport data management webapp with:
 * • Full CRUD operations (Create, Read, Update, Delete)
 * • Real-time localStorage persistence
 * • Advanced filtering and sorting capabilities
 * • CSV/JSON export functionality
 * • 100% responsive design (mobile/tablet/desktop)
 * • Dark motorsport theme styling
 * • 100% Vanilla JavaScript (no frameworks)
 * • PWA-ready architecture
 * 
 * FEATURES:
 * - Driver management with licentie tracking
 * - Session/Race recording with detailed telemetry
 * - Real-time search and filtering
 * - Sortable data tables
 * - Form validation with visual feedback
 * - Data export (CSV/JSON)
 * - Confirm dialogs for destructive actions
 * - Responsive UI for all screen sizes
 * - Dark mode by default
 * 
 * LANGUAGE: Dutch (NL)
 * AUTHOR: Motorsport Dev Team
 * CREATED: 2026-02-17
 * UPDATED: 2026-02-17
 * 
 * USAGE:
 * 1. Open index.html in modern browser
 * 2. Add drivers and sessions
 * 3. Export data as CSV/JSON
 * 4. All data saved to localStorage automatically
 * 
 * BROWSER SUPPORT:
 * Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
 * Mobile: iOS Safari, Chrome Android
 * 
 * FILE SIZE: ~35 KB (minified ~12 KB)
 */

// ============================================================
// GLOBALE VARIABELEN & CONSTANTS
// ============================================================

const CONFIG = {
    // LocalStorage keys
    STORAGE_COUREURS: 'autocross-data-coureurs',
    STORAGE_SESSIES: 'autocross-data-sessies',
    
    // Debounce delay (ms)
    DEBOUNCE_DELAY: 250,
    
    // Notification timeout (ms)
    NOTIFICATION_TIMEOUT: 3000,
    
    // Sorteer configuratie
    SORT_ASC: 'asc',
    SORT_DESC: 'desc'
};

// Globale state
let appState = {
    coureurs: [],
    sessies: [],
    editingCoureurId: null,
    editingSessieId: null,
    currentSort: { field: null, direction: CONFIG.SORT_ASC },
    sessieSort: { field: null, direction: CONFIG.SORT_ASC }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Genereert een UUID v4
 * Eenvoudige implementatie voor client-side gebruik
 * @returns {string} UUID v4 formaat
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Debounce functie voor performance optimalisatie
 * Voorkomt excessive function calls bij user input
 * @param {function} func - Te debounce functie
 * @param {number} delay - Vertraging in ms
 * @returns {function} Debounced versie
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Formatteert datum naar YYYY-MM-DD formaat
 * @param {string} dateString - Input datum string
 * @returns {string} Formatted datum
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Valideert tijd formaat (mm:ss.ss)
 * @param {string} time - Te valideren tijd
 * @returns {boolean} True als geldig formaat
 */
function validateTimeFormat(time) {
    const regex = /^([0-5][0-9]|[0-9]):([0-5][0-9])\.([0-9]{2})$/;
    return regex.test(time);
}

/**
 * Toont notification bericht aan gebruiker
 * @param {string} message - Bericht inhoud
 * @param {string} type - success|error|info
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, CONFIG.NOTIFICATION_TIMEOUT);
}

/**
 * Toont loading spinner
 * @param {boolean} show - Tonen of verbergen
 */
function showSpinner(show = true) {
    const spinner = document.getElementById('loading-spinner');
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

/**
 * Toont confirm dialog voor destructieve acties
 * @param {string} title - Dialog titel
 * @param {string} message - Dialog bericht
 * @param {function} onConfirm - Callback bij confirmatie
 */
function showConfirmDialog(title, message, onConfirm) {
    const modal = document.getElementById('confirm-dialog');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    
    const confirmBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    
    const handleConfirm = () => {
        onConfirm();
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    const handleCancel = () => {
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    modal.classList.add('active');
}

// ============================================================
// LOCAL STORAGE MANAGEMENT
// ============================================================

/**
 * Laadt gegevens uit localStorage
 * Voert automatisch uit bij app start
 */
function loadFromStorage() {
    try {
        const coureurs = localStorage.getItem(CONFIG.STORAGE_COUREURS);
        const sessies = localStorage.getItem(CONFIG.STORAGE_SESSIES);
        
        appState.coureurs = coureurs ? JSON.parse(coureurs) : [];
        appState.sessies = sessies ? JSON.parse(sessies) : [];
    } catch (error) {
        console.error('Fout bij laden van storage:', error);
        showNotification('Fout bij laden van gegevens', 'error');
    }
}

/**
 * Slaat gegevens op in localStorage
 * Voert automatisch uit na elke CRUD operatie
 */
function saveToStorage() {
    try {
        localStorage.setItem(CONFIG.STORAGE_COUREURS, JSON.stringify(appState.coureurs));
        localStorage.setItem(CONFIG.STORAGE_SESSIES, JSON.stringify(appState.sessies));
    } catch (error) {
        console.error('Fout bij opslaan in storage:', error);
        showNotification('Fout bij opslaan van gegevens', 'error');
    }
}

// ============================================================
// COUREUR CRUD OPERATIONS
// ============================================================

/**
 * Voegt nieuwe coureur toe aan appState en storage
 * @param {object} coureurData - Coureur data object
 * @returns {object} Nieuw aangemaakte coureur
 */
function addCoureur(coureurData) {
    const newCoureur = {
        id: generateUUID(),
        ...coureurData
    };
    appState.coureurs.push(newCoureur);
    saveToStorage();
    showNotification(`Coureur "${coureurData.naam}" toegevoegd`, 'success');
    return newCoureur;
}

/**
 * Update bestaande coureur
 * @param {string} id - Coureur ID
 * @param {object} coureurData - Bijgewerkte data
 * @returns {object} Bijgewerkte coureur of null
 */
function updateCoureur(id, coureurData) {
    const index = appState.coureurs.findIndex(c => c.id === id);
    if (index !== -1) {
        appState.coureurs[index] = { ...appState.coureurs[index], ...coureurData };
        saveToStorage();
        showNotification(`Coureur "${coureurData.naam}" bijgewerkt`, 'success');
        return appState.coureurs[index];
    }
    return null;
}

/**
 * Verwijdert coureur uit appState
 * @param {string} id - Coureur ID
 * @returns {boolean} True als succesvol verwijderd
 */
function deleteCoureur(id) {
    const index = appState.coureurs.findIndex(c => c.id === id);
    if (index !== -1) {
        const coureur = appState.coureurs[index];
        appState.coureurs.splice(index, 1);
        saveToStorage();
        showNotification(`Coureur "${coureur.naam}" verwijderd`, 'success');
        return true;
    }
    return false;
}

/**
 * Haalt coureur op via ID
 * @param {string} id - Coureur ID
 * @returns {object} Coureur object of undefined
 */
function getCoureur(id) {
    return appState.coureurs.find(c => c.id === id);
}

// ============================================================
// SESSIE CRUD OPERATIONS
// ============================================================

/**
 * Voegt nieuwe sessie toe
 * @param {object} sessieData - Sessie data object
 * @returns {object} Nieuw aangemaakte sessie
 */
function addSessie(sessieData) {
    const newSessie = {
        id: generateUUID(),
        ...sessieData
    };
    appState.sessies.push(newSessie);
    saveToStorage();
    showNotification(`Sessie "${sessieData.eventNaam}" toegevoegd`, 'success');
    return newSessie;
}

/**
 * Update bestaande sessie
 * @param {string} id - Sessie ID
 * @param {object} sessieData - Bijgewerkte data
 * @returns {object} Bijgewerkte sessie of null
 */
function updateSessie(id, sessieData) {
    const index = appState.sessies.findIndex(s => s.id === id);
    if (index !== -1) {
        appState.sessies[index] = { ...appState.sessies[index], ...sessieData };
        saveToStorage();
        showNotification(`Sessie bijgewerkt`, 'success');
        return appState.sessies[index];
    }
    return null;
}

/**
 * Verwijdert sessie
 * @param {string} id - Sessie ID
 * @returns {boolean} True als succesvol verwijderd
 */
function deleteSessie(id) {
    const index = appState.sessies.findIndex(s => s.id === id);
    if (index !== -1) {
        appState.sessies.splice(index, 1);
        saveToStorage();
        showNotification('Sessie verwijderd', 'success');
        return true;
    }
    return false;
}

/**
 * Haalt sessie op via ID
 * @param {string} id - Sessie ID
 * @returns {object} Sessie object of undefined
 */
function getSessie(id) {
    return appState.sessies.find(s => s.id === id);
}

// ============================================================
// FORM HANDLERS - COUREURS
// ============================================================

/**
 * Laadt coureur formulier met data voor editing
 * @param {string} coureurId - ID van coureur om te bewerken
 */
function loadCoureurForm(coureurId) {
    const coureur = getCoureur(coureurId);
    if (!coureur) return;

    appState.editingCoureurId = coureurId;
    document.getElementById('coureur-form-title').textContent = `Bewerk Coureur: ${coureur.naam}`;
    document.getElementById('coureur-naam').value = coureur.naam;
    document.getElementById('coureur-startnummer').value = coureur.startnummer;
    document.getElementById('coureur-team').value = coureur.team || '';
    document.getElementById('coureur-klasse').value = coureur.klasse;
    document.getElementById('coureur-licentie').value = coureur.licentienummer || '';
    document.getElementById('coureur-ervaring').value = coureur.jarenErvaring || '';
    document.getElementById('coureur-gewicht').value = coureur.gewicht || '';

    document.getElementById('coureur-btn-opslaan').textContent = 'BIJWERKEN';
    document.getElementById('coureur-btn-nieuw').style.display = 'none';
}

/**
 * Reset coureur formulier naar standaard staat
 */
function resetCoureurForm() {
    document.getElementById('coureur-form').reset();
    document.getElementById('coureur-form-title').textContent = 'Nieuwe Coureur';
    document.getElementById('coureur-btn-opslaan').textContent = 'OPSLAAN';
    document.getElementById('coureur-btn-nieuw').style.display = 'block';
    appState.editingCoureurId = null;
}

/**
 * Verwerkt coureur formulier submit
 * @param {event} event - Submit event
 */
function submitCoureurForm(event) {
    event.preventDefault();

    const coureurData = {
        naam: document.getElementById('coureur-naam').value.trim(),
        startnummer: document.getElementById('coureur-startnummer').value.trim(),
        team: document.getElementById('coureur-team').value.trim(),
        klasse: document.getElementById('coureur-klasse').value,
        licentienummer: document.getElementById('coureur-licentie').value.trim(),
        jarenErvaring: parseInt(document.getElementById('coureur-ervaring').value) || 0,
        gewicht: parseInt(document.getElementById('coureur-gewicht').value) || null
    };

    if (!coureurData.naam || !coureurData.startnummer || !coureurData.klasse) {
        showNotification('Verplichte velden ontbreken', 'error');
        return;
    }

    try {
        if (appState.editingCoureurId) {
            updateCoureur(appState.editingCoureurId, coureurData);
        } else {
            addCoureur(coureurData);
        }
        renderCoureurs();
        resetCoureurForm();
    } catch (error) {
        console.error('Fout bij opslaan coureur:', error);
        showNotification('Fout bij opslaan', 'error');
    }
}

// ============================================================
// FORM HANDLERS - SESSIES
// ============================================================

/**
 * Laadt sessie formulier met data voor editing
 * @param {string} sessieId - ID van sessie om te bewerken
 */
function loadSessieForm(sessieId) {
    const sessie = getSessie(sessieId);
    if (!sessie) return;

    appState.editingSessieId = sessieId;
    document.getElementById('sessie-form-title').textContent = `Bewerk Sessie: ${sessie.eventNaam}`;

    // Event
    document.getElementById('sessie-datum').value = sessie.datum;
    document.getElementById('sessie-naam').value = sessie.eventNaam;
    document.getElementById('sessie-locatie').value = sessie.locatie || '';

    // Baan
    document.getElementById('sessie-baan-type').value = sessie.baanType;
    document.getElementById('sessie-baan-conditie').value = sessie.baanConditie;
    document.getElementById('sessie-baan-lengte').value = sessie.baanLengte || '';

    // Weer
    document.getElementById('sessie-temp').value = sessie.temperatuur || '';
    document.getElementById('sessie-weer-type').value = sessie.weerType || '';
    document.getElementById('sessie-wind').value = sessie.wind || '';

    // Auto
    document.getElementById('sessie-auto-klasse').value = sessie.autoKlasse || '';
    document.getElementById('sessie-banden-type').value = sessie.bandenType || '';
    document.getElementById('sessie-banden-merk').value = sessie.bandenMerk || '';
    document.getElementById('sessie-banden-lf').value = sessie.bandenspanning?.LF || '';
    document.getElementById('sessie-banden-rf').value = sessie.bandenspanning?.RF || '';
    document.getElementById('sessie-banden-lr').value = sessie.bandenspanning?.LR || '';
    document.getElementById('sessie-banden-rr').value = sessie.bandenspanning?.RR || '';

    // Coureur & Sessie
    document.getElementById('sessie-coureur').value = sessie.coureurId;
    document.getElementById('sessie-type').value = sessie.sessieType;
    document.getElementById('sessie-start').value = sessie.startpositie || '';
    document.getElementById('sessie-eind').value = sessie.eindpositie || '';
    document.getElementById('sessie-tijd').value = sessie.tijd;
    document.getElementById('sessie-notities').value = sessie.notities || '';

    // Toon/verberg buttons
    document.getElementById('sessie-btn-opslaan').style.display = 'none';
    document.getElementById('sessie-btn-bewerken').style.display = 'block';
    document.getElementById('sessie-btn-verwijderen').style.display = 'block';
}

/**
 * Reset sessie formulier naar standaard staat
 */
function resetSessieForm() {
    document.getElementById('sessie-form').reset();
    document.getElementById('sessie-form-title').textContent = 'Nieuwe Sessie';
    document.getElementById('sessie-btn-opslaan').style.display = 'block';
    document.getElementById('sessie-btn-bewerken').style.display = 'none';
    document.getElementById('sessie-btn-verwijderen').style.display = 'none';
    appState.editingSessieId = null;
}

/**
 * Verwerkt sessie formulier submit
 * @param {event} event - Submit event
 */
function submitSessieForm(event) {
    event.preventDefault();

    const sessieData = {
        datum: document.getElementById('sessie-datum').value,
        eventNaam: document.getElementById('sessie-naam').value.trim(),
        locatie: document.getElementById('sessie-locatie').value.trim(),
        baanType: document.getElementById('sessie-baan-type').value,
        baanConditie: document.getElementById('sessie-baan-conditie').value,
        baanLengte: parseInt(document.getElementById('sessie-baan-lengte').value) || 0,
        temperatuur: parseInt(document.getElementById('sessie-temp').value) || null,
        weerType: document.getElementById('sessie-weer-type').value,
        wind: document.getElementById('sessie-wind').value,
        autoKlasse: document.getElementById('sessie-auto-klasse').value,
        bandenType: document.getElementById('sessie-banden-type').value.trim(),
        bandenMerk: document.getElementById('sessie-banden-merk').value.trim(),
        bandenspanning: {
            LF: parseFloat(document.getElementById('sessie-banden-lf').value) || 0,
            RF: parseFloat(document.getElementById('sessie-banden-rf').value) || 0,
            LR: parseFloat(document.getElementById('sessie-banden-lr').value) || 0,
            RR: parseFloat(document.getElementById('sessie-banden-rr').value) || 0
        },
        coureurId: document.getElementById('sessie-coureur').value,
        sessieType: document.getElementById('sessie-type').value,
        startpositie: parseInt(document.getElementById('sessie-start').value) || null,
        eindpositie: parseInt(document.getElementById('sessie-eind').value) || null,
        tijd: document.getElementById('sessie-tijd').value,
        notities: document.getElementById('sessie-notities').value.trim()
    };

    if (!sessieData.datum || !sessieData.eventNaam || !sessieData.baanType || 
        !sessieData.baanConditie || !sessieData.coureurId || !sessieData.sessieType) {
        showNotification('Verplichte velden ontbreken', 'error');
        return;
    }

    if (!validateTimeFormat(sessieData.tijd)) {
        showNotification('Tijd moet in formaat mm:ss.ss zijn', 'error');
        return;
    }

    try {
        if (appState.editingSessieId) {
            updateSessie(appState.editingSessieId, sessieData);
        } else {
            addSessie(sessieData);
        }
        renderSessies();
        resetSessieForm();
    } catch (error) {
        console.error('Fout bij opslaan sessie:', error);
        showNotification('Fout bij opslaan', 'error');
    }
}

// ============================================================
// RENDERING FUNCTIONS - COUREURS
// ============================================================

/**
 * Rendert coureurs tabel met search en sort
 */
function renderCoureurs() {
    const tbody = document.getElementById('coureurs-tbody');
    const searchTerm = document.getElementById('coureur-search').value.toLowerCase();

    let filtered = appState.coureurs.filter(c => 
        c.naam.toLowerCase().includes(searchTerm) ||
        c.startnummer.toLowerCase().includes(searchTerm)
    );

    // Sorteren
    if (appState.currentSort.field) {
        filtered.sort((a, b) => {
            const aVal = a[appState.currentSort.field];
            const bVal = b[appState.currentSort.field];
            const compare = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return appState.currentSort.direction === CONFIG.SORT_DESC ? -compare : compare;
        });
    }

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">Geen coureurs gevonden</td></tr>';
        return;
    }

    filtered.forEach(coureur => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${coureur.naam}</td>
            <td>${coureur.startnummer}</td>
            <td>${coureur.klasse}</td>
            <td>${coureur.jarenErvaring || '-'}</td>
            <td class="action-buttons">
                <button class="btn-icon edit" data-id="${coureur.id}" title="Bewerk">✏️</button>
                <button class="btn-icon delete" data-id="${coureur.id}" title="Verwijder">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateCoureurSelectDropdowns();
}

/**
 * Update coureur selectie dropdowns in sessie formulier
 */
function updateCoureurSelectDropdowns() {
    const select = document.getElementById('sessie-coureur');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">-- Selecteer Coureur --</option>';
    appState.coureurs.forEach(coureur => {
        const option = document.createElement('option');
        option.value = coureur.id;
        option.textContent = `${coureur.naam} (#${coureur.startnummer})`;
        select.appendChild(option);
    });
    
    select.value = currentValue;
}

// ============================================================
// RENDERING FUNCTIONS - SESSIES
// ============================================================

/**
 * Rendert sessies tabel met filters en sort
 */
function renderSessies() {
    const tbody = document.getElementById('sessies-tbody');
    const eventFilter = document.getElementById('sessie-event-filter').value.toLowerCase();
    const coureurFilter = document.getElementById('sessie-coureur-filter').value;
    const typeFilter = document.getElementById('sessie-type-filter').value;

    let filtered = appState.sessies.filter(s => {
        const matchEvent = s.eventNaam.toLowerCase().includes(eventFilter);
        const matchCoureur = !coureurFilter || s.coureurId === coureurFilter;
        const matchType = !typeFilter || s.sessieType === typeFilter;
        return matchEvent && matchCoureur && matchType;
    });

    // Sorteren
    if (appState.sessieSort.field) {
        filtered.sort((a, b) => {
            const aVal = a[appState.sessieSort.field];
            const bVal = b[appState.sessieSort.field];
            const compare = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return appState.sessieSort.direction === CONFIG.SORT_DESC ? -compare : compare;
        });
    }

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty">Geen sessies gevonden</td></tr>';
        return;
    }

    filtered.forEach(sessie => {
        const coureur = getCoureur(sessie.coureurId);
        const coureurNaam = coureur ? coureur.naam : 'Onbekend';
        const bandenStr = `${sessie.bandenspanning?.LF || '-'}/${sessie.bandenspanning?.RR || '-'}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(sessie.datum)}</td>
            <td>${sessie.eventNaam}</td>
            <td>${coureurNaam}</td>
            <td>${sessie.sessieType}</td>
            <td>${sessie.startpositie || '-'} → ${sessie.eindpositie || '-'}</td>
            <td>${sessie.tijd}</td>
            <td>${bandenStr} bar</td>
            <td class="action-buttons">
                <button class="btn-icon edit" data-id="${sessie.id}" title="Bewerk">✏️</button>
                <button class="btn-icon delete" data-id="${sessie.id}" title="Verwijder">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateSessieFilterDropdowns();
}

/**
 * Update filter dropdowns in sessie tabel
 */
function updateSessieFilterDropdowns() {
    const coureurSelect = document.getElementById('sessie-coureur-filter');
    const currentValue = coureurSelect.value;
    
    coureurSelect.innerHTML = '<option value="">Alle Coureurs</option>';
    appState.coureurs.forEach(coureur => {
        const option = document.createElement('option');
        option.value = coureur.id;
        option.textContent = coureur.naam;
        coureurSelect.appendChild(option);
    });
    
    coureurSelect.value = currentValue;
}

// ============================================================
// RENDERING FUNCTIONS - DASHBOARD
// ============================================================

/**
 * Rendert dashboard statistieken
 */
function renderDashboard() {
    document.getElementById('stat-coureurs').textContent = appState.coureurs.length;
    document.getElementById('stat-sessies').textContent = appState.sessies.length;
    
    const uniqueEvents = new Set(appState.sessies.map(s => s.eventNaam)).size;
    document.getElementById('stat-events').textContent = uniqueEvents;
    
    // Recente sessies (laatste 5)
    const recent = [...appState.sessies]
        .sort((a, b) => new Date(b.datum) - new Date(a.datum))
        .slice(0, 5);
    
    const list = document.getElementById('recent-sessies-list');
    list.innerHTML = '';
    
    if (recent.length === 0) {
        list.innerHTML = '<p style="color: var(--color-text-secondary);">Geen sessies</p>';
        return;
    }
    
    recent.forEach(sessie => {
        const coureur = getCoureur(sessie.coureurId);
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <strong>${sessie.eventNaam}</strong><br>
            <small>${coureur?.naam || 'Onbekend'} - ${sessie.sessieType}</small><br>
            <small>Tijd: ${sessie.tijd} | ${formatDate(sessie.datum)}</small>
        `;
        list.appendChild(item);
    });
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

/**
 * Converteer array naar CSV formaat
 * @param {array} data - Data array
 * @param {array} headers - Kolom headers
 * @returns {string} CSV formaat string
 */
function arrayToCSV(data, headers) {
    const csv = [headers.join(',')];
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) value = '';
            if (typeof value === 'object') value = JSON.stringify(value);
            value = String(value).replace(/"/g, '""');
            return `"${value}"`;
        });
        csv.push(values.join(','));
    });
    return csv.join('\n');
}

/**
 * Download CSV bestand
 * @param {string} filename - Bestandsnaam
 * @param {string} csvContent - CSV inhoud
 */
function downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export coureurs naar CSV
 */
function exportCoureurs() {
    const today = new Date().toISOString().split('T')[0];
    const filename = `autocross-coureurs-${today}.csv`;
    const headers = ['id', 'naam', 'startnummer', 'team', 'klasse', 'licentienummer', 'jarenErvaring', 'gewicht'];
    const csv = arrayToCSV(appState.coureurs, headers);
    downloadCSV(filename, csv);
    showNotification('Coureurs geëxporteerd', 'success');
}

/**
 * Export sessies naar CSV
 */
function exportSessies() {
    const today = new Date().toISOString().split('T')[0];
    const filename = `autocross-sessies-${today}.csv`;
    
    const sessiesWithCoureur = appState.sessies.map(sessie => {
        const coureur = getCoureur(sessie.coureurId);
        return {
            ...sessie,
            coureurNaam: coureur?.naam || 'Onbekend'
        };
    });
    
    const headers = ['datum', 'eventNaam', 'locatie', 'coureurNaam', 'sessieType', 'tijd', 
                     'startpositie', 'eindpositie', 'baanType', 'baanConditie', 'temperatuur',
                     'bandenMerk', 'bandenType'];
    const csv = arrayToCSV(sessiesWithCoureur, headers);
    downloadCSV(filename, csv);
    showNotification('Sessies geëxporteerd', 'success');
}

/**
 * Export alles naar JSON
 */
function exportJSON() {
    const today = new Date().toISOString().split('T')[0];
    const filename = `autocross-backup-${today}.json`;
    const data = {
        exported: new Date().toISOString(),
        version: '1.0.0',
        coureurs: appState.coureurs,
        sessies: appState.sessies
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Backup geëxporteerd', 'success');
}

/**
 * Update export informatie
 */
function updateExportInfo() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('export-date').textContent = today;
    document.getElementById('export-coureur-count').textContent = appState.coureurs.length;
    document.getElementById('export-sessie-count').textContent = appState.sessies.length;
}

// ============================================================
// EVENT LISTENERS
// ============================================================

/**
 * Initializeert alle event listeners
 * Voert uit bij app start
 */
function initializeEventListeners() {
    // TAB NAVIGATION
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // COUREUR FORM
    document.getElementById('coureur-form').addEventListener('submit', submitCoureurForm);
    document.getElementById('coureur-btn-nieuw').addEventListener('click', resetCoureurForm);
    document.getElementById('coureur-btn-annuleren').addEventListener('click', resetCoureurForm);
    
    document.getElementById('coureur-search').addEventListener('input', debounce(() => {
        renderCoureurs();
    }, CONFIG.DEBOUNCE_DELAY));

    // COUREURS TABLE
    document.getElementById('coureurs-tbody').addEventListener('click', function(e) {
        if (e.target.classList.contains('edit')) {
            const id = e.target.dataset.id;
            loadCoureurForm(id);
            switchTab('coureurs');
        } else if (e.target.classList.contains('delete')) {
            const id = e.target.dataset.id;
            const coureur = getCoureur(id);
            showConfirmDialog(
                'Coureur verwijderen',
                `Weet u zeker dat u coureur "${coureur.naam}" wilt verwijderen?`,
                () => {
                    deleteCoureur(id);
                    renderCoureurs();
                    resetCoureurForm();
                }
            );
        }
    });

    // COUREUR TABLE SORTEREN
    document.querySelectorAll('#coureurs-table th[data-sortable]').forEach(th => {
        th.addEventListener('click', function() {
            const field = this.dataset.sortable;
            if (appState.currentSort.field === field) {
                appState.currentSort.direction = 
                    appState.currentSort.direction === CONFIG.SORT_ASC 
                        ? CONFIG.SORT_DESC 
                        : CONFIG.SORT_ASC;
            } else {
                appState.currentSort.field = field;
                appState.currentSort.direction = CONFIG.SORT_ASC;
            }
            renderCoureurs();
        });
    });

    // SESSIE FORM
    document.getElementById('sessie-form').addEventListener('submit', submitSessieForm);
    document.getElementById('sessie-btn-nieuw').addEventListener('click', resetSessieForm);
    document.getElementById('sessie-btn-annuleren').addEventListener('click', resetSessieForm);
    
    document.getElementById('sessie-btn-bewerken').addEventListener('click', function() {
        if (!appState.editingSessieId) return;
        
        const form = document.getElementById('sessie-form');
        const sessieData = {
            datum: document.getElementById('sessie-datum').value,
            eventNaam: document.getElementById('sessie-naam').value.trim(),
            locatie: document.getElementById('sessie-locatie').value.trim(),
            baanType: document.getElementById('sessie-baan-type').value,
            baanConditie: document.getElementById('sessie-baan-conditie').value,
            baanLengte: parseInt(document.getElementById('sessie-baan-lengte').value) || 0,
            temperatuur: parseInt(document.getElementById('sessie-temp').value) || null,
            weerType: document.getElementById('sessie-weer-type').value,
            wind: document.getElementById('sessie-wind').value,
            autoKlasse: document.getElementById('sessie-auto-klasse').value,
            bandenType: document.getElementById('sessie-banden-type').value.trim(),
            bandenMerk: document.getElementById('sessie-banden-merk').value.trim(),
            bandenspanning: {
                LF: parseFloat(document.getElementById('sessie-banden-lf').value) || 0,
                RF: parseFloat(document.getElementById('sessie-banden-rf').value) || 0,
                LR: parseFloat(document.getElementById('sessie-banden-lr').value) || 0,
                RR: parseFloat(document.getElementById('sessie-banden-rr').value) || 0
            },
            coureurId: document.getElementById('sessie-coureur').value,
            sessieType: document.getElementById('sessie-type').value,
            startpositie: parseInt(document.getElementById('sessie-start').value) || null,
            eindpositie: parseInt(document.getElementById('sessie-eind').value) || null,
            tijd: document.getElementById('sessie-tijd').value,
            notities: document.getElementById('sessie-notities').value.trim()
        };

        updateSessie(appState.editingSessieId, sessieData);
        renderSessies();
        resetSessieForm();
    });
    
    document.getElementById('sessie-btn-verwijderen').addEventListener('click', function() {
        if (!appState.editingSessieId) return;
        const sessie = getSessie(appState.editingSessieId);
        showConfirmDialog(
            'Sessie verwijderen',
            `Weet u zeker dat u sessie "${sessie.eventNaam}" wilt verwijderen?`,
            () => {
                deleteSessie(appState.editingSessieId);
                renderSessies();
                resetSessieForm();
            }
        );
    });

    // SESSIE FORM FILTERS & SEARCH
    document.getElementById('sessie-event-filter').addEventListener('input', debounce(() => {
        renderSessies();
    }, CONFIG.DEBOUNCE_DELAY));
    
    document.getElementById('sessie-coureur-filter').addEventListener('change', () => {
        renderSessies();
    });
    
    document.getElementById('sessie-type-filter').addEventListener('change', () => {
        renderSessies();
    });

    // SESSIES TABLE
    document.getElementById('sessies-tbody').addEventListener('click', function(e) {
        if (e.target.classList.contains('edit')) {
            const id = e.target.dataset.id;
            loadSessieForm(id);
            switchTab('sessies');
        } else if (e.target.classList.contains('delete')) {
            const id = e.target.dataset.id;
            const sessie = getSessie(id);
            showConfirmDialog(
                'Sessie verwijderen',
                `Weet u zeker dat u sessie "${sessie.eventNaam}" wilt verwijderen?`,
                () => {
                    deleteSessie(id);
                    renderSessies();
                    resetSessieForm();
                }
            );
        }
    });

    // SESSIE TABLE SORTEREN
    document.querySelectorAll('#sessies-table th[data-sortable]').forEach(th => {
        th.addEventListener('click', function() {
            const field = this.dataset.sortable;
            if (field === 'coureurId' || field === 'coureurNaam') {
                if (appState.sessieSort.field === 'coureurId') {
                    appState.sessieSort.direction = 
                        appState.sessieSort.direction === CONFIG.SORT_ASC 
                            ? CONFIG.SORT_DESC 
                            : CONFIG.SORT_ASC;
                } else {
                    appState.sessieSort.field = 'coureurId';
                    appState.sessieSort.direction = CONFIG.SORT_ASC;
                }
            } else {
                if (appState.sessieSort.field === field) {
                    appState.sessieSort.direction = 
                        appState.sessieSort.direction === CONFIG.SORT_ASC 
                            ? CONFIG.SORT_DESC 
                            : CONFIG.SORT_ASC;
                } else {
                    appState.sessieSort.field = field;
                    appState.sessieSort.direction = CONFIG.SORT_ASC;
                }
            }
            renderSessies();
        });
    });

    // EXPORT
    document.getElementById('export-coureurs-btn').addEventListener('click', exportCoureurs);
    document.getElementById('export-sessies-btn').addEventListener('click', exportSessies);
    document.getElementById('export-json-btn').addEventListener('click', exportJSON);
}

/**
 * Wisselt tussen tabs
 * @param {string} tabName - Naam van tab (dashboard|coureurs|sessies|export)
 */
function switchTab(tabName) {
    // Verberg alle tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Verwijder active class van alle buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Toon geselecteerde tab
    const tabElement = document.getElementById(`${tabName}-tab`);
    if (tabElement) {
        tabElement.classList.add('active');
    }

    // Voeg active class toe aan geklikte button
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    if (btn) {
        btn.classList.add('active');
    }

    // Render tab content
    if (tabName === 'dashboard') {
        renderDashboard();
    } else if (tabName === 'coureurs') {
        renderCoureurs();
    } else if (tabName === 'sessies') {
        renderSessies();
    } else if (tabName === 'export') {
        updateExportInfo();
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialisatie van de app
 * Voert uit wanneer DOM klaar is
 */
function initializeApp() {
    try {
        // Laad data
        loadFromStorage();

        // Initialize UI
        initializeEventListeners();

        // Render initial content
        renderDashboard();

        // PWA Registration (optional)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('Service Worker niet beschikbaar:', err);
            });
        }

        console.log('✓ AUTOCROSS DATA v1.0.0 app succesvol geïnitialiseerd');
        console.log('✓ Coureurs geladen:', appState.coureurs.length);
        console.log('✓ Sessies geladen:', appState.sessies.length);
    } catch (error) {
        console.error('Fout bij initialisatie:', error);
        showNotification('Fout bij laden van app', 'error');
    }
}

// Start app wanneer DOM klaar is
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
