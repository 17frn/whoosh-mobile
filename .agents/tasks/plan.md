# Implementation Plan: Province-Focused Map System

## Overview
Build a modal-based map system where users select a province (Banten or DKI Jakarta), view an SVG map of that province, and see timeline moment markers pinned to their actual locations. This replaces the full Indonesia map approach with a province-by-province focused view.

## Key Design Decisions

**1. Modal Structure**: Create a new `ProvinceMapModal.vue` component following the pattern in `GlobalMapModal.vue` (dialog element, backdrop blur, close button, scroll/zoom/pan controls).

**2. Province Selection**: Use a dropdown/selector at the top of the modal. When a province is selected, the map section below updates to show that province's SVG and markers.

**3. SVG Map Data**: Extract path data for Banten (ID-BT) and Jakarta (ID-JK) from `IndonesiaMapSVG.vue` and create focused province SVG components. Each province needs its own viewBox calculated from the path's bounding box.

**4. Marker Positioning**: Use the existing `indonesiaLocations.ts` keywords to detect which province a moment belongs to, then convert lat/lng to SVG coordinates using Indonesia's geo bounds (lng: 95.22→141.01, lat: -10.95→7.36) mapped to the SVG viewBox (792.54596 x 316.66394).

**5. Integration Point**: Keep the existing map button in `HomeView.vue` but dispatch a new event `open-province-map` instead of `open-global-map`.

**6. Styling**: Match the blue amber theme from `style.css` and the neo-brutalism card style from `RecentHighlights.vue` (bold borders, box shadows, clear typography).

---

## Implementation Steps

- [ ] 1. **Extract SVG paths for Banten and DKI Jakarta**
      
      Read `src/components/shared/IndonesiaMapSVG.vue` and copy the exact `<path>` elements for:
      - Banten (ID-BT): title="Banten"
      - DKI Jakarta (ID-JK): title="Jakarta Raya"
      
      Calculate the viewBox for each province by analyzing the path's d attribute bounds. Banten path starts at `m 199.16571,231.92789` and Jakarta at `m 173.98571,239.51789`. Use these to determine appropriate viewBox dimensions that frame each province tightly with padding.
      
      Files: Create `src/components/maps/BantenMapSVG.vue` and `src/components/maps/JakartaMapSVG.vue`
      
      Verify: Open each file and confirm the path data is present and viewBox is set. Run `npm run build` to check for syntax errors.

- [ ] 2. **Create province data structure and coordinate converter**
      
      Create `src/data/provinceMapData.ts` with:
      - Interface for province definition (id, name, svgComponent, viewBox, geoBounds)
      - Array of province objects for Banten and Jakarta
      - Function `latLngToSVGCoords(lat, lng, provinceBounds, svgViewBox)` that converts geographic coordinates to SVG x/y
      - Use Indonesia's geo bounds (lng: [95.22, 141.01], lat: [-10.95, 7.36]) and SVG viewBox (792.54596 x 316.66394) as reference
      
      Files: `src/data/provinceMapData.ts`
      
      Verify: Run TypeScript compilation `npm run build` and check for type errors. Write a quick test in the file to confirm lat/lng→SVG conversion returns sensible coordinates within the province viewBox bounds.

- [ ] 3. **Build marker detection and filtering logic**
      
      In `src/composables/useProvinceMarkers.ts`, create a composable that:
      - Accepts timeline items and selected province ID
      - Uses `indonesiaLocations.ts` keywords to match each timeline item's location to a province
      - Filters items to only those matching the selected province
      - Converts each item's lat/lng to SVG coordinates using the converter from step 2
      - Returns an array of marker objects with { id, title, location, date, moments, svgX, svgY, dotColor }
      
      Files: `src/composables/useProvinceMarkers.ts`
      
      Verify: Import this composable in a test component and console.log the markers array. Confirm that items are correctly filtered by province and SVG coordinates fall within expected ranges.

- [ ] 4. **Create ProvinceMapModal component structure**
      
      Create `src/components/modals/ProvinceMapModal.vue` following the pattern from `GlobalMapModal.vue`:
      - `<dialog>` element with ref, backdrop, close button
      - Province selector dropdown at the top (similar to year selector in HomeView.vue)
      - Map container section below the selector
      - Use neo-brutalism styling: 2px solid borders, box-shadow offsets, theme CSS variables (--theme-bg, --theme-surface, --theme-border, --theme-accent)
      - Include zoom/pan controls (buttons: zoom in, zoom out, reset)
      - Expose `openMap()` method via defineExpose
      
      Files: `src/components/modals/ProvinceMapModal.vue`
      
      Verify: Mount the component in App.vue temporarily, open the modal via button click, verify close button works, dropdown shows Banten/Jakarta options, and styling matches the app theme.

- [ ] 5. **Integrate province SVG maps with dynamic switching**
      
      Inside `ProvinceMapModal.vue`:
      - Import BantenMapSVG and JakartaMapSVG components
      - Use `<component :is="currentProvinceMap">` to dynamically render the selected province's SVG
      - Pass markers array as prop to the SVG component
      - Render markers as SVG `<circle>` elements positioned at svgX/svgY with click handlers
      - Implement the marker popup (same split-layout design from GlobalMapModal: left pane with title/location/date, right pane with photo grid)
      
      Files: `src/components/modals/ProvinceMapModal.vue`, `src/components/maps/BantenMapSVG.vue`, `src/components/maps/JakartaMapSVG.vue`
      
      Verify: Select Banten in the dropdown, confirm Banten map renders. Select Jakarta, confirm map switches. Click a marker, verify popup shows with correct data and photos. Run `npm run dev` and test in browser.

- [ ] 6. **Implement zoom, pan, and touch gesture controls**
      
      Add interactive viewBox manipulation to ProvinceMapModal:
      - Store current viewBox state (x, y, w, h) in ref
      - Zoom buttons: scale viewBox width/height by factor (0.65 for zoom in, 1/0.65 for zoom out)
      - Mouse wheel: zoom centered on cursor position (same logic as GlobalMapModal onWheel)
      - Drag to pan: track mouse/touch movement, update viewBox x/y offset
      - Pinch to zoom (mobile): track two-finger distance, scale viewBox accordingly
      - Reset button: restore original province viewBox
      
      Files: `src/components/modals/ProvinceMapModal.vue`
      
      Verify: Open modal, test zoom buttons, mouse wheel zoom, drag to pan, pinch gestures on mobile device or emulator. Confirm viewBox updates smoothly and markers stay in correct positions. Test with `npm run dev` on both desktop and mobile.

- [ ] 7. **Connect modal to HomeView map button**
      
      In `src/views/HomeView.vue`:
      - Find the existing map button (`.btn-global-map`, triggers `openGlobalMap`)
      - Change the click handler to dispatch a new custom event `open-province-map`
      - In `App.vue`, import ProvinceMapModal and add it to the template
      - Listen for `open-province-map` event on window and call the modal's `openMap()` method
      - Pass the full timeline items array as prop to ProvinceMapModal
      
      Files: `src/views/HomeView.vue`, `src/App.vue`
      
      Verify: Click the map button in HomeView, confirm ProvinceMapModal opens (not GlobalMapModal). Verify timeline items are passed correctly and markers render. Close modal and reopen to ensure state resets properly.

- [ ] 8. **Style marker popup and finalize theme consistency**
      
      Polish the marker popup in ProvinceMapModal:
      - Match the split-layout from GlobalMapModal (calm sage green left pane, white right pane, overlapping circular icon)
      - Use theme CSS variables for all colors (--theme-surface, --theme-border, --theme-accent, --theme-text)
      - Ensure popup positioning logic prevents overflow (adjust x/y if popup would go off-canvas)
      - Add transition animations for popup open/close
      - Test with moments that have 0, 1, 2, 4+ photos to ensure layout adapts correctly
      
      Files: `src/components/modals/ProvinceMapModal.vue` (scoped styles)
      
      Verify: Open various moments from different provinces, verify popup styling is consistent with the rest of the app. Check popup doesn't overflow on small screens. Test animations are smooth. Run `npm run dev` and manually test all cases.

- [ ] 9. **Add province map state persistence and default selection**
      
      In ProvinceMapModal:
      - On mount, detect which provinces have moments (using the marker detection logic)
      - Set default selected province to the first province with moments, or Banten if none
      - Store last selected province in localStorage (`provinceMapLastSelected`)
      - On open, restore last selected province from localStorage
      
      Files: `src/components/modals/ProvinceMapModal.vue`
      
      Verify: Add a moment in Banten, open map, confirm Banten is selected. Close and reopen, confirm it remembers Banten. Add a Jakarta moment, reopen map, confirm Jakarta appears in the dropdown and can be selected.

- [ ] 10. **Final integration testing and documentation**
       
       Test the complete flow:
       - Add moments with locations in Banten and Jakarta (use keywords from indonesiaLocations.ts)
       - Click map button in HomeView
       - Select each province and verify correct map and markers appear
       - Click markers and verify popup shows correct moment data
       - Test zoom, pan, and reset on both desktop and mobile
       - Verify theme styling is consistent (blue amber theme variables)
       - Check that closing the modal and reopening works without errors
       
       Run full build: `npm run build` and check for warnings or errors.
       
       Files: All files from previous steps
       
       Verify: Full build completes without errors. Manual testing checklist passes on desktop browser and mobile device/emulator. Map functionality works smoothly with no console errors.

---

## File Summary

**New Files:**
- `src/components/modals/ProvinceMapModal.vue` — main modal with province selector and map display
- `src/components/maps/BantenMapSVG.vue` — Banten province SVG map component
- `src/components/maps/JakartaMapSVG.vue` — Jakarta province SVG map component
- `src/data/provinceMapData.ts` — province definitions and coordinate conversion utilities
- `src/composables/useProvinceMarkers.ts` — marker filtering and positioning logic

**Modified Files:**
- `src/views/HomeView.vue` — update map button event from `open-global-map` to `open-province-map`
- `src/App.vue` — import and mount ProvinceMapModal, listen for `open-province-map` event

**Reference Files (read but not modified):**
- `src/components/modals/GlobalMapModal.vue` — pattern for modal structure, zoom/pan logic, marker popup
- `src/components/shared/IndonesiaMapSVG.vue` — source for Banten and Jakarta SVG path data
- `src/data/indonesiaLocations.ts` — province keyword matching
- `src/style.css` — theme CSS variables
- `src/components/shared/RecentHighlights.vue` — neo-brutalism styling reference
- `src/data/timeline.ts` — TimelineData interface

---

## Technical Notes

**SVG Coordinate Conversion Formula:**
```typescript
// Geographic bounds → SVG coordinate mapping
function latLngToSVGCoords(lat: number, lng: number, geoBounds, svgViewBox) {
  const { minLng, maxLng, minLat, maxLat } = geoBounds;
  const { x, y, width, height } = svgViewBox;
  
  // Normalize geographic coordinates to 0-1 range
  const normalizedX = (lng - minLng) / (maxLng - minLng);
  const normalizedY = (maxLat - lat) / (maxLat - minLat); // Inverted Y axis
  
  // Map to SVG coordinates
  const svgX = x + normalizedX * width;
  const svgY = y + normalizedY * height;
  
  return { svgX, svgY };
}
```

**Province Detection:**
Use `indonesiaLocations.ts` keywords array. For each timeline item's location string, check if any keyword from Banten or Jakarta matches (case-insensitive substring match).

**ViewBox Calculation for Province Maps:**
- Banten path starts around `199.16571,231.92789` and has width ~15-20 units, height ~15-20 units
- Jakarta path starts around `173.98571,239.51789` and has width ~10-15 units, height ~10-15 units
- Calculate tight viewBox with 20% padding: `viewBox="xMin yMin width height"`

**Event Bus Pattern:**
Follow existing pattern from GlobalMapModal:
- `window.addEventListener('open-province-map', openMap)`
- `window.dispatchEvent(new Event('open-province-map'))`

**Build and Test Commands:**
- Development: `npm run dev` (starts Vite dev server on port 3000)
- Build: `npm run build` (Vue TSC type check + Vite build)
- No test framework configured — verification is manual testing in browser

---

## Acceptance Criteria

✅ User can click the map button in HomeView and see the ProvinceMapModal open
✅ Dropdown shows "Banten" and "DKI Jakarta" as options
✅ Selecting a province displays the correct SVG map
✅ Timeline moments are correctly filtered by province and shown as markers
✅ Clicking a marker opens a popup with moment title, location, date, and photos
✅ Zoom in/out buttons work correctly
✅ Mouse wheel zooms the map centered on cursor
✅ Drag to pan works on desktop
✅ Pinch to zoom and touch pan work on mobile
✅ Reset button restores original province viewBox
✅ Styling matches blue amber theme and neo-brutalism design pattern
✅ Modal remembers last selected province across sessions
✅ Build completes without errors: `npm run build`
