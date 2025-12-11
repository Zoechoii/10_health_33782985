const USDA_API_KEY = 'ySZ7E7EEPDvKGBnWPudYRnTAxlfBEclUL1pwiTE9';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// search for foods
async function searchFoods(query, pageSize = 10) {
    try {
        const url = `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('USDA search error:', error);
        throw error;
    }
}

// get food details by FDC ID
async function getFoodDetails(fdcId) {
    try {
        const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('USDA food details error:', error);
        throw error;
    }
}

// format nutrition information
function formatNutritionInfo(foodData) {
    const nutrition = {
        description: foodData.description || 'N/A',
        brandOwner: foodData.brandOwner || null,
        ingredients: foodData.ingredients || null,
        nutrients: {}
    };

    // extract nutrients
    if (foodData.foodNutrients && Array.isArray(foodData.foodNutrients)) {
        foodData.foodNutrients.forEach(nutrient => {
            if (nutrient.nutrient && nutrient.amount !== null && nutrient.amount !== undefined) {
                const nutrientName = nutrient.nutrient.name;
                nutrition.nutrients[nutrientName] = {
                    amount: nutrient.amount,
                    unit: nutrient.nutrient.unitName || '',
                    nutrientId: nutrient.nutrient.id
                };
            }
        });
    }

    return nutrition;
}

// get common nutrients summary
function getCommonNutrients(nutrition) {
    const commonNutrients = {
        calories: null,
        protein: null,
        carbohydrates: null,
        fat: null,
        fiber: null,
        sugar: null,
        sodium: null,
        calcium: null,
        iron: null,
        vitaminC: null
    };

    // map nutrients
    const nutrientMap = {
        'Energy': 'calories',
        'Protein': 'protein',
        'Carbohydrate, by difference': 'carbohydrates',
        'Total lipid (fat)': 'fat',
        'Fiber, total dietary': 'fiber',
        'Sugars, total including NLEA': 'sugar',
        'Sodium, Na': 'sodium',
        'Calcium, Ca': 'calcium',
        'Iron, Fe': 'iron',
        'Vitamin C, total ascorbic acid': 'vitaminC'
    };

    Object.keys(nutrition.nutrients).forEach(nutrientName => {
        const key = nutrientMap[nutrientName];
        if (key && nutrition.nutrients[nutrientName]) {
            commonNutrients[key] = {
                amount: nutrition.nutrients[nutrientName].amount,
                unit: nutrition.nutrients[nutrientName].unit
            };
        }
    });

    return commonNutrients;
}

module.exports = {
    searchFoods,
    getFoodDetails,
    formatNutritionInfo,
    getCommonNutrients
};


