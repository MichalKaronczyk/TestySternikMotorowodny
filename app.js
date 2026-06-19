const DATA_URL = "data/questions.json";
const STORAGE_KEY = "sternik-motorowodny-progress";

const elements = {
  totalQuestions: document.querySelector("#total-questions"),
  answeredCount: document.querySelector("#answered-count"),
  accuracy: document.querySelector("#accuracy"),
  streak: document.querySelector("#streak"),
  seenCount: document.querySelector("#seen-count"),
  questionCounter: document.querySelector("#question-counter"),
  questionText: document.querySelector("#question-text"),
  modePill: document.querySelector("#mode-pill"),
  visualNote: document.querySelector("#visual-note"),
  answers: document.querySelector("#answers"),
  feedback: document.querySelector("#feedback"),
  skipButton: document.querySelector("#skip-button"),
  unseenButton: document.querySelector("#unseen-button"),
  mistakesButton: document.querySelector("#mistakes-button"),
  nextButton: document.querySelector("#next-button"),
  resetButton: document.querySelector("#reset-button"),
  progressCopy: document.querySelector("#progress-copy"),
  progressBar: document.querySelector("#progress-bar"),
};

const state = {
  questions: [],
  deck: [],
  mistakesDeck: [],
  unseenDeck: [],
  current: null,
  answeredCurrent: false,
  mode: "random",
  progress: {
    answered: 0,
    correct: 0,
    streak: 0,
    seenIds: [],
    mistakeIds: [],
  },
};

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function loadProgress() {
  try {
    const storedProgress = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (storedProgress) {
      state.progress = {
        ...state.progress,
        ...storedProgress,
        seenIds: storedProgress.seenIds ?? [],
        mistakeIds: storedProgress.mistakeIds ?? [],
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function hydrateStats() {
  const { answered, correct, streak, seenIds } = state.progress;
  const accuracy = answered === 0 ? 0 : Math.round((correct / answered) * 100);
  const unseenCount = getUnseenQuestions().length;
  const seenPercent =
    state.questions.length === 0 ? 0 : Math.round((seenIds.length / state.questions.length) * 100);

  elements.totalQuestions.textContent = state.questions.length;
  elements.answeredCount.textContent = answered;
  elements.accuracy.textContent = `${accuracy}%`;
  elements.streak.textContent = streak;
  elements.seenCount.textContent = seenIds.length;
  elements.progressBar.style.width = `${seenPercent}%`;
  elements.progressCopy.textContent =
    seenIds.length === 0
      ? "Zacznij odpowiadać, a zobaczysz ile pytań już dotknąłeś."
      : `Masz za sobą ${seenIds.length} z ${state.questions.length} pytań (${seenPercent}%).`;
  elements.mistakesButton.disabled = state.progress.mistakeIds.length === 0;
  elements.unseenButton.disabled = unseenCount === 0;
}

function getAnswerText(question, answerId) {
  return question.answers.find((answer) => answer.id === answerId)?.text ?? "brak treści";
}

function rebuildMistakesDeck() {
  const mistakeIds = new Set(state.progress.mistakeIds);
  state.mistakesDeck = shuffle(state.questions.filter((question) => mistakeIds.has(question.id)));
}

function getUnseenQuestions() {
  const seenIds = new Set(state.progress.seenIds);
  return state.questions.filter((question) => !seenIds.has(question.id));
}

function rebuildUnseenDeck() {
  state.unseenDeck = shuffle(getUnseenQuestions());
}

function getModeLabel() {
  if (state.mode === "mistakes") {
    return "Powtórka błędów";
  }

  if (state.mode === "unseen") {
    return "Nowe pytania";
  }

  return "Losowo";
}

function getNextQuestion() {
  if (state.mode === "mistakes") {
    if (state.mistakesDeck.length === 0) {
      rebuildMistakesDeck();
    }

    if (state.mistakesDeck.length > 0) {
      return state.mistakesDeck.pop();
    }

    state.mode = "random";
  }

  if (state.mode === "unseen") {
    if (state.unseenDeck.length === 0) {
      rebuildUnseenDeck();
    }

    if (state.unseenDeck.length > 0) {
      return state.unseenDeck.pop();
    }

    state.mode = "random";
  }

  if (state.deck.length === 0) {
    state.deck = shuffle(state.questions);
  }

  return state.deck.pop();
}

function renderQuestion() {
  state.current = getNextQuestion();
  state.answeredCurrent = false;

  if (!state.current) {
    elements.questionText.textContent = "Nie udało się załadować pytania.";
    return;
  }

  elements.modePill.textContent = getModeLabel();
  elements.questionCounter.textContent = `Pytanie ${state.current.id} z ${state.questions.length}`;
  elements.questionText.textContent = state.current.question;
  elements.visualNote.classList.toggle("hidden", !state.current.hasVisualPrompt);
  elements.feedback.className = "feedback hidden";
  elements.feedback.textContent = "";
  elements.nextButton.disabled = true;

  elements.answers.replaceChildren(
    ...state.current.answers.map((answer) => {
      const button = document.createElement("button");
      button.className = "answer-button";
      button.type = "button";
      button.dataset.answerId = answer.id;
      button.innerHTML = `
        <span class="answer-button__letter">${answer.id}</span>
        <span class="answer-button__text"></span>
      `;
      button.querySelector(".answer-button__text").textContent = answer.text;
      button.addEventListener("click", () => selectAnswer(answer.id));
      return button;
    }),
  );
}

function markQuestionSeen(questionId) {
  if (!state.progress.seenIds.includes(questionId)) {
    state.progress.seenIds.push(questionId);
  }
}

function updateMistakes(questionId, isCorrect) {
  const mistakeIds = new Set(state.progress.mistakeIds);

  if (isCorrect) {
    mistakeIds.delete(questionId);
  } else {
    mistakeIds.add(questionId);
  }

  state.progress.mistakeIds = [...mistakeIds];
}

function selectAnswer(answerId) {
  if (state.answeredCurrent || !state.current) {
    return;
  }

  const isCorrect = answerId === state.current.correctAnswer;
  state.answeredCurrent = true;
  state.progress.answered += 1;
  state.progress.correct += isCorrect ? 1 : 0;
  state.progress.streak = isCorrect ? state.progress.streak + 1 : 0;

  markQuestionSeen(state.current.id);
  updateMistakes(state.current.id, isCorrect);
  saveProgress();

  elements.answers.querySelectorAll(".answer-button").forEach((button) => {
    const buttonAnswerId = button.dataset.answerId;
    button.disabled = true;

    if (buttonAnswerId === state.current.correctAnswer) {
      button.classList.add("is-correct");
    }

    if (buttonAnswerId === answerId && !isCorrect) {
      button.classList.add("is-wrong");
    }
  });

  const correctText = getAnswerText(state.current, state.current.correctAnswer);
  elements.feedback.className = `feedback ${isCorrect ? "is-good" : "is-bad"}`;
  elements.feedback.textContent = isCorrect
    ? "Dobrze. Możesz przejść do następnego pytania."
    : `Nie tym razem. Poprawna odpowiedź: ${state.current.correctAnswer.toUpperCase()} - ${correctText}`;
  elements.nextButton.disabled = false;
  hydrateStats();
}

function skipQuestion() {
  renderQuestion();
}

function startMistakesMode() {
  if (state.progress.mistakeIds.length === 0) {
    return;
  }

  state.mode = "mistakes";
  rebuildMistakesDeck();
  renderQuestion();
}

function startUnseenMode() {
  if (getUnseenQuestions().length === 0) {
    return;
  }

  state.mode = "unseen";
  rebuildUnseenDeck();
  renderQuestion();
}

function resetProgress() {
  const confirmed = window.confirm("Wyczyścić lokalne statystyki i listę błędów?");

  if (!confirmed) {
    return;
  }

  state.progress = {
    answered: 0,
    correct: 0,
    streak: 0,
    seenIds: [],
    mistakeIds: [],
  };
  state.mode = "random";
  state.unseenDeck = [];
  saveProgress();
  hydrateStats();
  renderQuestion();
}

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Nie udało się pobrać bazy pytań: ${response.status}`);
    }

    const data = await response.json();
    state.questions = data.questions;
    state.deck = shuffle(state.questions);
    loadProgress();
    hydrateStats();
    renderQuestion();
  } catch (error) {
    elements.questionText.textContent =
      "Nie mogę załadować bazy pytań. Uruchom stronę przez lokalny serwer albo GitHub Pages.";
    elements.feedback.className = "feedback is-bad";
    elements.feedback.textContent = error.message;
  }
}

elements.nextButton.addEventListener("click", renderQuestion);
elements.skipButton.addEventListener("click", skipQuestion);
elements.unseenButton.addEventListener("click", startUnseenMode);
elements.mistakesButton.addEventListener("click", startMistakesMode);
elements.resetButton.addEventListener("click", resetProgress);

init();
