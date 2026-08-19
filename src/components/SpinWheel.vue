<template>
  <div ref="container" class="flex spin-container">
    <picture>
      <source srcset="/img/image.avif" type="image/avif" />
      <source srcset="/img/image.webp" type="image/webp" />
      <img src="/img/image.png" class="image" alt="background image" />
    </picture>
    <div
      class="icon"
      @click="spin"
      @keyup.enter="spin"
      @keyup.space="spin"
      v-tooltip.bottom="{
        value: `↻ Spin!`,
        class: 'text-xl',
        escape: true
      }"
      tabindex="0"
    >
      <div class="icon-inner">
        <span class="spin-text">SPIN</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watch } from 'vue';
import random from 'random';
import { Wheel, type WheelProps } from 'spin-wheel';
import { useDialog } from 'primevue/usedialog';
import { TickSound, LabelLength } from '@/services/SettingService';
import { ItemService, Items } from '@/services/ItemService';
import CongratulationDialog from '@/components/CongratulationDialog.vue';

const itemService = inject<ItemService>('ItemService');

const properties: WheelProps = {
  isInteractive: false,
  radius: 0.48,
  rotationResistance: 0,
  itemLabelRadius: 0.92,
  itemLabelRadiusMax: 0.3,
  itemLabelRotation: 180,
  itemLabelAlign: 'left',
  itemLabelColors: ['#fff'],
  itemLabelBaselineOffset: -0.07,
  itemLabelFont:
    '"Suez One", "Mochiy Pop P One", "Jua", "Unbounded", "Mitr", "Noto Sans TC", "Noto Sans SC", "Noto Sans Lao", "Noto Color Emoji"',
  itemLabelFontSizeMax: 55,
  itemBackgroundColors: [
    '#fdc963',
    '#00cca8',
    '#2b87e9',
    '#fd775b',
    '#ff4b78',
    '#c88857',
    '#a64a97',
    '#5b7c7d',
    '#715344',
    '#904e55',
    '#8b7856'
  ],
  rotationSpeedMax: 2000,
  lineWidth: 1,
  lineColor: '#fff',
  items: []
};

const container = ref();

let spinCount = 0;
let wheel: Wheel | undefined = undefined;
let isSpinning = false;

// Force all visual slices to have weight = 1 so they are spread completely evenly
const getVisualItems = (items?: any[]) => {
  if (!items || items.length === 0) return [];
  return items.map((item) => ({
    ...item,
    weight: 1 // visually 100% equal slices
  }));
};

// Pick the winning item index based on actual item weights
const getRandomWeightedIndex = (): number => {
  const currentItems = Items.value || [];
  if (currentItems.length === 0) return 0;

  const totalWeight = currentItems.reduce((sum, item) => sum + (Number(item.weight) || 1), 0);
  let randomNum = Math.random() * totalWeight;

  for (let i = 0; i < currentItems.length; i++) {
    const weight = Number(currentItems[i].weight) || 1;
    if (randomNum < weight) {
      return i;
    }
    randomNum -= weight;
  }
  return currentItems.length - 1;
};

const stopAndClearSound = () => {
  if (!wheel) return;
  wheel.onCurrentIndexChange = () => {};
  wheel.stop();
};

const playSound = () => {
  if (!TickSound.value) return;

  var src = TickSound.value.value.startsWith('data:')
    ? TickSound.value.value
    : `/sound/${TickSound.value.value}`;
  const audio = new Audio(src);
  audio.volume = 0.3;
  audio.play();
};

const spin = () => {
  if (!wheel || isSpinning) return;

  const currentItems = Items.value || [];
  if (currentItems.length === 0) return;

  isSpinning = true;

  // Determine the secret weighted winner
  const targetIndex = getRandomWeightedIndex();
  const duration = random.int(4000, 5500);
  const revolutions = random.int(5, 8);

  wheel.onCurrentIndexChange = () => {
    playSound();
  };

  // Smoothly spin to the chosen weighted item
  wheel.spinToItem(targetIndex, duration, false, revolutions, 1);
};

const dialog = useDialog();
const openCongratulationDialog = ($event: {
  type: 'rest';
  currentIndex: number;
  rotation: number;
}) => {
  dialog.open(CongratulationDialog, {
    props: {
      modal: true,
      showHeader: false,
      style: 'border: 0',
      contentStyle: 'border: 0; backgroundColor: transparent',
      dismissableMask: true
    },
    data: {
      item: Items.value![$event.currentIndex]
    }
  });
};

const handleResize = () => {
  if (wheel) {
    wheel.resize();
  }
};

onMounted(() => {
  watch(Items, (newValue) => {
    if (wheel) {
      wheel.items = getVisualItems(newValue);
    }
  });

  watch(LabelLength, (newValue) => {
    if (wheel) {
      wheel.itemLabelRadiusMax = 1 - newValue;
    }
  });

  wheel = new Wheel(container.value, {
    ...properties,
    items: getVisualItems(Items.value),
    itemLabelRadiusMax: 1 - LabelLength.value
  });

  wheel.spin(10);

  wheel.onRest = ($event) => {
    isSpinning = false;
    stopAndClearSound();
    openCongratulationDialog($event);
  };

  wheel.onSpin = () => {
    gtag('event', 'spin');
    gtag('event', 'spin_count', {
      count: ++spinCount
    });
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 200);
  });

  setTimeout(() => {
    if (wheel) {
      wheel.itemLabelRadiusMax = 1 - LabelLength.value;
      wheel.resize();
    }
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss" scoped>
@import 'primeflex/core/_variables.scss';

.spin-container {
  aspect-ratio: 1/1;
  width: 200vw;
  height: 90vh;

  margin-top: -3.5rem;
  margin-bottom: -10vh;
  position: relative;

  @media (min-width: map-get($breakpoints, 'sm')) {
    height: 100vh;
  }

  @media (min-width: map-get($breakpoints, 'md')) {
    height: 110vh;
  }

  @media (orientation: landscape) {
    width: 75vh !important;
    height: 75vh !important;
    max-width: 90vw;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
}

.image {
  object-position: center;
  object-fit: contain;

  aspect-ratio: 1/1;
  width: 200vw;
  height: 90vh;

  position: absolute;
  top: calc(calc(50%) - calc(90vh / 2));
  left: calc(calc(50%) - calc(200vw / 2));

  @media (min-width: map-get($breakpoints, 'sm')) {
    height: 100vh;
    top: calc(calc(50%) - calc(100vh / 2));
  }

  @media (min-width: map-get($breakpoints, 'md')) {
    height: 110vh;
    top: calc(calc(50%) - calc(110vh / 2));
  }

  @media (orientation: landscape) {
    width: 75vh !important;
    height: 75vh !important;
    top: 0 !important;
    left: 0 !important;
  }
}

.icon {
  $icon-size: 13vh;
  cursor: pointer;

  width: $icon-size;
  height: $icon-size;
  border-radius: 50%;

  /* Premium center button styling with no unfair image */
  background: radial-gradient(circle at 35% 30%, #ffd700 0%, #d4af37 40%, #855800 100%);
  border: 4px solid #ffffff;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.7), 0 8px 16px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -4px 6px rgba(0, 0, 0, 0.5);

  display: flex;
  align-items: center;
  justify-content: center;

  position: absolute;
  top: calc(calc(50%) - calc($icon-size / 2));
  left: calc(calc(50%) - calc($icon-size / 2));
  user-select: none;
  z-index: 5;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease, filter 0.15s ease;

  .icon-inner {
    width: 80%;
    height: 80%;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, #e11d48 0%, #be123c 60%, #881337 100%);
    border: 2px solid #ffedd5;
    box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spin-text {
    font-family: 'Rock Salt', 'Impact', sans-serif;
    color: #ffffff;
    font-size: clamp(0.9rem, 3.2vh, 1.8rem);
    font-weight: 900;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(255, 255, 255, 0.6);
  }

  @media (orientation: landscape) {
    $icon-size-ls: 11vh;
    width: $icon-size-ls !important;
    height: $icon-size-ls !important;
    top: calc(50% - ($icon-size-ls / 2)) !important;
    left: calc(50% - ($icon-size-ls / 2)) !important;

    .spin-text {
      font-size: clamp(0.75rem, 2.5vh, 1.4rem);
    }
  }

  &:hover {
    transform: scale(1.08);
    filter: brightness(1.15);
    box-shadow: 0 0 35px rgba(255, 215, 0, 0.9), 0 10px 20px rgba(0, 0, 0, 0.7);
  }

  &:active {
    transform: scale(0.94);
    filter: brightness(0.9);
  }
}
</style>
