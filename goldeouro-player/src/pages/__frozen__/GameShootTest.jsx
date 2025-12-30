import React from "react";

export default function GameShootTest() {
  return (
    <div style={{ 
      width: "100%", 
      height: "100vh", 
      background: "#052a4d", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      color: "white",
      fontSize: "24px"
    }}>
      <div>
        <h1>🎯 Gol de Ouro - Teste</h1>
        <p>Se você está vendo isso, o roteamento está funcionando!</p>
        <p>URL: {window.location.href}</p>
      </div>
    </div>
  );
}
