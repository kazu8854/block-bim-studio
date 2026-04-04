import '@cloudscape-design/global-styles/index.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const el = document.getElementById('root');
if (!el) {
  throw new Error('root element missing');
}

createRoot(el).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
