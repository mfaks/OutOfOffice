import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, afterEach } from 'vitest';
import AuthDialog from '../components/AuthDialog';
import { AuthProvider } from '../context/AuthContext';

function renderDialog(open = true, onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <AuthProvider>
        <AuthDialog open={open} onClose={onClose} />
      </AuthProvider>,
    ),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('AuthDialog', () => {
  it('renders sign in heading by default', () => {
    renderDialog();
    expect(
      screen.getByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('switches to register mode when "Sign up" is clicked', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(
      screen.getByRole('heading', { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it('shows first name and last name fields in register mode', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });

  it('switches back to login mode when "Sign in" link is clicked in register mode', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    const switchLinks = screen.getAllByRole('button', { name: /sign in/i });
    // The submit button has type="submit"; the mode-switch link has type="button"
    const switchLink = switchLinks.find(
      (el) => (el as HTMLButtonElement).type === 'button',
    );
    await userEvent.click(switchLink!);
    expect(
      screen.getByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('shows error when passwords do not match in register mode', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'abc123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'xyz789');
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    );
    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
  });

  it('calls onClose after successful login', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }),
    );
    const { onClose } = renderDialog();
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'pass123');
    await userEvent.click(
      screen.getByRole('button', { name: /^sign in$/i, hidden: true }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows error message on login failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Invalid credentials' }), {
        status: 401,
      }),
    );
    renderDialog();
    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrongpass');
    await userEvent.click(
      screen.getByRole('button', { name: /^sign in$/i, hidden: true }),
    );
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
