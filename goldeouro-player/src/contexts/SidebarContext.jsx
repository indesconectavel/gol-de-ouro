import React, { createContext, useContext, useState } from 'react'

const SidebarContext = createContext()

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export const SidebarProvider = ({ children }) => {
  // Sidebar sempre retraída - sem opção de expandir
  const isCollapsed = true

  const value = {
    isCollapsed,
    toggleSidebar: () => {} // Função vazia para manter compatibilidade
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}
