// main.js

let db;

/**
 * Initializes the application by setting up IndexedDB and loading initial data.
 */
async function initializeApp() {
  try {
    db = await initDatabase();
    console.log('Database initialized successfully.');

    // // Check if schemas exist in IndexedDB
    // const schemas = await getAllSchemas();
    // if (schemas.length === 0) {
      // If no schemas, migrate from localStorage
      await migrateDataToIndexedDB();
    // }

    // Populate the sidebar with prompt types
    populatePromptTypes();

    // Automatically select the first prompt type on page load
    const firstPromptType = document.querySelector('.prompt-type-list li');
    if (firstPromptType) {
      firstPromptType.classList.add('active');
      loadPromptsForType(firstPromptType.textContent.trim());
    }
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

initializeApp();

/**
 * Populates the sidebar with the list of available prompt types.
 */
async function populatePromptTypes() {
  const promptTypeList = document.getElementById('promptTypeList');
  promptTypeList.innerHTML = ''; // Clear existing list

  try {
    const schemas = await getAllSchemas();

    if (schemas.length === 0) {
      promptTypeList.innerHTML = '<li>No prompt types available. Please add a schema.</li>';
      return;
    }

    schemas.forEach(schema => {
      const listItem = document.createElement('li');
      listItem.textContent = schema.promptType;
      listItem.classList.add('prompt-type-item');

      // Add event listener for selection
      listItem.addEventListener('click', () => {
        // Remove 'active' class from all items
        document.querySelectorAll('.prompt-type-list li').forEach(li => li.classList.remove('active'));
        // Add 'active' class to the selected item
        listItem.classList.add('active');
        // Load existing prompts for this type
        loadPromptsForType(schema.promptType);
      });

      promptTypeList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error populating prompt types:', error);
    promptTypeList.innerHTML = '<li>Error loading prompt types.</li>';
  }
}

/**
 * Loads and displays the list of prompts for a given prompt type.
 * @param {String} promptType - The type of prompts to load.
 */
async function loadPromptsForType(promptType) {
  const promptsListSection = document.getElementById('promptsListSection');
  const promptsList = document.getElementById('promptsList');
  promptsList.innerHTML = ''; // Clear existing list

  try {
    const filteredPrompts = await getPromptsByType(promptType);

    if (filteredPrompts.length === 0) {
      promptsList.innerHTML = '<li>No prompts available for this type.</li>';
      return;
    }

    filteredPrompts.forEach(prompt => {
      const listItem = document.createElement('li');
      listItem.dataset.promptId = prompt.id;

      const title = document.createElement('span');
      title.className = 'prompt-title';
      title.textContent = prompt.data.title;
      listItem.appendChild(title);

      const actions = document.createElement('div');
      actions.className = 'prompt-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn--secondary';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the parent click event
        editPrompt(prompt.id);
      });
      actions.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn--secondary';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePrompt(prompt.id);
      });
      actions.appendChild(deleteBtn);

      listItem.appendChild(actions);

      listItem.addEventListener('click', () => {
        // Optionally, highlight the selected prompt
        document.querySelectorAll('.prompts-list li').forEach(li => li.classList.remove('active-prompt'));
        listItem.classList.add('active-prompt');
      });

      promptsList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error loading prompts:', error);
    promptsList.innerHTML = '<li>Error loading prompts.</li>';
  }
}

/**
 * Handles editing of a prompt.
 * @param {String} promptId - The unique identifier of the prompt to edit.
 */
async function editPrompt(promptId) {
  try {
    const promptToEdit = await getPromptById(promptId);
    if (promptToEdit) {
      const selectedSchema = await getSchemaByType(promptToEdit.promptType);
      if (selectedSchema) {
        generateForm(selectedSchema, promptToEdit.data); // Generate form with existing data
        isEditing = true;
        editingPromptId = promptId;
        existingPrompt = promptToEdit;
      } else {
        alert(`Schema for prompt type "${promptToEdit.promptType}" not found.`);
      }
    } else {
      alert('Prompt not found.');
    }
  } catch (error) {
    console.error('Error editing prompt:', error);
    alert('An error occurred while editing the prompt.');
  }
}

/**
 * Handles deletion of a prompt.
 * @param {String} promptId - The unique identifier of the prompt to delete.
 */
async function deletePrompt(promptId) {
  if (confirm('Are you sure you want to delete this prompt?')) {
    try {
      await deletePromptFromDB(promptId);
      alert('Prompt deleted successfully.');
      const selectedType = getSelectedPromptType();
      if (selectedType) {
        loadPromptsForType(selectedType);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('An error occurred while deleting the prompt.');
    }
  }
}

/**
 * Generates a unique identifier for each prompt.
 * @returns {String} A UUID v4 string.
 */
function generateUUID() { // Public Domain/MIT
  let d = new Date().getTime();//Timestamp
  let d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16;//random number between 0 and 16
    if(d > 0){
      r = (d + r)%16 | 0;
      d = Math.floor(d/16);
    } else {
      r = (d2 + r)%16 | 0;
      d2 = Math.floor(d2/16);
    }
    return (c==='x' ? r :(r&0x3|0x8)).toString(16);
  });
}

/**
 * Opens the Schema Editor modal with the selected schema loaded.
 * If no schema is selected, prompts the user to create a new one.
 */
async function openSchemaEditor(promptType = null) {
  if (promptType) {
    try {
      const schema = await getSchemaByType(promptType);
      if (schema) {
        schemaEditor.value = JSON.stringify(schema, null, 2);
      } else {
        // Initialize with an empty schema template
        const emptySchema = {
          "promptType": "",
          "schemaVersion": "1.0",
          "fields": {}
        };
        schemaEditor.value = JSON.stringify(emptySchema, null, 2);
      }
    } catch (error) {
      console.error('Error loading schema for editing:', error);
      schemaEditor.value = '';
    }
  } else {
    // Initialize with an empty schema template
    const emptySchema = {
      "promptType": "",
      "schemaVersion": "1.0",
      "fields": {}
    };
    schemaEditor.value = JSON.stringify(emptySchema, null, 2);
  }

  // Clear any previous error/success messages
  schemaErrorMsg.textContent = '';
  schemaEditor.classList.remove('error', 'success');

  // Display the modal
  schemaEditorModal.style.display = 'block';
}

/**
 * Closes the Schema Editor modal.
 */
function closeSchemaEditorModal() {
  schemaEditorModal.style.display = 'none';
}

/**
 * Handles the "Cancel" button in the form section.
 */
const cancelFormBtn = document.getElementById('cancelFormBtn');
cancelFormBtn.addEventListener('click', () => {
  dynamicForm.reset();
  isEditing = false;
  editingPromptId = null;
  existingPrompt = null;
  const formSection = document.getElementById('formSection');
  formSection.style.display = 'none';
});

/**
 * Saves the edited schema from the Schema Editor Modal.
 */
async function saveEditedSchema() {
  const schemaText = schemaEditor.value.trim();

  if (!schemaText) {
    displayError('Schema cannot be empty.');
    return;
  }

  let parsedSchema;
  try {
    parsedSchema = JSON.parse(schemaText);
  } catch (error) {
    displayError(`Invalid JSON: ${error.message}`);
    return;
  }

  const validationError = validateSchema(parsedSchema);
  if (validationError) {
    displayError(`Schema validation error: ${validationError}`);
    return;
  }

  try {
    const existingSchema = await getSchemaByType(parsedSchema.promptType);
    if (existingSchema) {
      // Update existing schema
      await updatePromptSchema(parsedSchema);
      console.log(`Schema for "${parsedSchema.promptType}" updated.`);
    } else {
      // Add new schema
      await addPromptSchema(parsedSchema);
      console.log(`Schema for "${parsedSchema.promptType}" added.`);
    }

    displaySuccess('Schema saved successfully!');
    refreshUIAfterSchemaChange(parsedSchema.promptType);
    setTimeout(() => {
      closeSchemaEditorModal();
    }, 1000);
  } catch (error) {
    displayError(`Error saving schema: ${error.message}`);
  }
}

/**
 * Refreshes the UI after a schema change.
 * @param {String} changedPromptType - The prompt type whose schema was changed.
 */
async function refreshUIAfterSchemaChange(changedPromptType) {
  // Re-populate prompt types in the sidebar
  await populatePromptTypes();

  // Validate existing prompts for the changed prompt type
  validateExistingPrompts(changedPromptType);

  // Check if the changed prompt type is currently selected
  const activePromptType = getSelectedPromptType();
  if (activePromptType === changedPromptType) {
    // If a form is open (either creating or editing), regenerate it with the new schema
    if (isFormOpen()) {
      try {
        const updatedSchema = await getSchemaByType(activePromptType);
        if (updatedSchema) {
          // If editing, retain existing prompt data
          if (isEditing && existingPrompt) {
            generateForm(updatedSchema, existingPrompt.data);
          } else {
            // If creating, generate a new empty form
            generateForm(updatedSchema);
          }
        }
      } catch (error) {
        console.error('Error regenerating form:', error);
      }
    }
  }
}

/**
 * Validates all existing prompts against their schemas and notifies the user of discrepancies.
 * @param {String} changedPromptType - The prompt type whose schema was changed.
 */
async function validateExistingPrompts(changedPromptType) {
  try {
    const allPrompts = await getPromptsByType(changedPromptType);
    const updatedSchema = await getSchemaByType(changedPromptType);

    if (!updatedSchema) {
      console.warn(`No schema found for prompt type "${changedPromptType}" during validation.`);
      return;
    }

    const validationIssues = [];

    for (let prompt of allPrompts) {
      const missingFields = [];
      for (let fieldName in updatedSchema.fields) {
        if (updatedSchema.fields.hasOwnProperty(fieldName)) {
          const field = updatedSchema.fields[fieldName];
          if (field.required) {
            if (field.type === 'boolean') {
              // Boolean fields are always present (true or false)
              continue;
            }
            // Check for nested objects
            if (field.type === 'object') {
              if (!prompt.data[fieldName]) {
                missingFields.push(fieldName);
              } else {
                // Check nested fields
                for (let nestedFieldName in field.fields) {
                  if (field.fields.hasOwnProperty(nestedFieldName)) {
                    const nestedField = field.fields[nestedFieldName];
                    if (nestedField.required) {
                      if (!prompt.data[fieldName][nestedFieldName]) {
                        missingFields.push(`${fieldName}.${nestedFieldName}`);
                      }
                    }
                  }
                }
              }
            } else {
              if (!prompt.data[fieldName]) {
                missingFields.push(fieldName);
              }
            }
          }
        }
      }

      if (missingFields.length > 0) {
        validationIssues.push({
          promptId: prompt.id,
          title: prompt.data.title || 'Untitled Prompt',
          missingFields: missingFields
        });
      }
    }

    if (validationIssues.length > 0) {
      // Notify the user about the issues
      let message = `The following prompts are missing required fields based on the updated schema for "${changedPromptType}":\n\n`;
      validationIssues.forEach(issue => {
        message += `- "${issue.title}" (ID: ${issue.promptId}) is missing: ${issue.missingFields.join(', ')}\n`;
      });
      message += `\nPlease update these prompts to comply with the new schema.`;

      alert(message);

      // Optionally, highlight these prompts in the prompts list or provide bulk edit options
    }
  } catch (error) {
    console.error('Error validating existing prompts:', error);
  }
}

/**
 * Generates a dynamic form based on the provided JSON schema.
 * @param {Object} schema - The JSON schema defining the form structure.
 * @param {Object} [existingData=null] - Optional existing data for editing.
 */
function generateForm(schema, existingData = null) {
  const form = document.getElementById('dynamicForm');
  form.innerHTML = ''; // Clear existing form fields

  const fields = schema.fields;

  for (let fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      createFormField(fieldName, field, form, existingData ? existingData[fieldName] : null);
    }
  }

  // Update form title based on mode
  const formTitle = document.getElementById('formSectionTitle');
  if (existingData) {
    formTitle.textContent = 'Edit Prompt';
  } else {
    formTitle.textContent = 'Create Prompt';
  }

  // Display the form section
  const formSection = document.getElementById('formSection');
  formSection.style.display = 'block';

  // Add real-time validation
  addRealTimeValidation(schema);
}

/**
 * Creates and appends form fields based on field definitions, including handling nested structures and conditional visibility.
 * @param {String} fieldName - The name of the field.
 * @param {Object} field - The field's schema definition.
 * @param {HTMLElement} parentElement - The parent element to append the field to.
 * @param {Object|Array|String|Boolean} [existingValue=null] - Existing data for the field.
 */
function createFormField(fieldName, field, parentElement, existingValue = null) {
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  formGroup.dataset.fieldName = fieldName; // For conditional logic

  // Create Label
  const label = document.createElement('label');
  label.setAttribute('for', fieldName);
  label.textContent = field.label;
  if (field.required) {
    label.innerHTML += ' <span class="required">*</span>';
  }
  formGroup.appendChild(label);

  // Create Input Based on Field Type
  let inputElement;
  switch (field.type) {
    case 'string':
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      break;
    case 'textarea':
      inputElement = document.createElement('textarea');
      inputElement.rows = 4;
      break;
    case 'select':
      inputElement = document.createElement('select');
      // Populate options
      field.options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        inputElement.appendChild(opt);
      });
      break;
    case 'date':
      inputElement = document.createElement('input');
      inputElement.type = 'date';
      break;
    case 'url':
      inputElement = document.createElement('input');
      inputElement.type = 'url';
      break;
    case 'code':
      inputElement = document.createElement('textarea');
      inputElement.rows = 6;
      break;
    case 'boolean':
      inputElement = document.createElement('input');
      inputElement.type = 'checkbox';
      break;
    case 'array':
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      break;
    case 'object':
      // Handle nested object
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'nested-fieldset';
      const legend = document.createElement('legend');
      legend.textContent = field.label;
      fieldset.appendChild(legend);

      const nestedFields = field.fields;
      for (let nestedFieldName in nestedFields) {
        if (nestedFields.hasOwnProperty(nestedFieldName)) {
          const nestedField = nestedFields[nestedFieldName];
          createFormField(nestedFieldName, nestedField, fieldset, existingValue ? existingValue[nestedFieldName] : null);
        }
      }

      formGroup.appendChild(fieldset);
      parentElement.appendChild(formGroup);
      return; // Exit the function as nested fields are already appended
    default:
      inputElement = document.createElement('input');
      inputElement.type = 'text';
  }

  // Set common attributes
  inputElement.id = fieldName;
  inputElement.name = fieldName;
  inputElement.placeholder = field.placeholder || '';
  if (field.required) {
    inputElement.required = true;
  }
  if (field.disabled) {
    inputElement.disabled = true;
  }
  if (field.default && field.type !== 'date') {
    if (field.default === 'current_date') {
      if (field.type === 'date') {
        inputElement.value = new Date().toISOString().split('T')[0];
      } else {
        inputElement.value = new Date().toLocaleDateString();
      }
    } else {
      inputElement.value = field.default;
    }
  }

  // Set existing data if editing
  if (existingValue !== null) {
    if (field.type === 'boolean') {
      inputElement.checked = existingValue;
    } else if (field.type === 'array') {
      inputElement.value = existingValue.join(', ');
    } else {
      inputElement.value = existingValue;
    }
  }

  // Append input to form group
  formGroup.appendChild(inputElement);

  // Append form group to parent element
  parentElement.appendChild(formGroup);

  // Handle Conditional Visibility
  if (field.conditional) {
    formGroup.style.display = 'none'; // Initially hide

    const targetField = document.getElementById(field.conditional.field);
    if (targetField) {
      const toggleVisibility = () => {
        let targetValue;
        if (targetField.type === 'checkbox') {
          targetValue = targetField.checked ? targetField.value : '';
        } else {
          targetValue = targetField.value;
        }

        if (Array.isArray(field.conditional.value)) {
          formGroup.style.display = field.conditional.value.includes(targetValue) ? 'block' : 'none';
        } else {
          formGroup.style.display = targetValue === field.conditional.value ? 'block' : 'none';
        }
      };

      // Initial check
      toggleVisibility();

      // Add event listener
      targetField.addEventListener('change', toggleVisibility);
      targetField.addEventListener('input', toggleVisibility);
    }
  }
}

/**
 * Adds real-time validation to form fields based on the schema.
 * @param {Object} schema - The JSON schema defining the form structure.
 */
function addRealTimeValidation(schema) {
  const fields = schema.fields;

  for (let fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      const inputElement = document.getElementById(fieldName);

      if (!inputElement || field.type === 'object') {
        // Skip validation for nested objects or undefined elements
        continue;
      }

      if (field.type === 'boolean') {
        // No validation needed for checkboxes
        continue;
      }

      // Create a span element for error messages
      let errorSpan = document.createElement('span');
      errorSpan.className = 'field-error';
      errorSpan.style.color = '#f44336';
      errorSpan.style.fontSize = '12px';
      errorSpan.style.display = 'none';
      inputElement.parentElement.appendChild(errorSpan);

      // Add event listener for real-time validation
      inputElement.addEventListener('input', () => {
        validateField(inputElement, field, errorSpan);
      });

      // For select elements, listen to 'change' event
      if (field.type === 'select') {
        inputElement.addEventListener('change', () => {
          validateField(inputElement, field, errorSpan);
        });
      }
    }
  }
}

/**
 * Validates a single form field based on its schema definition.
 * @param {HTMLElement} input - The form input element.
 * @param {Object} field - The field's schema definition.
 * @param {HTMLElement} errorSpan - The span element to display error messages.
 */
function validateField(input, field, errorSpan) {
  let isValid = true;
  let message = '';

  const value = input.value.trim();

  // Required field validation
  if (field.required) {
    if (field.type === 'boolean') {
      // No action needed for checkboxes
    } else if (!value) {
      isValid = false;
      message = `${field.label} is required.`;
    }
  }

  // Specific field type validations
  if (isValid && field.type === 'url' && value) {
    const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if (!urlPattern.test(value)) {
      isValid = false;
      message = `${field.label} must be a valid URL.`;
    }
  }

  // Email validation if specified
  if (isValid && field.validation === 'email' && value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      isValid = false;
      message = `${field.label} must be a valid email address.`;
    }
  }

  // Add more validations based on field.type or custom rules here

  if (!isValid) {
    errorSpan.textContent = message;
    errorSpan.style.display = 'block';
    input.classList.add('input-error');
  } else {
    errorSpan.textContent = '';
    errorSpan.style.display = 'none';
    input.classList.remove('input-error');
  }
}

/**
 * Handles the form submission for creating or editing prompts.
 */
async function handleFormSubmission() {
  const selectedType = getSelectedPromptType();
  if (!selectedType) {
    alert('No prompt type selected.');
    return;
  }

  const selectedSchema = await getSchemaByType(selectedType);
  if (!selectedSchema) {
    alert(`Schema for prompt type "${selectedType}" not found.`);
    return;
  }

  // Collect form data
  const formData = {};
  const fields = selectedSchema.fields;
  let isValid = true;
  let validationMessages = [];

  for (let fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      const inputElement = document.getElementById(fieldName);

      if (!inputElement) {
        // Skip undefined fields (e.g., nested objects handled separately)
        continue;
      }

      if (field.type === 'boolean') {
        formData[fieldName] = inputElement.checked;
      } else if (field.type === 'array') {
        // Assuming comma-separated values
        formData[fieldName] = inputElement.value.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (field.type === 'object') {
        // Handle nested objects
        const nestedData = {};
        for (let nestedFieldName in field.fields) {
          if (field.fields.hasOwnProperty(nestedFieldName)) {
            const nestedField = field.fields[nestedFieldName];
            const nestedInput = document.getElementById(nestedFieldName);
            if (!nestedInput) continue;

            if (nestedField.type === 'boolean') {
              nestedData[nestedFieldName] = nestedInput.checked;
            } else if (nestedField.type === 'array') {
              nestedData[nestedFieldName] = nestedInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else {
              nestedData[nestedFieldName] = nestedInput.value.trim();
            }

            // Validation for required nested fields
            if (nestedField.required) {
              if (nestedField.type === 'boolean') {
                // No action needed for checkboxes
              } else if (!nestedData[nestedFieldName]) {
                isValid = false;
                validationMessages.push(`${nestedField.label} is required.`);
              }
            }

            // Additional validations for nested fields
            if (nestedField.validation === 'email' && nestedData[nestedFieldName]) {
              const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailPattern.test(nestedData[nestedFieldName])) {
                isValid = false;
                validationMessages.push(`${nestedField.label} must be a valid email address.`);
              }
            }
          }
        }
        formData[fieldName] = nestedData;
      } else {
        formData[fieldName] = inputElement.value.trim();
      }

      // Validation for required fields
      if (field.required && field.type !== 'boolean' && field.type !== 'object') {
        if (!formData[fieldName]) {
          isValid = false;
          validationMessages.push(`${field.label} is required.`);
        }
      }

      // Additional validations based on field type
      if (field.type === 'url' && formData[fieldName]) {
        const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        if (!urlPattern.test(formData[fieldName])) {
          isValid = false;
          validationMessages.push(`${field.label} must be a valid URL.`);
        }
      }

      // Add more field-specific validations as needed
    }
  }

  if (!isValid) {
    alert('Form submission failed:\n' + validationMessages.join('\n'));
    return;
  }

  // Prepare prompt object
  const prompt = {
    id: isEditing ? editingPromptId : generateUUID(),
    promptType: selectedType,
    data: formData,
    createdAt: isEditing ? existingPrompt.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    if (isEditing) {
      await updatePromptInDB(prompt);
      console.log(`Prompt "${prompt.data.title}" updated.`);
    } else {
      await addPrompt(prompt);
      console.log(`Prompt "${prompt.data.title}" added.`);
    }

    alert(`Prompt ${isEditing ? 'updated' : 'created'} successfully!`);

    // Reset form and flags
    dynamicForm.reset();
    isEditing = false;
    editingPromptId = null;
    existingPrompt = null;

    // Hide the form section after submission
    const formSection = document.getElementById('formSection');
    formSection.style.display = 'none';

    // Refresh prompts list
    loadPromptsForType(selectedType);
  } catch (error) {
    console.error('Error saving prompt:', error);
    alert('An error occurred while saving the prompt.');
  }
}

/**
 * Opens the Schema Editor modal with the selected schema loaded.
 * If no schema is selected, prompts the user to create a new one.
 */
async function openSchemaEditor(promptType = null) {
  if (promptType) {
    try {
      const schema = await getSchemaByType(promptType);
      if (schema) {
        schemaEditor.value = JSON.stringify(schema, null, 2);
      } else {
        // Initialize with an empty schema template
        const emptySchema = {
          "promptType": "",
          "schemaVersion": "1.0",
          "fields": {}
        };
        schemaEditor.value = JSON.stringify(emptySchema, null, 2);
      }
    } catch (error) {
      console.error('Error loading schema for editing:', error);
      schemaEditor.value = '';
    }
  } else {
    // Initialize with an empty schema template
    const emptySchema = {
      "promptType": "",
      "schemaVersion": "1.0",
      "fields": {}
    };
    schemaEditor.value = JSON.stringify(emptySchema, null, 2);
  }

  // Clear any previous error/success messages
  schemaErrorMsg.textContent = '';
  schemaEditor.classList.remove('error', 'success');

  // Display the modal
  schemaEditorModal.style.display = 'block';
}

/**
 * Closes the Schema Editor modal.
 */
function closeSchemaEditorModal() {
  schemaEditorModal.style.display = 'none';
}

/**
 * Saves the edited schema from the Schema Editor Modal.
 */
async function saveEditedSchema() {
  const schemaText = schemaEditor.value.trim();

  if (!schemaText) {
    displayError('Schema cannot be empty.');
    return;
  }

  let parsedSchema;
  try {
    parsedSchema = JSON.parse(schemaText);
  } catch (error) {
    displayError(`Invalid JSON: ${error.message}`);
    return;
  }

  const validationError = validateSchema(parsedSchema);
  if (validationError) {
    displayError(`Schema validation error: ${validationError}`);
    return;
  }

  try {
    const existingSchema = await getSchemaByType(parsedSchema.promptType);
    if (existingSchema) {
      // Update existing schema
      await updatePromptSchema(parsedSchema);
      console.log(`Schema for "${parsedSchema.promptType}" updated.`);
    } else {
      // Add new schema
      await addPromptSchema(parsedSchema);
      console.log(`Schema for "${parsedSchema.promptType}" added.`);
    }

    displaySuccess('Schema saved successfully!');
    refreshUIAfterSchemaChange(parsedSchema.promptType);
    setTimeout(() => {
      closeSchemaEditorModal();
    }, 1000);
  } catch (error) {
    displayError(`Error saving schema: ${error.message}`);
  }
}

/**
 * Refreshes the UI after a schema change.
 * @param {String} changedPromptType - The prompt type whose schema was changed.
 */
async function refreshUIAfterSchemaChange(changedPromptType) {
  // Re-populate prompt types in the sidebar
  await populatePromptTypes();

  // Validate existing prompts for the changed prompt type
  await validateExistingPrompts(changedPromptType);

  // Check if the changed prompt type is currently selected
  const activePromptType = getSelectedPromptType();
  if (activePromptType === changedPromptType) {
    // If a form is open (either creating or editing), regenerate it with the new schema
    if (isFormOpen()) {
      try {
        const updatedSchema = await getSchemaByType(activePromptType);
        if (updatedSchema) {
          // If editing, retain existing prompt data
          if (isEditing && existingPrompt) {
            generateForm(updatedSchema, existingPrompt.data);
          } else {
            // If creating, generate a new empty form
            generateForm(updatedSchema);
          }
        }
      } catch (error) {
        console.error('Error regenerating form:', error);
      }
    }
  }
}

/**
 * Validates all existing prompts against their schemas and notifies the user of discrepancies.
 * @param {String} changedPromptType - The prompt type whose schema was changed.
 */
async function validateExistingPrompts(changedPromptType) {
  try {
    const allPrompts = await getPromptsByType(changedPromptType);
    const updatedSchema = await getSchemaByType(changedPromptType);

    if (!updatedSchema) {
      console.warn(`No schema found for prompt type "${changedPromptType}" during validation.`);
      return;
    }

    const validationIssues = [];

    for (let prompt of allPrompts) {
      const missingFields = [];
      for (let fieldName in updatedSchema.fields) {
        if (updatedSchema.fields.hasOwnProperty(fieldName)) {
          const field = updatedSchema.fields[fieldName];
          if (field.required) {
            if (field.type === 'boolean') {
              // Boolean fields are always present (true or false)
              continue;
            }
            // Check for nested objects
            if (field.type === 'object') {
              if (!prompt.data[fieldName]) {
                missingFields.push(fieldName);
              } else {
                // Check nested fields
                for (let nestedFieldName in field.fields) {
                  if (field.fields.hasOwnProperty(nestedFieldName)) {
                    const nestedField = field.fields[nestedFieldName];
                    if (nestedField.required) {
                      if (!prompt.data[fieldName][nestedFieldName]) {
                        missingFields.push(`${fieldName}.${nestedFieldName}`);
                      }
                    }
                  }
                }
              }
            } else {
              if (!prompt.data[fieldName]) {
                missingFields.push(fieldName);
              }
            }
          }
        }
      }

      if (missingFields.length > 0) {
        validationIssues.push({
          promptId: prompt.id,
          title: prompt.data.title || 'Untitled Prompt',
          missingFields: missingFields
        });
      }
    }

    if (validationIssues.length > 0) {
      // Notify the user about the issues
      let message = `The following prompts are missing required fields based on the updated schema for "${changedPromptType}":\n\n`;
      validationIssues.forEach(issue => {
        message += `- "${issue.title}" (ID: ${issue.promptId}) is missing: ${issue.missingFields.join(', ')}\n`;
      });
      message += `\nPlease update these prompts to comply with the new schema.`;

      alert(message);

      // Optionally, highlight these prompts in the prompts list or provide bulk edit options
    }
  } catch (error) {
    console.error('Error validating existing prompts:', error);
  }
}

/**
 * Checks if the form is currently open for creating or editing a prompt.
 * @returns {Boolean} True if the form is open, else false.
 */
function isFormOpen() {
  // Assuming that when a form is open, the formSection is visible
  const formSection = document.getElementById('formSection');
  return formSection.style.display === 'block';
}

/**
 * Displays an error message within the Schema Editor Modal.
 * @param {String} message - The error message to display.
 */
function displayError(message) {
  schemaErrorMsg.textContent = message;
  schemaEditor.classList.add('error');
  schemaEditor.classList.remove('success');
}

/**
 * Displays a success message within the Schema Editor Modal.
 * @param {String} message - The success message to display.
 */
function displaySuccess(message) {
  schemaErrorMsg.textContent = message;
  schemaEditor.classList.add('success');
  schemaEditor.classList.remove('error');
}

// Event listeners for Schema Editor Modal
const saveSchemaBtn = document.getElementById('saveSchemaBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelSchemaBtn = document.getElementById('cancelSchemaBtn');

saveSchemaBtn.addEventListener('click', saveEditedSchema);
closeModalBtn.addEventListener('click', closeSchemaEditorModal);
cancelSchemaBtn.addEventListener('click', closeSchemaEditorModal);

/**
 * Generates a dynamic form based on the provided JSON schema.
 * @param {Object} schema - The JSON schema defining the form structure.
 * @param {Object} [existingData=null] - Optional existing data for editing.
 */
function generateForm(schema, existingData = null) {
  const form = document.getElementById('dynamicForm');
  form.innerHTML = ''; // Clear existing form fields

  const fields = schema.fields;

  for (let fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      createFormField(fieldName, field, form, existingData ? existingData[fieldName] : null);
    }
  }

  // Update form title based on mode
  const formTitle = document.getElementById('formSectionTitle');
  if (existingData) {
    formTitle.textContent = 'Edit Prompt';
  } else {
    formTitle.textContent = 'Create Prompt';
  }

  // Display the form section
  const formSection = document.getElementById('formSection');
  formSection.style.display = 'block';

  // Add real-time validation
  addRealTimeValidation(schema);
}

/**
 * Creates and appends form fields based on field definitions, including handling nested structures and conditional visibility.
 * @param {String} fieldName - The name of the field.
 * @param {Object} field - The field's schema definition.
 * @param {HTMLElement} parentElement - The parent element to append the field to.
 * @param {Object|Array|String|Boolean} [existingValue=null] - Existing data for the field.
 */
function createFormField(fieldName, field, parentElement, existingValue = null) {
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  formGroup.dataset.fieldName = fieldName; // For conditional logic

  // Create Label
  const label = document.createElement('label');
  label.setAttribute('for', fieldName);
  label.textContent = field.label;
  if (field.required) {
    label.innerHTML += ' <span class="required">*</span>';
  }
  formGroup.appendChild(label);

  // Create Input Based on Field Type
  let inputElement;
  switch (field.type) {
    case 'string':
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      break;
    case 'textarea':
      inputElement = document.createElement('textarea');
      inputElement.rows = 4;
      break;
    case 'select':
      inputElement = document.createElement('select');
      // Populate options
      field.options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        inputElement.appendChild(opt);
      });
      break;
    case 'date':
      inputElement = document.createElement('input');
      inputElement.type = 'date';
      break;
    case 'url':
      inputElement = document.createElement('input');
      inputElement.type = 'url';
      break;
    case 'code':
      inputElement = document.createElement('textarea');
      inputElement.rows = 6;
      break;
    case 'boolean':
      inputElement = document.createElement('input');
      inputElement.type = 'checkbox';
      break;
    case 'array':
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      break;
    case 'object':
      // Handle nested object
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'nested-fieldset';
      const legend = document.createElement('legend');
      legend.textContent = field.label;
      fieldset.appendChild(legend);

      const nestedFields = field.fields;
      for (let nestedFieldName in nestedFields) {
        if (nestedFields.hasOwnProperty(nestedFieldName)) {
          const nestedField = nestedFields[nestedFieldName];
          createFormField(nestedFieldName, nestedField, fieldset, existingValue ? existingValue[nestedFieldName] : null);
        }
      }

      formGroup.appendChild(fieldset);
      parentElement.appendChild(formGroup);
      return; // Exit the function as nested fields are already appended
    default:
      inputElement = document.createElement('input');
      inputElement.type = 'text';
  }

  // Set common attributes
  inputElement.id = fieldName;
  inputElement.name = fieldName;
  inputElement.placeholder = field.placeholder || '';
  if (field.required) {
    inputElement.required = true;
  }
  if (field.disabled) {
    inputElement.disabled = true;
  }
  if (field.default && field.type !== 'date') {
    if (field.default === 'current_date') {
      if (field.type === 'date') {
        inputElement.value = new Date().toISOString().split('T')[0];
      } else {
        inputElement.value = new Date().toLocaleDateString();
      }
    } else {
      inputElement.value = field.default;
    }
  }

  // Set existing data if editing
  if (existingValue !== null) {
    if (field.type === 'boolean') {
      inputElement.checked = existingValue;
    } else if (field.type === 'array') {
      inputElement.value = existingValue.join(', ');
    } else {
      inputElement.value = existingValue;
    }
  }

  // Append input to form group
  formGroup.appendChild(inputElement);

  // Append form group to parent element
  parentElement.appendChild(formGroup);

  // Handle Conditional Visibility
  if (field.conditional) {
    formGroup.style.display = 'none'; // Initially hide

    const targetField = document.getElementById(field.conditional.field);
    if (targetField) {
      const toggleVisibility = () => {
        let targetValue;
        if (targetField.type === 'checkbox') {
          targetValue = targetField.checked ? targetField.value : '';
        } else {
          targetValue = targetField.value;
        }

        if (Array.isArray(field.conditional.value)) {
          formGroup.style.display = field.conditional.value.includes(targetValue) ? 'block' : 'none';
        } else {
          formGroup.style.display = targetValue === field.conditional.value ? 'block' : 'none';
        }
      };

      // Initial check
      toggleVisibility();

      // Add event listener
      targetField.addEventListener('change', toggleVisibility);
      targetField.addEventListener('input', toggleVisibility);
    }
  }
}

/**
 * Adds real-time validation to form fields based on the schema.
 * @param {Object} schema - The JSON schema defining the form structure.
 */
function addRealTimeValidation(schema) {
  const fields = schema.fields;

  for (let fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      const inputElement = document.getElementById(fieldName);

      if (!inputElement || field.type === 'object') {
        // Skip validation for nested objects or undefined elements
        continue;
      }

      if (field.type === 'boolean') {
        // No validation needed for checkboxes
        continue;
      }

      // Create a span element for error messages
      let errorSpan = document.createElement('span');
      errorSpan.className = 'field-error';
      errorSpan.style.color = '#f44336';
      errorSpan.style.fontSize = '12px';
      errorSpan.style.display = 'none';
      inputElement.parentElement.appendChild(errorSpan);

      // Add event listener for real-time validation
      inputElement.addEventListener('input', () => {
        validateField(inputElement, field, errorSpan);
      });

      // For select elements, listen to 'change' event
      if (field.type === 'select') {
        inputElement.addEventListener('change', () => {
          validateField(inputElement, field, errorSpan);
        });
      }
    }
  }
}

/**
 * Validates a single form field based on its schema definition.
 * @param {HTMLElement} input - The form input element.
 * @param {Object} field - The field's schema definition.
 * @param {HTMLElement} errorSpan - The span element to display error messages.
 */
function validateField(input, field, errorSpan) {
  let isValid = true;
  let message = '';

  const value = input.value.trim();

  // Required field validation
  if (field.required) {
    if (field.type === 'boolean') {
      // No action needed for checkboxes
    } else if (!value) {
      isValid = false;
      message = `${field.label} is required.`;
    }
  }

  // Specific field type validations
  if (isValid && field.type === 'url' && value) {
    const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if (!urlPattern.test(value)) {
      isValid = false;
      message = `${field.label} must be a valid URL.`;
    }
  }

  // Email validation if specified
  if (isValid && field.validation === 'email' && value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      isValid = false;
      message = `${field.label} must be a valid email address.`;
    }
  }

  // Add more validations based on field.type or custom rules here

  if (!isValid) {
    errorSpan.textContent = message;
    errorSpan.style.display = 'block';
    input.classList.add('input-error');
  } else {
    errorSpan.textContent = '';
    errorSpan.style.display = 'none';
    input.classList.remove('input-error');
  }
}

/**
 * Handles the form submission for creating or editing prompts.
 */
async function handleFormSubmission() {
  const selectedType = getSelectedPromptType();
  if (!selectedType) {
    alert('No prompt type selected.');
    return;
  }

  const selectedSchema = await getSchemaByType(selectedType);
  if (!selectedSchema) {
    alert(`Schema for prompt type "${selectedType}" not found.`);
    return;
  }

  // Collect form data
  const formData = {};
  const fields = selectedSchema.fields;
  let isValid = true;
  let validationMessages = [];

  for (let fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      const inputElement = document.getElementById(fieldName);

      if (!inputElement) {
        // Skip undefined fields (e.g., nested objects handled separately)
        continue;
      }

      if (field.type === 'boolean') {
        formData[fieldName] = inputElement.checked;
      } else if (field.type === 'array') {
        // Assuming comma-separated values
        formData[fieldName] = inputElement.value.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (field.type === 'object') {
        // Handle nested objects
        const nestedData = {};
        for (let nestedFieldName in field.fields) {
          if (field.fields.hasOwnProperty(nestedFieldName)) {
            const nestedField = field.fields[nestedFieldName];
            const nestedInput = document.getElementById(nestedFieldName);
            if (!nestedInput) continue;

            if (nestedField.type === 'boolean') {
              nestedData[nestedFieldName] = nestedInput.checked;
            } else if (nestedField.type === 'array') {
              nestedData[nestedFieldName] = nestedInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else {
              nestedData[nestedFieldName] = nestedInput.value.trim();
            }

            // Validation for required nested fields
            if (nestedField.required) {
              if (nestedField.type === 'boolean') {
                // No action needed for checkboxes
              } else if (!nestedData[nestedFieldName]) {
                isValid = false;
                validationMessages.push(`${nestedField.label} is required.`);
              }
            }

            // Additional validations for nested fields
            if (nestedField.validation === 'email' && nestedData[nestedFieldName]) {
              const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailPattern.test(nestedData[nestedFieldName])) {
                isValid = false;
                validationMessages.push(`${nestedField.label} must be a valid email address.`);
              }
            }
          }
        }
        formData[fieldName] = nestedData;
      } else {
        formData[fieldName] = inputElement.value.trim();
      }

      // Validation for required fields
      if (field.required && field.type !== 'boolean' && field.type !== 'object') {
        if (!formData[fieldName]) {
          isValid = false;
          validationMessages.push(`${field.label} is required.`);
        }
      }

      // Additional validations based on field type
      if (field.type === 'url' && formData[fieldName]) {
        const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        if (!urlPattern.test(formData[fieldName])) {
          isValid = false;
          validationMessages.push(`${field.label} must be a valid URL.`);
        }
      }

      // Add more field-specific validations as needed
    }
  }

  if (!isValid) {
    alert('Form submission failed:\n' + validationMessages.join('\n'));
    return;
  }

  // Prepare prompt object
  const prompt = {
    id: isEditing ? editingPromptId : generateUUID(),
    promptType: selectedType,
    data: formData,
    createdAt: isEditing ? existingPrompt.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    if (isEditing) {
      await updatePromptInDB(prompt);
      console.log(`Prompt "${prompt.data.title}" updated.`);
    } else {
      await addPrompt(prompt);
      console.log(`Prompt "${prompt.data.title}" added.`);
    }

    alert(`Prompt ${isEditing ? 'updated' : 'created'} successfully!`);

    // Reset form and flags
    dynamicForm.reset();
    isEditing = false;
    editingPromptId = null;
    existingPrompt = null;

    // Hide the form section after submission
    const formSection = document.getElementById('formSection');
    formSection.style.display = 'none';

    // Refresh prompts list
    loadPromptsForType(selectedType);
  } catch (error) {
    console.error('Error saving prompt:', error);
    alert('An error occurred while saving the prompt.');
  }
}

/**
 * Opens the Schema Editor modal with the selected schema loaded.
 * If no schema is selected, prompts the user to create a new one.
 */
async function openSchemaEditor(promptType = null) {
  if (promptType) {
    try {
      const schema = await getSchemaByType(promptType);
      if (schema) {
        schemaEditor.value = JSON.stringify(schema, null, 2);
      } else {
        // Initialize with an empty schema template
        const emptySchema = {
          "promptType": "",
          "schemaVersion": "1.0",
          "fields": {}
        };
        schemaEditor.value = JSON.stringify(emptySchema, null, 2);
      }
    } catch (error) {
      console.error('Error loading schema for editing:', error);
      schemaEditor.value = '';
    }
  } else {
    // Initialize with an empty schema template
    const emptySchema = {
      "promptType": "",
      "schemaVersion": "1.0",
      "fields": {}
    };
    schemaEditor.value = JSON.stringify(emptySchema, null, 2);
  }

  // Clear any previous error/success messages
  schemaErrorMsg.textContent = '';
  schemaEditor.classList.remove('error', 'success');

  // Display the modal
  schemaEditorModal.style.display = 'block';
}

/**
 * Closes the Schema Editor modal.
 */
function closeSchemaEditorModal() {
  schemaEditorModal.style.display = 'none';
}

/**
 * Saves the edited schema from the Schema Editor Modal.
 */
async function saveEditedSchema() {
  const schemaText = schemaEditor.value.trim();

  if (!schemaText) {
    displayError('Schema cannot be empty.');
    return;
  }

  let parsedSchema;
  try {
    parsedSchema = JSON.parse(schemaText);
  } catch (error) {
    displayError(`Invalid JSON: ${error.message}`);
    return;
  }

  const validationError = validateSchema(parsedSchema);
  if (validationError) {
    displayError(`Schema validation error: ${validationError}`);
    return;
  }

  try {
    const existingSchema = await getSchemaByType(parsedSchema.promptType);
    if (existingSchema) {
      // Update existing schema
      await updatePromptSchema(parsedSchema);
      console.log(`Schema for "${parsedSchema.promptType}" updated.`);
    } else {
      // Add new schema
      await addPromptSchema(parsedSchema);
      console.log(`Schema for "${parsedSchema.promptType}" added.`);
    }

    displaySuccess('Schema saved successfully!');
    refreshUIAfterSchemaChange(parsedSchema.promptType);
    setTimeout(() => {
      closeSchemaEditorModal();
    }, 1000);
  } catch (error) {
    displayError(`Error saving schema: ${error.message}`);
  }
}

/**
 * Validates a single form field based on its schema definition.
 * @param {HTMLElement} input - The form input element.
 * @param {Object} field - The field's schema definition.
 * @param {HTMLElement} errorSpan - The span element to display error messages.
 */
function validateField(input, field, errorSpan) {
  let isValid = true;
  let message = '';

  const value = input.value.trim();

  // Required field validation
  if (field.required) {
    if (field.type === 'boolean') {
      // No action needed for checkboxes
    } else if (!value) {
      isValid = false;
      message = `${field.label} is required.`;
    }
  }

  // Specific field type validations
  if (isValid && field.type === 'url' && value) {
    const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if (!urlPattern.test(value)) {
      isValid = false;
      message = `${field.label} must be a valid URL.`;
    }
  }

  // Email validation if specified
  if (isValid && field.validation === 'email' && value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      isValid = false;
      message = `${field.label} must be a valid email address.`;
    }
  }

  // Add more validations based on field.type or custom rules here

  if (!isValid) {
    errorSpan.textContent = message;
    errorSpan.style.display = 'block';
    input.classList.add('input-error');
  } else {
    errorSpan.textContent = '';
    errorSpan.style.display = 'none';
    input.classList.remove('input-error');
  }
}

/**
 * Handles the form submission for creating or editing prompts.
 */
async function handleFormSubmission() {
  const selectedType = getSelectedPromptType();
  if (!selectedType) {
    alert('No prompt type selected.');
    return;
  }

  const selectedSchema = await getSchemaByType(selectedType);
  if (!selectedSchema) {
    alert(`Schema for prompt type "${selectedType}" not found.`);
    return;
  }

  // Collect form data
  const formData = {};
  const fields = selectedSchema.fields;
  let isValid = true;
  let validationMessages = [];

  for (let fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      const inputElement = document.getElementById(fieldName);

      if (!inputElement) {
        // Skip undefined fields (e.g., nested objects handled separately)
        continue;
      }

      if (field.type === 'boolean') {
        formData[fieldName] = inputElement.checked;
      } else if (field.type === 'array') {
        // Assuming comma-separated values
        formData[fieldName] = inputElement.value.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (field.type === 'object') {
        // Handle nested objects
        const nestedData = {};
        for (let nestedFieldName in field.fields) {
          if (field.fields.hasOwnProperty(nestedFieldName)) {
            const nestedField = field.fields[nestedFieldName];
            const nestedInput = document.getElementById(nestedFieldName);
            if (!nestedInput) continue;

            if (nestedField.type === 'boolean') {
              nestedData[nestedFieldName] = nestedInput.checked;
            } else if (nestedField.type === 'array') {
              nestedData[nestedFieldName] = nestedInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else {
              nestedData[nestedFieldName] = nestedInput.value.trim();
            }

            // Validation for required nested fields
            if (nestedField.required) {
              if (nestedField.type === 'boolean') {
                // No action needed for checkboxes
              } else if (!nestedData[nestedFieldName]) {
                isValid = false;
                validationMessages.push(`${nestedField.label} is required.`);
              }
            }

            // Additional validations for nested fields
            if (nestedField.validation === 'email' && nestedData[nestedFieldName]) {
              const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailPattern.test(nestedData[nestedFieldName])) {
                isValid = false;
                validationMessages.push(`${nestedField.label} must be a valid email address.`);
              }
            }
          }
        }
        formData[fieldName] = nestedData;
      } else {
        formData[fieldName] = inputElement.value.trim();
      }

      // Validation for required fields
      if (field.required && field.type !== 'boolean' && field.type !== 'object') {
        if (!formData[fieldName]) {
          isValid = false;
          validationMessages.push(`${field.label} is required.`);
        }
      }

      // Additional validations based on field type
      if (field.type === 'url' && formData[fieldName]) {
        const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        if (!urlPattern.test(formData[fieldName])) {
          isValid = false;
          validationMessages.push(`${field.label} must be a valid URL.`);
        }
      }

      // Add more field-specific validations as needed
    }
  }

  if (!isValid) {
    alert('Form submission failed:\n' + validationMessages.join('\n'));
    return;
  }

  // Prepare prompt object
  const prompt = {
    id: isEditing ? editingPromptId : generateUUID(),
    promptType: selectedType,
    data: formData,
    createdAt: isEditing ? existingPrompt.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    if (isEditing) {
      await updatePromptInDB(prompt);
      console.log(`Prompt "${prompt.data.title}" updated.`);
    } else {
      await addPrompt(prompt);
      console.log(`Prompt "${prompt.data.title}" added.`);
    }

    alert(`Prompt ${isEditing ? 'updated' : 'created'} successfully!`);

    // Reset form and flags
    dynamicForm.reset();
    isEditing = false;
    editingPromptId = null;
    existingPrompt = null;

    // Hide the form section after submission
    const formSection = document.getElementById('formSection');
    formSection.style.display = 'none';

    // Refresh prompts list
    loadPromptsForType(selectedType);
  } catch (error) {
    console.error('Error saving prompt:', error);
    alert('An error occurred while saving the prompt.');
  }
}

/**
 * Validates the schema.
 * @param {Object} schema - The schema object to validate.
 * @returns {String|null} An error message if validation fails, otherwise null.
 */
function validateSchema(schema) {
  const requiredProperties = ['promptType', 'schemaVersion', 'fields'];

  for (let prop of requiredProperties) {
    if (!schema.hasOwnProperty(prop)) {
      return `Missing required property: "${prop}"`;
    }
  }

  // Additional validation for nested fields can be added here
  // For example, ensure that conditional fields reference existing fields
  for (let fieldName in schema.fields) {
    if (schema.fields.hasOwnProperty(fieldName)) {
      const field = schema.fields[fieldName];
      if (field.conditional) {
        const targetField = schema.fields[field.conditional.field];
        if (!targetField) {
          return `Conditional field "${fieldName}" references non-existent field "${field.conditional.field}"`;
        }
      }
      // Recursively validate nested objects
      if (field.type === 'object' && field.fields) {
        const nestedSchema = {
          promptType: fieldName,
          schemaVersion: schema.schemaVersion,
          fields: field.fields
        };
        const nestedValidation = validateSchema(nestedSchema);
        if (nestedValidation) {
          return nestedValidation;
        }
      }
    }
  }

  return null; // No errors
}

/**
 * Displays an error message within the Schema Editor Modal.
 * @param {String} message - The error message to display.
 */
function displayError(message) {
  schemaErrorMsg.textContent = message;
  schemaEditor.classList.add('error');
  schemaEditor.classList.remove('success');
}

/**
 * Displays a success message within the Schema Editor Modal.
 * @param {String} message - The success message to display.
 */
function displaySuccess(message) {
  schemaErrorMsg.textContent = message;
  schemaEditor.classList.add('success');
  schemaEditor.classList.remove('error');
}
