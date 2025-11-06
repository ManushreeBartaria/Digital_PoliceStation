// src/__tests__/GovernmentDashboard.test.jsx
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import GovernmentDashboard from '../pages/GovernmentDashboard';

// ---- mock the axios instance used by your code: src/services/api.js ----
vi.mock('../services/api', () => {
  const get = vi.fn(async (url) => {
    if (url === '/government/escalations') {
      return {
        data: [
          {
            id: 1,
            fir_id: '5ffd53c0-ae10-4d40-b584-5d59098da021',
            aadhar_no: '123456789',
            reason: 'Investigation was not done properly',
            status: 'pending',
            created_at: new Date('2025-11-06T12:33:57Z').toISOString(),
            updated_at: new Date('2025-11-06T12:33:57Z').toISOString(),
          },
        ],
      };
    }

    if (url === '/fir/details') {
      return {
        data: {
          fir_id: '5ffd53c0-ae10-4d40-b584-5d59098da021',
          fullname: 'Manushree Bartaria',
          offence_type: 'Theft',
          incident_location: 'Jagatpura',
          incident_date: '2025-11-05',
          incident_time: '20:47:00',
          id_proof_value: '123456789',
          station_id: '123456',
          member_id: 1,
          status: 'active',
          case_narrative: 'I was in market…',
          progress: [
            {
              id: 10,
              created_at: new Date('2025-11-06T14:15:00Z').toISOString(),
              progress_text: 'CCTV footage collected',
              evidence_text: 'Video evidence',
            },
          ],
          culprits: [{ id: 1, name: 'Unknown', custody_status: 'at large' }],
        },
      };
    }

    if (url === '/fir/list') {
      return {
        data: [
          {
            fir_id: '23ab91c7-f5b1-408d-9c3c-0e2835a3ac98',
            fullname: 'Manushree Bartaria',
            offence_type: 'Kidnapping',
            incident_location: 'Jaipur-Ajmer highway',
            status: 'active',
            incident_date: '2025-11-05',
            station_id: '123456',
          },
        ],
      };
    }

    return { data: [] };
  });

  return { default: { get } };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <GovernmentDashboard />
    </MemoryRouter>
  );
}

describe('GovernmentDashboard', () => {
  test('shows the header and Government chip', async () => {
    renderPage();
    expect(screen.getByText(/Digital Police Station/i)).toBeInTheDocument();
    expect(screen.getByText(/Government/i)).toBeInTheDocument();
  });

  test('dropdown shows government member id and logout button', async () => {
    renderPage();
    const chip = screen.getByRole('button', { name: /profile menu/i });
    await userEvent.click(chip);

    expect(await screen.findByText(/Government Member ID/i)).toBeInTheDocument();

    // tolerate either "9999" (from setup) or "—" (if component didn’t decode it)
    const idValue = screen.getByText((txt) => {
      const t = String(txt).trim();
      return t === '9999' || t === '—';
    });
    expect(idValue).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  test('renders escalations list and opens FIR modal with details', async () => {
    renderPage();

    // one escalation row appears
    const row = await screen.findByText(/FIR #5ffd53c0-ae10-4d40-b584-5d59098da021/i);
    expect(row).toBeInTheDocument();

    // click View button
    const viewBtn = screen.getAllByRole('button', { name: /View/i })[0];
    await userEvent.click(viewBtn);

    // modal header anchors us to the modal
    const modalHeader = await screen.findByText(/FIR Details/i);
    // climb up to the card container (header -> header row -> card container)
    const modalContainer = modalHeader.parentElement?.parentElement ?? modalHeader;

    // Check label/value rows rather than exact long ID string (robust to wrapping)
    const getValueFromKeyVal = (labelRegex) => {
      const labelEl = within(modalContainer).getByText(labelRegex);
      const row = labelEl.closest('div'); // KeyVal row container
      // “value” is the last span in the row
      return row?.querySelector('span:last-child');
    };

    // Status
    expect(getValueFromKeyVal(/^Status$/i)).toHaveTextContent(/ACTIVE/i);
    // Complainant
    expect(getValueFromKeyVal(/^Complainant$/i)).toHaveTextContent(/Manushree Bartaria/i);
    // Offence & Location
    expect(getValueFromKeyVal(/^Offence$/i)).toHaveTextContent(/Theft/i);
    expect(getValueFromKeyVal(/^Location$/i)).toHaveTextContent(/Jagatpura/i);

    // Escalation reason block is modal-only
    expect(within(modalContainer).getByText(/Escalation Reason/i)).toBeInTheDocument();
    expect(within(modalContainer).getByText(/Investigation was not done properly/i)).toBeInTheDocument();

    // Latest progress (modal-only too)
    expect(within(modalContainer).getByText(/CCTV footage collected/i)).toBeInTheDocument();
    expect(within(modalContainer).getByText(/Video evidence/i)).toBeInTheDocument();
  });

  test('lists All FIRs (all stations)', async () => {
    renderPage();
    expect(await screen.findByText(/All FIRs \(All Stations\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/23ab91c7-f5b1-408d-9c3c-0e2835a3ac98/i)).toBeInTheDocument();
  });
});
