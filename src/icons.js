export function icon(type, className = "") {
  const paths = {
    leaf: '<path d="M12 21V10M12 14C3 15 2 7 3 4c7-1 10 3 9 10ZM12 10C11 3 18 1 22 2c1 6-3 10-10 8Z"/>',
    drop: '<path d="M12 2C8 8 4 11 4 16a8 8 0 0 0 16 0c0-5-4-8-8-14Z"/><path d="M8 16c0 2 1 3 3 4"/>',
    salt: '<path d="m7 3 10 0 2 5-2 13H7L5 8Z"/><path d="M5 8h14M9 5h.1M12 5h.1M15 5h.1M9 13h6M9 17h6"/>',
    chili:
      '<path d="M18 7C16 20 8 23 3 20c8-1 6-13 12-14l3 1Z"/><path d="M16 7c0-3 2-4 5-4"/>',
    cube: '<path d="m12 3 9 5v10l-9 5-9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v10"/>',
    lemon:
      '<path d="M4 5c3-4 13-2 16 5s-2 12-8 11S0 10 4 5Z"/><path d="m4 5-2-2M20 20l2 2M9 7l1-.1"/>',
    jar: '<path d="M6 7h12l2 4v10H4V11Z"/><path d="M6 3h12v4H6ZM8 14h8M8 17h8"/>',
    spoon:
      '<ellipse cx="8" cy="7" rx="4" ry="6" transform="rotate(-30 8 7)"/><path d="m11 12 9 10"/>',
    book: '<path d="M12 5C8 2 3 3 2 4v17c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-2-7-1-10 1ZM12 5v17"/>',
    undo: '<path d="m8 4-5 5 5 5M3 9h10a7 7 0 1 1 0 14"/>',
    reset: '<path d="M20 7a9 9 0 1 0 1 9M20 2v5h-5"/>',
    sound:
      '<path d="M11 4 5 9H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
    pause: '<path d="M7 4v16M17 4v16"/>',
    play: '<path d="m7 3 15 9-15 9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M20 4l-2 2M6 18l-2 2"/>',
    download: '<path d="M12 2v14m-5-5 5 5 5-5M3 17v5h18v-5"/>',
    check: '<path d="m4 12 5 5L21 5"/>',
    close: '<path d="m5 5 14 14M19 5 5 19"/>',
  };

  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type] || paths.leaf}</svg>`;
}
