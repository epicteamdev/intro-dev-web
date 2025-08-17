let myTrips = JSON.parse(localStorage.getItem('mapKeepMyTrips')) || [


    { id: 't1', title: 'Praia do Francês', date: '2024-07-10', state: 'Alagoas', description: 'Dia de sol e mar!', photos: ['https://placehold.co/70x70?text=Praia1'] },


    { id: 't2', title: 'Centro de Palmas', date: '2023-11-05', state: 'Tocantins', description: 'Conhecendo a capital.', photos: ['https://placehold.co/70x70?text=Palmas1', 'https://placehold.co/70x70?text=Palmas2'] },


    { id: 't3', title: 'Pelourinho Visita', date: '2024-01-20', state: 'Bahia', description: 'Cultura e história.', photos: [] }


];

let nextTripId;

if (myTrips.length > 0 && myTrips.some(trip => typeof trip.id === 'string' && trip.id.startsWith('t'))) {
    const maxIdNum = myTrips
        .map(trip => parseInt(trip.id.replace('t', ''), 10))
        .filter(num => !isNaN(num))
        .reduce((max, current) => Math.max(max, current), 0);
    nextTripId = maxIdNum + 1;
} else {
    nextTripId = (myTrips.filter(trip => typeof trip.id === 'string' && trip.id.startsWith('t')).length || 0) + 1;
}

function saveTripsToLocalStorage() {
    localStorage.setItem('mapKeepMyTrips', JSON.stringify(myTrips));
}

const LOGGED_IN_KEY = 'mapKeepLoggedIn';
function isLoggedIn() { return localStorage.getItem(LOGGED_IN_KEY) === 'yes'; }
function setLoginStatus(isNowLoggedIn) {
    if (isNowLoggedIn) localStorage.setItem(LOGGED_IN_KEY, 'yes');
    else localStorage.removeItem(LOGGED_IN_KEY);
}

let currentOpenModalId = null;
function showModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        modalElement.classList.remove('hidden');
        currentOpenModalId = modalId;
        document.body.style.overflow = 'hidden';
    }
}
function hideModal() {
    if (currentOpenModalId) {
        const modalElement = document.getElementById(currentOpenModalId);
        if (modalElement) modalElement.classList.add('hidden');
        currentOpenModalId = null;
        document.body.style.overflow = '';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const bodyId = document.body.id;

    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('close-modal-button')) {
            hideModal();
        }
        if (event.target.classList.contains('modal-backdrop')) {
            if (currentOpenModalId && event.target.id === currentOpenModalId) {
                hideModal();
            }
        }
    });

    if (bodyId === 'login-page-body') {
        if (isLoggedIn()) { window.location.href = 'trips.html'; return; }
        const loginBtn = document.getElementById('login-button');
        if (loginBtn) {
            loginBtn.onclick = () => { setLoginStatus(true); window.location.href = 'trips.html'; };
        }
    } else {
        if (!isLoggedIn()) { window.location.href = 'login.html'; return; }

        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.onclick = () => { setLoginStatus(false); window.location.href = 'login.html'; };
        }
        const userGreetingEl = document.getElementById('user-greeting');
        if(userGreetingEl) userGreetingEl.textContent = 'Olá!';

        if (bodyId === 'timeline-page-body') initTimelinePage();
        else if (bodyId === 'map-page-body') initMapPage();
    }
});

function initTimelinePage() {
    setActiveNavLink('trips.html');
    renderTripListForTimeline();

    const fabTimeline = document.getElementById('add-trip-fab');
    const addTripModalOnTimeline = document.getElementById('add-trip-modal');

    if (fabTimeline && addTripModalOnTimeline) {
        fabTimeline.onclick = () => {
            setupAndShowAddEditModal(addTripModalOnTimeline.id, null, null, renderTripListForTimeline);
        };
    }

    const detailModalOnTimeline = document.getElementById('trip-detail-modal');
    if (detailModalOnTimeline) {
        const editButton = detailModalOnTimeline.querySelector('#edit-trip-from-detail-button');
        const deleteButton = detailModalOnTimeline.querySelector('#delete-trip-button');

        if(editButton && addTripModalOnTimeline){
            editButton.onclick = function() {
                const tripId = this.dataset.tripId;
                const tripToEdit = myTrips.find(t => t.id === tripId);
                if (tripToEdit) {
                    hideModal();
                    setupAndShowAddEditModal(addTripModalOnTimeline.id, tripToEdit, null, renderTripListForTimeline);
                }
            };
        }
        if(deleteButton){
            deleteButton.onclick = function() {
                const tripId = this.dataset.tripId;
                if (confirm('Tem certeza que deseja excluir esta viagem?')) {
                    myTrips = myTrips.filter(t => t.id !== tripId);
                    saveTripsToLocalStorage();
                    hideModal();
                    renderTripListForTimeline();
                    window.location.reload();
                }
            };
        }
    }
}

function renderTripListForTimeline() {
    const container = document.getElementById('trip-list-container');
    const noTripsMsg = document.querySelector('#timeline-page-body .no-trips-message');
    if (!container || !noTripsMsg) return;

    const sortedTrips = [...myTrips].sort((a, b) => b.date.localeCompare(a.date));
    noTripsMsg.classList.toggle('hidden', sortedTrips.length > 0);
    container.innerHTML = sortedTrips.length > 0 ? sortedTrips.map(createTripCardHTML).join('') : '';

    container.querySelectorAll('.trip-card').forEach(card => {
        card.onclick = () => showTripDetailModalOnTimeline(card.dataset.id);
    });
}

function createTripCardHTML(trip) {
    const photos = Array.isArray(trip.photos) ? trip.photos : [];
    const firstPhoto = photos.length > 0 ? photos[0] : 'https://placehold.co/60x60?text=Pic';
    return `
        <div class="trip-card" data-id="${trip.id}">
            <img src="${firstPhoto}" class="trip-photo-thumbnail" alt="${trip.title}">
            <div class="trip-card-content">
                <h3>${trip.title} (${trip.state})</h3>
                <p class="trip-date">${new Date(trip.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
        </div>`;
}

function showTripDetailModalOnTimeline(tripId) {
    const trip = myTrips.find(t => t.id === tripId);
    const detailModal = document.getElementById('trip-detail-modal');
    if (!trip || !detailModal) return;

    detailModal.querySelector('#detail-modal-title').textContent = trip.title;
    detailModal.querySelector('#trip-detail-image-modal').src = (trip.photos && trip.photos.length > 0) ? trip.photos[0] : 'https://placehold.co/300x200?text=Viagem';
    detailModal.querySelector('#detail-modal-trip-title').textContent = trip.title;
    detailModal.querySelector('#trip-detail-date-modal').textContent = `Data: ${new Date(trip.date + 'T00:00:00').toLocaleDateString('pt-BR')}`;
    detailModal.querySelector('#trip-detail-description-modal').textContent = trip.description;

    const photosContainer = detailModal.querySelector('#trip-detail-photos-container');
    photosContainer.innerHTML = '';
    if(Array.isArray(trip.photos)) trip.photos.forEach(pUrl => photosContainer.innerHTML += `<img src="${pUrl}" alt="Foto da viagem">`);

    const editButton = detailModal.querySelector('#edit-trip-from-detail-button');
    const deleteButton = detailModal.querySelector('#delete-trip-button');
    if(editButton) editButton.dataset.tripId = trip.id;
    if(deleteButton) deleteButton.dataset.tripId = trip.id;

    showModal('trip-detail-modal');
}

function initMapPage() {
    setActiveNavLink('main.html');

    const svgMapElement = document.getElementById('brazil-map-actual-svg');
    const mapModalTitleEl = document.getElementById('map-modal-title');
    const mapModalBodyEl = document.getElementById('map-modal-body-content');
    const mapModalFooterEl = document.getElementById('map-modal-footer-content');

    let previouslySelectedStatePath = null;
    let currentMapStateNameForAddForm = '';

    if (svgMapElement) {
        svgMapElement.querySelectorAll('.map-state').forEach(path => {
            path.onclick = function() {
                const stateId = this.id;
                currentMapStateNameForAddForm = this.dataset.stateName || stateId.toUpperCase();
                if (!stateId) return;

                if (previouslySelectedStatePath) previouslySelectedStatePath.classList.remove('selected-map-state');
                this.classList.add('selected-map-state');
                previouslySelectedStatePath = this;

                renderGalleryContentInMapPageModal(currentMapStateNameForAddForm);
            };
        });
    }

    function renderGalleryContentInMapPageModal(stateName) {
        if(mapModalTitleEl) mapModalTitleEl.textContent = `Viagens em ${stateName}`;
        const tripsForState = myTrips.filter(trip => trip.state.toLowerCase() === stateName.toLowerCase());

        if (mapModalBodyEl) {
            mapModalBodyEl.innerHTML = tripsForState.length > 0 ?
                tripsForState.map(createTripCardHTML).join('') :
                `<p>Nenhuma viagem para ${stateName}.</p>`;

            mapModalBodyEl.querySelectorAll('.trip-card').forEach(card => {
                card.onclick = () => {
                    card.onclick = () => showTripDetailModalOnTimeline(card.dataset.id);
                };
            });
        }
        if (mapModalFooterEl) {
            mapModalFooterEl.innerHTML = `<button id="map-modal-plus-button" class="fab-like-modal-button">+</button>`;
            document.getElementById('map-modal-plus-button').onclick = () => {
                setupAndShowAddEditModal('map-action-modal', null, stateName, () => {
                    renderGalleryContentInMapPageModal(stateName);
                }, true);
            };
        }
        showModal('map-action-modal');
    }
}

function setupAndShowAddEditModal(modalId, tripToEdit = null, defaultState = null, submitRefreshCallback, isMapPageDynamicModal = false) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    let formHtmlContent = '';
    let formIdToUse = isMapPageDynamicModal ? "dynamic-trip-form" : "trip-form";
    let modalTitleText;

    const titleValue = tripToEdit ? tripToEdit.title : '';
    const dateValue = tripToEdit ? tripToEdit.date : '';
    const stateValue = defaultState || (tripToEdit ? tripToEdit.state : '');
    const descriptionValue = tripToEdit ? tripToEdit.description : '';
    const tripIdValue = tripToEdit ? tripToEdit.id : '';

    modalTitleText = tripToEdit ? `Editar Viagem` : `Adicionar Nova Viagem`;
    if (isMapPageDynamicModal && defaultState && !tripToEdit) modalTitleText = `Adicionar Viagem em ${defaultState}`;

    if (isMapPageDynamicModal) {
        document.getElementById('map-modal-title').textContent = modalTitleText;
        formHtmlContent = `
            <form id="${formIdToUse}">
                <input type="hidden" id="trip-id-input" value="${tripIdValue}">
                <div><label for="trip-title-input">Cidade/Local:</label><input type="text" id="trip-title-input" value="${titleValue}" required></div>
                <div><label for="trip-date-input">Data:</label><input type="date" id="trip-date-input" value="${dateValue}" required></div>
                <div><label for="trip-state-form-input">Estado:</label><input type="text" id="trip-state-form-input" value="${stateValue}" required></div>
                <div><label for="trip-description-input">Memórias:</label><textarea id="trip-description-input" rows="3" required>${descriptionValue}</textarea></div>
                <div><label for="trip-photos-input">Fotos:</label><input type="file" id="trip-photos-input" accept="image/*" multiple><div class="photo-preview-container"></div></div>
                <button type="submit">Salvar Viagem</button>
            </form>`;
        document.getElementById('map-modal-body-content').innerHTML = formHtmlContent;
        document.getElementById('map-modal-footer-content').innerHTML = '';
    } else {
        const formInStaticModal = modalElement.querySelector(`#${formIdToUse}`);
        const staticModalTitle = modalElement.querySelector('#add-trip-modal-title');
        if (!formInStaticModal || !staticModalTitle) return;

        staticModalTitle.textContent = modalTitleText;
        formInStaticModal.reset();
        formInStaticModal.querySelector('#trip-id-input').value = tripIdValue;
        formInStaticModal.querySelector('#trip-title-input').value = titleValue;
        formInStaticModal.querySelector('#trip-date-input').value = dateValue;
        formInStaticModal.querySelector('#trip-state-form-input').value = stateValue;
        formInStaticModal.querySelector('#trip-description-input').value = descriptionValue;

        const photoPreview = formInStaticModal.querySelector('.photo-preview-container');
        if (photoPreview) {
            photoPreview.innerHTML = '';
            if (tripToEdit && Array.isArray(tripToEdit.photos)) {
                tripToEdit.photos.forEach(pUrl => photoPreview.innerHTML += `<img src="${pUrl}" alt="Preview">`);
            }
        }
    }

    const currentForm = document.getElementById(formIdToUse);
    if (currentForm) {
        currentForm.onsubmit = (event) => handleGlobalTripFormSubmit(event, submitRefreshCallback);
        const photoInput = currentForm.querySelector('#trip-photos-input');
        if (photoInput) photoInput.onchange = handleGlobalPhotoPreviewEvent;
    }

    showModal(modalId);
}

function handleGlobalTripFormSubmit(event, refreshCallback) {
    event.preventDefault();
    const form = event.target;

    const tripId = form.querySelector('#trip-id-input').value;
    const title = form.querySelector('#trip-title-input').value;
    const date = form.querySelector('#trip-date-input').value;
    const state = form.querySelector('#trip-state-form-input').value;
    const description = form.querySelector('#trip-description-input').value;

    let photoPreviewURLs = [];
    const previewImages = form.querySelectorAll('.photo-preview-container img');
    previewImages.forEach(img => photoPreviewURLs.push(img.src));

    const tripData = { title, date, state, description, photos: photoPreviewURLs };
    const stateOfSubmittedTrip = tripData.state;

    if (tripId) {
        tripData.id = tripId;
        const index = myTrips.findIndex(t => t.id === tripId);
        if (index !== -1) myTrips[index] = { ...myTrips[index], ...tripData };
    } else {
        tripData.id = 't' + nextTripId++;
        myTrips.push(tripData);
    }

    saveTripsToLocalStorage();

    hideModal();
    if (typeof refreshCallback === 'function') {
        if (form.id === "dynamic-trip-form" && typeof currentMapStateNameForAddForm !== 'undefined') {
            refreshCallback(stateOfSubmittedTrip || currentMapStateNameForAddForm);
        } else {
            refreshCallback();
        }
    }
}

function handleGlobalPhotoPreviewEvent(event) {
    const form = event.target.closest('form');
    if (!form) return;
    const previewContainer = form.querySelector('.photo-preview-container');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    const files = event.target.files;
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);
            previewContainer.appendChild(img);
        }
    }
}

function setActiveNavLink(pageName) {
    document.querySelectorAll('#main-nav a').forEach(a => {
        if (a.getAttribute('href') === pageName) a.classList.add('active-nav');
        else a.classList.remove('active-nav');
    });
}