/**
 * Heartland Chat — portable customer-assistance Web Component.
 *
 * Usage:
 * <script type="module" src="/components/heartland-chat/heartland-chat.js"></script>
 * <heartland-chat
 *   api-endpoint="https://chat-api.example.com/v1/chat"
 *   booking-endpoint="https://chat-api.example.com/v1/bookings"
 *   tracking-endpoint="https://chat-api.example.com/v1/repairs/track"
 *   assistant-name="Nova"
 *   business-name="Your Business"
 *   accent-color="#a6d832"
 *   booking-url="https://example.com/book"
 *   phone="800-555-0199"
 * ></heartland-chat>
 */

const icons = {
  spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.35 5.15a4.7 4.7 0 0 0 3.5 3.5L22 12l-5.15 1.35a4.7 4.7 0 0 0-3.5 3.5L12 22l-1.35-5.15a4.7 4.7 0 0 0-3.5-3.5L2 12l5.15-1.35a4.7 4.7 0 0 0 3.5-3.5L12 2Z"/><path d="m19 2 .4 1.6L21 4l-1.6.4L19 6l-.4-1.6L17 4l1.6-.4L19 2Z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
  send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  track: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h13v10H3zM16 10h3l2 3v4h-5z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M6 11h7"/></svg>`,
};

const styles = `
  :host {
    --hc-accent: #a6d832;
    --hc-navy: #07182b;
    --hc-blue: #0d65f3;
    --hc-white: #fff;
    --hc-muted: #64768a;
    --hc-border: rgba(7, 24, 43, .11);
    position: fixed;
    z-index: 999;
    right: 24px;
    bottom: 24px;
    color: #142b40;
    font-family: "DM Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button, input { font: inherit; }
  button, a { -webkit-tap-highlight-color: transparent; }
  button { border: 0; cursor: pointer; }
  svg { display: block; width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

  .launcher {
    position: relative;
    width: 62px;
    height: 62px;
    margin-left: auto;
    border-radius: 20px;
    display: grid;
    place-items: center;
    color: var(--hc-navy);
    background: var(--hc-accent);
    box-shadow: 0 15px 42px rgba(7, 24, 43, .25), inset 0 0 0 1px rgba(255,255,255,.42);
    transition: transform .22s ease, border-radius .22s ease;
  }
  .launcher:hover { transform: translateY(-3px); border-radius: 50%; }
  .launcher svg { width: 27px; height: 27px; stroke-width: 1.7; }
  .launcher .close-icon { display: none; }
  .launcher[aria-expanded="true"] .spark-icon { display: none; }
  .launcher[aria-expanded="true"] .close-icon { display: block; }
  .launcher::before {
    content: "";
    position: absolute;
    inset: -6px;
    z-index: -1;
    border: 1px solid color-mix(in srgb, var(--hc-accent) 55%, transparent);
    border-radius: 24px;
    animation: hc-pulse 2.2s ease-out infinite;
  }
  @keyframes hc-pulse { 70%, 100% { transform: scale(1.15); opacity: 0; } }

  .nudge {
    position: absolute;
    right: 75px;
    bottom: 9px;
    width: max-content;
    max-width: 230px;
    padding: 10px 14px;
    border-radius: 11px;
    color: var(--hc-navy);
    background: var(--hc-white);
    box-shadow: 0 12px 34px rgba(7,24,43,.16);
    font-size: 12px;
    font-weight: 700;
    transition: opacity .2s ease, transform .2s ease;
  }
  .nudge::after { content: ""; position: absolute; right: -5px; bottom: 13px; width: 11px; height: 11px; background: inherit; transform: rotate(45deg); }
  .nudge.hidden { opacity: 0; transform: translateX(8px); pointer-events: none; }

  .panel {
    position: absolute;
    right: 0;
    bottom: 76px;
    width: min(378px, calc(100vw - 32px));
    height: min(610px, calc(100vh - 120px));
    min-height: 480px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.6);
    border-radius: 22px;
    background: #f6f9fa;
    box-shadow: 0 28px 90px rgba(4, 22, 40, .27);
    transform-origin: right bottom;
    opacity: 0;
    visibility: hidden;
    transform: translateY(14px) scale(.96);
    transition: opacity .24s ease, transform .24s cubic-bezier(.2,.8,.2,1), visibility .24s;
  }
  .panel.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }

  .header {
    min-height: 91px;
    padding: 18px 18px 17px;
    display: flex;
    align-items: center;
    gap: 13px;
    color: var(--hc-white);
    background: var(--hc-navy);
    position: relative;
    overflow: hidden;
  }
  .header::after { content: ""; position: absolute; right: -55px; top: -80px; width: 180px; height: 180px; border: 1px solid rgba(166,216,50,.16); border-radius: 50%; box-shadow: 0 0 0 30px rgba(166,216,50,.03); }
  .avatar { position: relative; z-index: 1; flex: 0 0 45px; width: 45px; height: 45px; display: grid; place-items: center; border-radius: 13px; color: var(--hc-navy); background: var(--hc-accent); }
  .avatar svg { width: 22px; height: 22px; }
  .online { position: absolute; right: -2px; bottom: -2px; width: 11px; height: 11px; border: 2px solid var(--hc-navy); border-radius: 50%; background: #53df87; }
  .identity { position: relative; z-index: 1; min-width: 0; }
  .identity strong, .identity span { display: block; }
  .identity strong { font: 750 15px/1.2 "Manrope", Inter, system-ui, sans-serif; }
  .identity span { margin-top: 5px; color: rgba(255,255,255,.52); font-size: 10px; }
  .header-close { position: relative; z-index: 2; margin-left: auto; padding: 9px; color: rgba(255,255,255,.65); background: transparent; }
  .header-close:hover { color: var(--hc-white); }

  .messages {
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 21px 18px 18px;
    scrollbar-width: thin;
    scrollbar-color: rgba(7,24,43,.2) transparent;
  }
  .message { display: flex; margin-bottom: 13px; animation: hc-message-in .3s ease both; }
  @keyframes hc-message-in { from { opacity: 0; transform: translateY(7px); } }
  .bubble { max-width: 87%; padding: 11px 13px; border-radius: 6px 15px 15px 15px; background: var(--hc-white); box-shadow: 0 3px 14px rgba(7,24,43,.07); color: #30475c; font-size: 12.5px; line-height: 1.55; white-space: pre-wrap; }
  .message.user { justify-content: flex-end; }
  .message.user .bubble { border-radius: 15px 6px 15px 15px; color: var(--hc-white); background: var(--hc-blue); box-shadow: 0 5px 18px rgba(13,101,243,.16); }
  .message.error .bubble { color: #944242; background: #fff1f1; }
  .message.typing .bubble { display: flex; align-items: center; gap: 4px; height: 36px; padding-inline: 15px; }
  .message.typing i { width: 5px; height: 5px; border-radius: 50%; background: #8fa0af; animation: hc-dot 1s infinite alternate; }
  .message.typing i:nth-child(2) { animation-delay: .16s; }.message.typing i:nth-child(3) { animation-delay: .32s; }
  @keyframes hc-dot { to { transform: translateY(-4px); opacity: .45; } }

  .quick-actions { display: flex; flex-wrap: wrap; gap: 7px; margin: 4px 0 18px; }
  .quick-action { padding: 8px 11px; border: 1px solid var(--hc-border); border-radius: 999px; color: var(--hc-navy); background: rgba(255,255,255,.8); font-size: 10.5px; font-weight: 700; transition: border .2s, background .2s; }
  .quick-action:hover { border-color: var(--hc-accent); background: #fff; }

  .action-card { width: 100%; display: grid; grid-template-columns: 35px 1fr 22px; align-items: center; gap: 10px; margin: 8px 0 15px; padding: 11px; color: var(--hc-navy); background: color-mix(in srgb, var(--hc-accent) 24%, white); border: 1px solid color-mix(in srgb, var(--hc-accent) 45%, white); border-radius: 13px; text-align: left; text-decoration: none; }
  .action-card > span:first-child { width: 35px; height: 35px; display: grid; place-items: center; border-radius: 9px; background: var(--hc-accent); }
  .action-card strong, .action-card small { display: block; }.action-card strong { font-size: 11.5px; }.action-card small { margin-top: 2px; color: #62743e; font-size: 9.5px; }.action-card > svg { width: 15px; }

  .booking-card { margin: 7px 0 18px; padding: 16px; border: 1px solid var(--hc-border); border-radius: 16px; background: var(--hc-white); box-shadow: 0 7px 24px rgba(7,24,43,.08); animation: hc-message-in .3s ease both; }
  .booking-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
  .booking-heading > span { flex: 0 0 34px; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; color: var(--hc-navy); background: var(--hc-accent); }
  .booking-heading svg { width: 17px; }
  .booking-heading strong, .booking-heading small { display: block; }.booking-heading strong { font-size: 12px; }.booking-heading small { margin-top: 2px; color: var(--hc-muted); font-size: 9px; }
  .booking-form { display: block; }
  .field { display: block; margin-bottom: 11px; }
  .field > span, .time-field legend { display: block; margin: 0 0 6px; color: var(--hc-navy); font-size: 9.5px; font-weight: 800; letter-spacing: .02em; }
  .field > span b, .time-field legend b { display: inline-grid; width: 17px; height: 17px; margin-right: 5px; place-items: center; border-radius: 50%; color: var(--hc-white); background: var(--hc-blue); font-size: 8px; }
  .booking-form input, .booking-form select { width: 100%; height: 40px; padding: 0 10px; border: 1px solid var(--hc-border); border-radius: 9px; outline: 0; color: var(--hc-navy); background: #f8fafb; font-size: 10.5px; }
  .booking-form input:focus, .booking-form select:focus { border-color: var(--hc-blue); box-shadow: 0 0 0 3px rgba(13,101,243,.08); }
  .booking-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .selected-date { min-height: 31px; margin: -1px 0 10px; padding: 7px 9px; border-radius: 8px; color: #526779; background: #eff4f6; font-size: 9.5px; }
  .selected-date strong { color: var(--hc-blue); }
  .time-field { min-width: 0; margin: 0 0 12px; padding: 0; border: 0; }
  .time-slots { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
  .time-slot { height: 30px; border: 1px solid var(--hc-border); border-radius: 8px; color: #54687b; background: #f8fafb; font-size: 8.5px; font-weight: 700; }
  .time-slot:hover, .time-slot.selected { color: var(--hc-white); border-color: var(--hc-blue); background: var(--hc-blue); }
  .contact-title { margin: 14px 0 9px; padding-top: 12px; border-top: 1px solid var(--hc-border); color: var(--hc-navy); font-size: 9.5px; font-weight: 800; }
  .booking-submit { width: 100%; height: 42px; margin-top: 2px; border-radius: 10px; color: var(--hc-navy); background: var(--hc-accent); font-size: 11px; font-weight: 800; transition: transform .2s, opacity .2s; }
  .booking-submit:hover { transform: translateY(-1px); }.booking-submit:disabled { opacity: .5; }
  .booking-status { min-height: 15px; margin: 8px 0 0; color: #a24646; text-align: center; font-size: 9px; }
  .booking-status.muted { color: var(--hc-muted); }
  .booking-success { padding: 15px 5px 4px; text-align: center; }
  .booking-success .success-mark { width: 47px; height: 47px; margin: 0 auto 12px; display: grid; place-items: center; border-radius: 50%; color: var(--hc-white); background: #31b96b; }
  .booking-success .success-mark svg { width: 23px; }.booking-success h3 { margin: 0; color: var(--hc-navy); font-size: 15px; }.booking-success p { margin: 7px auto 0; max-width: 250px; color: var(--hc-muted); font-size: 10.5px; }

  .tracking-card { margin: 7px 0 18px; padding: 16px; border: 1px solid var(--hc-border); border-radius: 16px; background: var(--hc-white); box-shadow: 0 7px 24px rgba(7,24,43,.08); animation: hc-message-in .3s ease both; }
  .tracking-card .booking-heading > span { color: var(--hc-white); background: var(--hc-blue); }
  .tracking-form { display: flex; gap: 7px; }
  .tracking-form input { min-width: 0; flex: 1; height: 41px; padding: 0 11px; border: 1px solid var(--hc-border); border-radius: 10px; outline: 0; color: var(--hc-navy); background: #f8fafb; font-size: 11px; text-transform: uppercase; }
  .tracking-form input:focus { border-color: var(--hc-blue); box-shadow: 0 0 0 3px rgba(13,101,243,.08); }
  .tracking-submit { flex: 0 0 auto; height: 41px; padding: 0 13px; border-radius: 10px; color: var(--hc-white); background: var(--hc-blue); font-size: 10px; font-weight: 800; }
  .tracking-submit:disabled { opacity: .5; }
  .tracking-help { margin: 9px 0 0; color: var(--hc-muted); font-size: 8.8px; line-height: 1.45; }
  .tracking-status { min-height: 14px; margin: 8px 0 0; color: #a24646; font-size: 9px; }
  .repair-result { margin-top: 15px; padding-top: 14px; border-top: 1px solid var(--hc-border); }
  .repair-result-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .repair-result-head small, .repair-result-head strong { display: block; }.repair-result-head small { color: var(--hc-muted); font-size: 8.5px; text-transform: uppercase; letter-spacing: .08em; }.repair-result-head strong { margin-top: 3px; color: var(--hc-navy); font-size: 12px; }
  .repair-badge { padding: 6px 8px; border-radius: 999px; color: #175f36; background: #daf7e5; font-size: 8px; font-weight: 800; white-space: nowrap; }
  .repair-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 11px 0; }
  .repair-meta div { padding: 8px; border-radius: 8px; background: #f1f5f7; }.repair-meta span, .repair-meta b { display: block; }.repair-meta span { color: var(--hc-muted); font-size: 7.5px; text-transform: uppercase; }.repair-meta b { margin-top: 2px; color: var(--hc-navy); font-size: 9px; }
  .repair-message { margin: 9px 0 13px; padding: 9px 10px; border-left: 3px solid var(--hc-accent); border-radius: 0 8px 8px 0; color: #4f6476; background: #f5f9ed; font-size: 9.5px; }
  .repair-timeline { margin: 0; padding: 0; list-style: none; }
  .repair-timeline li { position: relative; padding: 0 0 13px 24px; }
  .repair-timeline li:last-child { padding-bottom: 0; }.repair-timeline li::before { content: ""; position: absolute; left: 6px; top: 7px; bottom: -4px; width: 1px; background: #d8e1e6; }.repair-timeline li:last-child::before { display: none; }.repair-timeline li::after { content: ""; position: absolute; left: 2px; top: 4px; width: 9px; height: 9px; border: 2px solid var(--hc-white); border-radius: 50%; background: var(--hc-blue); box-shadow: 0 0 0 1px var(--hc-blue); }
  .repair-timeline strong, .repair-timeline span { display: block; }.repair-timeline strong { color: var(--hc-navy); font-size: 9.5px; }.repair-timeline span { margin-top: 2px; color: var(--hc-muted); font-size: 8px; }

  .composer { padding: 12px; background: var(--hc-white); border-top: 1px solid var(--hc-border); }
  .composer form { display: flex; align-items: center; gap: 8px; }
  input { width: 100%; height: 43px; padding: 0 12px; border: 1px solid var(--hc-border); border-radius: 11px; outline: 0; color: var(--hc-navy); background: #f8fafb; font-size: 12px; transition: border .2s, box-shadow .2s; }
  input:focus { border-color: var(--hc-blue); box-shadow: 0 0 0 3px rgba(13,101,243,.09); }
  input::placeholder { color: #93a2af; }
  .send { flex: 0 0 43px; width: 43px; height: 43px; display: grid; place-items: center; border-radius: 11px; color: var(--hc-navy); background: var(--hc-accent); transition: transform .2s, opacity .2s; }
  .send:hover { transform: translateY(-1px); }.send:disabled { opacity: .45; cursor: not-allowed; }
  .send svg { width: 18px; }
  .privacy { margin: 8px 0 0; text-align: center; color: #a0abb4; font-size: 8.5px; }

  @media (max-width: 640px) {
    :host { right: 14px; bottom: 76px; }
    .launcher { width: 56px; height: 56px; border-radius: 17px; }
    .panel { position: fixed; inset: 12px 12px 76px; width: auto; height: auto; min-height: 0; border-radius: 19px; }
    .nudge { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  }
`;

class HeartlandChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.messages = [];
    this.sessionId = this.getSessionId();
    this.busy = false;
  }

  connectedCallback() {
    this.name = this.getAttribute("assistant-name") || "Nova";
    this.business = this.getAttribute("business-name") || "our team";
    this.endpoint = this.getAttribute("api-endpoint") || "";
    this.bookingEndpoint = this.getAttribute("booking-endpoint") || this.deriveBookingEndpoint(this.endpoint);
    this.appointmentTypesEndpoint = this.deriveAppointmentEndpoint("/v1/appointments/types");
    this.appointmentAvailabilityEndpoint = this.deriveAppointmentEndpoint("/v1/appointments/availability");
    this.trackingEndpoint = this.getAttribute("tracking-endpoint") || this.deriveTrackingEndpoint(this.endpoint);
    this.bookingUrl = this.getAttribute("booking-url") || "";
    this.phone = this.getAttribute("phone") || "";
    this.accent = this.getAttribute("accent-color") || "#a6d832";
    this.getPendingAppointment();
    this.render();
    this.bindEvents();
    this.addWelcome();
  }

  getSessionId() {
    const key = "heartland-chat-session";
    try {
      let value = sessionStorage.getItem(key);
      if (!value) {
        value = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(key, value);
      }
      return value;
    } catch {
      return `session-${Date.now()}`;
    }
  }

  createAppointmentRequestId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });
  }

  getAppointmentRequestId() {
    const key = "heartland-appointment-request-id";
    try {
      const existing = sessionStorage.getItem(key);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing || "")) return existing;
      const created = this.createAppointmentRequestId();
      sessionStorage.setItem(key, created);
      return created;
    } catch {
      return this.createAppointmentRequestId();
    }
  }

  clearAppointmentRequestId() {
    clearTimeout(this.pendingAppointmentExpiryTimer);
    this.pendingAppointmentExpiryTimer = null;
    try {
      sessionStorage.removeItem("heartland-appointment-request-id");
      sessionStorage.removeItem("heartland-pending-appointment");
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }
  }

  expirePendingAppointment() {
    clearTimeout(this.pendingAppointmentExpiryTimer);
    this.pendingAppointmentExpiryTimer = null;
    try {
      sessionStorage.removeItem("heartland-pending-appointment");
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }
  }

  getPendingAppointment() {
    try {
      const pending = JSON.parse(sessionStorage.getItem("heartland-pending-appointment") || "null");
      const isFresh = Number.isFinite(pending?.savedAt) && Date.now() - pending.savedAt < 30 * 60 * 1000;
      if (isFresh && pending?.payload?.appointmentRequestId && pending?.payload?.appointmentMasterId) {
        clearTimeout(this.pendingAppointmentExpiryTimer);
        this.pendingAppointmentExpiryTimer = setTimeout(
          () => this.expirePendingAppointment(),
          Math.max(1, 30 * 60 * 1000 - (Date.now() - pending.savedAt)),
        );
        return pending;
      }
      if (pending) this.expirePendingAppointment();
    } catch {
      this.expirePendingAppointment();
    }
    return null;
  }

  savePendingAppointment(pending) {
    try {
      sessionStorage.setItem("heartland-pending-appointment", JSON.stringify({ ...pending, savedAt: Date.now() }));
      clearTimeout(this.pendingAppointmentExpiryTimer);
      this.pendingAppointmentExpiryTimer = setTimeout(
        () => this.expirePendingAppointment(),
        30 * 60 * 1000,
      );
    } catch {
      // The in-memory request ID still protects ordinary retries in this page view.
    }
  }

  deriveBookingEndpoint(chatEndpoint) {
    if (!chatEndpoint) return "";
    try {
      return new URL("/v1/bookings", chatEndpoint).toString();
    } catch {
      return "";
    }
  }

  deriveAppointmentEndpoint(path) {
    if (!this.bookingEndpoint) return "";
    try {
      const bookingUrl = new URL(this.bookingEndpoint, document.baseURI);
      return new URL(path, bookingUrl).toString();
    } catch {
      return "";
    }
  }

  deriveTrackingEndpoint(chatEndpoint) {
    if (!chatEndpoint) return "";
    try {
      return new URL("/v1/repairs/track", chatEndpoint).toString();
    } catch {
      return "";
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="nudge" role="status">Questions? I’m here to help.</div>
      <section class="panel" aria-label="Chat with ${this.escape(this.name)}" aria-hidden="true">
        <header class="header">
          <div class="avatar">${icons.spark}<i class="online"></i></div>
          <div class="identity"><strong>${this.escape(this.name)} · ${this.escape(this.business)}</strong><span>Online now · Usually replies instantly</span></div>
          <button class="header-close" type="button" aria-label="Close chat">${icons.close}</button>
        </header>
        <div class="messages" role="log" aria-live="polite" aria-relevant="additions"></div>
        <footer class="composer">
          <form>
            <label class="sr-only" for="hc-message">Your message</label>
            <input id="hc-message" type="text" maxlength="800" autocomplete="off" placeholder="Ask us anything…" />
            <button class="send" type="submit" aria-label="Send message">${icons.send}</button>
          </form>
          <p class="privacy">Powered by a secure, independent chat service</p>
        </footer>
      </section>
      <button class="launcher" type="button" aria-label="Open chat" aria-expanded="false">
        <span class="spark-icon">${icons.spark}</span><span class="close-icon">${icons.close}</span>
      </button>
    `;
    this.style.setProperty("--hc-accent", this.accent);
    this.panel = this.shadowRoot.querySelector(".panel");
    this.launcher = this.shadowRoot.querySelector(".launcher");
    this.messageList = this.shadowRoot.querySelector(".messages");
    this.form = this.shadowRoot.querySelector("form");
    this.input = this.shadowRoot.querySelector("input");
    this.sendButton = this.shadowRoot.querySelector(".send");
    this.nudge = this.shadowRoot.querySelector(".nudge");
  }

  bindEvents() {
    this.launcher.addEventListener("click", () => this.toggle());
    this.shadowRoot.querySelector(".header-close").addEventListener("click", () => this.toggle(false));
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit(this.input.value);
    });
    this.messageList.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]");
      if (action?.dataset.action === "track-repair") {
        this.startTracking();
        return;
      }
      const button = event.target.closest("[data-message]");
      if (button) this.submit(button.dataset.message);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.panel.classList.contains("open")) this.toggle(false);
    });
    setTimeout(() => this.nudge?.classList.add("hidden"), 7000);
  }

  toggle(force) {
    const open = force ?? !this.panel.classList.contains("open");
    this.panel.classList.toggle("open", open);
    this.panel.setAttribute("aria-hidden", String(!open));
    this.launcher.setAttribute("aria-expanded", String(open));
    this.launcher.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    this.nudge.classList.add("hidden");
    if (open) setTimeout(() => this.input.focus(), 240);
    this.dispatchEvent(new CustomEvent(open ? "chat-open" : "chat-close", { bubbles: true }));
  }

  addWelcome() {
    this.addMessage("assistant", `Hi! I’m ${this.name}, the ${this.business} assistant. How can I help today?`);
    const actions = document.createElement("div");
    actions.className = "quick-actions";
    ["Book an appointment", "What do you repair?", "Check repair status"].forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-action";
      if (label === "Check repair status") button.dataset.action = "track-repair";
      else button.dataset.message = label;
      button.textContent = label;
      actions.append(button);
    });
    this.messageList.append(actions);
  }

  startTracking() {
    if (!this.messageList.querySelector(".tracking-card")) {
      this.addMessage("user", "Check repair status");
      this.addMessage("assistant", "Enter the repair tracking number from your Customer Repair sheet or confirmation email.");
    }
    this.openTrackingForm();
  }

  async submit(rawMessage) {
    const message = rawMessage.trim();
    if (!message || this.busy) return;
    this.input.value = "";
    this.addMessage("user", message);
    this.setBusy(true);
    const typing = this.addTyping();

    try {
      const response = this.endpoint ? await this.requestServer(message) : await this.demoResponse(message);
      typing.remove();
      this.addMessage("assistant", response.reply);
      this.renderActions(response.actions || []);
    } catch (error) {
      typing.remove();
      this.addMessage("error", "I couldn’t reach the chat service just now. Please try again or call our team directly.");
      if (this.phone) this.renderActions([{ label: `Call ${this.phone}`, url: `tel:${this.phone.replace(/\D/g, "")}`, type: "phone" }]);
      this.dispatchEvent(new CustomEvent("chat-error", { detail: error, bubbles: true }));
    } finally {
      this.setBusy(false);
    }
  }

  async requestServer(message) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        message,
        sessionId: this.sessionId,
        history: this.messages.slice(-12),
        context: { businessName: this.business, pageUrl: window.location.href, pageTitle: document.title },
      }),
    });
    if (!response.ok) throw new Error(`Chat server returned ${response.status}`);
    const data = await response.json();
    const reply = data.reply || data.message || data.answer;
    if (!reply) throw new Error("Chat server response did not include a reply");
    return { reply: String(reply), actions: Array.isArray(data.actions) ? data.actions : [] };
  }

  async demoResponse(message) {
    await new Promise((resolve) => setTimeout(resolve, 550));
    const text = message.toLowerCase();
    if (/book|appointment|demo|schedule/.test(text)) {
      return { reply: "Absolutely. Choose a time that works for you and the team will take it from there.", actions: this.bookingUrl ? [{ label: "Open appointment calendar", url: this.bookingUrl, type: "calendar" }] : [] };
    }
    if (/track|status|repair/.test(text) && /track|status/.test(text)) {
      return { reply: "You can check your repair in real time using the tracking number on your repair sheet or confirmation email.", actions: [{ label: "Enter repair tracking number", type: "tracking" }] };
    }
    if (/repair|service|fix|offer/.test(text)) {
      return { reply: "We help with laptops, desktops, phones, tablets, virus removal, data recovery, networks, business IT, custom PCs, and more. What device is giving you trouble?", actions: [] };
    }
    if (/hour|open|close/.test(text)) return { reply: "Heartland is open Monday through Saturday, 10:00 AM–6:00 PM, and closed Sunday.", actions: [] };
    if (/location|address|where/.test(text)) return { reply: "We have locations in Omaha at 13812 Manderson Circle and Council Bluffs at 1924 West Broadway.", actions: [] };
    return { reply: `Thanks for reaching out! This preview is ready to connect to your dedicated chat server. In the meantime, I can help with services, locations, hours, appointments, and repair tracking.`, actions: this.bookingUrl ? [{ label: "Book an appointment", url: this.bookingUrl, type: "calendar" }] : [] };
  }

  addMessage(role, text) {
    const row = document.createElement("div");
    row.className = `message ${role}`;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    row.append(bubble);
    this.messageList.append(row);
    if (role === "user" || role === "assistant") this.messages.push({ role, content: text });
    this.scrollToLatest();
    return row;
  }

  addTyping() {
    const row = document.createElement("div");
    row.className = "message typing";
    row.setAttribute("aria-label", `${this.name} is typing`);
    row.innerHTML = `<div class="bubble"><i></i><i></i><i></i></div>`;
    this.messageList.append(row);
    this.scrollToLatest();
    return row;
  }

  renderActions(actions) {
    actions.filter((action) => action?.label && (["calendar", "tracking"].includes(action.type) || action.url)).forEach((action) => {
      if (action.type === "calendar") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "action-card";
        button.innerHTML = `<span>${icons.calendar}</span><span><strong>${this.escape(action.label)}</strong><small>Select a date and time here</small></span>${icons.arrow}`;
        button.addEventListener("click", () => this.openBookingForm());
        this.messageList.append(button);
        return;
      }
      if (action.type === "tracking") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "action-card";
        button.innerHTML = `<span>${icons.track}</span><span><strong>${this.escape(action.label)}</strong><small>View status without leaving this page</small></span>${icons.arrow}`;
        button.addEventListener("click", () => this.openTrackingForm());
        this.messageList.append(button);
        return;
      }
      const link = document.createElement("a");
      link.className = "action-card";
      link.href = action.url;
      if (/^https?:/.test(action.url)) link.target = "_blank";
      link.rel = "noopener noreferrer";
      const icon = action.type === "calendar" ? icons.calendar : icons.arrow;
      link.innerHTML = `<span>${icon}</span><span><strong>${this.escape(action.label)}</strong><small>Continue securely</small></span>${icons.arrow}`;
      this.messageList.append(link);
    });
    this.scrollToLatest();
  }

  openTrackingForm() {
    const existing = this.messageList.querySelector(".tracking-card");
    if (existing) {
      existing.scrollIntoView({ behavior: "smooth", block: "start" });
      existing.querySelector("input")?.focus();
      return;
    }

    const card = document.createElement("section");
    card.className = "tracking-card";
    card.setAttribute("aria-label", "Track your repair");
    card.innerHTML = `
      <div class="booking-heading"><span>${icons.track}</span><div><strong>Track your repair</strong><small>See the latest status from our team</small></div></div>
      <form class="tracking-form">
        <label class="sr-only" for="hc-tracking-number">Repair tracking number</label>
        <input id="hc-tracking-number" name="trackingNumber" maxlength="64" autocomplete="off" placeholder="Repair Track No." pattern="[A-Za-z0-9-]+" required />
        <button class="tracking-submit" type="submit">Check status</button>
      </form>
      <p class="tracking-help">Find this number on your Customer Repair sheet or confirmation email.</p>
      <p class="tracking-status" role="status"></p>
    `;
    card.querySelector("form").addEventListener("submit", (event) => this.submitTracking(event, card));
    this.messageList.append(card);
    this.scrollToLatest();
    setTimeout(() => card.querySelector("input")?.focus(), 100);
  }

  async submitTracking(event, card) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = card.querySelector(".tracking-submit");
    const status = card.querySelector(".tracking-status");
    const trackingNumber = form.elements.trackingNumber.value.trim().toUpperCase();
    button.disabled = true;
    button.textContent = "Checking…";
    status.textContent = "";
    card.querySelector(".repair-result")?.remove();

    try {
      if (!this.trackingEndpoint) throw new Error("Repair tracking is not connected yet.");
      const response = await fetch(this.trackingEndpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ trackingNumber, sessionId: this.sessionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Tracking server returned ${response.status}`);
      this.renderRepairResult(card, data.repair);
      this.dispatchEvent(new CustomEvent("repair-tracked", { detail: data.repair, bubbles: true }));
    } catch (error) {
      status.textContent = error.message || "We couldn’t find that repair. Check the number and try again.";
      this.dispatchEvent(new CustomEvent("tracking-error", { detail: error, bubbles: true }));
    } finally {
      button.disabled = false;
      button.textContent = "Check status";
    }
  }

  renderRepairResult(card, repair) {
    const result = document.createElement("div");
    result.className = "repair-result";
    const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not set";
    const updates = Array.isArray(repair.updates) && repair.updates.length
      ? repair.updates
      : [{ title: repair.statusLabel, message: repair.statusMessage, createdAt: repair.updatedAt }];
    result.innerHTML = `
      <div class="repair-result-head"><div><small>Repair #${this.escape(repair.trackingNumber)}</small><strong>${this.escape(repair.deviceName || repair.service || "Your device")}</strong></div><span class="repair-badge">${this.escape(repair.statusLabel)}</span></div>
      <div class="repair-meta"><div><span>Location</span><b>${this.escape(repair.location || "Heartland")}</b></div><div><span>Estimated completion</span><b>${this.escape(formatDate(repair.estimatedCompletion))}</b></div></div>
      ${repair.statusMessage ? `<p class="repair-message">${this.escape(repair.statusMessage)}</p>` : ""}
      <ol class="repair-timeline">${updates.map((update) => `<li><strong>${this.escape(update.title)}</strong><span>${this.escape(update.message || formatDate(update.createdAt))}</span></li>`).join("")}</ol>
    `;
    card.append(result);
    card.querySelector(".tracking-status").textContent = "";
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  openBookingForm() {
    const existing = this.messageList.querySelector(".booking-card:not([data-booking-complete])");
    if (existing) {
      existing.scrollIntoView({ behavior: "smooth", block: "start" });
      existing.querySelector("select")?.focus();
      return;
    }

    const pendingAppointment = this.getPendingAppointment();
    if (pendingAppointment) {
      this.openPendingAppointment(pendingAppointment);
      return;
    }

    const today = new Date();
    const minimumDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");

    const card = document.createElement("section");
    card.className = "booking-card";
    card.appointmentRequestId = this.getAppointmentRequestId();
    card.setAttribute("aria-label", "Book an appointment");
    card.innerHTML = `
      <div class="booking-heading"><span>${icons.calendar}</span><div><strong>Book an appointment</strong><small>Select your service, date, and time</small></div></div>
      <form class="booking-form">
        <label class="field"><span><b>1</b>Select appointment type</span>
          <select name="appointmentTypeId" disabled required>
            <option value="">Loading appointment types…</option>
          </select>
        </label>
        <p class="booking-status appointment-types-status muted" role="status">Loading appointment types…</p>
        <button class="quick-action retry-appointment-types" type="button" hidden>Try again</button>
        <div class="selected-date appointment-type-description" hidden></div>
        <label class="field"><span><b>2</b>Select your date</span><input name="appointmentDate" type="date" min="${minimumDate}" disabled required /></label>
        <div class="selected-date">Selected date: <strong>Choose a date above</strong></div>
        <fieldset class="time-field">
          <legend><b>3</b>Select your time</legend>
          <div class="time-slots"></div>
          <p class="booking-status availability-status muted" role="status">Select an appointment type and date to view available times.</p>
          <input name="appointmentMasterId" type="hidden" />
        </fieldset>
        <div class="contact-title">Your contact details</div>
        <div class="booking-row"><label class="field"><span>First name</span><input name="firstName" autocomplete="given-name" maxlength="255" required /></label><label class="field"><span>Last name</span><input name="lastName" autocomplete="family-name" maxlength="255" required /></label></div>
        <div class="booking-row"><label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required /></label><label class="field"><span>Phone</span><input name="phone" type="tel" autocomplete="tel" maxlength="255" required /></label></div>
        <label class="field"><span>Address</span><input name="address" autocomplete="street-address" maxlength="255" required /></label>
        <div class="booking-row"><label class="field"><span>City</span><input name="city" autocomplete="address-level2" maxlength="255" required /></label><label class="field"><span>State</span><input name="state" autocomplete="address-level1" maxlength="255" required /></label></div>
        <label class="field"><span>ZIP code</span><input name="zip" autocomplete="postal-code" maxlength="255" required /></label>
        <label class="field"><span>Message (optional)</span><input name="message" maxlength="10000" /></label>
        <button class="booking-submit" type="submit">Request this appointment</button>
        <p class="booking-status booking-submit-status" role="status"></p>
      </form>
    `;

    const form = card.querySelector(".booking-form");
    const typeInput = form.elements.appointmentTypeId;
    const dateInput = form.elements.appointmentDate;
    const dateSummary = card.querySelector(".selected-date strong");
    typeInput.addEventListener("change", () => {
      const selectedType = card.appointmentTypes?.find((type) => String(type.id) === typeInput.value);
      const typeDescription = card.querySelector(".appointment-type-description");
      typeDescription.textContent = selectedType?.description || "";
      typeDescription.hidden = !typeDescription.textContent;
      dateInput.disabled = !typeInput.value;
      this.resetAppointmentSlot(card, typeInput.value ? "Choose a date to view available times." : "Select an appointment type and date to view available times.");
      if (typeInput.value && dateInput.value) this.loadAppointmentAvailability(card);
    });
    dateInput.addEventListener("change", () => {
      this.resetAppointmentSlot(card, dateInput.value ? "Loading available times…" : "Choose a date to view available times.");
      if (!dateInput.value) {
        dateSummary.textContent = "Choose a date above";
        return;
      }
      const date = new Date(`${dateInput.value}T12:00:00`);
      dateSummary.textContent = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
      if (typeInput.value) this.loadAppointmentAvailability(card);
    });
    card.querySelector(".retry-appointment-types").addEventListener("click", () => this.loadAppointmentTypes(card));
    form.addEventListener("submit", (event) => this.submitBooking(event, card));
    this.messageList.append(card);
    this.scrollToLatest();
    this.loadAppointmentTypes(card);
  }

  openPendingAppointment(pending) {
    const card = document.createElement("section");
    card.className = "booking-card";
    card.setAttribute("aria-label", "Resume appointment request");
    card.innerHTML = `
      <div class="booking-heading"><span>${icons.calendar}</span><div><strong>Checking your appointment</strong><small>Resuming the request from this tab</small></div></div>
      <p class="booking-status pending-appointment-status muted" role="status">Checking whether your appointment was saved…</p>
      <button class="booking-submit pending-appointment-retry" type="button" hidden>Try again</button>
      <button class="quick-action pending-appointment-start-over" type="button" hidden>Discard and start over</button>
    `;
    card.querySelector(".pending-appointment-retry").addEventListener("click", () => this.retryPendingAppointment(card, pending));
    card.querySelector(".pending-appointment-start-over").addEventListener("click", () => {
      this.clearAppointmentRequestId();
      card.remove();
      this.openBookingForm();
    });
    this.messageList.append(card);
    this.scrollToLatest();
    this.retryPendingAppointment(card, pending);
  }

  async retryPendingAppointment(card, pending) {
    const status = card.querySelector(".pending-appointment-status");
    const retryButton = card.querySelector(".pending-appointment-retry");
    const startOverButton = card.querySelector(".pending-appointment-start-over");
    retryButton.disabled = true;
    retryButton.hidden = true;
    this.setBookingStatus(status, "Checking whether your appointment was saved…");
    try {
      const result = await this.requestAppointmentCreation(pending.payload);
      this.renderAppointmentSuccess(card, result, pending.appointmentDate, pending.startTime, pending.payload);
    } catch (error) {
      this.setBookingStatus(status, error.message || "Unable to check the appointment right now.", true);
      retryButton.disabled = false;
      retryButton.hidden = false;
      const permanentClientError =
        error.status === 400 ||
        error.status === 413 ||
        error.code === "APPOINTMENT_UNAVAILABLE";
      startOverButton.hidden = !permanentClientError;
      this.dispatchEvent(new CustomEvent("booking-error", { detail: error, bubbles: true }));
    }
  }

  async loadAppointmentTypes(card) {
    const form = card.querySelector(".booking-form");
    const typeInput = form.elements.appointmentTypeId;
    const dateInput = form.elements.appointmentDate;
    const status = card.querySelector(".appointment-types-status");
    const retryButton = card.querySelector(".retry-appointment-types");
    const requestId = (card.appointmentTypesRequestId || 0) + 1;
    card.appointmentTypesRequestId = requestId;
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Loading appointment types…";
    typeInput.replaceChildren(placeholder);
    typeInput.disabled = true;
    dateInput.disabled = true;
    retryButton.hidden = true;
    this.setBookingStatus(status, "Loading appointment types…");
    this.resetAppointmentSlot(card, "Select an appointment type and date to view available times.");

    try {
      if (!this.appointmentTypesEndpoint) throw new Error("Appointment booking is not connected yet.");
      const response = await fetch(this.appointmentTypesEndpoint, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        headers: { "Accept": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(this.responseError(data, `Appointment type server returned ${response.status}`));
      if (card.appointmentTypesRequestId !== requestId) return;
      const appointmentTypes = this.responseCollection(data, ["appointmentTypes", "types"])
        .filter((type) => type && type.id !== undefined && type.id !== null && String(type.name || "").trim());
      card.appointmentTypes = appointmentTypes;

      if (!appointmentTypes.length) {
        placeholder.textContent = "No appointment types available";
        this.setBookingStatus(status, "No appointment types are currently available.");
        return;
      }

      placeholder.textContent = "Choose appointment type…";
      appointmentTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = String(type.id);
        option.textContent = String(type.name);
        typeInput.append(option);
      });
      typeInput.disabled = false;
      this.setBookingStatus(status, "");
      setTimeout(() => typeInput.focus(), 100);
    } catch (error) {
      if (card.appointmentTypesRequestId !== requestId) return;
      placeholder.textContent = "Unable to load appointment types";
      this.setBookingStatus(status, error.message || "Unable to load appointment types.", true);
      retryButton.hidden = false;
    }
  }

  async loadAppointmentAvailability(card) {
    const form = card.querySelector(".booking-form");
    const appointmentTypeId = form.elements.appointmentTypeId.value;
    const date = form.elements.appointmentDate.value;
    if (!appointmentTypeId || !date) {
      this.resetAppointmentSlot(card, "Select an appointment type and date to view available times.");
      return;
    }

    const requestId = (card.availabilityRequestId || 0) + 1;
    card.availabilityRequestId = requestId;
    this.resetAppointmentSlot(card, "Loading available times…", false);

    try {
      if (!this.appointmentAvailabilityEndpoint) throw new Error("Appointment availability is not connected yet.");
      const url = new URL(this.appointmentAvailabilityEndpoint, document.baseURI);
      url.searchParams.set("appointmentTypeId", appointmentTypeId);
      url.searchParams.set("date", date);
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        headers: { "Accept": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(this.responseError(data, `Availability server returned ${response.status}`));
      if (card.availabilityRequestId !== requestId) return;

      const slots = this.responseCollection(data, ["slots", "availability"])
        .filter((slot) => slot && slot.appointmentMasterId !== undefined && slot.appointmentMasterId !== null && Number(slot.remainingSlots) > 0);
      if (!slots.length) {
        this.setBookingStatus(card.querySelector(".availability-status"), "No appointment times are available for this date.");
        return;
      }

      const slotContainer = card.querySelector(".time-slots");
      slots.forEach((slot) => {
        const startTime = this.formatAppointmentTime(slot.startTime);
        const endTime = this.formatAppointmentTime(slot.endTime);
        const remainingSlots = Number(slot.remainingSlots);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "time-slot";
        button.textContent = startTime;
        button.title = `${startTime}–${endTime} · ${remainingSlots} ${remainingSlots === 1 ? "spot" : "spots"} left`;
        button.setAttribute("aria-label", button.title);
        button.addEventListener("click", () => {
          slotContainer.querySelectorAll(".time-slot").forEach((candidate) => candidate.classList.remove("selected"));
          button.classList.add("selected");
          card.selectedAppointmentSlot = slot;
          form.elements.appointmentMasterId.value = String(slot.appointmentMasterId);
          this.setBookingStatus(card.querySelector(".availability-status"), `${startTime}–${endTime} selected · ${remainingSlots} ${remainingSlots === 1 ? "spot" : "spots"} left`);
        });
        slotContainer.append(button);
      });
      this.setBookingStatus(card.querySelector(".availability-status"), "Choose one of the available times.");
      this.scrollToLatest();
    } catch (error) {
      if (card.availabilityRequestId !== requestId) return;
      this.setBookingStatus(card.querySelector(".availability-status"), error.message || "Unable to load available times.", true);
    }
  }

  resetAppointmentSlot(card, message, invalidateRequest = true) {
    if (invalidateRequest) card.availabilityRequestId = (card.availabilityRequestId || 0) + 1;
    card.selectedAppointmentSlot = null;
    card.querySelector(".time-slots").replaceChildren();
    const masterIdInput = card.querySelector('[name="appointmentMasterId"]');
    if (masterIdInput) masterIdInput.value = "";
    this.setBookingStatus(card.querySelector(".availability-status"), message);
  }

  responseCollection(data, keys) {
    if (Array.isArray(data)) return data;
    for (const key of keys) {
      if (Array.isArray(data?.[key])) return data[key];
    }
    if (Array.isArray(data?.data)) return data.data;
    for (const key of keys) {
      if (Array.isArray(data?.data?.[key])) return data.data[key];
    }
    return [];
  }

  responseError(data, fallback) {
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.error?.message === "string") return data.error.message;
    if (typeof data?.message === "string") return data.message;
    return fallback;
  }

  setBookingStatus(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("muted", !isError);
  }

  formatAppointmentTime(value) {
    const raw = String(value || "");
    const match = raw.match(/(?:^|[T\s])(\d{1,2}):(\d{2})/);
    if (!match) return raw;
    const hours = Number(match[1]);
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${match[2]} ${hours >= 12 ? "PM" : "AM"}`;
  }

  async requestAppointmentCreation(payload) {
    if (!this.bookingEndpoint) throw new Error("Appointment booking is not connected yet.");
    const response = await fetch(this.bookingEndpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(this.responseError(result, `Booking server returned ${response.status}`));
      error.status = response.status;
      error.code = result.code;
      throw error;
    }
    return result;
  }

  renderAppointmentSuccess(card, result, fallbackDate, fallbackStartTime, fallbackBooking = {}) {
    const canonicalDate = result.booking?.date || fallbackDate;
    const canonicalStartTime = result.booking?.startTime || fallbackStartTime;
    const selectedTime = this.formatAppointmentTime(canonicalStartTime);
    const selectedDate = new Date(`${canonicalDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const reply = result.reply || "Your appointment request is in! Our team will contact you to confirm the time.";
    const reference = result.booking?.uniqueId;
    this.clearAppointmentRequestId();
    card.setAttribute("data-booking-complete", "");
    card.innerHTML = `<div class="booking-success"><div class="success-mark"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></div><h3>Request received</h3><p>${this.escape(reply)}<br><strong>${this.escape(selectedDate)} at ${this.escape(selectedTime)}</strong>${reference ? `<br><small>Reference: ${this.escape(reference)}</small>` : ""}</p></div>`;
    this.addMessage("assistant", `I’ve saved your appointment request for ${selectedDate} at ${selectedTime}. The team will contact you to confirm it.`);
    this.dispatchEvent(new CustomEvent("booking-created", { detail: result.booking || fallbackBooking, bubbles: true }));
  }

  async submitBooking(event, card) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = card.querySelector(".booking-submit-status");
    const submitButton = card.querySelector(".booking-submit");
    if (!card.selectedAppointmentSlot || !form.elements.appointmentMasterId.value) {
      status.textContent = "Please select an available time.";
      return;
    }
    if (!form.reportValidity()) return;

    const values = Object.fromEntries(new FormData(form));
    const requiredStringFields = ["firstName", "lastName", "email", "phone", "address", "city", "state", "zip"];
    const missingField = requiredStringFields.find((field) => !String(values[field] || "").trim());
    if (missingField) {
      status.textContent = "Please complete all required contact details.";
      form.elements[missingField]?.focus();
      return;
    }
    const selectedSlot = { ...card.selectedAppointmentSlot };
    const payload = {
      sessionId: this.sessionId,
      appointmentRequestId: card.appointmentRequestId,
      appointmentMasterId: selectedSlot.appointmentMasterId,
      firstName: String(values.firstName).trim(),
      lastName: String(values.lastName).trim(),
      email: String(values.email).trim(),
      phone: String(values.phone).trim(),
      address: String(values.address).trim(),
      city: String(values.city).trim(),
      state: String(values.state).trim(),
      zip: String(values.zip).trim(),
      message: String(values.message || "").trim(),
    };
    this.savePendingAppointment({
      payload,
      appointmentDate: String(values.appointmentDate),
      startTime: selectedSlot.startTime,
    });
    const controls = Array.from(form.elements);
    const disabledStates = controls.map((control) => [control, control.disabled]);
    controls.forEach((control) => { control.disabled = true; });
    submitButton.textContent = "Sending request…";
    status.textContent = "";

    try {
      const result = await this.requestAppointmentCreation(payload);
      this.renderAppointmentSuccess(card, result, String(values.appointmentDate), selectedSlot.startTime, payload);
    } catch (error) {
      status.textContent = error.code === "APPOINTMENT_REQUEST_CONFLICT"
        ? `${error.message}. Reference: ${payload.appointmentRequestId}. Check this reference with your email before starting another request.`
        : error.message || "Unable to submit the appointment. Please try again.";
      disabledStates.forEach(([control, wasDisabled]) => { control.disabled = wasDisabled; });
      submitButton.textContent = "Request this appointment";
      this.dispatchEvent(new CustomEvent("booking-error", { detail: error, bubbles: true }));
    }
  }

  setBusy(value) {
    this.busy = value;
    this.input.disabled = value;
    this.sendButton.disabled = value;
  }

  scrollToLatest() {
    requestAnimationFrame(() => this.messageList.scrollTo({ top: this.messageList.scrollHeight, behavior: "smooth" }));
  }

  escape(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }
}

if (!customElements.get("heartland-chat")) customElements.define("heartland-chat", HeartlandChat);

export { HeartlandChat };
