// src/setupTests.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Minimal defaults so components that read localStorage don't crash
beforeAll(() => {
  localStorage.setItem('token', 'dummy.token.value');
  localStorage.setItem(
    'user',
    JSON.stringify({ name: 'Citizen', aadhar_no: '123412341234' })
  );
});

// jsdom doesn't implement scrollIntoView — make it a harmless no-op
if (!Element.prototype.scrollIntoView) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
  });
}

// Silence window.alert during tests (and make it assertable)
if (!window.alert) {
  window.alert = () => {};
}
vi.spyOn(window, 'alert').mockImplementation(() => {});
