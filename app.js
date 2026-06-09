const STORAGE = {
  apiKey: 'nutriscan_api_key',
  goals: 'nutriscan_goals',
  profile: 'nutriscan_profile',
};

const GEMINI_MODEL_PREFERENCE = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
];

let availableGeminiModelsCache = null;

const DEFAULT_GOALS = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fats: 70,
};

const state = {
  compressedImage: null,
  currentResult: null,
  selectedDate: toDateKey(new Date()),
  installPrompt: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const elements = {
  tabButtons: $$('.tab-button'),
  views: $$('.view'),
  apiStatus: $('#apiStatus'),
  apiLock: $('#apiLock'),
  cameraInput: $('#cameraInput'),
  fileInput: $('#fileInput'),
  cameraButton: $('#cameraButton'),
  uploadButton: $('#uploadButton'),
  dropZone: $('#dropZone'),
  previewFrame: $('#previewFrame'),
  imagePreview: $('#imagePreview'),
  emptyPreview: $('#emptyPreview'),
  compressionInfo: $('#compressionInfo'),
  analyzeButton: $('#analyzeButton'),
  buttonLoader: $('.button-loader'),
  resultEmpty: $('#resultEmpty'),
  resultPanel: $('#resultPanel'),
  mealName: $('#mealName'),
  confidenceChip: $('#confidenceChip'),
  calorieRing: $('#calorieRing'),
  calorieValue: $('#calorieValue'),
  mealNotes: $('#mealNotes'),
  foodReview: $('#foodReview'),
  proteinValue: $('#proteinValue'),
  carbsValue: $('#carbsValue'),
  fatsValue: $('#fatsValue'),
  saveMealButton: $('#saveMealButton'),
  discardResultButton: $('#discardResultButton'),
  historyDate: $('#historyDate'),
  weekStrip: $('#weekStrip'),
  dailyCalorieRing: $('#dailyCalorieRing'),
  dailyCalories: $('#dailyCalories'),
  dailySummaryText: $('#dailySummaryText'),
  dailyProtein: $('#dailyProtein'),
  dailyCarbs: $('#dailyCarbs'),
  dailyFats: $('#dailyFats'),
  proteinBar: $('#proteinBar'),
  carbsBar: $('#carbsBar'),
  fatsBar: $('#fatsBar'),
  mealList: $('#mealList'),
  clearDayButton: $('#clearDayButton'),
  apiForm: $('#apiForm'),
  apiKeyInput: $('#apiKeyInput'),
  toggleApiVisibility: $('#toggleApiVisibility'),
  deleteApiKeyButton: $('#deleteApiKeyButton'),
  apiFormStatus: $('#apiFormStatus'),
  goalsForm: $('#goalsForm'),
  goalCalories: $('#goalCalories'),
  goalProtein: $('#goalProtein'),
  goalCarbs: $('#goalCarbs'),
  goalFats: $('#goalFats'),
  goalsFormStatus: $('#goalsFormStatus'),
  toast: $('#toast'),
  installButton: $('#installButton'),
  mealContext: $('#mealContext'),
  dailyTargetLine: $('#dailyTargetLine'),
  targetProtein: $('#targetProtein'),
  targetCarbs: $('#targetCarbs'),
  targetFats: $('#targetFats'),
  calorieDelta: $('#calorieDelta'),
  comparisonAdvice: $('#comparisonAdvice'),
  profileForm: $('#profileForm'),
  profileAge: $('#profileAge'),
  profileSex: $('#profileSex'),
  profileHeight: $('#profileHeight'),
  profileWeight: $('#profileWeight'),
  profileActivity: $('#profileActivity'),
  profileGoal: $('#profileGoal'),
  profileFormStatus: $('#profileFormStatus'),
  profileCalories: $('#profileCalories'),
  profileProtein: $('#profileProtein'),
  profileCarbs: $('#profileCarbs'),
  profileFats: $('#profileFats'),
  profileSummaryText: $('#profileSummaryText'),
  profileAdvice: $('#profileAdvice'),
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  registerServiceWorker();
  setupTabs();
  setupScanner();
  setupDashboard();
  setupSettings();
  setupInstallPrompt();
  refreshApiState();
  loadProfileIntoForm();
  loadGoalsIntoForm();
  renderProfileSummary();
  renderDashboard();
}

function setupTabs() {
  elements.tabButtons.forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });

  $$('[data-go-settings]').forEach((button) => {
    button.addEventListener('click', () => activateTab('settings'));
  });
}

function activateTab(tabId) {
  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabId;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  elements.views.forEach((view) => {
    view.classList.toggle('active', view.id === tabId);
  });

  if (tabId === 'dashboard') {
    renderDashboard();
  }

  if (tabId === 'profile') {
    renderProfileSummary();
  }
}

function setupScanner() {
  elements.cameraButton.addEventListener('click', () => elements.cameraInput.click());
  elements.uploadButton.addEventListener('click', () => elements.fileInput.click());
  elements.cameraInput.addEventListener('change', (event) => handleFileSelection(event.target.files?.[0]));
  elements.fileInput.addEventListener('change', (event) => handleFileSelection(event.target.files?.[0]));
  elements.analyzeButton.addEventListener('click', analyzeCurrentImage);
  elements.saveMealButton.addEventListener('click', saveCurrentMeal);
  elements.discardResultButton.addEventListener('click', clearResult);

  ['dragenter', 'dragover'].forEach((eventName) => {
    elements.previewFrame.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.previewFrame.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    elements.previewFrame.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.previewFrame.classList.remove('drag-over');
    });
  });

  elements.previewFrame.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0];
    handleFileSelection(file);
  });
}

async function handleFileSelection(file) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Selecciona una imagen válida.');
    return;
  }

  try {
    setBusy(true, 'Comprimiendo imagen...');
    const compressed = await compressImage(file, 800, 0.6);
    state.compressedImage = compressed;
    state.currentResult = null;

    elements.imagePreview.src = compressed.dataUrl;
    elements.imagePreview.classList.remove('hidden');
    elements.emptyPreview.classList.add('hidden');
    elements.compressionInfo.textContent = `Imagen lista: ${(compressed.size / 1024).toFixed(0)} KB, ${compressed.width}×${compressed.height}px.`;
    elements.analyzeButton.disabled = !hasApiKey();
    clearResult(false);
  } catch (error) {
    console.error(error);
    showToast('No se pudo procesar la imagen. Intenta con otro archivo.');
  } finally {
    setBusy(false);
  }
}

function compressImage(file, maxWidth = 800, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = $('#compressionCanvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = '#081a14';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ dataUrl, base64, mimeType: 'image/jpeg', width, height, size: estimateBase64Bytes(base64) });
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function estimateBase64Bytes(base64) {
  const padding = (base64.match(/=+$/) || [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function analyzeCurrentImage() {
  const apiKey = getApiKey();

  if (!apiKey) {
    showToast('Primero configura tu API Key en Ajustes.');
    activateTab('settings');
    return;
  }

  if (!state.compressedImage) {
    showToast('Primero selecciona o toma una foto.');
    return;
  }

  setBusy(true, 'Analizando con Gemini...');

  try {
    const result = await callGemini(apiKey, state.compressedImage, elements.mealContext?.value.trim() || '');
    const normalized = normalizeGeminiResult(result);
    state.currentResult = normalized;
    renderResult(normalized);
    showToast('Análisis listo. Revisa y guarda la comida.');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'No se pudo analizar la imagen. Verifica tu API Key o intenta nuevamente.');
  } finally {
    setBusy(false);
  }
}

async function callGemini(apiKey, image, mealContext = '') {
  const contextText = mealContext
    ? `\nContexto aportado por el usuario: ${mealContext}. Usá este dato para identificar ingredientes, rellenos, cantidad o cocción que no sean visibles en la foto.`
    : '';
  const prompt = `Analiza la imagen de comida y devuelve únicamente JSON válido, sin markdown, sin texto adicional y sin unidades en los números.${contextText} Si no puedes identificar con certeza, usa el plato más probable y baja el campo confidence. Esquema exacto requerido: {"dish_name":"string","calories":number,"protein_g":number,"fat_g":number,"carbs_g":number,"confidence":number,"notes":"string","review":"string"}. calories debe ser kcal estimadas; protein_g, fat_g y carbs_g deben ser gramos estimados para la porción visible. confidence debe estar entre 0 y 1. notes debe explicar brevemente la incertidumbre de la estimación. review debe ser una reseña nutricional y gastronómica breve en español rioplatense/neutro, de 1 a 2 frases, útil y amable, mencionando balance, porción o una mejora posible sin juzgar.`;

  let lastError = null;
  const modelsToTry = await getAvailableGeminiModels(apiKey);

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: image.mimeType,
                  data: image.base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          topP: 0.85,
          topK: 32,
          responseMimeType: 'application/json',
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.error?.message || `Error ${response.status} al llamar a Gemini.`;
      lastError = new Error(`${model}: ${message}`);

      if (shouldTryNextModel(response.status, message)) {
        console.warn(`Modelo no disponible, probando fallback: ${model}`, message);
        continue;
      }

      throw lastError;
    }

    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      lastError = new Error(`${model}: Gemini no devolvió un resultado interpretable.`);
      continue;
    }

    const parsed = parseGeminiJson(text);
    parsed.model_used = model;
    return parsed;
  }

  throw lastError || new Error('No se encontró un modelo Gemini compatible para esta API Key.');
}

async function getAvailableGeminiModels(apiKey) {
  if (availableGeminiModelsCache?.length) return availableGeminiModelsCache;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn('No se pudo listar modelos Gemini; se usarán fallbacks locales.', payload?.error?.message || response.status);
      return GEMINI_MODEL_PREFERENCE;
    }

    const available = (payload.models || [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => model.name?.replace(/^models\//, ''))
      .filter(Boolean);

    const preferredAvailable = GEMINI_MODEL_PREFERENCE.filter((model) => available.includes(model));
    const otherFlashAvailable = available
      .filter((model) => /gemini.*flash/i.test(model))
      .filter((model) => !preferredAvailable.includes(model))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    availableGeminiModelsCache = [...preferredAvailable, ...otherFlashAvailable];
    return availableGeminiModelsCache.length ? availableGeminiModelsCache : GEMINI_MODEL_PREFERENCE;
  } catch (error) {
    console.warn('No se pudo listar modelos Gemini; se usarán fallbacks locales.', error);
    return GEMINI_MODEL_PREFERENCE;
  }
}

function shouldTryNextModel(status, message) {
  const retryableModelProblem = /not found|not supported|permission|not available|does not exist|is not supported/i.test(message);
  return [400, 403, 404].includes(status) && retryableModelProblem;
}

function parseGeminiJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const cleaned = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned);
  }
}

function normalizeGeminiResult(raw) {
  const calories = clampNumber(raw.calories ?? raw.kcal ?? raw.energy, 0, 10000);
  const protein = clampNumber(raw.protein_g ?? raw.protein ?? raw.proteins, 0, 1000);
  const carbs = clampNumber(raw.carbs_g ?? raw.carbohydrates_g ?? raw.carbs, 0, 1000);
  const fats = clampNumber(raw.fat_g ?? raw.fats_g ?? raw.fat ?? raw.fats, 0, 1000);
  const confidence = clampNumber(raw.confidence ?? 0.75, 0, 1);

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    dishName: String(raw.dish_name ?? raw.name ?? raw.plato ?? 'Comida detectada').trim() || 'Comida detectada',
    calories: Math.round(calories),
    protein: roundMacro(protein),
    carbs: roundMacro(carbs),
    fats: roundMacro(fats),
    confidence,
    notes: String(raw.notes ?? 'Estimación generada por IA; puede variar según porción e ingredientes.').trim(),
    review: String(raw.review ?? raw.food_review ?? raw.reseña ?? raw.resena ?? 'Buena referencia para registrar tu comida; la IA recomienda revisar porción e ingredientes si querés mayor precisión.').trim(),
    modelUsed: String(raw.model_used ?? '').trim(),
    context: elements.mealContext?.value.trim() || '',
    photoDataUrl: state.compressedImage?.dataUrl || '',
    createdAt: new Date().toISOString(),
  };
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function roundMacro(value) {
  return Math.round(value * 10) / 10;
}

function renderResult(result) {
  elements.resultEmpty.classList.add('hidden');
  elements.resultPanel.classList.remove('hidden');
  elements.mealName.textContent = result.dishName;
  elements.confidenceChip.textContent = result.modelUsed
    ? `${Math.round(result.confidence * 100)}% · ${result.modelUsed.replace('gemini-', '')}`
    : `${Math.round(result.confidence * 100)}% confianza`;
  elements.calorieValue.textContent = String(result.calories);
  elements.proteinValue.textContent = `${formatNumber(result.protein)} g`;
  elements.carbsValue.textContent = `${formatNumber(result.carbs)} g`;
  elements.fatsValue.textContent = `${formatNumber(result.fats)} g`;
  elements.mealNotes.textContent = result.notes;
  elements.foodReview.textContent = result.review;

  const goals = getGoals();
  const degrees = Math.min(360, Math.round((result.calories / goals.calories) * 360));
  elements.calorieRing.style.setProperty('--progress', `${degrees}deg`);
}

function clearResult(clearImage = true) {
  state.currentResult = null;
  elements.resultPanel.classList.add('hidden');
  elements.resultEmpty.classList.remove('hidden');

  if (clearImage) {
    state.compressedImage = null;
    elements.imagePreview.removeAttribute('src');
    elements.imagePreview.classList.add('hidden');
    elements.emptyPreview.classList.remove('hidden');
    elements.compressionInfo.textContent = 'Aún no se seleccionó ninguna imagen.';
    elements.analyzeButton.disabled = true;
  }
}

function saveCurrentMeal() {
  if (!state.currentResult) {
    showToast('No hay resultado para guardar.');
    return;
  }

  const dateKey = toDateKey(new Date(state.currentResult.createdAt));
  const meals = getMealsForDate(dateKey);
  meals.push(state.currentResult);
  saveMealsForDate(dateKey, meals);

  state.selectedDate = dateKey;
  elements.historyDate.value = dateKey;
  showToast('Comida guardada en tu historial local.');
  clearResult(true);
  renderDashboard();
  activateTab('dashboard');
}

function setupDashboard() {
  elements.historyDate.value = state.selectedDate;
  elements.historyDate.addEventListener('change', () => {
    state.selectedDate = elements.historyDate.value || toDateKey(new Date());
    renderDashboard();
  });

  elements.clearDayButton.addEventListener('click', () => {
    const meals = getMealsForDate(state.selectedDate);
    if (!meals.length) {
      showToast('Ese día no tiene comidas guardadas.');
      return;
    }

    const confirmed = window.confirm('¿Borrar todas las comidas guardadas para este día?');
    if (!confirmed) return;

    localStorage.removeItem(dayStorageKey(state.selectedDate));
    renderDashboard();
    showToast('Día borrado.');
  });
}

function renderDashboard() {
  elements.historyDate.value = state.selectedDate;
  renderWeekStrip();

  const meals = getMealsForDate(state.selectedDate);
  const totals = meals.reduce((acc, meal) => {
    acc.calories += Number(meal.calories) || 0;
    acc.protein += Number(meal.protein) || 0;
    acc.carbs += Number(meal.carbs) || 0;
    acc.fats += Number(meal.fats) || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const goals = getGoals();
  const calorieDegrees = Math.min(360, Math.round((totals.calories / goals.calories) * 360));
  const calorieDiff = Math.round(goals.calories - totals.calories);

  elements.dailyCalorieRing.style.setProperty('--progress', `${calorieDegrees}deg`);
  elements.dailyCalories.textContent = String(Math.round(totals.calories));
  elements.dailyProtein.textContent = `${formatNumber(totals.protein)} g`;
  elements.dailyCarbs.textContent = `${formatNumber(totals.carbs)} g`;
  elements.dailyFats.textContent = `${formatNumber(totals.fats)} g`;
  if (elements.dailyTargetLine) elements.dailyTargetLine.textContent = `Meta: ${Math.round(goals.calories)} kcal · P ${formatNumber(goals.protein)} g · C ${formatNumber(goals.carbs)} g · G ${formatNumber(goals.fats)} g`;
  if (elements.targetProtein) elements.targetProtein.textContent = `${formatNumber(goals.protein)} g`;
  if (elements.targetCarbs) elements.targetCarbs.textContent = `${formatNumber(goals.carbs)} g`;
  if (elements.targetFats) elements.targetFats.textContent = `${formatNumber(goals.fats)} g`;
  if (elements.calorieDelta) elements.calorieDelta.textContent = formatCalorieDelta(calorieDiff);
  if (elements.comparisonAdvice) elements.comparisonAdvice.textContent = buildComparisonAdvice(totals, goals);
  elements.proteinBar.style.width = `${toPercent(totals.protein, goals.protein)}%`;
  elements.carbsBar.style.width = `${toPercent(totals.carbs, goals.carbs)}%`;
  elements.fatsBar.style.width = `${toPercent(totals.fats, goals.fats)}%`;

  const readableDate = formatDateLong(state.selectedDate);
  elements.dailySummaryText.textContent = meals.length
    ? `${readableDate}: ${meals.length} comida${meals.length === 1 ? '' : 's'} guardada${meals.length === 1 ? '' : 's'}.`
    : `${readableDate}: todavía no guardaste comidas.`;

  renderMealList(meals);
}

function renderWeekStrip() {
  elements.weekStrip.innerHTML = '';
  const selected = parseDateKey(state.selectedDate);
  const start = new Date(selected);
  start.setDate(selected.getDate() - 3);

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    const meals = getMealsForDate(key);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `day-chip${key === state.selectedDate ? ' active' : ''}`;
    button.innerHTML = `<span>${formatWeekday(date)}</span><strong>${date.getDate()}</strong><span>${meals.length} comida${meals.length === 1 ? '' : 's'}</span>`;
    button.addEventListener('click', () => {
      state.selectedDate = key;
      elements.historyDate.value = key;
      renderDashboard();
    });
    elements.weekStrip.appendChild(button);
  }
}

function renderMealList(meals) {
  elements.mealList.innerHTML = '';

  if (!meals.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No hay comidas guardadas para este día. Escanea una foto y guárdala para verla aquí.';
    elements.mealList.appendChild(empty);
    return;
  }

  [...meals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach((meal) => {
    const item = document.createElement('article');
    item.className = 'meal-item';

    const thumb = meal.photoDataUrl
      ? `<div class="meal-thumb"><img src="${escapeAttribute(meal.photoDataUrl)}" alt="Foto guardada de ${escapeHtml(meal.dishName)}" loading="lazy"></div>`
      : '<div class="meal-thumb placeholder" aria-hidden="true">NS</div>';

    item.innerHTML = `
      ${thumb}
      <div class="meal-meta">
        <h4>${escapeHtml(meal.dishName)}</h4>
        <p>${formatTime(meal.createdAt)} · ${Math.round(meal.calories)} kcal</p>
        ${meal.review ? `<p class="meal-review">${escapeHtml(meal.review)}</p>` : ''}
        <div class="meal-macros">
          <span>P ${formatNumber(meal.protein)} g</span>
          <span>C ${formatNumber(meal.carbs)} g</span>
          <span>G ${formatNumber(meal.fats)} g</span>
        </div>
      </div>
      ${meal.context ? `<p class="meal-context">Dato: ${escapeHtml(meal.context)}</p>` : ''}
      <button class="delete-meal-button" type="button" aria-label="Eliminar ${escapeHtml(meal.dishName)}">×</button>
    `;

    item.querySelector('.delete-meal-button').addEventListener('click', () => deleteMeal(meal.id));
    elements.mealList.appendChild(item);
  });
}

function deleteMeal(mealId) {
  const meals = getMealsForDate(state.selectedDate);
  const nextMeals = meals.filter((meal) => meal.id !== mealId);
  saveMealsForDate(state.selectedDate, nextMeals);
  renderDashboard();
  showToast('Comida eliminada.');
}

function setupSettings() {
  elements.apiKeyInput.value = getApiKey();

  elements.apiForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const key = elements.apiKeyInput.value.trim();

    if (!key) {
      showToast('Pega una API Key antes de guardar.');
      return;
    }

    localStorage.setItem(STORAGE.apiKey, key);
    elements.apiFormStatus.textContent = 'API Key guardada localmente en este navegador.';
    refreshApiState();
    showToast('API Key guardada.');
  });

  elements.toggleApiVisibility.addEventListener('click', () => {
    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.toggleApiVisibility.textContent = isPassword ? 'Ocultar' : 'Ver';
  });

  elements.deleteApiKeyButton.addEventListener('click', () => {
    localStorage.removeItem(STORAGE.apiKey);
    elements.apiKeyInput.value = '';
    elements.apiFormStatus.textContent = 'API Key eliminada de este navegador.';
    refreshApiState();
    showToast('API Key eliminada.');
  });



  if (elements.profileForm) {
    elements.profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const profile = readProfileForm();
      const validation = validateProfile(profile);
      if (validation) {
        showToast(validation);
        return;
      }

      const goals = calculateNutritionGoals(profile);
      localStorage.setItem(STORAGE.profile, JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }));
      localStorage.setItem(STORAGE.goals, JSON.stringify(goals));
      elements.profileFormStatus.textContent = 'Perfil guardado y objetivos diarios actualizados.';
      loadGoalsIntoForm();
      renderProfileSummary();
      renderDashboard();
      showToast('Perfil nutricional actualizado.');
    });
  }

  elements.goalsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const goals = {
      calories: Math.max(1, Number(elements.goalCalories.value) || DEFAULT_GOALS.calories),
      protein: Math.max(1, Number(elements.goalProtein.value) || DEFAULT_GOALS.protein),
      carbs: Math.max(1, Number(elements.goalCarbs.value) || DEFAULT_GOALS.carbs),
      fats: Math.max(1, Number(elements.goalFats.value) || DEFAULT_GOALS.fats),
    };
    localStorage.setItem(STORAGE.goals, JSON.stringify(goals));
    renderProfileSummary();
    elements.goalsFormStatus.textContent = 'Objetivos guardados localmente.';
    renderDashboard();
    showToast('Objetivos diarios actualizados.');
  });
}


function readProfileForm() {
  return {
    age: Number(elements.profileAge?.value) || 0,
    sex: elements.profileSex?.value || 'other',
    height: Number(elements.profileHeight?.value) || 0,
    weight: Number(elements.profileWeight?.value) || 0,
    activity: Number(elements.profileActivity?.value) || 1.2,
    goal: elements.profileGoal?.value || 'maintain',
  };
}

function validateProfile(profile) {
  if (profile.age < 12 || profile.age > 100) return 'Revisa la edad: debe estar entre 12 y 100 años.';
  if (profile.height < 120 || profile.height > 230) return 'Revisa la altura: debe estar entre 120 y 230 cm.';
  if (profile.weight < 35 || profile.weight > 250) return 'Revisa el peso: debe estar entre 35 y 250 kg.';
  return '';
}

function calculateNutritionGoals(profile) {
  const sexOffset = profile.sex === 'male' ? 5 : profile.sex === 'female' ? -161 : -78;
  const bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + sexOffset;
  const maintenance = bmr * profile.activity;
  const goalConfig = getGoalConfig(profile.goal);
  const calories = Math.max(1200, Math.round(maintenance * goalConfig.calorieFactor));
  const protein = Math.round(profile.weight * goalConfig.proteinPerKg);
  const fats = Math.round(Math.max(profile.weight * 0.7, (calories * 0.22) / 9));
  const carbs = Math.round(Math.max(40, (calories - (protein * 4) - (fats * 9)) / 4));

  return {
    calories,
    protein,
    carbs,
    fats,
    bmr: Math.round(bmr),
    maintenance: Math.round(maintenance),
    goalLabel: goalConfig.label,
    source: 'profile',
  };
}

function getGoalConfig(goal) {
  const configs = {
    lose_fat: { label: 'bajar peso / perder grasa', calorieFactor: 0.85, proteinPerKg: 2.0, advice: 'Déficit moderado, buena proteína y constancia. Priorizá comidas saciantes, verduras y entrenamiento de fuerza si podés.' },
    recompose: { label: 'perder grasa y mantener músculo', calorieFactor: 0.92, proteinPerKg: 2.1, advice: 'Déficit suave con proteína alta: ideal para mejorar composición corporal sin bajar demasiado el rendimiento.' },
    maintain: { label: 'mantener peso y mejorar hábitos', calorieFactor: 1.0, proteinPerKg: 1.7, advice: 'Objetivo equilibrado: buscá regularidad, fibra, proteína suficiente y calidad de alimentos.' },
    gain_muscle: { label: 'ganar músculo con mínimo exceso', calorieFactor: 1.08, proteinPerKg: 2.0, advice: 'Superávit leve: acompañalo con entrenamiento progresivo y controlá que el aumento de peso sea gradual.' },
    gain_weight: { label: 'subir peso', calorieFactor: 1.15, proteinPerKg: 1.8, advice: 'Superávit más claro: sumá comidas densas en energía sin descuidar proteína, micronutrientes y digestión.' },
  };
  return configs[goal] || configs.maintain;
}

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.profile) || 'null');
  } catch {
    return null;
  }
}

function loadProfileIntoForm() {
  const profile = getProfile();
  if (!profile || !elements.profileForm) return;
  elements.profileAge.value = profile.age || '';
  elements.profileSex.value = profile.sex || 'other';
  elements.profileHeight.value = profile.height || '';
  elements.profileWeight.value = profile.weight || '';
  elements.profileActivity.value = String(profile.activity || 1.2);
  elements.profileGoal.value = profile.goal || 'maintain';
}

function renderProfileSummary() {
  if (!elements.profileCalories) return;
  const profile = getProfile();
  const goals = getGoals();
  const goalConfig = profile ? getGoalConfig(profile.goal) : null;

  elements.profileCalories.textContent = String(Math.round(goals.calories));
  elements.profileProtein.textContent = `${formatNumber(goals.protein)} g`;
  elements.profileCarbs.textContent = `${formatNumber(goals.carbs)} g`;
  elements.profileFats.textContent = `${formatNumber(goals.fats)} g`;

  if (!profile) {
    elements.profileSummaryText.textContent = 'Completá edad, altura, peso, actividad y objetivo para obtener una guía personalizada.';
    elements.profileAdvice.textContent = 'Mientras no cargues tu perfil, se usan metas generales por defecto. Podés editarlas manualmente en Ajustes.';
    return;
  }

  elements.profileSummaryText.textContent = `Para ${goalConfig.label}, tu referencia es ${Math.round(goals.calories)} kcal diarias. Mantenimiento estimado: ${goals.maintenance || '—'} kcal.`;
  elements.profileAdvice.textContent = goalConfig.advice;
}

function formatCalorieDelta(diff) {
  if (Math.abs(diff) <= 40) return 'Estás prácticamente en tu meta calórica.';
  return diff > 0 ? `Te faltan aprox. ${diff} kcal.` : `Te pasaste aprox. ${Math.abs(diff)} kcal.`;
}

function buildComparisonAdvice(totals, goals) {
  const remainingProtein = Math.round(goals.protein - totals.protein);
  const remainingCalories = Math.round(goals.calories - totals.calories);
  const calorieText = remainingCalories >= 0
    ? `quedan unas ${remainingCalories} kcal para el día`
    : `superaste la meta por unas ${Math.abs(remainingCalories)} kcal`;
  const proteinText = remainingProtein > 8
    ? `Conviene priorizar proteína en la próxima comida: faltan unos ${remainingProtein} g.`
    : remainingProtein < -8
      ? 'La proteína ya está cubierta; equilibrá con verduras, fibra y saciedad.'
      : 'La proteína está cerca de la meta.';
  return `Según tu objetivo, ${calorieText}. ${proteinText}`;
}

function refreshApiState() {
  const ready = hasApiKey();
  elements.apiStatus.textContent = ready ? 'API lista' : 'Sin API';
  elements.apiStatus.classList.toggle('ready', ready);
  elements.apiLock.classList.toggle('hidden', ready);
  elements.analyzeButton.disabled = !ready || !state.compressedImage;
}

function loadGoalsIntoForm() {
  const goals = getGoals();
  elements.goalCalories.value = goals.calories;
  elements.goalProtein.value = goals.protein;
  elements.goalCarbs.value = goals.carbs;
  elements.goalFats.value = goals.fats;
}

function getApiKey() {
  return localStorage.getItem(STORAGE.apiKey) || '';
}

function hasApiKey() {
  return Boolean(getApiKey());
}

function getGoals() {
  try {
    return { ...DEFAULT_GOALS, ...JSON.parse(localStorage.getItem(STORAGE.goals) || '{}') };
  } catch {
    return { ...DEFAULT_GOALS };
  }
}

function dayStorageKey(dateKey) {
  return `nutriscan_day_${dateKey}`;
}

function getMealsForDate(dateKey) {
  try {
    const value = localStorage.getItem(dayStorageKey(dateKey));
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMealsForDate(dateKey, meals) {
  if (!meals.length) {
    localStorage.removeItem(dayStorageKey(dateKey));
    return;
  }

  try {
    localStorage.setItem(dayStorageKey(dateKey), JSON.stringify(meals));
  } catch (error) {
    console.error(error);
    showToast('No se pudo guardar: el almacenamiento local está lleno. Borra días antiguos o usa fotos más pequeñas.');
  }
}

function toDateKey(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateLong(dateKey) {
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseDateKey(dateKey));
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat('es', { weekday: 'short' }).format(date).replace('.', '');
}

function formatTime(value) {
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatNumber(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function toPercent(value, goal) {
  return Math.min(100, Math.round(((Number(value) || 0) / Math.max(1, Number(goal) || 1)) * 100));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function setBusy(isBusy, label = '') {
  elements.analyzeButton.disabled = isBusy || !hasApiKey() || !state.compressedImage;
  elements.buttonLoader.classList.toggle('hidden', !isBusy);
  const text = elements.analyzeButton.querySelector('span:first-child');
  text.textContent = isBusy ? label : 'Analizar con IA';
}

let toastTimer;
function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  toastTimer = window.setTimeout(() => elements.toast.classList.add('hidden'), 4200);
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.installPrompt = event;
    elements.installButton.classList.remove('hidden');
  });

  elements.installButton.addEventListener('click', async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    elements.installButton.classList.add('hidden');
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const reloadOnceForUpdate = () => {
    const flag = 'nutriscan_sw_reloaded_20260608_cachefix';
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, '1');
    window.location.replace('./index.html?v=20260609-profile');
  };

  try {
    const registration = await navigator.serviceWorker.register('./sw.js?v=20260609-profile', {
      updateViaCache: 'none',
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NUTRISCAN_UPDATED') {
        reloadOnceForUpdate();
      }
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', reloadOnceForUpdate);
    await registration.update();
  } catch (error) {
    console.warn('No se pudo registrar el service worker.', error);
  }
}
