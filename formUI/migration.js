// migration.js

const promptData = [
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "promptType": "Text",
    "data": {
      "title": "How to start learning Python",
      "description": "A basic prompt to help users start learning Python",
      "tags": ["python", "beginner", "tutorial"],
      "createdAt": "2024-10-20",
      "content": "Start by understanding Python's syntax and how to write basic programs. It's also important to practice by solving simple problems.",
      "language": "English"
    },
    "createdAt": "2024-10-20T08:00:00Z",
    "updatedAt": "2024-10-20T09:00:00Z"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "promptType": "Code",
    "data": {
      "title": "JavaScript Fetch API Example",
      "description": "Code snippet showing how to use Fetch API for making HTTP requests.",
      "tags": ["javascript", "api", "fetch"],
      "createdAt": "2024-10-21",
      "codeSnippet": "fetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data));",
      "language": "JavaScript"
    },
    "createdAt": "2024-10-21T10:00:00Z",
    "updatedAt": "2024-10-21T11:00:00Z"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "promptType": "Text",
    "data": {
      "title": "Benefits of Meditation",
      "description": "A prompt explaining the benefits of daily meditation",
      "tags": ["meditation", "health", "mindfulness"],
      "createdAt": "2024-10-19",
      "content": "Daily meditation has been shown to reduce stress, improve focus, and promote emotional health.",
      "language": "English"
    },
    "createdAt": "2024-10-19T08:00:00Z",
    "updatedAt": "2024-10-19T09:00:00Z"
  }
]

const promptSchemas = [
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
      "codeSnippet": {
        "type": "code",
        "label": "Code Snippet",
        "required": true,
        "placeholder": "Enter code snippet here"
      },
      "language": {
        "type": "select",
        "label": "Programming Language",
        "required": true,
        "options": ["JavaScript", "Python", "Java", "C++", "Other"]
      }
    }
  }
]



/**
 * Migrates data from localStorage to IndexedDB.
 * @returns {Promise<void>}
 */
 async function migrateDataToIndexedDB() {
  try {
    // Initialize database
    db = await initDatabase();

    // Migrate Schemas
    // const localSchemas = JSON.parse(localStorage.getItem('promptSchemas')) || [];
    for (let schema of promptSchemas) {
      const existingSchema = await getSchemaByType(schema.promptType);
      if (!existingSchema) {
        await addPromptSchema(schema);
        console.log(`Migrated schema for "${schema.promptType}".`);
      } else {
        console.log(`Schema for "${schema.promptType}" already exists. Skipping migration.`);
      }
    }

    // Migrate Prompts
    // const localPrompts = JSON.parse(localStorage.getItem('promptData')) || [];
    for (let prompt of promptData) {
      const existingPrompt = await getPromptById(prompt.id);
      if (!existingPrompt) {
        await addPrompt(prompt);
        console.log(`Migrated prompt "${prompt.data.title}".`);
      } else {
        console.log(`Prompt "${prompt.data.title}" already exists. Skipping migration.`);
      }
    }

    // Optional: Clear localStorage after migration
    // localStorage.removeItem('promptSchemas');
    // localStorage.removeItem('promptData');

    console.log('Data migration completed successfully.');
  } catch (error) {
    console.error('Data migration failed:', error);
  }
}
