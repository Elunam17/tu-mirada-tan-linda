(() => {
  const canvas = document.getElementById("matrix");
  const context = canvas.getContext("2d");
  const message = document.getElementById("message");

  if (!context) {
    throw new Error("No se pudo iniciar el lienzo de la animación.");
  }

  const cellSize = 12;
  const glyphs = "0123456789";
  const streams = [];
  const rainDuration = 2200;
  const phrases = [
    { text: "nicole", duration: 1400 },
    { text: "Tu", duration: 1200 },
    { text: "Eres", duration: 1200 },
    { text: "Muy", duration: 1200 },
    { text: "Linda", duration: 1400 },
    { text: "Y", duration: 1000 },
    { text: "Hermosa", duration: 1600 },
    { text: "Me", duration: 1200 },
    { text: "pierdo", duration: 1400 },
    { text: "En tu mirada", duration: 1900 },
    { text: "tan linda ❤️", duration: 1900 },
    { text: "Me encanta", duration: 1600 },
    { text: "Cuando me", duration: 1600 },
    { text: "Regaña", duration: 1200 },
  ];
  const phraseDuration = phrases.reduce((total, phrase) => total + phrase.duration, 0);
  const cycleDuration = rainDuration + phraseDuration;
  const textCanvas = document.createElement("canvas");
  const textContext = textCanvas.getContext("2d", { willReadFrequently: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let textPixels = null;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let lastTime = 0;
  let elapsed = 0;
  let lastAnnouncedPhase = "";

  if (!textContext) {
    throw new Error("No se pudo preparar el texto de la animación.");
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    textCanvas.width = Math.ceil(width);
    textCanvas.height = Math.ceil(height);

    const laneCount = Math.ceil(width / (cellSize * 2));
    streams.length = 0;
    for (let index = 0; index < laneCount; index += 1) {
      if (Math.random() > 0.22) {
        streams.push({
          x: index * cellSize * 2 + Math.random() * cellSize,
          y: Math.random() * height,
          length: 7 + Math.floor(Math.random() * 12),
          speed: 75 + Math.random() * 60,
        });
      }
    }

    drawMessage(currentPhase());
  }

  function currentPhase() {
    let cycleTime = elapsed % cycleDuration;
    if (cycleTime < rainDuration) return "rain";

    cycleTime -= rainDuration;
    for (const phrase of phrases) {
      if (cycleTime < phrase.duration) return phrase.text;
      cycleTime -= phrase.duration;
    }

    return phrases[phrases.length - 1].text;
  }

  function drawMessage(phase) {
    textContext.clearRect(0, 0, width, height);
    textPixels = null;
    if (phase === "rain") return;

    const maxTextWidth = width * 0.9;
    let fontSize = Math.min(height * 0.34, width * 0.22);
    textContext.font = `700 ${fontSize}px "Courier New", monospace`;
    while (textContext.measureText(phase).width > maxTextWidth && fontSize > 12) {
      fontSize -= 2;
      textContext.font = `700 ${fontSize}px "Courier New", monospace`;
    }

    textContext.textAlign = "center";
    textContext.textBaseline = "middle";
    textContext.fillStyle = "#fff";
    textContext.fillText(phase, width / 2, height / 2);
    textPixels = textContext.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
  }

  function announcePhase(phase) {
    if (phase === lastAnnouncedPhase) return;
    lastAnnouncedPhase = phase;
    message.textContent =
      phase === "rain" ? "Una lluvia de números morados" : `Los números forman ${phase}`;
    drawMessage(phase);
  }

  function drawFrame(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;
    elapsed += delta;
    if (reducedMotion.matches) elapsed = cycleDuration - 500;

    const phase = currentPhase();
    announcePhase(phase);
    context.fillStyle = "rgba(11, 7, 17, 0.16)";
    context.fillRect(0, 0, width, height);
    context.font = `${cellSize}px "Courier New", monospace`;

    for (const stream of streams) {
      stream.y += stream.speed * (delta / 1000);
      if (stream.y - stream.length * cellSize > height) {
        stream.y = -Math.random() * height * 0.45;
        stream.length = 7 + Math.floor(Math.random() * 12);
        stream.speed = 75 + Math.random() * 60;
      }

      for (let index = 0; index < stream.length; index += 1) {
        const y = stream.y - index * cellSize;
        if (y < 0 || y > height) continue;

        const progress = index / stream.length;
        const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        context.fillStyle =
          index === 0
            ? "#e4d3ff"
            : `rgba(157, 119, 196, ${Math.max(0.18, 0.78 - progress * 0.62)})`;
        context.fillText(glyph, stream.x, y);
      }
    }

    if (phase !== "rain") {
      const columnsPerCell = Math.max(1, Math.floor(cellSize * 0.7));
      const rowsPerCell = Math.max(1, Math.floor(cellSize * 0.85));
      const maskRadius = 3;
      context.save();
      context.font = `${cellSize + 3}px "Courier New", monospace`;
      context.shadowColor = "#b56cff";
      context.shadowBlur = 7;

      for (let y = 0; y < height; y += rowsPerCell) {
        for (let x = 0; x < width; x += columnsPerCell) {
          if (!textPixels) continue;
          let insideLetter = false;
          for (let offsetY = -maskRadius; offsetY <= maskRadius && !insideLetter; offsetY += 2) {
            for (let offsetX = -maskRadius; offsetX <= maskRadius; offsetX += 2) {
              const sampleX = Math.floor(x + offsetX);
              const sampleY = Math.floor(y + offsetY);
              if (
                sampleX < 0 ||
                sampleX >= textCanvas.width ||
                sampleY < 0 ||
                sampleY >= textCanvas.height
              ) {
                continue;
              }
              const pixelIndex = (sampleY * textCanvas.width + sampleX) * 4 + 3;
              if (textPixels[pixelIndex] > 40) {
                insideLetter = true;
                break;
              }
            }
          }
          if (!insideLetter) continue;

          const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
          context.fillStyle = Math.random() > 0.3 ? "#f5eaff" : "#d5aaff";
          context.fillText(glyph, x, y);
        }
      }

      context.restore();
    }

    if (!reducedMotion.matches) {
      window.requestAnimationFrame(drawFrame);
    }
  }

  window.addEventListener("resize", resize);
  resize();
  window.requestAnimationFrame(drawFrame);
})();
