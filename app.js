const STORAGE = {
  apiKey: 'nutriscan_api_key',
  assistantApiKey: 'nutriscan_assistant_api_key',
  goals: 'nutriscan_goals',
  profile: 'nutriscan_profile',
  chatHistory: 'nutriscan_chat_history',
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

const MICRONUTRIENT_DEFINITIONS = [
  { key: 'vitaminC', label: 'Vit. C', fullLabel: 'Vitamina C', unit: 'mg', aliases: ['vitamin_c_mg', 'vitamina_c_mg', 'vitaminC', 'vitamin_c'] },
  { key: 'vitaminB1', label: 'B1', fullLabel: 'Vitamina B1', unit: 'mg', aliases: ['vitamin_b1_mg', 'thiamin_mg', 'tiamina_mg', 'vitaminB1'] },
  { key: 'vitaminB2', label: 'B2', fullLabel: 'Vitamina B2', unit: 'mg', aliases: ['vitamin_b2_mg', 'riboflavin_mg', 'riboflavina_mg', 'vitaminB2'] },
  { key: 'vitaminB3', label: 'B3', fullLabel: 'Vitamina B3', unit: 'mg', aliases: ['vitamin_b3_mg', 'niacin_mg', 'niacina_mg', 'vitaminB3'] },
  { key: 'vitaminB5', label: 'B5', fullLabel: 'Vitamina B5', unit: 'mg', aliases: ['vitamin_b5_mg', 'pantothenic_acid_mg', 'acido_pantotenico_mg', 'vitaminB5'] },
  { key: 'vitaminB6', label: 'B6', fullLabel: 'Vitamina B6', unit: 'mg', aliases: ['vitamin_b6_mg', 'pyridoxine_mg', 'piridoxina_mg', 'vitaminB6'] },
  { key: 'vitaminB7', label: 'B7', fullLabel: 'Vitamina B7', unit: 'mcg', aliases: ['vitamin_b7_mcg', 'biotin_mcg', 'biotina_mcg', 'vitaminB7'] },
  { key: 'vitaminB9', label: 'B9', fullLabel: 'Vitamina B9', unit: 'mcg', aliases: ['vitamin_b9_mcg', 'folate_mcg', 'folato_mcg', 'acido_folico_mcg', 'vitaminB9'] },
  { key: 'vitaminB12', label: 'B12', fullLabel: 'Vitamina B12', unit: 'mcg', aliases: ['vitamin_b12_mcg', 'cobalamin_mcg', 'cobalamina_mcg', 'vitaminB12'] },
  { key: 'vitaminA', label: 'Vit. A', fullLabel: 'Vitamina A', unit: 'mcg', aliases: ['vitamin_a_mcg', 'retinol_mcg', 'rae_mcg', 'vitaminA'] },
  { key: 'vitaminD', label: 'Vit. D', fullLabel: 'Vitamina D', unit: 'mcg', aliases: ['vitamin_d_mcg', 'vitaminD'] },
  { key: 'vitaminE', label: 'Vit. E', fullLabel: 'Vitamina E', unit: 'mg', aliases: ['vitamin_e_mg', 'tocopherol_mg', 'vitaminE'] },
  { key: 'vitaminK', label: 'Vit. K', fullLabel: 'Vitamina K', unit: 'mcg', aliases: ['vitamin_k_mcg', 'vitaminK'] },
  { key: 'calcium', label: 'Calcio', fullLabel: 'Calcio', unit: 'mg', aliases: ['calcium_mg', 'calcio_mg', 'calcium'] },
  { key: 'magnesium', label: 'Magnesio', fullLabel: 'Magnesio', unit: 'mg', aliases: ['magnesium_mg', 'magnesio_mg', 'magnesium'] },
  { key: 'potassium', label: 'Potasio', fullLabel: 'Potasio', unit: 'mg', aliases: ['potassium_mg', 'potasio_mg', 'potassium'] },
  { key: 'sodium', label: 'Sodio', fullLabel: 'Sodio', unit: 'mg', aliases: ['sodium_mg', 'sodio_mg', 'sodium'] },
  { key: 'phosphorus', label: 'Fósforo', fullLabel: 'Fósforo', unit: 'mg', aliases: ['phosphorus_mg', 'fosforo_mg', 'phosphorus'] },
  { key: 'iron', label: 'Hierro', fullLabel: 'Hierro', unit: 'mg', aliases: ['iron_mg', 'hierro_mg', 'iron'] },
  { key: 'zinc', label: 'Zinc', fullLabel: 'Zinc', unit: 'mg', aliases: ['zinc_mg', 'zinc'] },
  { key: 'copper', label: 'Cobre', fullLabel: 'Cobre', unit: 'mg', aliases: ['copper_mg', 'cobre_mg', 'copper'] },
  { key: 'manganese', label: 'Manganeso', fullLabel: 'Manganeso', unit: 'mg', aliases: ['manganese_mg', 'manganeso_mg', 'manganese'] },
  { key: 'iodine', label: 'Yodo', fullLabel: 'Yodo', unit: 'mcg', aliases: ['iodine_mcg', 'yodo_mcg', 'iodine'] },
  { key: 'selenium', label: 'Selenio', fullLabel: 'Selenio', unit: 'mcg', aliases: ['selenium_mcg', 'selenio_mcg', 'selenium'] },
];

const MICRONUTRIENT_PRIORITY = ['potassium', 'sodium', 'calcium', 'magnesium', 'phosphorus', 'iron', 'zinc', 'vitaminC', 'vitaminA', 'vitaminB12', 'vitaminD', 'vitaminK'];
const BIOACTIVE_LEVELS = ['sin dato', 'bajo', 'medio', 'alto'];

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
  micronutrientHighlights: $('#micronutrientHighlights'),
  hydrationBioactives: $('#hydrationBioactives'),
  micronutrientConfidence: $('#micronutrientConfidence'),
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
  dailyTargetLine: $('#dailyTargetLine'),
  dailyProtein: $('#dailyProtein'),
  targetProtein: $('#targetProtein'),
  proteinBar: $('#proteinBar'),
  dailyCarbs: $('#dailyCarbs'),
  targetCarbs: $('#targetCarbs'),
  carbsBar: $('#carbsBar'),
  dailyFats: $('#dailyFats'),
  targetFats: $('#targetFats'),
  fatsBar: $('#fatsBar'),
  goalComparisonCard: $('#goalComparisonCard'),
  calorieDelta: $('#calorieDelta'),
  comparisonAdvice: $('#comparisonAdvice'),
  dailyMicronutrientCard: $('#dailyMicronutrientCard'),
  dailyMicronutrientHighlights: $('#dailyMicronutrientHighlights'),
  dailyHydrationBioactives: $('#dailyHydrationBioactives'),
  dailyMicronutrientNote: $('#dailyMicronutrientNote'),
  mealList: $('#mealList'),
  clearDayButton: $('#clearDayButton'),
  profileForm: $('#profileForm'),
  profileAge: $('#profileAge'),
  profileSex: $('#profileSex'),
  profileHeight: $('#profileHeight'),
  profileWeight: $('#profileWeight'),
  profileActivity: $('#profileActivity'),
  profileGoal: $('#profileGoal'),
  profileFormStatus: $('#profileFormStatus'),
  profileRecommendation: $('#profileRecommendation'),
  profileCalories: $('#profileCalories'),
  profileCalorieRing: $('#profileCalorieRing'),
  profileProtein: $('#profileProtein'),
  profileCarbs: $('#profileCarbs'),
  profileFats: $('#profileFats'),
  goalsForm: $('#goalsForm'),
  goalCalories: $('#goalCalories'),
  goalProtein: $('#goalProtein'),
  goalCarbs: $('#goalCarbs'),
  goalFats: $('#goalFats'),
  goalsFormStatus: $('#goalsFormStatus'),
  apiKeyForm: $('#apiKeyForm'),
  apiKeyInput: $('#apiKeyInput'),
  toggleApiVisibility: $('#toggleApiVisibility'),
  deleteApiKeyButton: $('#deleteApiKeyButton'),
  apiFormStatus: $('#apiFormStatus'),
  assistantKeyForm: $('#assistantKeyForm'),
  assistantKeyInput: $('#assistantKeyInput'),
  toggleAssistantVisibility: $('#toggleAssistantVisibility'),
  deleteAssistantKeyButton: $('#deleteAssistantKeyButton'),
  assistantKeyFormStatus: $('#assistantKeyFormStatus'),
  assistantStatus: $('#assistantStatus'),
  assistantLock: $('#assistantLock'),
  chatContainer: $('#chatContainer'),
  chatHistory: $('#chatHistory'),
  chatInput: $('#chatInput'),
  chatSendButton: $('#chatSendButton'),
  installButton: $('#installButton'),
};

const ASSISTANT_CONFIG = {
  rateLimitMs: 1000,
  maxRequestsPerHour: 60,
  cacheExpiryMs: 1800000,
};

const assistantState = {
  lastRequestTime: 0,
  requestsThisHour: 0,
  hourStartTime: Date.now(),
  responseCache: {},
};

async function callGemini(apiKey, image, mealContext = '') {
  const contextText = mealContext
    ? `\nContexto aportado por el usuario: ${mealContext}. Usá este dato para identificar ingredientes, rellenos, cantidad o cocción que no sean visibles en la foto.`
    : '';
  const prompt = `Analiza la imagen de comida y devuelve únicamente JSON válido, sin markdown, sin texto adicional y sin unidades en los números.${contextText} Si no puedes identificar con certeza, usa el plato más probable, baja confidence y baja micronutrient_confidence. Esquema exacto requerido: {"dish_name":"string","calories":number,"protein_g":number,"fat_g":number,"carbs_g":number,"confidence":number,"notes":"string","review":"string","micronutrient_confidence":number,"micronutrients":{"vitamin_c_mg":number,"vitamin_b1_mg":number,"vitamin_b2_mg":number,"vitamin_b3_mg":number,"vitamin_b5_mg":number,"vitamin_b6_mg":number,"vitamin_b7_mcg":number,"vitamin_b9_mcg":number,"vitamin_b12_mcg":number,"vitamin_a_mcg":number,"vitamin_d_mcg":number,"vitamin_e_mg":number,"vitamin_k_mcg":number,"calcium_mg":number,"magnesium_mg":number,"potassium_mg":number,"sodium_mg":number,"phosphorus_mg":number,"iron_mg":number,"zinc_mg":number,"copper_mg":number,"manganese_mg":number,"iodine_mcg":number,"selenium_mcg":number},"hydration":{"water_g":number,"water_percent":number},"bioactives":{"antioxidants":"bajo|medio|alto|sin dato","polyphenols":"bajo|medio|alto|sin dato","flavonoids":"bajo|medio|alto|sin dato","notes":"string"}}. calories debe ser kcal estimadas; protein_g, fat_g y carbs_g deben ser gramos estimados para la porción visible. Los micronutrientes, agua y compuestos bioactivos son estimaciones orientativas para la porción visible: si no aplica o no se puede inferir, usa 0 en nutrientes numéricos y "sin dato" en bioactivos. confidence y micronutrient_confidence deben estar entre 0 y 1. notes debe explicar brevemente la incertidumbre de la estimación. review debe ser una reseña nutricional y gastronómica breve en español rioplatense/neutro, de 1 a 2 frases, útil y amable, mencionando balance, porción, micronutrientes destacados o una mejora posible sin juzgar.`;

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
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('No se pudo parsear la respuesta JSON de Gemini.');
      }
    }
    throw new Error('Gemini no devolvió JSON válido.');
  }
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initializeApp() {
  registerServiceWorker();
  initializeElements();
  attachEventListeners();
  loadProfile();
  loadGoals();
  loadChatHistory();
  refreshAssistantState();
  updateDashboard();
  handleInstallPrompt();
  syncWithLocalStorage();
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const reloadOnceForUpdate = () => {
    const flag = 'nutriscan_sw_reloaded_20260614_fix_redirect';
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, '1');
    window.location.replace('./index.html?v=20260614-fix-format');
  };

  try {
    const registration = await navigator.serviceWorker.register('./sw.js?v=20260614-fix-format', {
      updateViaCache: 'none',
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NUTRISCAN_UPDATED') {
        console.log('App actualizada a versión:', event.data.version);
        reloadOnceForUpdate();
      }
    });

    const reloadOnceForUpdate2 = () => {
      const flag = 'nutriscan_sw_reloaded_20260614_fix_redirect';
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
      window.location.replace('./index.html?v=20260614-fix-format');
    };

    let newWorker = null;
    registration.addEventListener('updatefound', () => {
      newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Nueva versión disponible. Recargando...');
          reloadOnceForUpdate2();
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', reloadOnceForUpdate);
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
  }
}

function initializeElements() {
  elements.tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      activateTab(tabName);
    });
  });
}

function attachEventListeners() {
  elements.cameraButton?.addEventListener('click', () => elements.cameraInput?.click());
  elements.uploadButton?.addEventListener('click', () => elements.fileInput?.click());
  elements.cameraInput?.addEventListener('change', handleFileSelect);
  elements.fileInput?.addEventListener('change', handleFileSelect);
  elements.dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('drag-over');
  });
  elements.dropZone?.addEventListener('dragleave', () => {
    elements.dropZone.classList.remove('drag-over');
  });
  elements.dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { value: { files }, enumerable: true });
      handleFileSelect(event);
    }
  });
  elements.analyzeButton?.addEventListener('click', analyzeImage);
  elements.saveMealButton?.addEventListener('click', saveMeal);
  elements.discardResultButton?.addEventListener('click', discardResult);
  elements.historyDate?.addEventListener('change', updateDashboard);
  elements.clearDayButton?.addEventListener('click', clearDay);
  elements.profileForm?.addEventListener('submit', saveProfile);
  elements.goalsForm?.addEventListener('submit', saveGoals);
  elements.toggleApiVisibility?.addEventListener('click', toggleApiKeyVisibility);
  elements.deleteApiKeyButton?.addEventListener('click', deleteApiKey);
  elements.toggleAssistantVisibility?.addEventListener('click', toggleAssistantKeyVisibility);
  elements.deleteAssistantKeyButton?.addEventListener('click', deleteAssistantKey);
  const chatForm = document.getElementById('chatForm');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendChatMessage();
    });
  }
  elements.chatSendButton?.addEventListener('click', (e) => {
    e.preventDefault();
    sendChatMessage();
  });
  elements.chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  document.querySelectorAll('[data-go-settings]').forEach((btn) => {
    btn.addEventListener('click', () => activateTab('settings'));
  });
}

function activateTab(tabName) {
  elements.tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
    btn.setAttribute('aria-selected', btn.dataset.tab === tabName);
  });
  elements.views.forEach((view) => {
    view.classList.toggle('active', view.id === tabName);
  });
  if (tabName === 'dashboard') {
    updateDashboard();
  }
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Por favor selecciona una imagen.');
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.getElementById('compressionCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const maxWidth = 1024;
        const maxHeight = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const reader2 = new FileReader();
            reader2.onload = (e2) => {
              const base64 = e2.target.result.split(',')[1];
              state.compressedImage = {
                base64,
                mimeType: file.type,
                originalSize: file.size,
                compressedSize: blob.size,
              };

              elements.imagePreview.src = e2.target.result;
              elements.imagePreview.classList.remove('hidden');
              elements.emptyPreview.classList.add('hidden');
              elements.compressionInfo.textContent = `Imagen comprimida: ${(blob.size / 1024).toFixed(1)} KB (original: ${(file.size / 1024).toFixed(1)} KB)`;
              elements.analyzeButton.disabled = false;
            };
            reader2.readAsDataURL(blob);
          },
          file.type,
          0.85
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error al procesar imagen:', error);
    showToast('Error al procesar la imagen.');
  }
}

async function analyzeImage() {
  if (!state.compressedImage) {
    showToast('Selecciona una imagen primero.');
    return;
  }

  const apiKey = localStorage.getItem(STORAGE.apiKey);
  if (!apiKey) {
    showToast('Configura tu API Key primero.');
    activateTab('settings');
    return;
  }

  elements.analyzeButton.disabled = true;
  elements.buttonLoader.classList.remove('hidden');

  try {
    const mealContext = document.getElementById('mealContext')?.value || '';
    const result = await callGemini(apiKey, state.compressedImage, mealContext);
    state.currentResult = result;
    displayResult(result);
  } catch (error) {
    console.error('Error analyzing image:', error);
    showToast(`Error: ${error.message}`);
  } finally {
    elements.analyzeButton.disabled = false;
    elements.buttonLoader.classList.add('hidden');
  }
}

function displayResult(result) {
  elements.resultEmpty.classList.add('hidden');
  elements.resultPanel.classList.remove('hidden');

  elements.mealName.textContent = result.dish_name || 'Comida desconocida';
  elements.calorieValue.textContent = Math.round(result.calories || 0);
  elements.calorieRing.style.setProperty('--progress', `${Math.min((result.calories / 600) * 360, 360)}deg`);
  elements.confidenceChip.textContent = `${Math.round((result.confidence || 0) * 100)}%`;
  elements.mealNotes.textContent = result.notes || 'Sin notas adicionales.';
  elements.foodReview.textContent = result.review || 'Reseña no disponible.';

  elements.proteinValue.textContent = `${Math.round(result.protein_g || 0)} g`;
  elements.carbsValue.textContent = `${Math.round(result.carbs_g || 0)} g`;
  elements.fatsValue.textContent = `${Math.round(result.fat_g || 0)} g`;

  elements.micronutrientConfidence.textContent = `Confianza: ${Math.round((result.micronutrient_confidence || 0) * 100)}%`;

  const micronutrients = result.micronutrients || {};
  const highlights = MICRONUTRIENT_PRIORITY.map((key) => {
    const def = MICRONUTRIENT_DEFINITIONS.find((d) => d.key === key);
    if (!def) return null;
    const aliases = def.aliases;
    const value = aliases.reduce((acc, alias) => acc || micronutrients[alias], null);
    return value ? { def, value } : null;
  }).filter(Boolean);

  elements.micronutrientHighlights.innerHTML = highlights
    .slice(0, 6)
    .map((h) => `<span class="nutrient-chip">${h.def.label}: ${Math.round(h.value)} ${h.def.unit}</span>`)
    .join('');

  const hydration = result.hydration || {};
  const bioactives = result.bioactives || {};
  let hydrationBioactivesHtml = '';
  if (hydration.water_g) {
    hydrationBioactivesHtml += `<div class="component-item"><span>Agua</span><strong>${Math.round(hydration.water_g)}g (${Math.round(hydration.water_percent || 0)}%)</strong></div>`;
  }
  if (bioactives.antioxidants) {
    hydrationBioactivesHtml += `<div class="component-item"><span>Antioxidantes</span><strong>${bioactives.antioxidants}</strong></div>`;
  }
  if (bioactives.polyphenols) {
    hydrationBioactivesHtml += `<div class="component-item"><span>Polifenoles</span><strong>${bioactives.polyphenols}</strong></div>`;
  }
  if (bioactives.flavonoids) {
    hydrationBioactivesHtml += `<div class="component-item"><span>Flavonoides</span><strong>${bioactives.flavonoids}</strong></div>`;
  }
  elements.hydrationBioactives.innerHTML = hydrationBioactivesHtml || '<p class="microcopy">Sin datos adicionales.</p>';
}

function saveMeal() {
  if (!state.currentResult) return;

  const dateKey = toDateKey(new Date());
  let meals = JSON.parse(localStorage.getItem(`meals_${dateKey}`) || '[]');
  meals.push({
    ...state.currentResult,
    id: Date.now(),
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(`meals_${dateKey}`, JSON.stringify(meals));

  showToast('Comida guardada en tu historial.');
  discardResult();
  updateDashboard();
}

function discardResult() {
  state.currentResult = null;
  elements.resultEmpty.classList.remove('hidden');
  elements.resultPanel.classList.add('hidden');
  elements.imagePreview.classList.add('hidden');
  elements.emptyPreview.classList.remove('hidden');
  elements.compressionInfo.textContent = 'Aún no se seleccionó ninguna imagen.';
  elements.analyzeButton.disabled = true;
  elements.cameraInput.value = '';
  elements.fileInput.value = '';
  document.getElementById('mealContext').value = '';
}

function updateDashboard() {
  const selectedDate = elements.historyDate?.value || toDateKey(new Date());
  elements.historyDate.value = selectedDate;

  const meals = getMealsForDate(selectedDate);
  const totalCals = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
  const totalFats = meals.reduce((sum, m) => sum + (m.fat_g || 0), 0);

  const goals = getGoals();
  elements.dailyCalories.textContent = Math.round(totalCals);
  elements.dailyCalorieRing.style.setProperty('--progress', `${Math.min((totalCals / goals.calories) * 360, 360)}deg`);

  const caloriePercent = Math.round((totalCals / goals.calories) * 100);
  elements.dailySummaryText.textContent = `${caloriePercent}% de tu meta (${Math.round(totalCals)} / ${goals.calories} kcal)`;

  if (caloriePercent > 100) {
    elements.dailyTargetLine.textContent = `Meta alcanzada: +${Math.round(totalCals - goals.calories)} kcal`;
  } else if (caloriePercent > 0) {
    elements.dailyTargetLine.textContent = `Te faltan ${Math.round(goals.calories - totalCals)} kcal`;
  } else {
    elements.dailyTargetLine.textContent = 'Meta: completa tu perfil para personalizarla.';
  }

  elements.dailyProtein.textContent = Math.round(totalProtein);
  elements.targetProtein.textContent = goals.protein;
  elements.proteinBar.style.width = `${Math.min((totalProtein / goals.protein) * 100, 100)}%`;

  elements.dailyCarbs.textContent = Math.round(totalCarbs);
  elements.targetCarbs.textContent = goals.carbs;
  elements.carbsBar.style.width = `${Math.min((totalCarbs / goals.carbs) * 100, 100)}%`;

  elements.dailyFats.textContent = Math.round(totalFats);
  elements.targetFats.textContent = goals.fats;
  elements.fatsBar.style.width = `${Math.min((totalFats / goals.fats) * 100, 100)}%`;

  const profile = getProfile();
  if (profile && profile.goal) {
    elements.goalComparisonCard.classList.remove('hidden');
    const delta = totalCals - goals.calories;
    if (delta > 0) {
      elements.calorieDelta.textContent = `+${Math.round(delta)} kcal (${Math.round((delta / goals.calories) * 100)}%)`;
      elements.comparisonAdvice.textContent = 'Superaste tu meta. Si es un día especial, no te preocupes. Mantén el balance en los próximos días.';
    } else if (delta < 0) {
      elements.calorieDelta.textContent = `${Math.round(delta)} kcal (${Math.round((delta / goals.calories) * 100)}%)`;
      elements.comparisonAdvice.textContent = 'Estás por debajo de tu meta. Considera agregar un snack o comida ligera si tienes hambre.';
    } else {
      elements.calorieDelta.textContent = 'En meta';
      elements.comparisonAdvice.textContent = 'Perfecto, alcanzaste tu meta calórica del día.';
    }
  } else {
    elements.goalComparisonCard.classList.add('hidden');
  }

  updateDailyMicronutrients(meals);
  renderMealList(meals, selectedDate);
  updateWeekStrip(selectedDate);
}

function updateDailyMicronutrients(meals) {
  const micronutrients = {};
  let totalWater = 0;
  const bioactivesCounts = { antioxidants: 0, polyphenols: 0, flavonoids: 0 };

  meals.forEach((meal) => {
    const mealMicros = meal.micronutrients || {};
    Object.keys(mealMicros).forEach((key) => {
      micronutrients[key] = (micronutrients[key] || 0) + (mealMicros[key] || 0);
    });
    if (meal.hydration?.water_g) {
      totalWater += meal.hydration.water_g;
    }
    const bioactives = meal.bioactives || {};
    if (bioactives.antioxidants && bioactives.antioxidants !== 'sin dato') bioactivesCounts.antioxidants++;
    if (bioactives.polyphenols && bioactives.polyphenols !== 'sin dato') bioactivesCounts.polyphenols++;
    if (bioactives.flavonoids && bioactives.flavonoids !== 'sin dato') bioactivesCounts.flavonoids++;
  });

  const highlights = MICRONUTRIENT_PRIORITY.map((key) => {
    const def = MICRONUTRIENT_DEFINITIONS.find((d) => d.key === key);
    if (!def) return null;
    const aliases = def.aliases;
    const value = aliases.reduce((acc, alias) => acc || micronutrients[alias], null);
    return value ? { def, value } : null;
  }).filter(Boolean);

  elements.dailyMicronutrientHighlights.innerHTML = highlights
    .slice(0, 6)
    .map((h) => `<span class="nutrient-chip">${h.def.label}: ${Math.round(h.value)} ${h.def.unit}</span>`)
    .join('');

  let bioactivesHtml = '';
  if (totalWater > 0) {
    bioactivesHtml += `<div class="component-item"><span>Agua total</span><strong>${Math.round(totalWater)}g</strong></div>`;
  }
  if (bioactivesCounts.antioxidants > 0) {
    bioactivesHtml += `<div class="component-item"><span>Comidas con antioxidantes</span><strong>${bioactivesCounts.antioxidants}</strong></div>`;
  }
  if (bioactivesCounts.polyphenols > 0) {
    bioactivesHtml += `<div class="component-item"><span>Comidas con polifenoles</span><strong>${bioactivesCounts.polyphenols}</strong></div>`;
  }
  if (bioactivesCounts.flavonoids > 0) {
    bioactivesHtml += `<div class="component-item"><span>Comidas con flavonoides</span><strong>${bioactivesCounts.flavonoids}</strong></div>`;
  }
  elements.dailyHydrationBioactives.innerHTML = bioactivesHtml || '<p class="microcopy">Sin datos adicionales.</p>';
}

function renderMealList(meals, selectedDate) {
  if (meals.length === 0) {
    elements.mealList.innerHTML = '<p class="microcopy">No hay comidas registradas para este día.</p>';
    return;
  }

  elements.mealList.innerHTML = meals
    .map(
      (meal) => `
    <div class="meal-item">
      <div class="meal-item-header">
        <div>
          <strong>${escapeHtml(meal.dish_name)}</strong>
          <small>${formatTime(meal.timestamp)}</small>
        </div>
        <span class="meal-calories">${Math.round(meal.calories)} kcal</span>
      </div>
      <div class="meal-item-macros">
        <span>P: ${Math.round(meal.protein_g)}g</span>
        <span>C: ${Math.round(meal.carbs_g)}g</span>
        <span>G: ${Math.round(meal.fat_g)}g</span>
      </div>
      <button class="ghost-button danger small" onclick="deleteMeal('${selectedDate}', ${meal.id})">Eliminar</button>
    </div>
  `
    )
    .join('');
}

function deleteMeal(dateKey, mealId) {
  let meals = JSON.parse(localStorage.getItem(`meals_${dateKey}`) || '[]');
  meals = meals.filter((m) => m.id !== mealId);
  localStorage.setItem(`meals_${dateKey}`, JSON.stringify(meals));
  updateDashboard();
}

function clearDay() {
  if (!confirm('¿Estás seguro de que querés borrar todas las comidas de este día?')) return;
  const dateKey = elements.historyDate?.value || toDateKey(new Date());
  localStorage.removeItem(`meals_${dateKey}`);
  updateDashboard();
  showToast('Día borrado.');
}

function getMealsForDate(dateKey) {
  return JSON.parse(localStorage.getItem(`meals_${dateKey}`) || '[]');
}

function updateWeekStrip(selectedDate) {
  const today = new Date(selectedDate);
  let html = '';

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = toDateKey(date);
    const meals = getMealsForDate(dateKey);
    const totalCals = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const goals = getGoals();
    const percent = Math.round((totalCals / goals.calories) * 100);

    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 1);
    const isToday = dateKey === toDateKey(new Date());
    const isSelected = dateKey === selectedDate;

    html += `
      <button class="week-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="elements.historyDate.value='${dateKey}'; updateDashboard();" title="${dateKey}">
        <span class="day-name">${dayName}</span>
        <span class="day-percent">${percent}%</span>
      </button>
    `;
  }

  elements.weekStrip.innerHTML = html;
}

function saveProfile(e) {
  e.preventDefault();
  const profile = {
    age: parseInt(elements.profileAge.value) || 25,
    sex: elements.profileSex.value || 'male',
    height: parseInt(elements.profileHeight.value) || 170,
    weight: parseFloat(elements.profileWeight.value) || 70,
    activity: parseFloat(elements.profileActivity.value) || 1.55,
    goal: elements.profileGoal.value || 'maintain',
  };

  localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
  calculateGoals(profile);
  elements.profileFormStatus.textContent = 'Perfil guardado y metas calculadas.';
  updateDashboard();
}

function calculateGoals(profile) {
  const { age, sex, height, weight, activity, goal } = profile;

  let bmr;
  if (sex === 'male') {
    bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else if (sex === 'female') {
    bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  } else {
    bmr = (88.362 + 13.397 * weight + 4.799 * height - 5.677 * age + 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age) / 2;
  }

  const tdee = Math.round(bmr * activity);

  let calories;
  switch (goal) {
    case 'lose_fat':
      calories = Math.round(tdee * 0.85);
      break;
    case 'recompose':
      calories = Math.round(tdee * 0.9);
      break;
    case 'maintain':
      calories = tdee;
      break;
    case 'gain_muscle':
      calories = Math.round(tdee * 1.1);
      break;
    case 'gain_weight':
      calories = Math.round(tdee * 1.2);
      break;
    default:
      calories = tdee;
  }

  const proteinPerKg = goal === 'gain_muscle' ? 2.2 : goal === 'lose_fat' ? 2.0 : 1.6;
  const protein = Math.round(weight * proteinPerKg);
  const fatPercent = 0.3;
  const fats = Math.round((calories * fatPercent) / 9);
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);

  const goals = { calories, protein, carbs, fats };
  localStorage.setItem(STORAGE.goals, JSON.stringify(goals));

  elements.profileCalories.textContent = calories;
  elements.profileProtein.textContent = protein;
  elements.profileCarbs.textContent = carbs;
  elements.profileFats.textContent = fats;
  elements.profileCalorieRing.style.setProperty('--progress', '270deg');
}

function loadProfile() {
  const profile = getProfile();
  if (profile) {
    elements.profileAge.value = profile.age;
    elements.profileSex.value = profile.sex;
    elements.profileHeight.value = profile.height;
    elements.profileWeight.value = profile.weight;
    elements.profileActivity.value = profile.activity;
    elements.profileGoal.value = profile.goal;
    calculateGoals(profile);
  }
}

function getProfile() {
  return JSON.parse(localStorage.getItem(STORAGE.profile) || 'null');
}

function saveGoals(e) {
  e.preventDefault();
  const goals = {
    calories: parseInt(elements.goalCalories.value) || DEFAULT_GOALS.calories,
    protein: parseInt(elements.goalProtein.value) || DEFAULT_GOALS.protein,
    carbs: parseInt(elements.goalCarbs.value) || DEFAULT_GOALS.carbs,
    fats: parseInt(elements.goalFats.value) || DEFAULT_GOALS.fats,
  };

  localStorage.setItem(STORAGE.goals, JSON.stringify(goals));
  elements.goalsFormStatus.textContent = 'Objetivos manuales guardados.';
  updateDashboard();
}

function loadGoals() {
  const goals = getGoals();
  elements.goalCalories.value = goals.calories;
  elements.goalProtein.value = goals.protein;
  elements.goalCarbs.value = goals.carbs;
  elements.goalFats.value = goals.fats;
}

function getGoals() {
  return JSON.parse(localStorage.getItem(STORAGE.goals) || JSON.stringify(DEFAULT_GOALS));
}

function toggleApiKeyVisibility() {
  const isPassword = elements.apiKeyInput.type === 'password';
  elements.apiKeyInput.type = isPassword ? 'text' : 'password';
  elements.toggleApiVisibility.textContent = isPassword ? 'Ocultar' : 'Ver';
}

function toggleAssistantKeyVisibility() {
  const isPassword = elements.assistantKeyInput.type === 'password';
  elements.assistantKeyInput.type = isPassword ? 'text' : 'password';
  elements.toggleAssistantVisibility.textContent = isPassword ? 'Ocultar' : 'Ver';
}

function deleteApiKey() {
  if (!confirm('¿Estás seguro de que querés eliminar tu API Key?')) return;
  localStorage.removeItem(STORAGE.apiKey);
  elements.apiKeyInput.value = '';
  elements.apiFormStatus.textContent = 'API Key eliminada.';
  refreshApiStatus();
}

function deleteAssistantKey() {
  if (!confirm('¿Estás seguro de que querés eliminar tu API Key del Asistente?')) return;
  localStorage.removeItem(STORAGE.assistantApiKey);
  elements.assistantKeyInput.value = '';
  elements.assistantKeyFormStatus.textContent = 'API Key del Asistente eliminada.';
  refreshAssistantState();
}

function refreshApiStatus() {
  const hasKey = Boolean(localStorage.getItem(STORAGE.apiKey));
  elements.apiStatus.textContent = hasKey ? 'API configurada' : 'Sin API';
  elements.apiStatus.classList.toggle('ready', hasKey);
  elements.apiLock.classList.toggle('hidden', hasKey);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function handleInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.installPrompt = e;
    elements.installButton?.classList.remove('hidden');
  });

  elements.installButton?.addEventListener('click', async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    const { outcome } = await state.installPrompt.userChoice;
    if (outcome === 'accepted') {
      state.installPrompt = null;
      elements.installButton?.classList.add('hidden');
    }
  });
}

function syncWithLocalStorage() {
  const apiKey = localStorage.getItem(STORAGE.apiKey);
  if (apiKey) {
    elements.apiKeyInput.value = apiKey;
  }
  const assistantKey = localStorage.getItem(STORAGE.assistantApiKey);
  if (assistantKey) {
    elements.assistantKeyInput.value = assistantKey;
  }
  refreshApiStatus();
}

document.getElementById('apiKeyForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const apiKey = elements.apiKeyInput.value.trim();
  if (!apiKey) {
    showToast('Pega una API Key válida.');
    return;
  }
  localStorage.setItem(STORAGE.apiKey, apiKey);
  elements.apiFormStatus.textContent = 'API Key guardada.';
  refreshApiStatus();
  availableGeminiModelsCache = null;
});

document.getElementById('assistantKeyForm')?.addEventListener('click', (e) => {
  if (e.target.id === 'saveAssistantKeyButton') {
    const assistantKey = elements.assistantKeyInput.value.trim();
    if (!assistantKey) {
      showToast('Pega una API Key válida.');
      return;
    }
    localStorage.setItem(STORAGE.assistantApiKey, assistantKey);
    elements.assistantKeyFormStatus.textContent = 'API Key del Asistente guardada.';
    refreshAssistantState();
    availableGeminiModelsCache = null;
  }
});

async function sendChatMessage() {
  const message = elements.chatInput.value.trim();
  if (!message) return;

  const assistantKey = getAssistantApiKey();
  if (!assistantKey) {
    showToast('Configura tu API Key del Asistente en Ajustes primero.');
    setTimeout(() => activateTab('settings'), 1000);
    return;
  }

  addChatMessage(message, 'user');
  elements.chatInput.value = '';

  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'chat-loading';
  loadingMsg.textContent = 'Asistente está pensando';
  elements.chatHistory.appendChild(loadingMsg);
  elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;

  try {
    const response = await callGeminiAssistant(assistantKey, message);
    loadingMsg.remove();
    addChatMessage(response, 'assistant');
    saveChatMessage({ role: 'user', content: message });
    saveChatMessage({ role: 'assistant', content: response });
  } catch (error) {
    loadingMsg.remove();
    console.error(error);
    addChatMessage(`Error: ${error.message || 'No se pudo procesar tu pregunta.'}`, 'error');
  }
}

function formatMarkdown(text) {
  // Escapar HTML primero para seguridad
  let html = escapeHtml(text);
  
  // Negritas: **texto** o __texto__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Listas: líneas que empiezan con * o -
  html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Saltos de línea
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

function addChatMessage(content, role = 'assistant') {
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${role}`;
  const formattedContent = role === 'assistant' ? formatMarkdown(content) : `<p>${escapeHtml(content)}</p>`;
  messageEl.innerHTML = `<div>${formattedContent}</div><small>${formatTime(new Date().toISOString())}</small>`;
  elements.chatHistory.appendChild(messageEl);
  elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
}

async function callGeminiAssistant(apiKey, userMessage) {
  const now = Date.now();
  if (now - assistantState.lastRequestTime < ASSISTANT_CONFIG.rateLimitMs) {
    throw new Error('Por favor espera un momento antes de enviar otro mensaje.');
  }
  if (now - assistantState.hourStartTime > 3600000) {
    assistantState.requestsThisHour = 0;
    assistantState.hourStartTime = now;
  }
  if (assistantState.requestsThisHour >= ASSISTANT_CONFIG.maxRequestsPerHour) {
    throw new Error('Has alcanzado el límite de mensajes por hora. Intenta más tarde.');
  }
  assistantState.lastRequestTime = now;
  assistantState.requestsThisHour += 1;

  const profile = getProfile();
  const meals = getMealsForDate(toDateKey(new Date()));
  const goals = getGoals();

  const lowerMsg = userMessage.toLowerCase();
  if (lowerMsg.includes('receta') || lowerMsg.includes('qué cocinar')) {
    return generateRecipeFromMeals(apiKey, meals, profile, goals);
  }
  if (lowerMsg.includes('resumen') || lowerMsg.includes('semana') || lowerMsg.includes('análisis')) {
    return generateWeeklySummary(apiKey, profile, goals);
  }

  let context = 'Eres un asistente nutricional experto, amable y motivador. ';
  if (profile) {
    context += `El usuario es ${profile.age} años, ${profile.sex}, ${profile.height}cm, ${profile.weight}kg, con objetivo de ${profile.goal}. `;
  }
  context += `Sus metas diarias son: ${goals.calories} kcal, ${goals.protein}g proteína, ${goals.carbs}g carbos, ${goals.fats}g grasas. `;
  if (meals.length > 0) {
    const totalCals = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
    context += `Hoy ha consumido aproximadamente ${Math.round(totalCals)} kcal (${Math.round(totalProtein)}g proteína) en ${meals.length} comidas. `;
  }
  context += 'Responde en español, de forma concisa y práctica. Si pide recetas, sé específico. Si pide consejo, sé motivador pero realista.';

  return callGeminiChat(apiKey, context, userMessage);
}

async function callGeminiChat(apiKey, systemPrompt, userMessage) {
  const cacheKey = 'gemini_chat_v3_' + hashString(systemPrompt + userMessage);
  const cached = assistantState.responseCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < ASSISTANT_CONFIG.cacheExpiryMs) {
    return cached.response;
  }

  const fullPrompt = `${systemPrompt}\n\nUsuario: ${userMessage}`;
  
  let lastError = null;
  const modelsToTry = await getAvailableGeminiModels(apiKey);

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 1024,
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

      const result = payload.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar una respuesta.';
      
      assistantState.responseCache[cacheKey] = {
        response: result,
        timestamp: Date.now(),
      };
      
      return result;
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      lastError = error;
      continue;
    }
  }

  const mainKey = localStorage.getItem(STORAGE.apiKey);
  if (mainKey && apiKey !== mainKey) {
    console.log('Trying fallback with main API Key...');
    return callGeminiChat(mainKey, systemPrompt, userMessage);
  }

  throw lastError || new Error('No se encontró un modelo Gemini compatible para esta API Key.');
}

function getAssistantApiKey() {
  return localStorage.getItem(STORAGE.assistantApiKey) || localStorage.getItem(STORAGE.apiKey) || '';
}

function hasAssistantApiKey() {
  return Boolean(getAssistantApiKey());
}

function refreshAssistantState() {
  const ready = hasAssistantApiKey();
  elements.assistantStatus.textContent = ready ? 'Asistente listo' : 'Sin API';
  elements.assistantStatus.classList.toggle('ready', ready);
  elements.assistantLock.classList.toggle('hidden', ready);
  if (elements.chatContainer) {
    elements.chatContainer.style.display = ready ? 'grid' : 'none';
  }
  
  const indicator = document.getElementById('assistantStatusIndicator');
  if (indicator) {
    indicator.textContent = ready ? 'Listo' : 'Falta API Key';
    indicator.style.color = ready ? '#00ffaa' : '#ff4444';
  }
}

function loadChatHistory() {
  if (!elements.chatHistory) return;
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE.chatHistory) || '[]');
    elements.chatHistory.innerHTML = '';
    history.slice(-20).forEach((msg) => {
      addChatMessage(msg.content, msg.role);
    });
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

function saveChatMessage(message) {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE.chatHistory) || '[]');
    history.push({ ...message, timestamp: new Date().toISOString() });
    if (history.length > 100) {
      history.shift();
    }
    localStorage.setItem(STORAGE.chatHistory, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

async function generateRecipeFromMeals(apiKey, meals, profile, goals) {
  const mealNames = meals.map(m => m.dishName).join(', ') || 'ninguna aún';
  const systemPrompt = 'Eres un experto chef nutricionista. Sugiere recetas saludables y fáciles.';
  const prompt = `Basándote en lo que el usuario ya comió hoy (${mealNames}), sugiere una receta para la próxima comida que:
1. Complemente los macronutrientes faltantes (metas: ${goals.protein}g proteína, ${goals.carbs}g carbos, ${goals.fats}g grasas)
2. Sea rápida y fácil de preparar
3. Incluya ingredientes comunes
4. Tenga instrucciones claras en 3-4 pasos

Sé conciso y práctico.`;

  return callGeminiChat(apiKey, systemPrompt, prompt);
}

async function generateWeeklySummary(apiKey, profile, goals) {
  let weekData = { totalCals: 0, totalProtein: 0, daysWithData: 0 };
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = toDateKey(date);
    const meals = getMealsForDate(dateKey);
    if (meals.length > 0) {
      weekData.totalCals += meals.reduce((sum, m) => sum + (m.calories || 0), 0);
      weekData.totalProtein += meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
      weekData.daysWithData += 1;
    }
  }

  const avgCals = weekData.daysWithData > 0 ? Math.round(weekData.totalCals / weekData.daysWithData) : 0;
  const avgProtein = weekData.daysWithData > 0 ? Math.round(weekData.totalProtein / weekData.daysWithData) : 0;

  const systemPrompt = 'Eres un analista de datos nutricionales motivador.';
  const prompt = `Analiza el progreso del usuario en la última semana:
- Días registrados: ${weekData.daysWithData}/7
- Promedio diario: ${avgCals} kcal, ${avgProtein}g proteína
- Meta diaria: ${goals.calories} kcal, ${goals.protein}g proteína
- Objetivo: ${profile?.goal || 'mantener peso'}

Da un resumen motivador de 2-3 frases sobre su progreso, identifica fortalezas y sugiere una mejora concreta.`;

  return callGeminiChat(apiKey, systemPrompt, prompt);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

document.addEventListener('DOMContentLoaded', initializeApp);
