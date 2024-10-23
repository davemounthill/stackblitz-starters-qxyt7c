// db.js

/**
 * Initializes the IndexedDB database and creates necessary object stores.
 * @returns {Promise<IDBDatabase>} A promise that resolves to the opened database.
 */
 function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AIPromptLibraryDB', 1);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store for prompt schemas
      if (!db.objectStoreNames.contains('promptSchemas')) {
        const schemaStore = db.createObjectStore('promptSchemas', { keyPath: 'promptType' });
        // You can create indexes if needed
      }

      // Create object store for prompts
      if (!db.objectStoreNames.contains('prompts')) {
        const promptStore = db.createObjectStore('prompts', { keyPath: 'id' });
        promptStore.createIndex('promptType', 'promptType', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
  });
}

/**
 * Adds a new prompt schema to the database.
 * @param {Object} schema - The schema object to add.
 * @returns {Promise<void>}
 */
function addPromptSchema(schema) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['promptSchemas'], 'readwrite');
    const store = transaction.objectStore('promptSchemas');
    const request = store.add(schema);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Add schema error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Updates an existing prompt schema in the database.
 * @param {Object} schema - The schema object to update.
 * @returns {Promise<void>}
 */
function updatePromptSchema(schema) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['promptSchemas'], 'readwrite');
    const store = transaction.objectStore('promptSchemas');
    const request = store.put(schema);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Update schema error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Retrieves all prompt schemas from the database.
 * @returns {Promise<Array>} An array of schema objects.
 */
function getAllSchemas() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['promptSchemas'], 'readonly');
    const store = transaction.objectStore('promptSchemas');
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Get all schemas error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Retrieves a specific prompt schema by promptType.
 * @param {String} promptType - The prompt type to retrieve.
 * @returns {Promise<Object>} The schema object.
 */
function getSchemaByType(promptType) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['promptSchemas'], 'readonly');
    const store = transaction.objectStore('promptSchemas');
    const request = store.get(promptType);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Get schema by type error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Adds a new prompt to the database.
 * @param {Object} prompt - The prompt object to add.
 * @returns {Promise<void>}
 */
function addPrompt(prompt) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['prompts'], 'readwrite');
    const store = transaction.objectStore('prompts');
    const request = store.add(prompt);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Add prompt error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Updates an existing prompt in the database.
 * @param {Object} prompt - The prompt object to update.
 * @returns {Promise<void>}
 */
function updatePromptInDB(prompt) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['prompts'], 'readwrite');
    const store = transaction.objectStore('prompts');
    const request = store.put(prompt);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Update prompt error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Retrieves all prompts of a specific prompt type from the database.
 * @param {String} promptType - The prompt type to filter by.
 * @returns {Promise<Array>} An array of prompt objects.
 */
function getPromptsByType(promptType) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['prompts'], 'readonly');
    const store = transaction.objectStore('prompts');
    const index = store.index('promptType');
    const request = index.getAll(promptType);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Get prompts by type error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Retrieves a prompt by its ID.
 * @param {String} promptId - The ID of the prompt to retrieve.
 * @returns {Promise<Object>} The prompt object.
 */
function getPromptById(promptId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['prompts'], 'readonly');
    const store = transaction.objectStore('prompts');
    const request = store.get(promptId);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Get prompt by ID error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Deletes a prompt by its ID.
 * @param {String} promptId - The ID of the prompt to delete.
 * @returns {Promise<void>}
 */
function deletePromptFromDB(promptId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['prompts'], 'readwrite');
    const store = transaction.objectStore('prompts');
    const request = store.delete(promptId);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Delete prompt error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Adds default schemas to the database.
 * @returns {Promise<void>}
 */
async function addDefaultSchemas() {
  const defaultSchemas = [
    // Include your default schemas here
    {
      "promptType": "Text",
      "schemaVersion": "1.0",
      "fields": {
        "title": {
          "type": "string",
          "label": "Title",
          "required": true,
          "placeholder": "Enter prompt title"
        },
        "description": {
          "type": "textarea",
          "label": "Description",
          "required": false,
          "placeholder": "Enter prompt description"
        },
        "tags": {
          "type": "array",
          "label": "Tags",
          "required": false,
          "placeholder": "Enter tags separated by commas"
        },
        "createdAt": {
          "type": "date",
          "label": "Created At",
          "required": true,
          "default": "current_date"
        },
        "content": {
          "type": "textarea",
          "label": "Content",
          "required": true,
          "placeholder": "Enter prompt content"
        },
        "language": {
          "type": "select",
          "label": "Language",
          "required": true,
          "options": ["English", "Spanish", "French", "Other"]
        },
        "languageOther": {
          "type": "string",
          "label": "Specify Language",
          "required": true,
          "placeholder": "Enter the language",
          "conditional": {
            "field": "language",
            "value": "Other"
          }
        }
      }
    },
    {
      "promptType": "Code",
      "schemaVersion": "1.0",
      "fields": {
        "title": {
          "type": "string",
          "label": "Title",
          "required": true,
          "placeholder": "Enter prompt title"
        },
        "description": {
          "type": "textarea",
          "label": "Description",
          "required": false,
          "placeholder": "Enter prompt description"
        },
        "tags": {
          "type": "array",
          "label": "Tags",
          "required": false,
          "placeholder": "Enter tags separated by commas"
        },
        "createdAt": {
          "type": "date",
          "label": "Created At",
          "required": true,
          "default": "current_date"
        },
        "content": {
          "type": "code",
          "label": "Code Snippet",
          "required": true,
          "placeholder": "Enter code here"
        },
        "language": {
          "type": "select",
          "label": "Programming Language",
          "required": true,
          "options": ["JavaScript", "Python", "Java", "C++", "Other"]
        },
        "languageOther": {
          "type": "string",
          "label": "Specify Language",
          "required": true,
          "placeholder": "Enter the programming language",
          "conditional": {
            "field": "language",
            "value": "Other"
          }
        },
        "execution": {
          "type": "boolean",
          "label": "Executable",
          "required": false,
          "default": false
        }
      }
    }
  ];

  for (let schema of defaultSchemas) {
    try {
      await addPromptSchema(schema);
      console.log(`Added default schema for prompt type: ${schema.promptType}`);
    } catch (error) {
      console.error(`Failed to add schema for prompt type: ${schema.promptType}`, error);
    }
  }
}
