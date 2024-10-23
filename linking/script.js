// script.js

// Mock Data for Prototype Testing
const mockNotes = [
  { id: 1, title: 'Project Plan' },
  { id: 2, title: 'Initial Research' },
  { id: 3, title: 'Budget Analysis' },
  { id: 4, title: 'Meeting Notes' },
  { id: 5, title: 'Final Report' }
];

let currentNoteId = 1; // ID of the current note being viewed

// Relationships Data Structure
let relationships = [
  {
    id: 1,
    sourceNoteId: 1,
    targetNoteId: 3,
    type: 'References',
    createdAt: '2024-04-25T10:15:30Z'
  },
  {
    id: 2,
    sourceNoteId: 3,
    targetNoteId: 1,
    type: 'Cited By',
    createdAt: '2024-04-25T10:16:00Z'
  },
  {
    id: 3,
    sourceNoteId: 1,
    targetNoteId: 2,
    type: 'Related To',
    createdAt: '2024-04-25T11:00:00Z'
  },
  {
    id: 4,
    sourceNoteId: 2,
    targetNoteId: 1,
    type: 'Subnote',
    createdAt: '2024-04-25T11:05:00Z'
  }
];

// Utility Functions
function findNoteById(id) {
  return mockNotes.find(note => note.id === id);
}

function findNoteByTitle(title) {
  return mockNotes.find(note => note.title.toLowerCase() === title.toLowerCase());
}

function getOutgoingRelationships(noteId) {
  return relationships.filter(rel => rel.sourceNoteId === noteId);
}

function getIncomingRelationships(noteId) {
  return relationships.filter(rel => rel.targetNoteId === noteId);
}

function renderNoteTitle() {
  const noteTitleElement = document.getElementById('noteTitle');
  const note = findNoteById(currentNoteId);
  noteTitleElement.textContent = note ? note.title : 'Unknown Note';
}

function renderBreadcrumbs() {
  const breadcrumbs = document.getElementById('breadcrumbs').querySelector('ul');
  breadcrumbs.innerHTML = '';

  // Example Breadcrumb Path: Home > Project Plan > Current Note
  const path = ['Home', 'Project Plan', findNoteById(currentNoteId).title];
  
  path.forEach((crumb, index) => {
    const li = document.createElement('li');
    if (index < path.length - 1) {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = crumb;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        // Simulate navigation
        alert(`Navigate to ${crumb}`);
      });
      li.appendChild(a);
      li.innerHTML += ' > ';
    } else {
      li.textContent = crumb;
      li.setAttribute('aria-current', 'page');
    }
    breadcrumbs.appendChild(li);
  });
}

function renderRelationships() {
  const outgoingList = document.getElementById('outgoingRelationshipsList');
  const incomingList = document.getElementById('incomingRelationshipsList');

  outgoingList.innerHTML = '';
  incomingList.innerHTML = '';

  const outgoingRels = getOutgoingRelationships(currentNoteId);
  const incomingRels = getIncomingRelationships(currentNoteId);

  outgoingRels.forEach(rel => {
    const li = document.createElement('li');
    
    const note = findNoteById(rel.targetNoteId);
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = note ? note.title : 'Unknown Note';
    a.classList.add('linked-note');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      // Simulate navigation
      alert(`Navigate to ${note.title}`);
      currentNoteId = note.id;
      initializeView();
    });
    
    const relType = document.createElement('span');
    relType.classList.add('relationship-type');
    relType.textContent = rel.type;
    
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-relationship', 'btn', 'icon-btn');
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => openEditRelationshipModal(rel.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-relationship', 'btn', 'icon-btn');
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => deleteRelationship(rel.id));
    
    li.appendChild(a);
    li.appendChild(relType);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    
    outgoingList.appendChild(li);
  });

  incomingRels.forEach(rel => {
    const li = document.createElement('li');
    
    const note = findNoteById(rel.sourceNoteId);
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = note ? note.title : 'Unknown Note';
    a.classList.add('linked-note');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      // Simulate navigation
      alert(`Navigate to ${note.title}`);
      currentNoteId = note.id;
      initializeView();
    });
    
    const relType = document.createElement('span');
    relType.classList.add('relationship-type');
    relType.textContent = rel.type;
    
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-relationship', 'btn', 'icon-btn');
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => openEditRelationshipModal(rel.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-relationship', 'btn', 'icon-btn');
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => deleteRelationship(rel.id));
    
    li.appendChild(a);
    li.appendChild(relType);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    
    incomingList.appendChild(li);
  });
}

function initializeView() {
  renderNoteTitle();
  renderBreadcrumbs();
  renderRelationships();
}

// Modal Handling
const linkNoteButton = document.getElementById('linkNoteButton');
const linkNoteModal = document.getElementById('linkNoteModal');
const closeLinkModal = document.getElementById('closeLinkModal');
const cancelLink = document.getElementById('cancelLink');
const modalOverlay = document.getElementById('modalOverlay');

linkNoteButton.addEventListener('click', () => {
  openModal(linkNoteModal);
});

closeLinkModal.addEventListener('click', () => {
  closeModal(linkNoteModal);
});

cancelLink.addEventListener('click', () => {
  closeModal(linkNoteModal);
});

modalOverlay.addEventListener('click', () => {
  closeModal(linkNoteModal);
});

// Edit Relationship Modal
const editRelationshipModal = document.getElementById('editRelationshipModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEdit = document.getElementById('cancelEdit');

closeEditModal.addEventListener('click', () => {
  closeModal(editRelationshipModal);
});

cancelEdit.addEventListener('click', () => {
  closeModal(editRelationshipModal);
});

modalOverlay.addEventListener('click', () => {
  closeModal(editRelationshipModal);
});

// Function to Open Modal
function openModal(modal) {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  modalOverlay.classList.remove('hidden');
}

// Function to Close Modal
function closeModal(modal) {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  modalOverlay.classList.add('hidden');
}

// Link Note Form Handling
const linkNoteForm = document.getElementById('linkNoteForm');
const targetNoteInput = document.getElementById('targetNote');
const relationshipTypeSelect = document.getElementById('relationshipType');
const noteSearchResults = document.getElementById('noteSearchResults');

linkNoteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const targetNoteTitle = targetNoteInput.value.trim();
  const relationshipType = relationshipTypeSelect.value;

  const targetNote = findNoteByTitle(targetNoteTitle);
  if (!targetNote) {
    alert('Target note not found.');
    return;
  }

  // Create Relationship (Mocked)
  const newRelationship = {
    id: relationships.length + 1,
    sourceNoteId: currentNoteId,
    targetNoteId: targetNote.id,
    type: relationshipType,
    createdAt: new Date().toISOString()
  };
  relationships.push(newRelationship);

  // For bidirectional, create reciprocal relationship if applicable
  const reciprocalType = getReciprocalRelationshipType(relationshipType);
  if (reciprocalType) {
    const reciprocalRelationship = {
      id: relationships.length + 1,
      sourceNoteId: targetNote.id,
      targetNoteId: currentNoteId,
      type: reciprocalType,
      createdAt: new Date().toISOString()
    };
    relationships.push(reciprocalRelationship);
  }

  // Refresh Relationships Section
  renderRelationships();

  // Close Modal
  closeModal(linkNoteModal);

  // Reset Form
  linkNoteForm.reset();
  noteSearchResults.innerHTML = '';
});

// Search Notes as User Types (Mocked)
targetNoteInput.addEventListener('input', () => {
  const query = targetNoteInput.value.trim().toLowerCase();
  noteSearchResults.innerHTML = '';

  if (query === '') return;

  const results = mockNotes.filter(note => note.title.toLowerCase().includes(query) && note.id !== currentNoteId);

  results.forEach(note => {
    const li = document.createElement('li');
    li.textContent = note.title;
    li.addEventListener('click', () => {
      targetNoteInput.value = note.title;
      noteSearchResults.innerHTML = '';
    });
    noteSearchResults.appendChild(li);
  });
});

// Get Reciprocal Relationship Type
function getReciprocalRelationshipType(type) {
  const reciprocalRelationshipTypes = {
    'References': 'Cited By',
    'Cited By': 'References',
    'Related To': 'Related To',
    'Subnote': 'Parent Note',
    'Parent Note': 'Subnote'
    // Add more as needed
  };

  return reciprocalRelationshipTypes[type] || null;
}

// Edit Relationship Handling
let relationshipToEditId = null;

function openEditRelationshipModal(relId) {
  relationshipToEditId = relId;
  const relationship = relationships.find(rel => rel.id === relId);
  if (!relationship) {
    alert('Relationship not found.');
    return;
  }

  const editRelationshipTypeSelect = document.getElementById('editRelationshipType');
  editRelationshipTypeSelect.value = relationship.type;

  openModal(editRelationshipModal);
}

const editRelationshipForm = document.getElementById('editRelationshipForm');

editRelationshipForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newType = document.getElementById('editRelationshipType').value;

  const relationship = relationships.find(rel => rel.id === relationshipToEditId);
  if (!relationship) {
    alert('Relationship not found.');
    return;
  }

  // Update Relationship Type
  relationship.type = newType;

  // If reciprocal, update the reciprocal relationship type as well
  const reciprocalType = getReciprocalRelationshipType(newType);
  if (reciprocalType) {
    const reciprocalRelationship = relationships.find(rel => rel.sourceNoteId === relationship.targetNoteId && rel.targetNoteId === relationship.sourceNoteId && rel.type === reciprocalType);
    if (reciprocalRelationship) {
      reciprocalRelationship.type = reciprocalType;
    }
  }

  // Refresh Relationships Section
  renderRelationships();

  // Close Modal
  closeModal(editRelationshipModal);
});

// Delete Relationship Handling
function deleteRelationship(relId) {
  if (!confirm('Are you sure you want to delete this relationship?')) return;

  const relationshipIndex = relationships.findIndex(rel => rel.id === relId);
  if (relationshipIndex === -1) {
    alert('Relationship not found.');
    return;
  }

  const relationship = relationships[relationshipIndex];
  
  // Remove relationship
  relationships.splice(relationshipIndex, 1);

  // Check for reciprocal relationship and remove it
  const reciprocalRelationshipIndex = relationships.findIndex(rel => rel.sourceNoteId === relationship.targetNoteId && rel.targetNoteId === relationship.sourceNoteId && getReciprocalRelationshipType(relationship.type) === rel.type);
  
  if (reciprocalRelationshipIndex !== -1) {
    relationships.splice(reciprocalRelationshipIndex, 1);
  }

  // Refresh Relationships Section
  renderRelationships();
}

// Back Button Handling
const backButton = document.getElementById('backButton');
backButton.addEventListener('click', () => {
  // For prototype, we'll simulate going back to 'Home'
  alert('Navigating back to Home...');
  // In real application, implement actual navigation logic
});

// Initialize the Prototype View
initializeView();
