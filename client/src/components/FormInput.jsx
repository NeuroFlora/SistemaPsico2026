import React from "react";

/**
 * A reusable form input component with a label.
 * Uses Tailwind CSS for styling.
 * @param {object} props - Component props.
 * @param {string} props.id - The id for the input and the 'for' attribute of the label.
 * @param {string} props.label - The text for the label.
 * @param {string} props.type - The input type (e.g., 'text', 'email', 'password').
 * @param {string} props.value - The current value of the input.
 * @param {function} props.onChange - The function to call when the input value changes.
 * @param {string} [props.placeholder] - The placeholder text for the input.
 * @param {boolean} [props.required=false] - Whether the input is required.
 */
const FormInput = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder || ""}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  );
};

export default FormInput;
