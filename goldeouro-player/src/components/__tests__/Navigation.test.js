// Testes para o componente Navigation - Gol de Ouro Player
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockLoggedInUser, mockLoggedOutUser, cleanupMocks } from '../../utils/testUtils';
import Navigation from '../Navigation';

// Mock do useAuth
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      avatar: '/images/avatar.jpg'
    },
    logout: jest.fn()
  })
}));

// Mock do useNotifications
jest.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: jest.fn(),
    clearAll: jest.fn()
  })
}));

describe('Navigation Component', () => {
  beforeEach(() => {
    cleanupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  test('renderiza corretamente com usuário logado', () => {
    mockLoggedInUser();
    
    renderWithProviders(<Navigation />);
    
    // Verificar se o nome do usuário está visível
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    
    // Verificar se os links de navegação estão presentes
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jogo')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Pagamentos')).toBeInTheDocument();
    expect(screen.getByText('Saque')).toBeInTheDocument();
  });

  test('exibe inicial do usuário quando não há avatar', () => {
    mockLoggedInUser({ avatar: null });
    
    renderWithProviders(<Navigation />);
    
    // Verificar se a inicial 'J' está visível
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  test('chama logout quando botão de logout é clicado', async () => {
    const mockLogout = jest.fn();
    
    // Mock do useAuth com função de logout
    jest.doMock('../../hooks/useAuth', () => ({
      useAuth: () => ({
        user: {
          id: '1',
          name: 'João Silva',
          email: 'joao@example.com'
        },
        logout: mockLogout
      })
    }));

    mockLoggedInUser();
    
    renderWithProviders(<Navigation />);
    
    // Encontrar e clicar no botão de logout
    const logoutButton = screen.getByRole('button', { name: /sair/i });
    fireEvent.click(logoutButton);
    
    // Verificar se a função de logout foi chamada
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  test('navega para as páginas corretas', () => {
    mockLoggedInUser();
    
    renderWithProviders(<Navigation />);
    
    // Verificar se os links têm os hrefs corretos
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /jogo/i })).toHaveAttribute('href', '/game');
    expect(screen.getByRole('link', { name: /perfil/i })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: /pagamentos/i })).toHaveAttribute('href', '/pagamentos');
    expect(screen.getByRole('link', { name: /saque/i })).toHaveAttribute('href', '/withdraw');
  });

  test('exibe notificações quando há notificações não lidas', () => {
    // Mock do useNotifications com notificações
    jest.doMock('../../hooks/useNotifications', () => ({
      useNotifications: () => ({
        notifications: [
          {
            id: '1',
            title: 'Nova notificação',
            message: 'Você tem uma nova mensagem',
            unread: true
          }
        ],
        unreadCount: 1,
        markAsRead: jest.fn(),
        clearAll: jest.fn()
      })
    }));

    mockLoggedInUser();
    
    renderWithProviders(<Navigation />);
    
    // Verificar se o badge de notificação está visível
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('sidebar está colapsado por padrão', () => {
    mockLoggedInUser();
    
    renderWithProviders(<Navigation />);
    
    // Verificar se a sidebar tem a classe de colapsada
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveClass('w-16'); // Classe quando colapsada
  });
});
