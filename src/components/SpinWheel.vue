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

let resizeObserver: ResizeObserver | undefined;

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

  // Observe container size changes directly (perfect for rotation & window resize)
  if (typeof ResizeObserver !== 'undefined' && container.value) {
    resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container.value);
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 300);
    setTimeout(handleResize, 600);
  });

  setTimeout(() => {
    if (wheel) {
      wheel.itemLabelRadiusMax = 1 - LabelLength.value;
      wheel.resize();
    }
  }, 100);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss" scoped>
@import 'primeflex/core/_variables.scss';

.spin-container {
  aspect-ratio: 1 / 1;
  width: min(92vw, 65vh);
  height: min(92vw, 65vh);
  max-width: 580px;
  max-height: 580px;
  margin: 0.5rem auto 1rem auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (orientation: landscape) {
    width: min(72vh, 72vw) !important;
    height: min(72vh, 72vw) !important;
    max-width: none;
    max-height: none;
    margin: 0 auto !important;
  }
}

.image {
  width: 100%;
  height: 100%;
  object-position: center;
  object-fit: contain;
  aspect-ratio: 1 / 1;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.icon {
  $icon-size: 20%;
  cursor: pointer;

  width: $icon-size;
  height: $icon-size;
  border-radius: 50%;

  /* Premium center button styling with no unfair image */
  background: radial-gradient(circle at 35% 30%, #ffd700 0%, #d4af37 40%, #855800 100%);
  border: 3px solid #ffffff;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.7), 0 6px 12px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -3px 5px rgba(0, 0, 0, 0.5);

  display: flex;
  align-items: center;
  justify-content: center;

  position: absolute;
  top: calc(50% - ($icon-size / 2));
  left: calc(50% - ($icon-size / 2));
  user-select: none;
  z-index: 5;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease, filter 0.15s ease;

  .icon-inner {
    width: 80%;
    height: 80%;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, #e11d48 0%, #be123c 60%, #881337 100%);
    border: 2px solid #ffedd5;
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spin-text {
    font-family: 'Rock Salt', 'Impact', sans-serif;
    color: #ffffff;
    font-size: clamp(0.75rem, 2.5vmin, 1.6rem);
    font-weight: 900;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9), 0 0 6px rgba(255, 255, 255, 0.6);
  }

  &:hover {
    transform: scale(1.08);
    filter: brightness(1.15);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.9), 0 8px 16px rgba(0, 0, 0, 0.7);
  }

  &:active {
    transform: scale(0.94);
    filter: brightness(0.9);
  }
}
</style>
