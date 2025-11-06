import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import CitizenDashboard from '../pages/CitizenDashboard';

vi.mock('../services/routes', () => {
  const mockFIRs = [
    {
      fir_id: 'abc-123',
      fullname: 'Alice Example',
      offence_type: 'Theft',
      incident_location: 'Jagatpura',
      status: 'closed',
    },
    {
      fir_id: 'xyz-789',
      fullname: 'Bob Example',
      offence_type: 'Assault',
      incident_location: 'Civil Lines',
      status: 'active',
    },
  ];

  const getCitizenFIRs = vi.fn(async () => mockFIRs);

  const getFIRDetail = vi.fn(async (fir_id) => {
    if (fir_id === 'abc-123') {
      return {
        fir_id: 'abc-123',
        fullname: 'Alice Example',
        offence_type: 'Theft',
        incident_location: 'Jagatpura',
        incident_date: '2025-11-05',
        incident_time: '20:47:00',
        status: 'closed',
        id_proof_value: '123412341234',
        station_id: 'ST-001',
        member_id: 42,
        case_narrative: 'Bag stolen near the market.',
        progress: [
          {
            id: 10,
            created_at: new Date('2025-11-06T14:15:00Z').toISOString(),
            progress_text: 'CCTV footage collected',
            evidence_text: 'Video evidence',
          },
        ],
      };
    }
    return {
      fir_id,
      fullname: 'Unknown',
      offence_type: '—',
      incident_location: '—',
      status: 'active',
      progress: [],
    };
  });

  const escalateFIR = vi.fn(async () => ({}));

  return {
    getCitizenFIRs,
    getFIRDetail,
    escalateFIR,
    default: { getCitizenFIRs, getFIRDetail, escalateFIR },
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <CitizenDashboard />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.setItem(
    'user',
    JSON.stringify({ name: 'Citizen', aadhar_no: '123412341234' })
  );
  localStorage.setItem('token', 'dummy.token.value');
});

describe('CitizenDashboard', () => {
  test('renders header and loads My FIRs list', async () => {
    renderPage();
    expect(screen.getByText(/Digital Police Station/i)).toBeInTheDocument();
    expect(screen.getByText(/My FIRs/i)).toBeInTheDocument();
    expect(await screen.findByText(/Theft — Alice Example/i)).toBeInTheDocument();
    expect(await screen.findByText(/Assault — Bob Example/i)).toBeInTheDocument();
  });

  test('opens FIR details modal when a FIR row is clicked', async () => {
    renderPage();
    const rowHeadline = await screen.findByText(/Theft — Alice Example/i);
    const rowLi = rowHeadline.closest('li') || rowHeadline.parentElement?.parentElement;
    await userEvent.click(rowLi);

    expect(await screen.findByText(/FIR Details/i)).toBeInTheDocument();
    expect(screen.getByText(/FIR ID:/i)).toBeInTheDocument();
    expect(screen.getByText('abc-123')).toBeInTheDocument();
    expect(screen.getByText(/CCTV footage collected/i)).toBeInTheDocument();
  });

  test('prefills Aadhar and escalates with selected FIR id', async () => {
    const { getByPlaceholderText } = renderPage();

    // Click the **row pill** Escalate (not the form submit)
    const rowHeadline = await screen.findByText(/Theft — Alice Example/i);
    const rowLi = rowHeadline.closest('li') || rowHeadline.parentElement?.parentElement;
    const pill = within(rowLi).getByRole('button', { name: /^Escalate$/i });
    await userEvent.click(pill);

    // Form prefilled
    const firIdInput = getByPlaceholderText(/Paste or select a FIR ID/i);
    await waitFor(() => expect(firIdInput).toHaveValue('abc-123'));

    const aadharInput = getByPlaceholderText(/Your Aadhar \(auto-filled\)/i);
    expect(aadharInput).toHaveValue('123412341234');
    expect(aadharInput).toBeDisabled();

    // Type reason
    const reasonBox = getByPlaceholderText(/Describe why you are requesting escalation/i);
    await userEvent.clear(reasonBox);
    await userEvent.type(reasonBox, 'Please review: missing witness statement.');

    // ⬇️ Disambiguate: scope to the escalate form section and pick the submit button there
    const section = screen.getByText(/Escalate Case/i).closest('section');
    const submitBtn = within(section).getByRole('button', { name: /^Escalate$/i });
    await userEvent.click(submitBtn);

    const { escalateFIR } = await import('../services/routes');
    await waitFor(() =>
      expect(escalateFIR).toHaveBeenCalledWith({
        fir_id: 'abc-123',
        reason: 'Please review: missing witness statement.',
      })
    );
  });

  test('clicking a row then "Use this FIR for Escalation" prefills the form', async () => {
    const { getByPlaceholderText } = renderPage();

    const rowHeadline = await screen.findByText(/Theft — Alice Example/i);
    const rowLi = rowHeadline.closest('li') || rowHeadline.parentElement?.parentElement;
    await userEvent.click(rowLi);

    const useBtn = await screen.findByRole('button', {
      name: /Use this FIR for Escalation/i,
    });
    await userEvent.click(useBtn);

    const firIdInput = getByPlaceholderText(/Paste or select a FIR ID/i);
    await waitFor(() => expect(firIdInput).toHaveValue('abc-123'));
  });
});
