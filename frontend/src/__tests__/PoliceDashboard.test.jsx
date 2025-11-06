import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoliceDashboard from '../pages/PoliceDashboard.jsx';

/* -------------------- Mocks (hoisted-safe) -------------------- */
const hoisted = vi.hoisted(() => {
  const state = {
    active: [
      {
        fir_id: 'act-1',
        status: 'active',
        incident_location: 'Station Market',
        case_narrative: 'Some narrative here.',
        offence_type: 'Theft',
        fullname: 'Alice Citizen',
        created_at: '2025-11-05T15:17:00Z',
      },
    ],
    closed: [
      {
        fir_id: 'cl-1',
        status: 'closed',
        incident_location: 'Civil Lines',
        case_narrative: 'Closed narrative.',
        offence_type: 'Assault',
        fullname: 'Bob Citizen',
        created_at: '2025-11-05T15:17:00Z',
      },
    ],
    all: [],
    details: {
      'act-1': {
        fir_id: 'act-1',
        status: 'active',
        fullname: 'Alice Citizen',
        age: 30,
        gender: 'Female',
        address: '123 Street',
        contact_number: '9999999999',
        id_proof_type: 'Aadhar',
        id_proof_value: '123412341234',
        incident_date: '2025-11-05',
        incident_time: '20:47',
        offence_type: 'Theft',
        incident_location: 'Station Market',
        case_narrative: 'Some narrative here.',
        progress: [
          {
            progress_text: 'Initial update',
            evidence_text: 'Receipt collected',
            created_at: '2025-11-06T14:15:00Z',
          },
        ],
        culprits: [{ name: '', custody_status: 'at large' }],
      },
    },
  };
  state.all = [...state.active, ...state.closed];

  const routesMock = {
    getFIRsByStation: vi.fn(async () => ({
      active: [...state.active],
      closed: [...state.closed],
      all: [...state.all],
    })),
    getFIRDetails: vi.fn(async (id) => state.details[id]),
    registerIncident: vi.fn(async (payload) => {
      const id = 'new-123';
      const newFIR = {
        fir_id: id,
        status: 'active',
        incident_location: payload.incident_location,
        case_narrative: payload.case_narrative,
        offence_type: payload.offence_type,
        fullname: payload.fullname,
        created_at: new Date().toISOString(),
      };
      state.active.unshift(newFIR);
      state.all.unshift(newFIR);
      state.details[id] = {
        ...newFIR,
        age: Number(payload.age) || 0,
        gender: payload.gender || '',
        address: payload.address || '',
        contact_number: payload.contact_number || '',
        id_proof_type: payload.id_proof_type || '',
        id_proof_value: payload.id_proof_value || '',
        incident_date: payload.incident_date || '',
        incident_time: payload.incident_time || '',
        progress: [],
        culprits: [],
      };
      return { report_id: id };
    }),
    addProgress: vi.fn(async ({ fir_id, progress_text }) => {
      if (!hoisted.state.details[fir_id]) return;
      hoisted.state.details[fir_id].progress.push({
        progress_text,
        created_at: new Date().toISOString(),
      });
    }),
    closeFIR: vi.fn(async ({ fir_id }) => {
      const idx = hoisted.state.active.findIndex((f) => f.fir_id === fir_id);
      if (idx !== -1) {
        const item = { ...hoisted.state.active[idx], status: 'closed' };
        hoisted.state.active.splice(idx, 1);
        hoisted.state.closed.unshift(item);
        hoisted.state.all = hoisted.state.all.map((f) =>
          f.fir_id === fir_id ? { ...f, status: 'closed' } : f
        );
        if (hoisted.state.details[fir_id]) {
          hoisted.state.details[fir_id].status = 'closed';
        }
      }
    }),
    searchFIRs: vi.fn(async (q) => {
      const query = String(q).toLowerCase();
      return hoisted.state.all.filter(
        (f) =>
          f.fir_id.toLowerCase().includes(query) ||
          (f.offence_type || '').toLowerCase().includes(query) ||
          (f.fullname || '').toLowerCase().includes(query) ||
          (f.incident_location || '').toLowerCase().includes(query)
      );
    }),
  };

  return { state, routesMock };
});

vi.mock('../services/routes', () => ({ default: hoisted.routesMock }));

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(async (url) => {
      if (url === '/policeauth/allmembers') {
        // Keep async to simulate loading; tests will use findBy*
        return { data: [{ name: 'Officer A' }, { name: 'Officer B' }] };
      }
      return { data: [] };
    }),
  },
}));

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig();
  return { ...actual, useNavigate: () => vi.fn() };
});

/* -------------------- Helpers -------------------- */

const renderDash = () =>
  render(
    <MemoryRouter>
      <PoliceDashboard />
    </MemoryRouter>
  );

// find the nearest <section> that contains the given title text
const getSectionByTitle = async (titleRe) => {
  const titleEl = await screen.findByText(titleRe);
  let node = titleEl;
  while (node && node.nodeName.toLowerCase() !== 'section') {
    node = node.parentElement;
  }
  if (!node) throw new Error('Section not found for ' + titleRe);
  return node;
};

// helper to get an <input/textarea/select> visually under a label inside a given root
const fieldByLabel = (root, labelRe, selector = 'input,textarea,select') => {
  const label = within(root).getByText(labelRe);
  let container = label.closest('div') || label.parentElement || root;
  const el = container.querySelector(selector);
  if (!el) throw new Error('Field not found for ' + labelRe);
  return el;
};

// ascend from an element to the closest modal card (div.modal-card)
const getModalCardFromTitle = async (titleRe) => {
  const header = await screen.findByText(titleRe);
  let el = header;
  while (el && !(el.classList && el.classList.contains('modal-card'))) {
    el = el.parentElement;
  }
  return el || header; // fallback so queries still work
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    'user',
    JSON.stringify({ name: 'Officer Jane', member_id: 'M-77', station_id: 'ST-09' })
  );
  localStorage.setItem('token', 'tkn');

  vi.clearAllMocks();
  hoisted.state.active = [
    {
      fir_id: 'act-1',
      status: 'active',
      incident_location: 'Station Market',
      case_narrative: 'Some narrative here.',
      offence_type: 'Theft',
      fullname: 'Alice Citizen',
      created_at: '2025-11-05T15:17:00Z',
    },
  ];
  hoisted.state.closed = [
    {
      fir_id: 'cl-1',
      status: 'closed',
      incident_location: 'Civil Lines',
      case_narrative: 'Closed narrative.',
      offence_type: 'Assault',
      fullname: 'Bob Citizen',
      created_at: '2025-11-05T15:17:00Z',
    },
  ];
  hoisted.state.all = [...hoisted.state.active, ...hoisted.state.closed];
  hoisted.state.details = {
    'act-1': {
      fir_id: 'act-1',
      status: 'active',
      fullname: 'Alice Citizen',
      age: 30,
      gender: 'Female',
      address: '123 Street',
      contact_number: '9999999999',
      id_proof_type: 'Aadhar',
      id_proof_value: '123412341234',
      incident_date: '2025-11-05',
      incident_time: '20:47',
      offence_type: 'Theft',
      incident_location: 'Station Market',
      case_narrative: 'Some narrative here.',
      progress: [
        {
          progress_text: 'Initial update',
          evidence_text: 'Receipt collected',
          created_at: '2025-11-06T14:15:00Z',
        },
      ],
      culprits: [{ name: '', custody_status: 'at large' }],
    },
  };
});

/* -------------------- Tests -------------------- */

describe('PoliceDashboard', () => {
  it('renders header, members, and station lists', async () => {
    renderDash();

    expect(
      screen.getByRole('heading', { name: /Digital Police Station Dashboard/i })
    ).toBeInTheDocument();

    // members (async fetch)
    expect(await screen.findByText('Officer A')).toBeInTheDocument();
    expect(await screen.findByText('Officer B')).toBeInTheDocument();

    // sections present
    const activeSec = await getSectionByTitle(/Active FIRs/i);
    const closedSec = await getSectionByTitle(/Closed FIRs/i);
    const allSec = await getSectionByTitle(/All FIRs \(This Station\)/i);

    // rows scoped per section to avoid duplicates across lists
    expect(within(activeSec).getByText(/Theft — Alice Citizen/i)).toBeInTheDocument();
    expect(within(closedSec).getByText(/Assault — Bob Citizen/i)).toBeInTheDocument();

    // "All" list has both; assert at least 2 rows total present
    expect(within(allSec).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
  });

  it('opens details for a FIR and shows Overview, then Save Update triggers routes.addProgress', async () => {
    const user = userEvent.setup();
    renderDash();

    const activeSec = await getSectionByTitle(/Active FIRs/i);

    // wait until row is in active section
    const row = await within(activeSec).findByText(/Theft — Alice Citizen/i);
    await user.click(row);

    const modal = await getModalCardFromTitle(/FIR Details/i);
    expect(within(modal).getByText(/Overview/i)).toBeInTheDocument();
    expect(within(modal).getByText('act-1')).toBeInTheDocument();
    expect(within(modal).getByText(/Alice Citizen/i)).toBeInTheDocument();

    const progressBox = within(modal).getByPlaceholderText(/Describe progress made/i);
    await user.type(progressBox, 'Follow-up done');
    await user.click(within(modal).getByRole('button', { name: /Save Update/i }));

    expect(hoisted.routesMock.addProgress).toHaveBeenCalledWith(
      expect.objectContaining({ fir_id: 'act-1', progress_text: 'Follow-up done' })
    );
  });

  it('closes an active FIR after confirm and moves it to Closed list', async () => {
    const user = userEvent.setup();
    renderDash();

    const activeSec = await getSectionByTitle(/Active FIRs/i);
    const row = await within(activeSec).findByText(/Theft — Alice Citizen/i);
    await user.click(row);

    const modal = await getModalCardFromTitle(/FIR Details/i);
    expect(within(modal).getByText(/Overview/i)).toBeInTheDocument();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(within(modal).getByRole('button', { name: /Close FIR/i }));

    await waitFor(() => {
      expect(screen.queryByText(/FIR Details/i)).not.toBeInTheDocument();
    });

    expect(hoisted.routesMock.closeFIR).toHaveBeenCalledWith(
      expect.objectContaining({ fir_id: 'act-1' })
    );

    // Active no longer has Alice
    expect(within(activeSec).queryByText(/Theft — Alice Citizen/i)).not.toBeInTheDocument();

    // Closed section should now include act-1 somewhere (title line shows #act-1)
    const closedSec = await getSectionByTitle(/Closed FIRs/i);
    expect(within(closedSec).getAllByRole('listitem').length).toBeGreaterThanOrEqual(1);

    confirmSpy.mockRestore();
  });

  it('opens File New FIR, completes steps, and shows the created FIR in All list', async () => {
    const user = userEvent.setup();
    renderDash();

    await user.click(screen.getByRole('button', { name: /\+ File FIR/i }));
    const modal = await getModalCardFromTitle(/File New FIR/i);

    // -------- Step 0 (Complainant) --------
    await user.type(fieldByLabel(modal, /Full Name/i), 'Charlie Test');
    const ageInput = fieldByLabel(modal, /Age/i);
    await user.clear(ageInput);
    await user.type(ageInput, '28');
    await user.selectOptions(fieldByLabel(modal, /Gender/i, 'select'), 'Male');
    await user.type(fieldByLabel(modal, /Contact Number/i), '8888888888');
    await user.type(fieldByLabel(modal, /Address/i), '221B Baker Street');
    await user.selectOptions(fieldByLabel(modal, /ID Proof Type/i, 'select'), 'Aadhar');
    await user.type(fieldByLabel(modal, /ID Proof Value/i), '000011112222');
    await user.click(within(modal).getByRole('button', { name: /Next/i }));

    // -------- Step 1 (Incident) --------
    await user.type(fieldByLabel(modal, /Incident Date/i), '2025-11-06');
    await user.type(fieldByLabel(modal, /Incident Time/i), '10:30');
    await user.type(fieldByLabel(modal, /Offence Type/i), 'Robbery');
    await user.type(fieldByLabel(modal, /Incident Location/i), 'Main Square');
    await user.click(within(modal).getByRole('button', { name: /Next/i }));

    // -------- Step 2 (Narrative) --------
    await user.type(fieldByLabel(modal, /Case Narrative/i, 'textarea'), 'Test narrative.');
    await user.click(within(modal).getByRole('button', { name: /Submit FIR/i }));

    await waitFor(() => {
      expect(screen.queryByText(/File New FIR/i)).not.toBeInTheDocument();
    });

    const allSec = await getSectionByTitle(/All FIRs \(This Station\)/i);
    expect(await within(allSec).findByText(/#new-123/i)).toBeInTheDocument();
    expect(within(allSec).getByText(/Robbery — Charlie Test/i)).toBeInTheDocument();

    expect(hoisted.routesMock.registerIncident).toHaveBeenCalled();
  });

  it('searches and opens result details', async () => {
    const user = userEvent.setup();
    renderDash();

    await user.click(screen.getByRole('button', { name: /Search/i }));

    const input = screen.getByPlaceholderText(/Search all FIRs/i);
    await user.type(input, 'alice');
    await user.click(screen.getByRole('button', { name: /Go/i }));

    const result = await screen.findByText(/Theft — Alice Citizen/i);
    await user.click(result);

    const modal = await getModalCardFromTitle(/FIR Details/i);
    expect(within(modal).getByText(/Overview/i)).toBeInTheDocument();
    expect(within(modal).getByText('act-1')).toBeInTheDocument();
  });

  it('opens profile dropdown and shows meta + logout button', async () => {
    const user = userEvent.setup();
    renderDash();

    const avatar = screen.getByRole('button', { name: /Profile menu/i });
    await user.click(avatar);

    expect(await screen.findByText(/On Duty/i)).toBeInTheDocument();
    expect(screen.getByText(/Member ID/i)).toBeInTheDocument();
    expect(screen.getByText('M-77')).toBeInTheDocument();
    expect(screen.getByText(/Station ID/i)).toBeInTheDocument();
    expect(screen.getByText('ST-09')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });
});
