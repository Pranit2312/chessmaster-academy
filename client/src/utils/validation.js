/**
 * Form validation schemas using Yup
 */

const nameRegex = /^[a-zA-Z\s]{2,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const validationSchemas = {
  login: {
    email: (value) => {
      if (!value) return 'Email is required';
      if (!emailRegex.test(value)) return 'Invalid email format';
      return null;
    },
    password: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return null;
    }
  },

  register: {
    name: (value) => {
      if (!value) return 'Name is required';
      if (!nameRegex.test(value)) return 'Name must be 2+ characters, letters only';
      return null;
    },
    email: (value) => {
      if (!value) return 'Email is required';
      if (!emailRegex.test(value)) return 'Invalid email format';
      return null;
    },
    password: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!passwordRegex.test(value)) {
        return 'Password must contain: uppercase, lowercase, number, special character';
      }
      return null;
    },
    role: (value) => {
      if (!value) return 'Please select a role';
      if (!['student', 'coach'].includes(value)) return 'Invalid role';
      return null;
    }
  },

  course: {
    title: (value) => {
      if (!value) return 'Course title is required';
      if (value.length < 5) return 'Title must be at least 5 characters';
      if (value.length > 100) return 'Title must be less than 100 characters';
      return null;
    },
    description: (value) => {
      if (!value) return 'Description is required';
      if (value.length < 20) return 'Description must be at least 20 characters';
      if (value.length > 5000) return 'Description must be less than 5000 characters';
      return null;
    },
    category: (value) => {
      if (!value) return 'Category is required';
      const validCategories = ['Openings', 'Endgame', 'Tactics', 'Strategy', 'Middle Game'];
      if (!validCategories.includes(value)) return 'Invalid category';
      return null;
    },
    difficulty: (value) => {
      if (!value) return 'Difficulty is required';
      const validDifficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      if (!validDifficulties.includes(value)) return 'Invalid difficulty';
      return null;
    },
    price: (value) => {
      if (value === undefined || value === null || value === '') return 'Price is required';
      const num = parseFloat(value);
      if (isNaN(num)) return 'Price must be a number';
      if (num < 0) return 'Price cannot be negative';
      if (num > 100000) return 'Price is too high';
      return null;
    }
  },

  profile: {
    bio: (value) => {
      if (!value) return null;
      if (value.length > 500) return 'Bio must be less than 500 characters';
      return null;
    },
    hourlyRate: (value) => {
      if (!value) return null;
      const num = parseFloat(value);
      if (isNaN(num)) return 'Rate must be a number';
      if (num < 0) return 'Rate cannot be negative';
      return null;
    }
  },

  booking: {
    date: (value) => {
      if (!value) return 'Date is required';
      const date = new Date(value);
      if (date < new Date()) return 'Date must be in the future';
      return null;
    },
    duration: (value) => {
      if (!value) return 'Duration is required';
      const num = parseInt(value);
      if (num < 15 || num > 180) return 'Duration must be between 15 and 180 minutes';
      return null;
    }
  }
};

/**
 * Validate a single field
 */
export const validateField = (fieldName, value, schemaType = 'login') => {
  const schema = validationSchemas[schemaType];
  if (!schema || !schema[fieldName]) return null;
  return schema[fieldName](value);
};

/**
 * Validate entire form
 */
export const validateForm = (formData, schemaType = 'login') => {
  const schema = validationSchemas[schemaType];
  const errors = {};

  Object.keys(schema).forEach((field) => {
    const error = schema[field](formData[field]);
    if (error) errors[field] = error;
  });

  return errors;
};

export default validationSchemas;
