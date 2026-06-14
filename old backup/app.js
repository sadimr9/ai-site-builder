/* WattVision — datos de demostración y renderizado del dashboard */
(() => {
  const BS_PER_KWH = 0.87; // tarifa residencial aproximada (Bs./kWh)

  /* ---------- Datos de demostración ---------- */

  // Consumo por hora (kWh) durante las últimas 24 horas
  const hourly = [
    0.18, 0.15, 0.14, 0.13, 0.14, 0.22, 0.45, 0.62,
    0.58, 0.41, 0.38, 0.40, 0.52, 0.47, 0.39, 0.36,
    0.44, 0.68, 0.91, 0.83, 0.61, 0.39, 0.27, 0.21
  ];

  const devices = [
    { name: 'Refrigerador',        power: 145, kwh: 3.48, status: 'on'   },
    { name: 'Aire Acondicionado',  power: 980, kwh: 4.10, status: 'peak' },
    { name: 'Bomba de Agua',       power: 620, kwh: 1.24, status: 'on'   },
    { name: 'Iluminación General', power: 60,  kwh: 0.48, status: 'on'   },
    { name: 'Televisor',           power: 110, kwh: 0.66, status: 'on'   },
    { name: 'Cargador / Tomas',    power: 35,  kwh: 0.84, status: 'off'  },
  ];

  const alerts = [
    {
      type: 'alert',
      title: 'Pico de consumo detectado',
      desc: 'Aire Acondicionado superó 900 W a las 18:00.',
      time: 'Hoy, 18:00'
    },
    {
      type: 'alert',
      title: 'Consumo "vampiro" nocturno',
      desc: 'Cargadores y tomas consumieron 0.84 kWh entre 00:00–05:00.',
      time: 'Hoy, 05:00'
    },
    {
      type: 'normal',
      title: 'Consumo dentro de lo normal',
      desc: 'Refrigerador operando en rango esperado.',
      time: 'Hoy, 12:00'
    }
  ];

  /* ---------- KPIs ---------- */

  function formatNumber(value, decimals = 0) {
    return value.toLocaleString('es-BO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function renderKpis() {
    const currentPower = devices
      .filter(d => d.status !== 'off')
      .reduce((sum, d) => sum + d.power, 0);

    const todayKwh = hourly.reduce((sum, v) => sum + v, 0);
    const todayBs = todayKwh * BS_PER_KWH;
    const monthCost = todayBs * 30;

    document.getElementById('kpi-power').textContent = formatNumber(currentPower);
    document.getElementById('kpi-kwh').textContent = formatNumber(todayKwh, 2);
    document.getElementById('kpi-kwh-bs').textContent = `≈ Bs. ${formatNumber(todayBs, 2)}`;
    document.getElementById('kpi-cost').textContent = `Bs. ${formatNumber(monthCost, 0)}`;

    return currentPower;
  }

  /* ---------- Gráfico de área (SVG) ---------- */

  function renderChart() {
    const width = 800;
    const height = 280;
    const padding = { top: 20, right: 16, bottom: 28, left: 36 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const max = Math.max(...hourly) * 1.15;
    const stepX = chartW / (hourly.length - 1);

    const points = hourly.map((v, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (v / max) * chartH;
      return [x, y];
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
      .join(' ');

    const areaPath =
      `${linePath} L${points[points.length - 1][0].toFixed(2)},${(padding.top + chartH).toFixed(2)} ` +
      `L${points[0][0].toFixed(2)},${(padding.top + chartH).toFixed(2)} Z`;

    // Líneas de grid horizontales (4 divisiones)
    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      gridLines.push(
        `<line class="grid-line" x1="${padding.left}" y1="${y.toFixed(2)}" x2="${width - padding.right}" y2="${y.toFixed(2)}"/>`
      );
      const value = (max * (1 - i / 4)).toFixed(2);
      gridLines.push(
        `<text class="axis-label" x="${(padding.left - 8).toFixed(2)}" y="${(y + 4).toFixed(2)}" text-anchor="end">${value}</text>`
      );
    }

    // Etiquetas del eje X cada 4 horas
    const xLabels = [];
    for (let i = 0; i < hourly.length; i += 4) {
      const x = padding.left + i * stepX;
      const hour = `${String(i).padStart(2, '0')}:00`;
      xLabels.push(
        `<text class="axis-label" x="${x.toFixed(2)}" y="${height - 6}" text-anchor="middle">${hour}</text>`
      );
    }

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Consumo de energía en las últimas 24 horas">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--area-fill)" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="var(--area-fill)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${gridLines.join('')}
        <path class="area-path" d="${areaPath}"/>
        <path class="line-path" d="${linePath}"/>
        ${xLabels.join('')}
      </svg>
    `;

    document.getElementById('chart').innerHTML = svg;
  }

  /* ---------- Panel de alertas ---------- */

  const alertIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>`;
  const checkIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

  function renderAlerts() {
    const html = alerts.map(a => `
      <div class="alert-item ${a.type === 'normal' ? 'normal' : ''}">
        ${a.type === 'normal' ? checkIcon : alertIcon}
        <div class="alert-body">
          <div class="alert-title">${a.title}</div>
          <div class="alert-desc">${a.desc}</div>
          <div class="alert-time">${a.time}</div>
        </div>
      </div>
    `).join('');

    document.getElementById('alerts-list').innerHTML = html;
  }

  /* ---------- Tabla de dispositivos ---------- */

  const plugIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2v4M15 2v4M7 6h10v3a5 5 0 0 1-10 0z"/><path d="M12 14v4M9 21h6"/></svg>`;

  const statusLabel = { on: 'Encendido', off: 'Apagado', peak: 'Pico' };

  function renderDevices() {
    const rows = devices.map(d => `
      <tr>
        <td><div class="device-name">${plugIcon}${d.name}</div></td>
        <td class="mono">${formatNumber(d.power)}</td>
        <td class="mono">${formatNumber(d.kwh, 2)}</td>
        <td class="mono">${formatNumber(d.kwh * BS_PER_KWH, 2)}</td>
        <td><span class="badge ${d.status}">${statusLabel[d.status]}</span></td>
      </tr>
    `).join('');

    document.getElementById('devices-table').innerHTML = rows;
  }

  /* ---------- Simulación "en vivo" ---------- */

  function startLiveUpdates(basePower) {
    const el = document.getElementById('kpi-power');
    setInterval(() => {
      const jitter = Math.round((Math.random() - 0.5) * 30);
      el.textContent = formatNumber(Math.max(0, basePower + jitter));
    }, 4000);
  }

  /* ---------- Inicialización ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    const basePower = renderKpis();
    renderChart();
    renderAlerts();
    renderDevices();
    startLiveUpdates(basePower);
  });
})();
