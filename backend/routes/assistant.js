/**
 * AI Assistant Routes — Chat and Suggested Queries
 */
const express = require('express');
const router = express.Router();
const { INDIAN_CITIES, getCityByName } = require('../data/citiesData');

const KNOWLEDGE_BASE = {
  uhi: 'Urban Heat Island (UHI) refers to the phenomenon where urban areas experience significantly higher temperatures than surrounding rural areas due to human activities, infrastructure, and reduced vegetation. Key factors: dark surfaces absorb heat, lack of trees means less evapotranspiration, concrete/asphalt retain heat, vehicle emissions, industrial activity, and air conditioning exhaust.',
  ndvi: 'NDVI (Normalized Difference Vegetation Index) ranges from -1 to 1. Values above 0.3 indicate healthy vegetation. Below 0.2 is concerning for urban areas. It\'s calculated from satellite red and near-infrared bands.',
  ndbi: 'NDBI (Normalized Difference Built-up Index) measures the extent of built-up/impervious surfaces. Higher values (>0.6) indicate dense urbanization. Used alongside NDVI to assess urban sprawl.',
  lst: 'LST (Land Surface Temperature) is measured by satellite thermal sensors. Critical threshold: 42°C. Cities above this face severe heat stress. Factors: albedo, green cover, building density, water bodies.',
  shap: 'SHAP (SHapley Additive exPlanations) is used in our XGBoost model to explain predictions. It shows which features (NDBI, NDVI, population density, etc.) contribute most to a city\'s UHI intensity prediction.',
  cooling: 'Cooling strategies include: Green roofs (0.3-1°C reduction), Cool roofs with reflective coatings (0.5-1.5°C), Urban forests (2-4°C local cooling), Water bodies (0.5-2°C), Permeable pavements (0.5-1°C), and Tree plantation (1-3°C depending on species and density).',
};

function generateResponse(message, cityName) {
  const msg = message.toLowerCase();
  const city = cityName ? getCityByName(cityName) : null;

  // City-specific queries
  if (city) {
    if (msg.includes('risk') || msg.includes('score')) {
      return { response: `**${city.name}** has a risk score of **${city.risk_score}/100** (${city.vulnerability}). UHI intensity is ${city.uhi_intensity}°C with LST at ${city.lst}°C. Green cover is ${city.green_cover_pct}% and built-up area is ${city.built_up_pct}%.`, sources: ['City Database', 'Risk Model v2.0'] };
    }
    if (msg.includes('temperature') || msg.includes('weather') || msg.includes('hot')) {
      return { response: `**${city.name}** climate profile:\n- Average: ${city.avg_temp}°C\n- Max recorded: ${city.max_temp}°C\n- Min: ${city.min_temp}°C\n- Humidity: ${city.humidity}%\n- Rainfall: ${city.rainfall_mm}mm/year\n- AQI: ${city.aqi}\n- LST: ${city.lst}°C`, sources: ['Climate Database'] };
    }
    if (msg.includes('tree') || msg.includes('plant')) {
      const trees = Math.round(city.population * 0.8 + city.area_km2 * 500);
      return { response: `**${city.name}** needs approximately **${trees.toLocaleString()} trees** for effective cooling. This could reduce temperatures by ${Math.round(city.uhi_intensity * 0.4 * 10) / 10}°C. Recommended species: Neem, Peepal, Banyan (best for ${city.humidity > 70 ? 'humid' : 'dry'} climate).`, sources: ['Tree Estimation Model'] };
    }
    return { response: `**${city.name}** (${city.state}) — Population: ${(city.population/1000000).toFixed(1)}M | Risk: ${city.risk_score}/100 (${city.vulnerability}) | UHI: ${city.uhi_intensity}°C | Green: ${city.green_cover_pct}% | AQI: ${city.aqi}. What specific aspect would you like to explore?`, sources: ['City Database'] };
  }

  // Topic-based responses
  if (msg.includes('uhi') || msg.includes('urban heat island') || msg.includes('heat island')) {
    return { response: KNOWLEDGE_BASE.uhi, sources: ['Climate Research Database'] };
  }
  if (msg.includes('ndvi') || msg.includes('vegetation')) {
    return { response: KNOWLEDGE_BASE.ndvi, sources: ['Remote Sensing Module'] };
  }
  if (msg.includes('cooling') || msg.includes('mitigation') || msg.includes('solution')) {
    return { response: KNOWLEDGE_BASE.cooling, sources: ['Cooling Strategy Engine'] };
  }
  if (msg.includes('worst') || msg.includes('critical') || msg.includes('dangerous')) {
    const top5 = [...INDIAN_CITIES].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);
    return { response: `Top 5 most critical cities:\n${top5.map((c, i) => `${i+1}. **${c.name}** (${c.state}) — Risk: ${c.risk_score}, UHI: ${c.uhi_intensity}°C, LST: ${c.lst}°C`).join('\n')}`, sources: ['Risk Ranking Model'] };
  }
  if (msg.includes('best') || msg.includes('green') || msg.includes('safe')) {
    const best5 = [...INDIAN_CITIES].sort((a, b) => a.risk_score - b.risk_score).slice(0, 5);
    return { response: `Top 5 safest cities:\n${best5.map((c, i) => `${i+1}. **${c.name}** (${c.state}) — Risk: ${c.risk_score}, Green: ${c.green_cover_pct}%, UHI: ${c.uhi_intensity}°C`).join('\n')}`, sources: ['City Database'] };
  }
  if (msg.includes('help') || msg.includes('what can')) {
    return { response: "I can help with:\n- **City analysis**: Ask about any Indian city's heat risk\n- **UHI explained**: Understanding urban heat islands\n- **Cooling strategies**: Solutions for heat mitigation\n- **Rankings**: Most/least at-risk cities\n- **Tree planning**: How many trees a city needs\n- **Climate data**: Temperature, AQI, humidity trends\n\nTry: \"What is the risk score of Delhi?\" or \"Which cities are most critical?\"", sources: ['System'] };
  }

  return { response: `I can help analyze urban heat data for 100+ Indian cities. Try asking about a specific city, UHI concepts, cooling strategies, or city rankings. For example:\n- "What is Delhi's heat risk?"\n- "Explain urban heat islands"\n- "Which are the most critical cities?"`, sources: ['System'] };
}

router.post('/chat', (req, res) => {
  const { message, city } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  const result = generateResponse(message, city);
  res.json({ query: message, city_context: city || null, ...result, model: 'UrbanHeat AI Assistant v2.0', timestamp: new Date().toISOString() });
});

router.get('/suggested-queries', (req, res) => {
  res.json({
    queries: [
      { text: 'What is the UHI risk for Delhi?', category: 'City Analysis' },
      { text: 'Which cities are most critical?', category: 'Rankings' },
      { text: 'Explain urban heat islands', category: 'Education' },
      { text: 'How many trees does Mumbai need?', category: 'Tree Planning' },
      { text: 'What cooling strategies work best?', category: 'Solutions' },
      { text: 'Compare Chennai vs Bengaluru heat risk', category: 'Comparison' },
      { text: 'Which cities have the worst AQI?', category: 'Air Quality' },
      { text: 'What is NDVI and why does it matter?', category: 'Education' },
    ],
  });
});

module.exports = router;
