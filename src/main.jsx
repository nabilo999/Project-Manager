import React, { useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './prototype.jsx';
import '../styles.css';
import { initPrototype } from '../app.js';

function Root() {
  useLayoutEffect(() => {
    try {
      initPrototype();
    } catch (error) {
      console.error('Project Place interaction setup failed', error);
    }
    const screens = [...document.querySelectorAll('.screen')];
    const go = (id) => {
      screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
      document.getElementById(id)?.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleNavigation = (event) => {
      const target = event.target.closest?.('[data-go], [data-open-board]');
      if (!target) return;
      if (target.matches('[data-open-board]')) {
        go('board-screen');
        return;
      }
      go(target.dataset.go);
    };
    document.addEventListener('click', handleNavigation, true);
    const addChecklistRow = (event) => {
      const button = event.target.closest?.('.checklist-card .add-check-item');
      if (!button || button.previousElementSibling?.classList.contains('inline-check-input')) return;
      const row = document.createElement('div');
      row.className = 'inline-check-input';
      row.innerHTML = '<input placeholder="Add a task…" aria-label="New checklist task" /><button type="button" aria-label="Save checklist task">＋</button>';
      button.before(row);
      const input = row.querySelector('input');
      const save = () => {
        const text = input.value.trim();
        if (!text) return input.focus();
        const item = document.createElement('label');
        item.innerHTML = '<input type="checkbox"><span></span>';
        item.querySelector('span').textContent = text;
        button.closest('.checklist-card')?.querySelector('.check-items')?.append(item);
        const checklist = button.closest('.checklist-card');
        if (checklist) {
          const total = checklist.querySelectorAll('.check-items input').length;
          const done = checklist.querySelectorAll('.check-items input:checked').length;
          const progress = checklist.querySelector('.task-progress');
          if (progress) progress.textContent = `${done} / ${total}`;
        }
        row.remove();
      };
      row.querySelector('button').addEventListener('click', save);
      input.addEventListener('keydown', (keyEvent) => { if (keyEvent.key === 'Enter') { keyEvent.preventDefault(); save(); } });
      input.focus();
    };
    document.addEventListener('click', addChecklistRow, true);
    go('welcome');
    return () => {
      document.removeEventListener('click', handleNavigation, true);
      document.removeEventListener('click', addChecklistRow, true);
    };
  }, []);
  return <App />;
}

createRoot(document.getElementById('root')).render(<Root />);
