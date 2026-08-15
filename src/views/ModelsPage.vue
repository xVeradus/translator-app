<!-- Benutzeroberfläche -->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>

        <ion-title>Sprachmodelle</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title> Sprachmodelle verwalten </ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <ion-button
            fill="outline"
            size="small"
            :disabled="isLoadingModels"
            @click="loadDownloadedModels"
          >
            <ion-spinner v-if="isLoadingModels" name="crescent" />

            <span v-else> Status aktualisieren </span>
          </ion-button>

          <ion-list>
            <ion-item v-for="lang in languages" :key="lang.code">
              <ion-label>
                <h2>{{ lang.name }}</h2>

                <p>
                  {{
                    isModelDownloaded(lang.code)
                      ? "Installiert"
                      : "Nicht installiert"
                  }}
                </p>
              </ion-label>

              <ion-button
                v-if="!isModelDownloaded(lang.code)"
                slot="end"
                size="small"
                :disabled="activeModelCode === lang.code"
                @click="downloadLanguageModel(lang.code)"
              >
                <ion-spinner
                  v-if="activeModelCode === lang.code"
                  name="crescent"
                />

                <span v-else> Laden </span>
              </ion-button>

              <ion-button
                v-else
                slot="end"
                size="small"
                fill="outline"
                color="danger"
                :disabled="activeModelCode === lang.code"
                @click="deleteLanguageModel(lang.code)"
              >
                <ion-spinner
                  v-if="activeModelCode === lang.code"
                  name="crescent"
                />

                <span v-else> Löschen </span>
              </ion-button>
            </ion-item>
          </ion-list>

          <ion-text v-if="modelMessage" color="medium">
            <p>{{ modelMessage }}</p>
          </ion-text>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<!-- Logik -->
<script setup lang="ts">
import { ref, onMounted } from "vue";

import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";

import { Translation, Language } from "@capacitor-mlkit/translation";
import { languages, languageName } from "../data/languages";

const downloadedModels = ref<Language[]>([]);
const isLoadingModels = ref(false);
const activeModelCode = ref<Language | "">("");
const modelMessage = ref("");

function isModelDownloaded(code: Language): boolean {
  return downloadedModels.value.includes(code);
}

async function loadDownloadedModels() {
  isLoadingModels.value = true;
  modelMessage.value = "";

  try {
    const result = await Translation.getDownloadedModels();

    downloadedModels.value = result.languages;
  } catch (error) {
    console.error("Fehler beim Laden der Modelle:", error);

    modelMessage.value = "Die Modelle konnten nicht geladen werden.";
  } finally {
    isLoadingModels.value = false;
  }
}

async function downloadLanguageModel(code: Language) {
  activeModelCode.value = code;
  modelMessage.value = "";

  try {
    await Translation.downloadModel({
      language: code,
    });

    await loadDownloadedModels();

    modelMessage.value = `${languageName(code)} wurde heruntergeladen.`;
  } catch (error) {
    console.error("Fehler beim Herunterladen des Modells:", error);

    modelMessage.value =
      `${languageName(code)} konnte nicht heruntergeladen werden. ` +
      "Besteht eine Internetverbindung?";
  } finally {
    activeModelCode.value = "";
  }
}

async function deleteLanguageModel(code: Language) {
  activeModelCode.value = code;
  modelMessage.value = "";

  try {
    await Translation.deleteDownloadedModel({
      language: code,
    });

    await loadDownloadedModels();

    modelMessage.value = `${languageName(code)} wurde gelöscht.`;
  } catch (error) {
    console.error("Fehler beim Löschen des Modells:", error);

    modelMessage.value = `${languageName(code)} konnte nicht gelöscht werden.`;
  } finally {
    activeModelCode.value = "";
  }
}

onMounted(() => {
  void loadDownloadedModels();
});
</script>

<!-- Styles (CSS) -->
<style scoped></style>
