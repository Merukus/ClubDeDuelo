const DATA_URL = "./data/tournament.json";

const ROUND_LABELS = {
  quarter: "Cuartos",
  semi: "Semifinal",
  final: "Final"
};

const SECTION_LABELS = {
  A: "Llave A",
  B: "Llave B",
  C: "Llave C",
  D: "Llave D",
  FINAL: "Final del Campeonato"
};

let tournamentData = null;
let activeSection = "A";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindNavigation();

  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error("No se pudo cargar el archivo tournament.json");
    }

    tournamentData = await response.json();
    renderSection(activeSection);
  } catch (error) {
    renderError(error.message);
  }
}

function bindNavigation() {
  const buttons = document.querySelectorAll(".nav-button");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activeSection = button.dataset.section;

      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      renderSection(activeSection);
    });
  });
}

function renderSection(sectionKey) {
  if (!tournamentData) return;

  if (sectionKey === "FINAL") {
    renderFinalSection();
    return;
  }

  renderBracketSection(sectionKey);
}

function renderBracketSection(sectionKey) {
  const content = document.getElementById("content");
  const matches = tournamentData.matches.filter((match) => match.key === sectionKey);

  const quarterMatches = matches.filter((match) => match.round === "quarter");
  const semiMatches = matches.filter((match) => match.round === "semi");
  const finalMatches = matches.filter((match) => match.round === "final");

  const bracketWinner = getMatchWinner(finalMatches[0]);

  content.innerHTML = `
    <article class="bracket-section">
      <div class="bracket-header">
        <div>
          <h2 class="bracket-title">${SECTION_LABELS[sectionKey]}</h2>
        </div>
        <div class="bracket-pill">BRACKET ${sectionKey}</div>
      </div>

      <div class="bracket-board">
        ${renderRoundColumn("Cuartos", "quarter", quarterMatches)}
        ${renderRoundColumn("Semifinal", "semi", semiMatches)}
        ${renderRoundColumn("Final de llave", "final", finalMatches)}

        <div class="round-column">
          <h3 class="round-title winner">Ganador</h3>
          <div class="matches-list key-final">
            <div class="key-winner-card">
              <span>🏆 Ganador ${SECTION_LABELS[sectionKey]}</span>
              <strong>${bracketWinner ? bracketWinner.name : "Pendiente"}</strong>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderFinalSection() {
  const content = document.getElementById("content");

  const finalMatches = tournamentData.matches.filter((match) => match.key === "FINAL");
  const semiMatches = finalMatches.filter((match) => match.round === "semi");
  const grandFinal = finalMatches.find((match) => match.round === "final");

  const champion = getMatchWinner(grandFinal);

  content.innerHTML = `
    <article class="final-layout">
      <div class="final-hero">
        <div>
          <h2>Final del Campeonato</h2>
          <p>Los ganadores de las 4 llaves se enfrentan por el título absoluto.</p>
        </div>
        <div style="font-size: 42px;">🏆</div>
      </div>

      <div class="final-board">
        ${renderRoundColumn("Semifinal General", "semi", semiMatches)}
        ${renderRoundColumn("Gran Final", "final", [grandFinal])}

        <div class="champion-card">
          <div class="cup">🏆</div>
          <div class="name">${champion ? champion.name : "Campeón pendiente"}</div>
        </div>
      </div>
    </article>
  `;
}

function renderRoundColumn(title, roundClass, matches) {
  const safeMatches = matches.filter(Boolean);

  return `
    <div class="round-column">
      <h3 class="round-title ${roundClass}">${title}</h3>
      <div class="matches-list ${getMatchListClass(roundClass)}">
        ${safeMatches.map((match) => renderMatch(match)).join("")}
      </div>
    </div>
  `;
}

function getMatchListClass(roundClass) {
  if (roundClass === "quarter") return "quarter";
  if (roundClass === "semi") return "semi";
  return "key-final";
}

function renderMatch(match) {
  const slotA = resolveSlot(match.slots[0]);
  const slotB = resolveSlot(match.slots[1]);

  return `
    <div class="match-card" title="${match.label}">
      ${renderPlayerSlot(slotA, match, 0)}
      ${renderPlayerSlot(slotB, match, 1)}
    </div>
  `;
}

function renderPlayerSlot(player, match, slotIndex) {
  const score = Array.isArray(match.scores) ? match.scores[slotIndex] : 0;

  if (!player) {
    return `
      <div class="match-player is-empty">
        <span class="player-name">Pendiente</span>
        <span class="player-score">-</span>
      </div>
    `;
  }

  const isWinner = match.winnerId === player.id;
  const tooltip = buildPlayerTooltip(player);

  return `
    <div class="match-player ${isWinner ? "is-winner" : ""}">
      <span class="player-name">${player.name}</span>
      <span class="player-score">${score ?? 0}</span>
      ${tooltip}
    </div>
  `;
}

function buildPlayerTooltip(player) {
  const typeLabel = player.type === "PLAYER" ? "Player" : "NPC";
  const typeClass = player.type === "PLAYER" ? "player" : "npc";
  const nickname = player.type === "PLAYER" && player.nickname ? player.nickname : "No aplica";

  const history = getPlayerHistory(player.id);
  const currentMatch = getCurrentMatchForPlayer(player.id);
  const nextOpponent = currentMatch ? getOpponentName(currentMatch, player.id) : "Pendiente";

  const historyHtml = history.length
    ? history.map((item) => `<div class="tooltip-row">• ${item}</div>`).join("")
    : `<div class="tooltip-row">Sin combates registrados todavía.</div>`;

  return `
    <div class="player-tooltip">
      <p class="tooltip-title">
        ${player.name}
        <span class="type-badge ${typeClass}">${typeLabel}</span>
      </p>
      <div class="tooltip-row"><span class="tooltip-label">Nickname:</span> ${nickname}</div>
      <div class="tooltip-row"><span class="tooltip-label">Llave:</span> ${player.key}</div>
      <div class="tooltip-row"><span class="tooltip-label">Próximo rival:</span> ${nextOpponent}</div>
      <div class="tooltip-row" style="margin-top: 10px;"><span class="tooltip-label">Historial:</span></div>
      ${historyHtml}
    </div>
  `;
}

function resolveSlot(slot) {
  if (!slot) return null;

  if (typeof slot === "string") {
    return getPlayerById(slot);
  }

  if (slot.fromMatch) {
    const sourceMatch = getMatchById(slot.fromMatch);
    return getMatchWinner(sourceMatch);
  }

  return null;
}

function getMatchWinner(match) {
  if (!match || !match.winnerId) return null;
  return getPlayerById(match.winnerId);
}

function getPlayerById(playerId) {
  return tournamentData.players.find((player) => player.id === playerId) || null;
}

function getMatchById(matchId) {
  return tournamentData.matches.find((match) => match.id === matchId) || null;
}

function getResolvedPlayersForMatch(match) {
  if (!match) return [];

  return match.slots
    .map((slot) => resolveSlot(slot))
    .filter(Boolean);
}

function getPlayerHistory(playerId) {
  const history = [];

  tournamentData.matches.forEach((match) => {
    const players = getResolvedPlayersForMatch(match);
    const playerWasInMatch = players.some((player) => player.id === playerId);

    if (!playerWasInMatch) return;

    const opponent = players.find((player) => player.id !== playerId);
    const roundName = ROUND_LABELS[match.round] || match.round;

    if (!match.winnerId) {
      history.push(`${roundName}: pendiente vs ${opponent ? opponent.name : "rival pendiente"}`);
      return;
    }

    if (match.winnerId === playerId) {
      history.push(`${roundName}: ganó vs ${opponent ? opponent.name : "rival pendiente"}`);
    } else {
      history.push(`${roundName}: perdió vs ${opponent ? opponent.name : "rival pendiente"}`);
    }
  });

  return history;
}

function getCurrentMatchForPlayer(playerId) {
  return tournamentData.matches.find((match) => {
    if (match.winnerId) return false;

    const players = getResolvedPlayersForMatch(match);
    return players.some((player) => player.id === playerId);
  });
}

function getOpponentName(match, playerId) {
  const players = getResolvedPlayersForMatch(match);
  const opponent = players.find((player) => player.id !== playerId);

  return opponent ? opponent.name : "Rival pendiente";
}

function renderError(message) {
  const content = document.getElementById("content");
  content.innerHTML = `<div class="error-card">${message}</div>`;
}
