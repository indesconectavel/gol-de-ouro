// Testes para a página Login - Gol de Ouro Player
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockLoggedOutUser, mockFetch, cleanupMocks } from '../../utils/testUtils';
import Login from '../Login';

// Mock do useAuth
const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null
  })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null })
}));

describe('Login Page', () => {
  beforeEach(() => {
    cleanupMocks();
    mockLoggedOutUser();
    mockFetch({ success: true });
  });

  afterEach(() => {
    cleanupMocks();
  });

  test('renderiza formulário de login corretamente', () => {
    renderWithProviders(<Login />);
    
    // Verificar se os campos estão presentes
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByText(/não tem uma conta/i)).toBeInTheDocument();
  });

  test('valida campos obrigatórios', async () => {
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    fireEvent.click(submitButton);
    
    // Verificar se as mensagens de erro aparecem
    await waitFor(() => {
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
    });
  });

  test('valida formato do email', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  test('chama função de login com dados corretos', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  test('exibe erro quando login falha', () => {
    const errorMessage = 'Credenciais inválidas';
    
    // Mock do useAuth com erro
    jest.doMock('../../hooks/useAuth', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false,
        error: errorMessage
      })
    }));

    renderWithProviders(<Login />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('exibe loading durante login', () => {
    // Mock do useAuth com loading
    jest.doMock('../../hooks/useAuth', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: true,
        error: null
      })
    }));

    renderWithProviders(<Login />);
    
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled();
  });

  test('navega para registro quando link é clicado', () => {
    renderWithProviders(<Login />);
    
    const registerLink = screen.getByText(/criar conta/i);
    fireEvent.click(registerLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  test('navega para dashboard após login bem-sucedido', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });
    
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('navega para página de origem após login', async () => {
    const fromPath = '/game';
    
    // Mock do useLocation com state
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useLocation: () => ({ state: { from: { pathname: fromPath } } })
    }));

    mockLogin.mockResolvedValueOnce({ success: true });
    
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(fromPath);
    });
  });
});
