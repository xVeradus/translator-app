<!-- Benutzeroberfläche -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Übersetzer</ion-title>

        <ion-buttons slot="end">
          <ion-button router-link="/models"> Modelle </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-textarea
        v-model="inputText"
        class="field"
        label="Zu übersetzender Text"
        label-placement="stacked"
        fill="outline"
        placeholder="Text eingeben ..."
        :auto-grow="true"
        :rows="3"
      />

      <ion-select
        v-model="sourceLanguage"
        class="field"
        label="Ausgangssprache"
        label-placement="stacked"
        fill="outline"
        interface="popover"
      >
        <ion-select-option value="auto">
          Automatisch erkennen
        </ion-select-option>

        <ion-select-option
          v-for="lang in languages"
          :key="lang.code"
          :value="lang.code"
        >
          {{ lang.name }}
        </ion-select-option>
      </ion-select>

      <p v-if="detectedLanguage" class="detected">
        Erkannt: {{ languageName(detectedLanguage) }}
      </p>

      <div class="swap-row">
        <ion-button
          fill="clear"
          shape="round"
          aria-label="Sprachen und Texte tauschen"
          @click="swapLanguages"
        >
          <ion-icon slot="icon-only" :icon="swapVerticalOutline" />
        </ion-button>
      </div>

      <ion-select
        v-model="targetLanguage"
        class="field"
        label="Zielsprache"
        label-placement="stacked"
        fill="outline"
        interface="popover"
      >
        <ion-select-option
          v-for="lang in languages"
          :key="lang.code"
          :value="lang.code"
        >
          {{ lang.name }}
        </ion-select-option>
      </ion-select>

      <ion-button
        class="translate-button"
        expand="block"
        color="primary"
        :disabled="isLoading"
        @click="translateText"
      >
        <ion-spinner v-if="isLoading" name="crescent" />

        <span v-else> Übersetzen </span>
      </ion-button>

      <ion-text v-if="errorMessage" color="danger">
        <p class="hint">{{ errorMessage }}</p>
      </ion-text>

      <ion-card v-if="translatedText" class="result-card">
        <ion-card-content>
          <div class="result-head">
            <span class="result-label">Übersetzter Text</span>
            <span class="result-lang">{{ languageName(targetLanguage) }}</span>
          </div>

          <p class="result-text">{{ translatedText }}</p>

          <div class="result-actions">
            <ion-button
              fill="clear"
              shape="round"
              :disabled="isCopying"
              aria-label="Übersetzung kopieren"
              @click="copyTranslation"
            >
              <ion-spinner v-if="isCopying" name="crescent" />

              <ion-icon v-else slot="icon-only" :icon="copyOutline" />
            </ion-button>

            <ion-button
              v-if="!isSpeaking"
              fill="clear"
              shape="round"
              aria-label="Übersetzung vorlesen"
              @click="speakTranslation"
            >
              <ion-icon slot="icon-only" :icon="volumeHighOutline" />
            </ion-button>

            <ion-button
              v-else
              fill="clear"
              shape="round"
              color="medium"
              aria-label="Vorlesen stoppen"
              @click="stopSpeaking"
            >
              <ion-icon slot="icon-only" :icon="stopCircleOutline" />
            </ion-button>
          </div>

          <ion-text v-if="speechMessage" color="danger">
            <p class="hint">{{ speechMessage }}</p>
          </ion-text>
        </ion-card-content>
      </ion-card>

      <ion-toast
        :is-open="!!copyMessage"
        :message="copyMessage"
        :duration="2000"
        @did-dismiss="copyMessage = ''"
      />
    </ion-content>
  </ion-page>
</template>

<!-- Logik -->
<script setup lang="ts">
import { ref } from "vue";
import { Clipboard } from "@capacitor/clipboard";

import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  IonIcon,
} from "@ionic/vue";

import { onMounted, onUnmounted } from "vue";

import {
  copyOutline,
  stopCircleOutline,
  swapVerticalOutline,
  volumeHighOutline,
} from "ionicons/icons";

import { Translation, Language } from "@capacitor-mlkit/translation";
import { LanguageIdentification } from "@capacitor-mlkit/language-identification";

import { languages, languageName } from "../data/languages";

import {
  SpeechSynthesis,
  QueueStrategy,
} from "@capawesome-team/capacitor-speech-synthesis";

const inputText = ref("");
const translatedText = ref("");

const sourceLanguage = ref<Language | "auto">("auto");
const targetLanguage = ref<Language>(Language.English);
const detectedLanguage = ref<Language | "">("");

const isLoading = ref(false);
const errorMessage = ref("");

const copyMessage = ref("");
const isCopying = ref(false);

const isSpeaking = ref(false);
const speechMessage = ref("");

function swapLanguages() {
  let newTargetLanguage: Language;

  if (sourceLanguage.value === "auto") {
    if (!detectedLanguage.value) {
      errorMessage.value =
        "Bitte zuerst übersetzen, damit die Ausgangssprache " +
        "erkannt werden kann.";
      return;
    }

    newTargetLanguage = detectedLanguage.value;
  } else {
    newTargetLanguage = sourceLanguage.value;
  }

  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = newTargetLanguage;

  const previousInput = inputText.value;
  inputText.value = translatedText.value;
  translatedText.value = previousInput;

  detectedLanguage.value = "";
  errorMessage.value = "";
  copyMessage.value = "";
  speechMessage.value = "";
}

async function copyTranslation() {
  copyMessage.value = "";

  if (!translatedText.value) {
    copyMessage.value = "Es ist noch keine Übersetzung vorhanden.";
    return;
  }

  isCopying.value = true;

  try {
    await Clipboard.write({
      string: translatedText.value,
      label: "Übersetzung",
    });

    copyMessage.value = "Text in die Zwischenablage kopiert";
  } catch (error) {
    console.error("Fehler beim Kopieren:", error);

    copyMessage.value = "Der Text konnte nicht kopiert werden.";
  } finally {
    isCopying.value = false;
  }
}

async function translateText() {
  translatedText.value = "";
  detectedLanguage.value = "";
  errorMessage.value = "";
  copyMessage.value = "";
  speechMessage.value = "";

  const cleanedText = inputText.value.trim();

  if (!cleanedText) {
    errorMessage.value = "Bitte geben Sie einen Text ein.";
    return;
  }

  isLoading.value = true;

  try {
    let effectiveSourceLanguage: Language;

    if (sourceLanguage.value === "auto") {
      const identificationResult =
        await LanguageIdentification.identifyLanguage({
          text: cleanedText,
        });

      if (identificationResult.language === "und") {
        errorMessage.value =
          "Die Sprache konnte nicht erkannt werden. " +
          "Bitte wählen Sie die Ausgangssprache manuell aus.";
        return;
      }

      const detected = languages.find(
        (lang) => lang.code === identificationResult.language,
      );

      if (!detected) {
        errorMessage.value =
          `Die erkannte Sprache (${identificationResult.language}) ` +
          "wird von dieser App nicht unterstützt.";
        return;
      }

      effectiveSourceLanguage = detected.code;
      detectedLanguage.value = detected.code;
    } else {
      effectiveSourceLanguage = sourceLanguage.value;
    }

    const translationResult = await Translation.translate({
      text: cleanedText,
      sourceLanguage: effectiveSourceLanguage,
      targetLanguage: targetLanguage.value,
    });

    translatedText.value = translationResult.text;
  } catch (error) {
    console.error("Übersetzungsfehler:", error);

    errorMessage.value =
      "Die Übersetzung konnte nicht durchgeführt werden. " +
      "Prüfen Sie die Internetverbindung, falls das Sprachmodell noch fehlt.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await SpeechSynthesis.addListener("start", () => {
    isSpeaking.value = true;
  });

  await SpeechSynthesis.addListener("end", () => {
    isSpeaking.value = false;
  });

  await SpeechSynthesis.addListener("error", () => {
    isSpeaking.value = false;
    speechMessage.value = "Die Übersetzung konnte nicht vorgelesen werden.";
  });
});

onUnmounted(async () => {
  await SpeechSynthesis.removeAllListeners();
});

function targetSpeechTag(): string {
  const language = languages.find((lang) => lang.code === targetLanguage.value);

  return language?.speechTag ?? targetLanguage.value;
}

async function speakTranslation() {
  speechMessage.value = "";

  if (!translatedText.value) {
    speechMessage.value = "Es ist noch keine Übersetzung vorhanden.";
    return;
  }

  const speechTag = targetSpeechTag();

  isSpeaking.value = true;

  try {
    const supportResult = await SpeechSynthesis.isLanguageAvailable({
      language: speechTag,
    });

    if (!supportResult.isAvailable) {
      speechMessage.value = `Für ${speechTag} ist keine Stimme installiert.`;
      return;
    }

    await SpeechSynthesis.speak({
      text: translatedText.value,
      language: speechTag,
      rate: 1,
      pitch: 1,
      volume: 1,
      queueStrategy: QueueStrategy.Flush,
    });
  } catch (error) {
    console.error("Fehler bei der Sprachausgabe:", error);

    speechMessage.value = "Die Übersetzung konnte nicht vorgelesen werden.";
  } finally {
    isSpeaking.value = false;
  }
}

async function stopSpeaking() {
  try {
    await SpeechSynthesis.cancel();
  } catch (error) {
    console.error("Fehler beim Stoppen der Sprachausgabe:", error);
  } finally {
    isSpeaking.value = false;
  }
}
</script>

<!-- CSS -->
<style scoped>
.field {
  margin-bottom: 14px;
}

.detected {
  margin: -6px 0 10px;
  font-size: 13px;
  color: var(--ion-color-medium);
}

.swap-row {
  display: flex;
  justify-content: center;
  margin: 0 0 6px;
}

.translate-button {
  margin-top: 6px;
}

.hint {
  margin: 8px 0 0;
  font-size: 13px;
}

.result-card {
  margin: 20px 0 0;
}

.result-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.result-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}

.result-lang {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.result-text {
  margin: 0;
  font-size: 22px;
  line-height: 1.35;
  color: var(--ion-color-dark);
}

.result-actions {
  display: flex;
  gap: 2px;
  margin: 12px 0 0 -11px;
}
</style>
