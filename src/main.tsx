
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'



console.log('Starting application...');

// Add CSP error listener
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    directive: e.violatedDirective,
    blockedURI: e.blockedURI,
    sourceFile: e.sourceFile,
    lineNumber: e.lineNumber,
    columnNumber: e.columnNumber
  });
});

// Add global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error, e.filename, e.lineno, e.colno);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

console.log('Root element found, creating React root...');
try {
  createRoot(rootElement).render(<App />);
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
}
