<template>
  <div class="container">
    <h1>Application Logs</h1>
    <div class="controls">
      <label for="date-select">Select Date:</label>
      <input type="date" id="date-select" v-model="selectedDate" @change="fetchLogsForDate">
      <button @click="toggleSortOrder" class="sort-button">
        Sort by Date: {{ sortOrder === 'asc' ? 'Oldest First' : 'Newest First' }}
      </button>
    </div>
    <div class="log-display">
      <div v-for="(line, index) in sortedLogs" :key="index" :class="getLogLevelClass(line)">
        <span class="log-timestamp">{{ extractTimestamp(line) }}</span>
        <span class="log-level">{{ extractLogLevel(line) }}</span>
        <span class="log-message">{{ extractLogMessage(line) }}</span>
        <span class="log-context">{{ extractLogContext(line) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const logs = ref('');
const formattedLogs = ref<string[]>([]);
const sortOrder = ref<'asc' | 'desc'>('desc'); // 'desc' for newest first, 'asc' for oldest first
const selectedDate = ref<string>('');

onMounted(async () => {
  // Set default to today's date
  selectedDate.value = new Date().toISOString().split('T')[0];
  await fetchLogsForDate();
});

const fetchLogsForDate = async () => {
  try {
    const response = await fetch(`/api/logs?date=${selectedDate.value}`);
    const data = await response.json();
    if (data.error) {
      logs.value = `Error: ${data.logs}`;
      formattedLogs.value = [`Error: ${data.logs}`];
    } else {
      logs.value = data.logs;
      formattedLogs.value = data.logs.split('\n').filter((line: string) => line.trim() !== '');
    }
  } catch (error: any) {
    logs.value = `Failed to fetch logs: ${error.message}`;
    formattedLogs.value = [`Failed to fetch logs: ${error.message}`];
    console.error('Failed to fetch logs:', error);
  }
};

const getLogLevelClass = (line: string) => {
  if (line.includes('[ERROR]')) {
    return 'log-entry error';
  } else if (line.includes('[INFO]')) {
    return 'log-entry info';
  }
  return 'log-entry';
};

const extractTimestamp = (line: string) => {
  const match = line.match(/^\[(.*?)\]/);
  return match ? match[1] : '';
};

const extractLogLevel = (line: string) => {
  const match = line.match(/\[(INFO|ERROR)\]/);
  return match ? match[1] : '';
};

const extractLogMessage = (line: string) => {
  const match = line.match(/\[(INFO|ERROR)\]\s*(.*?)(?:\s*\{.*)?$/);
  return match ? match[2].trim() : line;
};

const extractLogContext = (line: string) => {
  const match = line.match(/(\{.*\})$/);
  return match ? match[1] : '';
};

const sortedLogs = computed(() => {
  return [...formattedLogs.value].sort((a, b) => {
    const timestampA = new Date(extractTimestamp(a)).getTime();
    const timestampB = new Date(extractTimestamp(b)).getTime();
    return sortOrder.value === 'asc' ? timestampA - timestampB : timestampB - timestampA;
  });
});

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};
</script>

<style scoped>
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.controls label {
  font-weight: bold;
}

.controls input[type="date"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.sort-button {
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 0; /* Reset margin as it's now in controls */
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.sort-button:hover {
  background-color: #45a049;
}

.log-display {
  background-color: #282c34; /* Dark background for logs */
  border: 1px solid #444;
  border-radius: 8px;
  padding: 15px;
  max-height: 80vh;
  overflow-y: auto;
  font-family: 'Fira Code', 'Courier New', Courier, monospace; /* Monospace font for code/logs */
  font-size: 0.85em;
  line-height: 1.6;
  color: #abb2bf; /* Light gray text */
}

.log-entry {
  display: flex;
  flex-wrap: wrap;
  padding: 5px 0;
  border-bottom: 1px dashed #3a3f4b;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-timestamp {
  color: #61afef; /* Blue for timestamps */
  margin-right: 10px;
  flex-shrink: 0;
}

.log-level {
  font-weight: bold;
  margin-right: 10px;
  flex-shrink: 0;
}

.log-message {
  flex-grow: 1;
  margin-right: 10px;
}

.log-context {
  color: #56b6c2; /* Cyan for context (JSON) */
  font-style: italic;
  flex-shrink: 0;
}

.log-entry.info .log-level {
  color: #98c379; /* Green for INFO */
}

.log-entry.error .log-level {
  color: #e06c75; /* Red for ERROR */
}

.log-entry.error {
  background-color: rgba(224, 108, 117, 0.1); /* Light red background for errors */
}
</style>