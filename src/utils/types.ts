/**
 * InspectionData - The structured output we want from ANY inspection report
 *
 * Regardless of input format (JSON, text, different schemas), we want to normalize
 * everything into this consistent structure. This is key for RPA - standardize inputs
 * so the rest of your pipeline doesn't need to know about format variations.
 */
export interface InspectionData {
  /** Full address where the issue was found */
  location: string;

  /** Type of damage/issue (e.g., "structural", "electrical", "corrosion") */
  damageType: string;

  /** Severity level: "low", "medium", or "high" */
  severity: 'low' | 'medium' | 'high';

  /** Detailed notes/observations from the inspection */
  notes: string;

  /** Optional: Original report ID for tracking */
  reportId?: string;
}

/**
 * FormField - Represents a field Claude Vision identified in a screenshot
 *
 * This is what Claude Vision returns when it "looks" at a form and tells us
 * where to enter data.
 */
export interface FormField {
  /** What the field is for (e.g., "location", "damage_type") */
  fieldName: string;

  /** The HTML selector Claude identified (e.g., "#location", "#site-address") */
  selector: string;

  /** Type of input: text field, dropdown, or textarea */
  fieldType: 'input' | 'select' | 'textarea';

  /** Optional: If it's a select, what value should we choose from the dropdown */
  selectValue?: string;
}
