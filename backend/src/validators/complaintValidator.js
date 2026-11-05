const {
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  CIVIC_CATEGORIES
} = require('../constants');
const mongoose = require('mongoose');

function validateCreateComplaint(data) {
  const errors = [];
  const { title, description, category, location, imageBase64 } = data;

  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    errors.push('Title must be at least 5 characters long.');
  } else if (title.trim().length > 150) {
    errors.push('Title cannot exceed 150 characters.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long.');
  } else if (description.trim().length > 2000) {
    errors.push('Description cannot exceed 2000 characters.');
  }

  let validatedCategory = 'Other';
  if (category) {
    if (!CIVIC_CATEGORIES.includes(category)) {
      errors.push(`Invalid category "${category}". Allowed: ${CIVIC_CATEGORIES.join(', ')}`);
    } else {
      validatedCategory = category;
    }
  }

  let validatedLocation = { address: '', latitude: null, longitude: null };
  if (!location) {
    errors.push('Location details are required.');
  } else if (typeof location === 'string') {
    if (location.trim().length < 3) {
      errors.push('Location address must be at least 3 characters.');
    } else {
      validatedLocation.address = location.trim();
    }
  } else if (typeof location === 'object') {
    if (!location.address || typeof location.address !== 'string' || location.address.trim().length < 3) {
      errors.push('A valid location address or locality name is required.');
    } else {
      validatedLocation.address = location.address.trim();
    }
    if (location.latitude !== undefined && location.latitude !== null) {
      const lat = Number(location.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('Latitude must be a valid number between -90 and 90.');
      } else {
        validatedLocation.latitude = lat;
      }
    }
    if (location.longitude !== undefined && location.longitude !== null) {
      const lng = Number(location.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push('Longitude must be a valid number between -180 and 180.');
      } else {
        validatedLocation.longitude = lng;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      title: title ? title.trim() : '',
      description: description ? description.trim() : '',
      category: validatedCategory,
      location: validatedLocation,
      imageBase64: imageBase64 || null
    }
  };
}

function validateStatusUpdate(data) {
  const errors = [];
  const { status, note } = data;

  if (!status || !Object.values(COMPLAINT_STATUSES).includes(status)) {
    errors.push(`Invalid status "${status}". Allowed: ${Object.values(COMPLAINT_STATUSES).join(', ')}`);
  }

  if (note && typeof note !== 'string') {
    errors.push('Note must be text.');
  } else if (note && note.length > 1000) {
    errors.push('Note cannot exceed 1000 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      status,
      note: note ? note.trim() : ''
    }
  };
}

function validateTriageUpdate(data) {
  const errors = [];
  const { category, priority, department, assignedTo } = data;
  const updates = {};

  if (category !== undefined) {
    if (!CIVIC_CATEGORIES.includes(category)) {
      errors.push(`Invalid category "${category}".`);
    } else {
      updates.category = category;
    }
  }

  if (priority !== undefined) {
    if (!Object.values(COMPLAINT_PRIORITIES).includes(priority)) {
      errors.push(`Invalid priority "${priority}".`);
    } else {
      updates.priority = priority;
    }
  }

  if (department !== undefined) {
    if (typeof department !== 'string' || department.trim().length > 100) {
      errors.push('Department must be a string up to 100 characters.');
    } else {
      updates.department = department.trim();
    }
  }

  if (assignedTo !== undefined) {
    if (assignedTo === null || assignedTo === '') {
      updates.assignedTo = null;
    } else if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      errors.push('assignedTo must be a valid User ObjectId or null.');
    } else {
      updates.assignedTo = assignedTo;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    updates
  };
}

function validateAdminNote(data) {
  const errors = [];
  const { text } = data;

  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    errors.push('Admin note text must be at least 2 characters long.');
  } else if (text.trim().length > 2000) {
    errors.push('Admin note cannot exceed 2000 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    text: text ? text.trim() : ''
  };
}

module.exports = {
  validateCreateComplaint,
  validateStatusUpdate,
  validateTriageUpdate,
  validateAdminNote
};
