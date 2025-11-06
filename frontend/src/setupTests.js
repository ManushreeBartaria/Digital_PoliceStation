import '@testing-library/jest-dom';

beforeAll(() => {
  // a lightweight localStorage/token default so components that read it don't crash
  localStorage.setItem('token', 'dummy.token.value');
  localStorage.setItem('user', JSON.stringify({ name: 'Government', government_member_id: '9999' }));
});
