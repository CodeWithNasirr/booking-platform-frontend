/**
 * resolveTranslated
 * app/tenant-site/[domain]/utils/resolveTranslated.js
 * 
 * Resolves multilingual JSON fields to the appropriate language value.
 * 
 * Backend stores multilingual content as:
 * {
 *   "en": "Hello",
 *   "ar": "مرحبا",
 *   "ur": "ہیلو"
 * }
 * 
 * This function extracts the correct value based on current language.
 * 
 * @param {Object|string} field - The multilingual field or plain string
 * @param {string} lang - Current language code (e.g., "en", "ar", "ur")
 * @param {string} fallbackLang - Fallback language if current not found (default: "en")
 * @returns {string} - Resolved text value
 * 
 * @example
 * const title = resolveTranslated(section.content.title, "ar");
 * // Returns Arabic title if available, otherwise falls back to English
 */
export function resolveTranslated(field, lang = "en", fallbackLang = "en") {
  // If field is null or undefined, return empty string
  if (field == null) {
    return "";
  }

  // If field is already a string, return it directly
  if (typeof field === "string") {
    return field;
  }

  // If field is an object (multilingual JSON)
  if (typeof field === "object") {
    // Try requested language first
    if (field[lang]) {
      return field[lang];
    }

    // Try fallback language
    if (field[fallbackLang]) {
      return field[fallbackLang];
    }

    // Try English as last resort
    if (field["en"]) {
      return field["en"];
    }

    // Return first available value
    const values = Object.values(field);
    if (values.length > 0 && typeof values[0] === "string") {
      return values[0];
    }

    return "";
  }

  // For any other type, convert to string
  return String(field);
}

/**
 * resolveTranslatedArray
 * 
 * Resolves an array of multilingual items.
 * Useful for navigation items, features lists, etc.
 * 
 * @param {Array} items - Array of items with multilingual fields
 * @param {string} lang - Current language code
 * @param {Array} fields - Fields to translate (default: ["title", "description", "label"])
 * @returns {Array} - Array with resolved translations
 */
export function resolveTranslatedArray(items, lang = "en", fields = ["title", "description", "label", "text", "name"]) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(item => {
    // Handle string items
    if (typeof item === "string") {
      return item;
    }
    
    // Handle multilingual string items (like features list)
    if (typeof item === "object" && item !== null) {
      // Check if this is a direct multilingual object
      const keys = Object.keys(item);
      const isMultilingual = keys.some(k => ["en", "ar", "ur", "he", "fa"].includes(k));
      
      if (isMultilingual && keys.every(k => typeof item[k] === "string" || item[k] === null)) {
        return resolveTranslated(item, lang);
      }
    }
    
    const resolved = { ...item };
    
    fields.forEach(field => {
      if (item[field] !== undefined) {
        resolved[field] = resolveTranslated(item[field], lang);
      }
    });

    return resolved;
  });
}

/**
 * resolveTranslatedContent
 * 
 * Deeply resolves all translatable fields in a content object.
 * 
 * @param {Object} content - Section content object
 * @param {string} lang - Current language code
 * @returns {Object} - Content with resolved translations
 */
export function resolveTranslatedContent(content, lang = "en") {
  if (!content || typeof content !== "object") {
    return content;
  }

  const resolved = {};

  for (const [key, value] of Object.entries(content)) {
    if (value === null || value === undefined) {
      resolved[key] = value;
    } else if (Array.isArray(value)) {
      // Handle arrays (navigation, features, testimonials, etc.)
      resolved[key] = value.map(item => {
        if (typeof item === "object" && item !== null) {
          return resolveTranslatedContent(item, lang);
        }
        return item;
      });
    } else if (typeof value === "object") {
      // Check if it's a multilingual object (has language keys)
      const keys = Object.keys(value);
      const isMultilingual = keys.some(k => ["en", "ar", "ur", "he", "fa"].includes(k));
      
      if (isMultilingual && keys.every(k => typeof value[k] === "string" || value[k] === null)) {
        // It's a multilingual field
        resolved[key] = resolveTranslated(value, lang);
      } else {
        // It's a nested object, recurse
        resolved[key] = resolveTranslatedContent(value, lang);
      }
    } else {
      // Primitive value, keep as is
      resolved[key] = value;
    }
  }

  return resolved;
}

export default resolveTranslated;
