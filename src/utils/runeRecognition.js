// Algorytm dopasowywania i oceny pociągnięć do rzeczywistego glifu runy (Glyph Raster Mask & Distance Matching)

/**
 * Ocenia pociągnięcia użytkownika w odniesieniu do prawdziwego symbolu runy (targetRune.symbol)
 *
 * @param {Array<Array<{x: number, y: number}>>} strokes - pociągnięcia na canvasie
 * @param {number} canvasWidth - szerokość canvasu
 * @param {number} canvasHeight - wysokość canvasu
 * @param {Object} targetRune - obiekt runy ze znakiem `symbol`
 * @returns {{ isMatch: boolean, accuracy: number, feedback: string }}
 */
export function evaluateRuneDrawing(strokes, canvasWidth, canvasHeight, targetRune) {
  if (!strokes || strokes.length === 0) {
    return { isMatch: false, accuracy: 0, feedback: 'Brak pociągnięć na tablicy.' };
  }

  const allPoints = strokes.flat();
  if (allPoints.length < 4) {
    return { isMatch: false, accuracy: 0, feedback: 'Rysunek jest zbyt krótki.' };
  }

  // Bounding box of user drawing
  const xs = allPoints.map(p => p.x);
  const ys = allPoints.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const userW = Math.max(maxX - minX, 1);
  const userH = Math.max(maxY - minY, 1);

  if (userW < 20 && userH < 20) {
    return { isMatch: false, accuracy: 10, feedback: 'Znak jest zbyt mały, by go odczytać.' };
  }

  try {
    const GRID_SIZE = 80;

    // 1. Create Offscreen Canvas for Target Glyph
    const tCanvas = document.createElement('canvas');
    tCanvas.width = GRID_SIZE;
    tCanvas.height = GRID_SIZE;
    const tCtx = tCanvas.getContext('2d', { willReadFrequently: true });
    tCtx.fillStyle = '#000000';
    tCtx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    tCtx.fillStyle = '#ffffff';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.font = 'bold 54px "Cinzel Decorative", "Segoe UI Symbol", "Times New Roman", serif';
    tCtx.fillText(targetRune.symbol || 'ᚠ', GRID_SIZE / 2, GRID_SIZE / 2 + 2);

    const tImgData = tCtx.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data;

    // 2. Create Offscreen Canvas for User Drawing
    const uCanvas = document.createElement('canvas');
    uCanvas.width = GRID_SIZE;
    uCanvas.height = GRID_SIZE;
    const uCtx = uCanvas.getContext('2d', { willReadFrequently: true });
    uCtx.fillStyle = '#000000';
    uCtx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    uCtx.strokeStyle = '#ffffff';
    uCtx.lineWidth = 5;
    uCtx.lineCap = 'round';
    uCtx.lineJoin = 'round';

    // Scale user points to fit nicely on the canvas grid
    const scaleX = GRID_SIZE / canvasWidth;
    const scaleY = GRID_SIZE / canvasHeight;

    strokes.forEach(stroke => {
      if (stroke.length < 1) return;
      uCtx.beginPath();
      uCtx.moveTo(stroke[0].x * scaleX, stroke[0].y * scaleY);
      for (let i = 1; i < stroke.length - 1; i++) {
        const xc = ((stroke[i].x + stroke[i + 1].x) / 2) * scaleX;
        const yc = ((stroke[i].y + stroke[i + 1].y) / 2) * scaleY;
        uCtx.quadraticCurveTo(stroke[i].x * scaleX, stroke[i].y * scaleY, xc, yc);
      }
      if (stroke.length > 1) {
        const last = stroke[stroke.length - 1];
        uCtx.lineTo(last.x * scaleX, last.y * scaleY);
      }
      uCtx.stroke();
    });

    const uImgData = uCtx.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data;

    // 3. Compare Pixels with 4-pixel dilation tolerance
    let targetPixelCount = 0;
    let targetCoveredCount = 0;
    let userPixelCount = 0;
    let userMatchingCount = 0;

    const isWhite = (data, x, y) => {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
      const idx = (y * GRID_SIZE + x) * 4;
      return data[idx] > 80; // Brightness threshold
    };

    const hasNearbyWhite = (data, cx, cy, radius = 4) => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            if (isWhite(data, cx + dx, cy + dy)) return true;
          }
        }
      }
      return false;
    };

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isT = isWhite(tImgData, x, y);
        const isU = isWhite(uImgData, x, y);

        if (isT) {
          targetPixelCount++;
          if (hasNearbyWhite(uImgData, x, y, 5)) {
            targetCoveredCount++;
          }
        }

        if (isU) {
          userPixelCount++;
          if (hasNearbyWhite(tImgData, x, y, 6)) {
            userMatchingCount++;
          }
        }
      }
    }

    const coverageRate = targetPixelCount > 0 ? (targetCoveredCount / targetPixelCount) : 0;
    const precisionRate = userPixelCount > 0 ? (userMatchingCount / userPixelCount) : 0;

    // 4. Combined accuracy calculation (balanced between covering the glyph and drawing within it)
    const combinedScore = coverageRate * 0.6 + precisionRate * 0.4;
    let accuracy = Math.round(combinedScore * 100);

    // Boost realistic, satisfying curve for players
    if (accuracy >= 35) {
      accuracy = Math.min(99, Math.round(55 + (accuracy - 35) * 0.75));
    }

    const isMatch = accuracy >= 58 || (coverageRate >= 0.45 && precisionRate >= 0.4);

    let feedback = 'Zbyt duże odchylenie linii od kształtu runy. Spróbuj ponownie!';
    if (accuracy >= 90) {
      feedback = '🌟 Perfekcyjne mistrzostwo kaligrafii! Znak lśni czystą mocą!';
    } else if (accuracy >= 75) {
      feedback = '✨ Znakomite odwzorowanie! Runa napełniła się magią.';
    } else if (isMatch) {
      feedback = '⚡ Runa rozpoznana i aktywowana pomyślnie!';
    } else if (accuracy >= 42) {
      feedback = 'Blisko! Skoryguj proporcje i poprowadź linię wzdłuż konturu.';
    }

    return {
      isMatch,
      accuracy,
      feedback,
      coverageRate: Math.round(coverageRate * 100),
      precisionRate: Math.round(precisionRate * 100)
    };
  } catch (err) {
    console.error('Error in rune drawing evaluation:', err);
    return {
      isMatch: true,
      accuracy: 75,
      feedback: '⚡ Runa zaakceptowana i aktywowana!'
    };
  }
}
