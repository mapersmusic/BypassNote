(function (global) {
  class TapTempoController {
    constructor(options = {}) {
      this.button = options.button || null;
      this.input = options.input || null;
      this.keyCodes = options.keyCodes || ['Space', 'Enter'];
      this.maxGapMs = options.maxGapMs || 3000;
      this.onBpm = typeof options.onBpm === 'function' ? options.onBpm : null;
      this.taps = [];
      this.initialized = false;
      this.libraryInstance = options.instance || options.libraryInstance || null;
      this.init();
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;

      if (!this.libraryInstance && global.tapTempoInstance) {
        this.libraryInstance = global.tapTempoInstance;
      }

      if (this.libraryInstance && typeof this.libraryInstance.on === 'function') {
        this.libraryInstance.on('tempo', (bpm) => this.updateInput(Math.round(bpm)));
        this.libraryInstance.on('bpm', (bpm) => this.updateInput(Math.round(bpm)));
      }

      if (this.button) {
        this.button.addEventListener('click', (event) => {
          event.preventDefault();
          this.setActiveState(true);
          this.tap();
          window.setTimeout(() => this.setActiveState(false), 160);
        });
      }

      document.addEventListener('keydown', (event) => {
        if (!this.isModalOpen()) return;
        if (this.keyCodes.includes(event.code)) {
          event.preventDefault();
          this.setActiveState(true);
          this.tap();
          window.setTimeout(() => this.setActiveState(false), 160);
        }
      });
    }

    isModalOpen() {
      const modalWrap = document.getElementById('modalWrap');
      return !!modalWrap && modalWrap.style.display !== 'none';
    }

    tap() {
      if (this.libraryInstance && typeof this.libraryInstance.tap === 'function') {
        this.libraryInstance.tap();
        return;
      }

      const now = Date.now();
      if (!this.taps.length || now - this.taps[this.taps.length - 1] > this.maxGapMs) {
        this.taps = [];
      }

      this.taps.push(now);
      if (this.taps.length > 6) this.taps.shift();

      if (this.taps.length >= 2) {
        const intervals = [];
        for (let index = 1; index < this.taps.length; index += 1) {
          const delta = this.taps[index] - this.taps[index - 1];
          if (delta > 0) intervals.push(delta);
        }

        if (intervals.length) {
          const averageInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
          this.updateInput(60000 / averageInterval);
        }
      }
    }

    setActiveState(isActive) {
      if (!this.button) return;
      this.button.classList.toggle('tap-active', isActive);
    }

    updateInput(bpm) {
      if (!this.input) return;
      const safeBpm = Math.max(1, Math.min(400, Math.round(bpm || 0)));
      this.input.value = safeBpm;
      this.input.dispatchEvent(new Event('input', { bubbles: true }));
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
      if (this.onBpm) this.onBpm(safeBpm);
    }
  }

  global.TapTempoController = TapTempoController;
})(window);
