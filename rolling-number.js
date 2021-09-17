// HELPER

function htmlEscape(string) {
  return string
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function html(strings, ...args) {
  return strings
    .map((str, i) =>
      i < args.length
        ? str +
          (args[i].__html
            ? [].concat(args[i].__html).join("")
            : htmlEscape(String(args[i])))
        : str
    )
    .join("")
    .trim();
}

function toDigits(num, size = 0) {
  const result = Number.isNaN(num) ? [] : num.toString().split("");
  const padSize = Math.max(0, size - result.length);
  return [...Array(padSize).fill("\u200B"), ...result];
}

function toSize(num) {
  return Number.isNaN(num) ? 0 : num.toString().length;
}

// STYLES

function renderStyles() {
  return html`
    <style>
      :host {
        --roll-duration: 1s;
      }
      .digit {
        width: 1ch;
        overflow: hidden;
        display: inline-flex;
        position: relative;
      }
      .value {
        color: transparent;
        position: relative;
      }
      .scale {
        user-select: none;
        position: absolute;
        left: 0;
        display: inline-flex
        align-items: center;
        justify-content: center;
        flex-direction: column;
        transition: transform var(--roll-duration);
      }
      .scale span:last-child { /* the minus (-) */
        position: absolute;
        bottom: -10%;
        left: 0;
      }
      [data-value="​"] .scale { transform: translatey(10%); }
      [data-value="0"] .scale { transform: translatey(0); }
      [data-value="1"] .scale { transform: translatey(-10%); }
      [data-value="2"] .scale { transform: translatey(-20%); }
      [data-value="3"] .scale { transform: translatey(-30%); }
      [data-value="4"] .scale { transform: translatey(-40%); }
      [data-value="5"] .scale { transform: translatey(-50%); }
      [data-value="6"] .scale { transform: translatey(-60%); }
      [data-value="7"] .scale { transform: translatey(-70%); }
      [data-value="8"] .scale { transform: translatey(-80%); }
      [data-value="9"] .scale { transform: translatey(-90%); }
      [data-value="-"] .scale { transform: translatey(-100%); }
    </style>
  `;
}

// RENDER HELPER

function renderDigit(value, index) {
  return html`
    <span class="digit" data-value="${value}" id="digit${index}">
      <span class="scale" aria-hidden="true">
        <span>0</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
        <span>6</span>
        <span>7</span>
        <span>8</span>
        <span>9</span>
        <span>-</span>
      </span>
      <span class="value">${value}</span>
    </span>
  `;
}

function renderRoot() {
  return html`
    ${{ __html: renderStyles() }}
    <span id="wrapper"> </span>
  `;
}

function render($wrapper, nextState, prevState) {
  const { value, size } = nextState;
  if (size > prevState.size) {
    $wrapper.innerHTML = toDigits(NaN, size).map(renderDigit).join("");
    setTimeout(() => {
      render($wrapper, nextState, { ...prevState, size });
    }, 23);
  } else {
    toDigits(value, size).forEach((digit, index) => {
      const $digit = $wrapper.querySelector(`#digit${index}`);
      if ($digit) {
        $digit.dataset.value = digit;
        $digit.querySelector(".value").textContent = digit;
      }
    });
  }
}

// WEB COMPONENT

const INTERNAL = Symbol("INTERNAL");

class RollingNumber extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }
  [INTERNAL] = {
    $wrapper: null,
    state: { value: NaN, size: 0 },
    update(payload) {
      if ("value" in payload) {
        const { value } = payload;
        const size = toSize(value);
        const state = { ...this.state, value };
        const nextState = size > this.state.size ? { ...state, size } : state;
        render(this.$wrapper, nextState, this.state);
        this.state = nextState;
      }
    },
  };
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = renderRoot();
    this[INTERNAL].$wrapper = shadow.getElementById("wrapper");
  }
  get value() {
    return this[INTERNAL].state.value;
  }
  set value(value) {
    this[INTERNAL].update({ value: Number.parseInt(value) });
  }
  attributeChangedCallback(name, _, newValue) {
    if (name === "value") {
      this.value = newValue;
    }
  }
  connectedCallback() {
    if (this.isConnected) {
      const input = this.getAttribute("value") || this.textContent;
      const value = Number.parseInt(input);
      this[INTERNAL].update({ value });
    }
  }
}

customElements.define("layflags-rolling-number", RollingNumber);

export { RollingNumber };
