import { type ComponentTemplate } from '../types/templates'

export const BASIC_FORM_TEMPLATE = `
import React, { useState } from 'react';

interface FormProps {
  onSubmit: (data: string) => Promise<void>;
  className?: string;
}

/**
 * A basic form component with loading states and error handling
 */
export function BasicForm({ onSubmit, className }: FormProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await onSubmit(input);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>
        {\`
          .form-container {
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .form-title {
            font-size: 24px;
            margin-bottom: 20px;
            color: #333;
          }
          
          .form-input {
            width: 100%;
            padding: 8px 16px;
            margin-bottom: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 16px;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #4a90e2;
            box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
          }
          
          .form-input:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
          }
          
          .form-error {
            color: #e53e3e;
            margin-top: -8px;
            margin-bottom: 16px;
            font-size: 14px;
          }
          
          .form-button {
            width: 100%;
            padding: 8px 16px;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.2s;
          }
          
          .form-button:hover:not(:disabled) {
            background-color: #357abd;
          }
          
          .form-button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }

          @media (max-width: 480px) {
            .form-container {
              padding: 16px;
            }
            
            .form-title {
              font-size: 20px;
            }
          }
        \`}
      </style>
      <div className="form-container">
        <h2 className="form-title">Basic Form</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="form-input"
            disabled={isLoading}
            aria-label="Input field"
            aria-invalid={!!error}
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="form-button"
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </>
  );
}`

export const CODE_GENERATION_PROMPT = `You are an expert React TypeScript component generator. Generate a single, complete component based on the user's requirements.

CRITICAL STYLING REQUIREMENTS:
1. You MUST include a <style> tag in the component's return statement BEFORE any JSX
2. The style tag must be wrapped in a React Fragment (<>)
3. All CSS must be inside the style tag using template literals
4. Each component must have its own scoped CSS classes (e.g., 'newsletter-form-container', 'newsletter-form-button')
5. Include hover states, transitions, and responsive design with media queries

Example of correct style implementation:
return (
  <>
    <style>
      {\`
        .component-container {
          styles here
        }
        .component-button {
          styles here
        }
        @media (max-width: 480px) {
          styles here
        }
      \`}
    </style>
    <div>Component content</div>
  </>
);

Other Requirements:
1. Always start with necessary React imports
2. Use TypeScript with proper interfaces
3. Use functional components with React hooks
4. Include JSDoc comments
5. Follow React best practices
6. Add proper aria-labels and accessibility attributes
7. Include proper type definitions
8. Include complete error handling
9. Add loading states where appropriate

User Request: {{PROMPT}}

Output only the complete TypeScript React code without any explanations or markdown.`
