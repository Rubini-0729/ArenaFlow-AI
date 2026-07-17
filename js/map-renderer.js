'use strict';

/* ArenaFlow Interactive Stadium Map Renderer */

class StadiumMapRenderer {
  /**
   * @param {string} svgContainerId - DOM ID of the target SVG container.
   */
  constructor(svgContainerId) {
    this.containerId = svgContainerId;
    this.svg = null;
    this.width = 500;
    this.height = 500;
    
    // Elements cache to prevent DOM query bottlenecks during animation and loops
    this.cachedElements = {
      route: null,
      sectors: {},
      concessions: {},
      restrooms: {}
    };
  }

  /**
   * Initializes the SVG map. Draws the field, concourses, gates, concessions, and restrooms,
   * then caches references to interactive components.
   */
  init() {
    this.svg = document.getElementById(this.containerId);
    if (!this.svg) return;
    
    // Clear existing contents
    this.svg.innerHTML = '';
    
    // Reset cache references
    this.cachedElements = {
      route: null,
      sectors: {},
      concessions: {},
      restrooms: {}
    };
    
    // Set viewBox attribute for responsive scaling
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    
    // Create base SVG group
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // 1. Draw External Concourse Border (Stadium Outline)
    const stadiumOuter = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    stadiumOuter.setAttribute('cx', '250');
    stadiumOuter.setAttribute('cy', '250');
    stadiumOuter.setAttribute('rx', '210');
    stadiumOuter.setAttribute('ry', '180');
    stadiumOuter.setAttribute('fill', 'rgba(23, 32, 51, 0.4)');
    stadiumOuter.setAttribute('stroke', 'rgba(255, 255, 255, 0.15)');
    stadiumOuter.setAttribute('stroke-width', '2');
    mainGroup.appendChild(stadiumOuter);

    // 2. Draw Intermediate Concourse Ring (Seating Bowl Backing)
    const seatingBowl = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    seatingBowl.setAttribute('cx', '250');
    seatingBowl.setAttribute('cy', '250');
    seatingBowl.setAttribute('rx', '170');
    seatingBowl.setAttribute('ry', '140');
    seatingBowl.setAttribute('fill', 'rgba(11, 15, 25, 0.6)');
    seatingBowl.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
    seatingBowl.setAttribute('stroke-width', '2');
    mainGroup.appendChild(seatingBowl);

    // 3. Draw Seating Sectors (Interactive wedges)
    const sectors = [
      { id: 'sec-north', label: 'North Stand', d: 'M 130,150 A 170,140 0 0,1 370,150 L 330,190 A 110,90 0 0,0 170,190 Z', color: 'rgba(0, 242, 254, 0.15)' },
      { id: 'sec-east', label: 'East Stand', d: 'M 370,150 A 170,140 0 0,1 370,350 L 330,310 A 110,90 0 0,0 330,190 Z', color: 'rgba(0, 242, 254, 0.2)' },
      { id: 'sec-south', label: 'South Stand', d: 'M 370,350 A 170,140 0 0,1 130,350 L 170,310 A 110,90 0 0,0 330,310 Z', color: 'rgba(0, 242, 254, 0.15)' },
      { id: 'sec-west', label: 'West Stand', d: 'M 130,350 A 170,140 0 0,1 130,150 L 170,190 A 110,90 0 0,0 170,310 Z', color: 'rgba(0, 242, 254, 0.2)' }
    ];

    sectors.forEach(s => {
      const sectorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      sectorPath.setAttribute('id', s.id);
      sectorPath.setAttribute('d', s.d);
      sectorPath.setAttribute('fill', s.color);
      sectorPath.setAttribute('stroke', 'rgba(255, 255, 255, 0.12)');
      sectorPath.setAttribute('stroke-width', '1');
      sectorPath.setAttribute('class', 'map-sector');
      
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = s.label;
      sectorPath.appendChild(title);
      
      mainGroup.appendChild(sectorPath);
      
      // Cache sector element reference
      this.cachedElements.sectors[s.id] = sectorPath;
    });

    // 4. Draw Central Playing Field (Soccer Pitch)
    const pitch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    pitch.setAttribute('x', '180');
    pitch.setAttribute('y', '200');
    pitch.setAttribute('width', '140');
    pitch.setAttribute('height', '100');
    pitch.setAttribute('rx', '4');
    pitch.setAttribute('fill', 'rgba(5, 150, 105, 0.15)');
    pitch.setAttribute('stroke', 'rgba(5, 150, 105, 0.4)');
    pitch.setAttribute('stroke-width', '2');
    mainGroup.appendChild(pitch);
    
    // Pitch Center Circle
    const pitchCenter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pitchCenter.setAttribute('cx', '250');
    pitchCenter.setAttribute('cy', '250');
    pitchCenter.setAttribute('r', '20');
    pitchCenter.setAttribute('fill', 'none');
    pitchCenter.setAttribute('stroke', 'rgba(5, 150, 105, 0.3)');
    pitchCenter.setAttribute('stroke-width', '2');
    mainGroup.appendChild(pitchCenter);

    // 5. Draw Dynamic Nav Route Holder
    const routePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    routePath.setAttribute('id', 'map-route');
    routePath.setAttribute('fill', 'none');
    routePath.setAttribute('stroke-linecap', 'round');
    routePath.setAttribute('class', 'map-route-path');
    mainGroup.appendChild(routePath);
    
    // Cache route reference
    this.cachedElements.route = routePath;

    // 6. Draw Gates as Outer Radar Circles
    Object.keys(GATES_DATA).forEach(gateName => {
      const gate = GATES_DATA[gateName];
      const gateGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gateGroup.setAttribute('id', `map-${gateName.replace(' ', '-').toLowerCase()}`);
      gateGroup.setAttribute('class', 'map-gate');
      
      // Outer radar ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', String(gate.coordinate.x));
      ring.setAttribute('cy', String(gate.coordinate.y));
      ring.setAttribute('r', '14');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke-width', '2');
      
      if (gate.crowdLevel > 80) {
        ring.setAttribute('stroke', 'var(--color-danger)');
        ring.setAttribute('style', 'animation: pulseRadar 1.5s infinite;');
      } else {
        ring.setAttribute('stroke', 'var(--color-brand-primary)');
        ring.setAttribute('opacity', '0.7');
      }
      
      // Inner Dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(gate.coordinate.x));
      dot.setAttribute('cy', String(gate.coordinate.y));
      dot.setAttribute('r', '7');
      dot.setAttribute('fill', gate.crowdLevel > 80 ? 'var(--color-danger)' : 'var(--color-brand-primary)');
      
      // Hover Tooltip
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      tooltip.textContent = `${gate.name}\nStatus: ${gate.status} (${gate.crowdLevel}% crowd)\nScanning Rate: ${gate.scanRate} scans/min\nAccess: ${gate.access}`;
      gateGroup.appendChild(tooltip);

      gateGroup.appendChild(ring);
      gateGroup.appendChild(dot);
      mainGroup.appendChild(gateGroup);
      
      // Label text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(gate.coordinate.x));
      text.setAttribute('y', String(gate.coordinate.y + (gate.coordinate.y > 250 ? 25 : -18)));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'var(--color-text-secondary)');
      text.setAttribute('font-size', '10px');
      text.setAttribute('font-weight', 'bold');
      text.textContent = gateName;
      mainGroup.appendChild(text);
    });

    // 7. Draw Concessions (Yellow squares)
    CONCESSIONS_DATA.forEach(c => {
      const cGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      cGroup.setAttribute('id', `map-${c.id}`);
      cGroup.setAttribute('class', 'map-concession');

      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      marker.setAttribute('x', String(c.coordinates.x - 5));
      marker.setAttribute('y', String(c.coordinates.y - 5));
      marker.setAttribute('width', '10');
      marker.setAttribute('height', '10');
      marker.setAttribute('rx', '2');
      marker.setAttribute('fill', 'var(--color-warning)');
      
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      tooltip.textContent = `${c.name} (Section ${c.section})\nType: ${c.type}\nWait Time: ${c.waitTime} mins\nVegan options: ${c.vegan ? 'Yes' : 'No'}`;
      
      cGroup.appendChild(marker);
      cGroup.appendChild(tooltip);
      mainGroup.appendChild(cGroup);
      
      // Cache concession element reference
      this.cachedElements.concessions[c.id] = cGroup;
    });

    // 8. Draw Restrooms (Blue triangles)
    RESTROOMS_DATA.forEach(r => {
      const rGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      rGroup.setAttribute('id', `map-${r.id}`);
      rGroup.setAttribute('class', 'map-restroom');
      
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const cx = r.coordinates.x;
      const cy = r.coordinates.y;
      marker.setAttribute('points', `${cx},${cy - 6} ${cx - 6},${cy + 6} ${cx + 6},${cy + 6}`);
      marker.setAttribute('fill', 'var(--color-info)');
      
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      tooltip.textContent = `Restroom Section ${r.section}\nType: ${r.type}\nWait Time: ${r.waitTime} mins\nAccessible: ${r.accessible ? 'Yes' : 'No'}`;
      
      rGroup.appendChild(marker);
      rGroup.appendChild(tooltip);
      mainGroup.appendChild(rGroup);
      
      // Cache restroom element reference
      this.cachedElements.restrooms[r.id] = rGroup;
    });

    this.svg.appendChild(mainGroup);
  }

  /**
   * Highlights specific elements on the map, dimming other elements. Uses element caching.
   * @param {object} highlightPkg - Highlight command details
   */
  applyHighlight(highlightPkg) {
    if (!this.svg) return;
    
    // Clear routes by default
    if (this.cachedElements.route) {
      this.cachedElements.route.setAttribute('d', '');
    }

    // Reset sectors opacity
    Object.values(this.cachedElements.sectors).forEach(s => {
      s.setAttribute('fill-opacity', '1.0');
      s.removeAttribute('style');
    });
    
    // Reset concessions opacity and scale
    Object.keys(this.cachedElements.concessions).forEach(cid => {
      const el = this.cachedElements.concessions[cid];
      if (el) {
        el.setAttribute('opacity', '1.0');
        el.removeAttribute('style');
      }
    });

    // Reset restrooms opacity and scale
    Object.keys(this.cachedElements.restrooms).forEach(rid => {
      const el = this.cachedElements.restrooms[rid];
      if (el) {
        el.setAttribute('opacity', '1.0');
        el.removeAttribute('style');
      }
    });

    if (!highlightPkg || Object.keys(highlightPkg).length === 0) return;

    if (highlightPkg.type === 'route') {
      const fromGate = GATES_DATA[highlightPkg.from];
      const targetSecMatch = highlightPkg.to.match(/\d+/);
      const targetSecNum = targetSecMatch ? parseInt(targetSecMatch[0], 10) : 118;
      
      let destCoord = { x: 250, y: 250 };
      if (targetSecNum <= 110) {
        destCoord = { x: 250, y: 160 }; // North Stand
      } else if (targetSecNum <= 125) {
        destCoord = { x: 330, y: 250 }; // East Stand
      } else if (targetSecNum <= 138) {
        destCoord = { x: 250, y: 340 }; // South Stand
      } else {
        destCoord = { x: 170, y: 250 }; // West Stand
      }

      if (fromGate) {
        this.drawRoutePath(fromGate.coordinate, destCoord, highlightPkg.accessible);
      }
    } else if (highlightPkg.type === 'concessions') {
      Object.values(this.cachedElements.sectors).forEach(s => {
        s.setAttribute('fill-opacity', '0.2');
      });
      
      CONCESSIONS_DATA.forEach(c => {
        const el = this.cachedElements.concessions[c.id];
        if (el) {
          if (highlightPkg.filter === 'vegan' && !c.vegan) {
            el.setAttribute('opacity', '0.2');
          } else {
            el.setAttribute('opacity', '1.0');
            el.setAttribute('style', `transform: scale(1.5); transform-origin: ${c.coordinates.x}px ${c.coordinates.y}px; filter: drop-shadow(0 0 4px var(--color-warning));`);
          }
        }
      });
    } else if (highlightPkg.type === 'restrooms') {
      RESTROOMS_DATA.forEach(r => {
        const el = this.cachedElements.restrooms[r.id];
        if (el) {
          if (r.id === highlightPkg.id) {
            el.setAttribute('opacity', '1.0');
            el.setAttribute('style', `transform: scale(1.6); transform-origin: ${r.coordinates.x}px ${r.coordinates.y}px; filter: drop-shadow(0 0 6px var(--color-info));`);
          } else {
            el.setAttribute('opacity', '0.2');
          }
        }
      });
    } else if (highlightPkg.type === 'concession-route') {
      const stand = CONCESSIONS_DATA.find(c => c.id === highlightPkg.standId);
      if (stand) {
        const secNum = highlightPkg.fromSection;
        let startCoord = { x: 250, y: 160 };
        if (secNum > 130) startCoord = { x: 250, y: 340 };
        else if (secNum > 115) startCoord = { x: 330, y: 250 };
        else if (secNum > 110) startCoord = { x: 170, y: 250 };
        
        this.drawRoutePath(startCoord, stand.coordinates, false);
        
        const el = this.cachedElements.concessions[stand.id];
        if (el) {
          el.setAttribute('opacity', '1.0');
          el.setAttribute('style', `transform: scale(2.0); transform-origin: ${stand.coordinates.x}px ${stand.coordinates.y}px; filter: drop-shadow(0 0 8px var(--color-warning));`);
        }
      }
    } else if (highlightPkg.type === 'evacuation') {
      Object.values(this.cachedElements.sectors).forEach(s => {
        s.setAttribute('fill', 'rgba(255, 82, 82, 0.3)');
        s.setAttribute('style', 'animation: pulseDanger 1.5s infinite;');
      });
      if (this.cachedElements.route) {
        this.cachedElements.route.setAttribute('d', 'M 100,250 L 170,250 M 400,250 L 330,250 M 250,100 L 250,180 M 250,400 L 250,320');
        this.cachedElements.route.setAttribute('stroke', 'var(--color-danger)');
        this.cachedElements.route.setAttribute('stroke-width', '5');
      }
    }
  }

  /**
   * Draws a bezier/curved route path between start and end coordinate points.
   */
  drawRoutePath(start, end, accessible = false) {
    if (!this.cachedElements.route) return;

    let pathString = "";
    if (accessible) {
      const controlX = start.x > 250 ? start.x + 20 : start.x - 20;
      const controlY = end.y > 250 ? end.y + 20 : end.y - 20;
      pathString = `M ${start.x},${start.y} Q ${controlX},${start.y} ${controlX},${controlY} T ${end.x},${end.y}`;
    } else {
      const cpX = (start.x + end.x) / 2 + (start.x < end.x ? -30 : 30);
      const cpY = (start.y + end.y) / 2 + (start.y < end.y ? 30 : -30);
      pathString = `M ${start.x},${start.y} Q ${cpX},${cpY} ${end.x},${end.y}`;
    }

    this.cachedElements.route.setAttribute('d', pathString);
    this.cachedElements.route.setAttribute('stroke', accessible ? 'var(--color-success)' : 'var(--color-brand-primary)');
    this.cachedElements.route.setAttribute('stroke-width', '4');
    this.cachedElements.route.setAttribute('filter', accessible ? 'drop-shadow(0 0 4px var(--color-success))' : 'drop-shadow(0 0 4px var(--color-brand-primary))');
  }

  /**
   * Updates crowd levels in sectors based on simulated traffic adjustments.
   * @param {string} sectorId - e.g. 'sec-east'
   * @param {number} densityPercent - 0 to 100
   */
  updateSectorCrowd(sectorId, densityPercent) {
    const sector = this.cachedElements.sectors[sectorId] || document.getElementById(sectorId);
    if (!sector) return;

    let heatColor = 'rgba(0, 242, 254, 0.15)'; // Low density
    if (densityPercent > 80) {
      heatColor = 'rgba(255, 82, 82, 0.4)'; // Red, high
    } else if (densityPercent > 50) {
      heatColor = 'rgba(245, 166, 35, 0.3)'; // Amber, medium
    }

    sector.setAttribute('fill', heatColor);
  }
}

// Export definitions for browser loading or module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StadiumMapRenderer;
}
