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
  FINAL: "Final del Torneo"
};

let tournamentData = null;
let activeSection = "A";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindNavigation();
  bindGlobalPlayerTooltip();

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
              <strong>${bracketWinner ? bracketWinner.name : "-"}</strong>
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
    <article class="final-layout bracket-section">
      <div class="bracket-header final-header">
        <div>
          <h2 class="bracket-title">Final del Torneo</h2>
          <p class="bracket-subtitle">Los ganadores de las 4 llaves se enfrentan por el título absoluto.</p>
        </div>
        <div class="bracket-pill final-pill">FASE FINAL</div>
      </div>

      <div class="final-stage">
        <div class="final-board">
          ${renderRoundColumn("Semifinal General", "semi", semiMatches)}
          ${renderRoundColumn("Gran Final", "final", [grandFinal])}

          <div class="round-column champion-column">
            <h3 class="round-title winner">Campeón</h3>
            <div class="matches-list champion-list">
              <div class="champion-card">
                <div class="cup">🏆</div>
                <div class="name">${champion ? champion.name : "Campeón"}</div>
              </div>
            </div>
          </div>
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

  return `
    <div class="match-player ${isWinner ? "is-winner" : ""}" data-player-id="${player.id}">
      <span class="player-name">${player.name}</span>
      <span class="player-score">${score ?? 0}</span>
    </div>
  `;
}

function buildPlayerTooltipContent(player) {
  const typeLabel = player.type === "PLAYER" ? "Player" : "NPC";
  const typeClass = player.type === "PLAYER" ? "player" : "npc";
  const history = getPlayerHistory(player.id);
  const totalVictories = getPlayerTotalVictories(player.id);
  const bracketOrigin = getBracketWinnerOrigin(player.id);

  const historyHtml = history.length
    ? history.map((item) => `
        <div class="tooltip-history-item ${item.resultClass}">
          <span>${escapeHtml(item.roundName)}</span>
          <strong>${escapeHtml(item.resultText)}</strong>
          <small>${escapeHtml(item.opponentName)}</small>
        </div>
      `).join("")
    : `<div class="tooltip-empty-history">Sin combates registrados todavía.</div>`;

  const nicknameHtml = player.type === "PLAYER"
    ? `<div class="tooltip-stat"><span>Nickname</span><strong>${escapeHtml(player.nickname || "Sin nickname")}</strong></div>`
    : "";

  const bracketOriginHtml = activeSection === "FINAL" && bracketOrigin
    ? `<div class="tooltip-origin">Viene de ${escapeHtml(bracketOrigin)}</div>`
    : "";

  return `
    <div class="tooltip-card-head">
      <div>
        <p class="tooltip-kicker">${typeLabel}</p>
        <p class="tooltip-title">${escapeHtml(player.name)}</p>
      </div>
      <span class="type-badge ${typeClass}">${typeLabel}</span>
    </div>

    ${bracketOriginHtml}

    <div class="tooltip-stats-grid">
      ${nicknameHtml}
      <div class="tooltip-stat"><span>Casa</span><strong>${escapeHtml(player.house || getFallbackHouse(player.id))}</strong></div>
      <div class="tooltip-stat tooltip-stat-inline"><span>Victorias:</span><strong>${totalVictories}</strong></div>
    </div>

    <div class="tooltip-history-title">Historial de combates</div>
    <div class="tooltip-history-list">
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
    const roundName = getFullRoundLabel(match);
    const opponentName = opponent ? opponent.name : "Rival pendiente";

    if (!match.winnerId) {
      history.push({
        roundName,
        opponentName,
        resultText: "Pendiente",
        resultClass: "pending"
      });
      return;
    }

    if (match.winnerId === playerId) {
      history.push({
        roundName,
        opponentName,
        resultText: "Victoria",
        resultClass: "win"
      });
    } else {
      history.push({
        roundName,
        opponentName,
        resultText: "Derrota",
        resultClass: "loss"
      });
    }
  });

  return history;
}

function getFullRoundLabel(match) {
  const baseRoundName = ROUND_LABELS[match.round] || match.round;

  if (match.key === "FINAL") {
    return match.round === "final" ? "Gran Final" : "Semifinal General";
  }

  return `${baseRoundName} ${match.key}`;
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


function bindGlobalPlayerTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "player-tooltip-portal";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  let activeTarget = null;

  const showTooltip = (target) => {
    if (!tournamentData) return;

    const player = getPlayerById(target.dataset.playerId);
    if (!player) return;

    activeTarget = target;
    tooltip.innerHTML = buildPlayerTooltipContent(player);
    tooltip.classList.add("is-visible");
    positionTooltip(target, tooltip);
  };

  const hideTooltip = () => {
    activeTarget = null;
    tooltip.classList.remove("is-visible", "is-below");
  };

  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest(".match-player[data-player-id]");
    if (!target) return;

    showTooltip(target);
  });

  document.addEventListener("pointerout", (event) => {
    const target = event.target.closest(".match-player[data-player-id]");
    if (!target) return;

    if (event.relatedTarget && target.contains(event.relatedTarget)) return;

    hideTooltip();
  });

  document.addEventListener("pointermove", () => {
    if (!activeTarget) return;
    positionTooltip(activeTarget, tooltip);
  });

  window.addEventListener("resize", () => {
    if (!activeTarget) return;
    positionTooltip(activeTarget, tooltip);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!activeTarget) return;
      positionTooltip(activeTarget, tooltip);
    },
    true
  );
}

function positionTooltip(target, tooltip) {
  const targetRect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 12;
  const gap = 10;

  let left = targetRect.left + 12;
  let top = targetRect.top - tooltipRect.height - gap;
  let shouldShowBelow = false;

  if (top < margin) {
    top = targetRect.bottom + gap;
    shouldShowBelow = true;
  }

  if (left + tooltipRect.width > viewportWidth - margin) {
    left = viewportWidth - tooltipRect.width - margin;
  }

  if (left < margin) {
    left = margin;
  }

  if (top + tooltipRect.height > viewportHeight - margin) {
    top = viewportHeight - tooltipRect.height - margin;
  }

  if (top < margin) {
    top = margin;
  }

  tooltip.style.left = `${Math.round(left)}px`;
  tooltip.style.top = `${Math.round(top)}px`;
  tooltip.classList.toggle("is-below", shouldShowBelow);
}

function getPlayerTotalVictories(playerId) {
  return tournamentData.matches.filter((match) => match.winnerId === playerId).length;
}

function getBracketWinnerOrigin(playerId) {
  const bracketFinal = tournamentData.matches.find((match) => {
    return match.key !== "FINAL" && match.round === "final" && match.winnerId === playerId;
  });

  if (!bracketFinal) return null;
  return SECTION_LABELS[bracketFinal.key] || `Llave ${bracketFinal.key}`;
}

function getFallbackHouse(playerId) {
  const index = tournamentData.players.findIndex((player) => player.id === playerId);
  const houses = ["Casa 1", "Casa 2", "Casa 3"];
  return houses[Math.max(index, 0) % houses.length];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderError(message) {
  const content = document.getElementById("content");
  content.innerHTML = `<div class="error-card">${message}</div>`;
}
