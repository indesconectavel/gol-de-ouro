import { useState } from "react";

export const GAME_STATE = {
  IDLE: "IDLE",
  SHOOTING: "SHOOTING",
  RESOLVING: "RESOLVING",
};

export default function GameCycle() {
  const [gameState, setGameState] = useState(GAME_STATE.IDLE);

  function startShot() {
    if (gameState !== GAME_STATE.IDLE) return;
    setGameState(GAME_STATE.SHOOTING);
  }

  function resolveShot() {
    setGameState(GAME_STATE.RESOLVING);
  }

  function endCycle() {
    setGameState(GAME_STATE.IDLE);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Game Cycle Test</h1>
      <p>Estado atual: <strong>{gameState}</strong></p>

      <button onClick={startShot}>Chutar</button>
      <button onClick={resolveShot}>Resolver</button>
      <button onClick={endCycle}>Reset</button>
    </div>
  );
}

