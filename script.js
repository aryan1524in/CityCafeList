// Add your API key and proxy settings at the top
const apiKey = "AIzaSyD60PrB8yrsySLPV8REEAFJ4DolkBXMFk8"; // Replace with your Google Places API key
const useProxy = true;
const proxy = "https://cors-anywhere.herokuapp.com/";

// Event listener to start the process when the page loads
document.addEventListener('DOMContentLoaded', () => {
    getLocation();
    document.getElementById('show-saved-btn').addEventListener('click', showSaved);
});

// Geolocation function
function getLocation() {
    const cache = JSON.parse(localStorage.getItem('cachedLocation') || '{}');
    const now = Date.now();

    if (cache.timestamp && now - cache.timestamp < 10 * 60 * 1000) {
        useLocation(cache.lat, cache.lng);
    } else {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            localStorage.setItem('cachedLocation', JSON.stringify({ lat, lng, timestamp: now }));
            useLocation(lat, lng);
        }, () => alert("Location access denied or unavailable."));
    }
}

// Function to call the Google Places API
async function useLocation(lat, lng) {
    const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=cafe&key=${apiKey}`;
    const url = useProxy ? proxy + endpoint : endpoint;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results) {
            displayCards(data.results);
        } else {
            alert("No cafes found.");
        }
    } catch (e) {
        console.error("Error fetching Places API:", e);
        alert("Error fetching cafes.");
    }
}

// Function to display cafe cards with Hammer.js
function displayCards(cafes) {
    const container = document.querySelector('.cards');
        container.classList.remove('scrollable'); 
    container.innerHTML = ''; // Clear previous cards

    if (cafes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No cafes found nearby.</p>';
        return;
    }

    cafes.forEach((cafe, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'swipe-wrapper';
        wrapper.style.zIndex = 200 - i;

        const card = document.createElement('div');
        card.className = 'location-card';

        const imgUrl = cafe.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${cafe.photos[0].photo_reference}&key=${apiKey}`
            : 'https://via.placeholder.com/400x250?text=No+Image+Available';

        const cafeData = {
            name: cafe.name,
            place_id: cafe.place_id,
            photo: imgUrl,
            rating: cafe.rating || 'N/A'
        };

        card.innerHTML = `
            <img src="${imgUrl}" alt="${cafe.name}" />
            <h3>${cafe.name}</h3>
            <p>⭐️ Rating: ${cafe.rating || 'N/A'}</p>
            <p><small>Swipe right to save 💖</small></p>
        `;

        wrapper.appendChild(card);
        container.appendChild(wrapper);

        // Hammer.js for swiping
        const hammertime = new Hammer(wrapper);
        hammertime.on('swipeleft', () => {
            wrapper.style.transform = 'translateX(-150%) rotate(-15deg)';
            wrapper.style.opacity = 0;
            setTimeout(() => wrapper.remove(), 500);
        });

        hammertime.on('swiperight', () => {
            saveCafe(JSON.stringify(cafeData));
            wrapper.style.transform = 'translateX(150%) rotate(15deg)';
            wrapper.style.opacity = 0;
            setTimeout(() => wrapper.remove(), 500);
        });
    });
}

// Function to save a cafe to localStorage
function saveCafe(cafeJSON) {
    const cafe = JSON.parse(cafeJSON);
    let saved = JSON.parse(localStorage.getItem('savedCafes') || '[]');

    if (!saved.find(c => c.place_id === cafe.place_id)) {
        saved.push(cafe);
        localStorage.setItem('savedCafes', JSON.stringify(saved));
        alert(`${cafe.name} saved!`);
    } else {
        alert(`${cafe.name} is already saved.`);
    }
}
function showSaved() {
    const container = document.querySelector('.cards');
    container.classList.add('scrollable');
    container.innerHTML = '';
    const saved = JSON.parse(localStorage.getItem('savedCafes') || '[]');

    if (saved.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: #999;">No saved cafes yet 😢</p>
            <button id="back-btn" class="return-btn">Go Back</button>
        `;
    } else {
        saved.forEach(cafe => {
            const card = document.createElement('div');
            card.className = 'location-card';
            card.innerHTML = `
                <img src="${cafe.photo}" alt="${cafe.name}" />
                <h3>${cafe.name}</h3>
                <p>⭐️ Rating: ${cafe.rating}</p>
            `;
            container.appendChild(card);
        });

        // Add the "Go Back" button after the saved cafes
        const backButton = document.createElement('button');
        backButton.id = 'back-btn';
        backButton.className = 'return-btn';
        backButton.textContent = 'Go Back';
        container.appendChild(backButton);
    }
    
    // Add event listener for the new button
    document.getElementById('back-btn').addEventListener('click', () => {
        getLocation();
    });
}
// Function to display saved cafes
// function showSaved() {
//     const container = document.querySelector('.cards');
//     container.innerHTML = '';
//     const saved = JSON.parse(localStorage.getItem('savedCafes') || '[]');

//     if (saved.length === 0) {
//         container.innerHTML = '<p style="text-align: center; color: #999;">No saved cafes yet 😢</p>';
//         return;
//     }

//     saved.forEach(cafe => {
//         const card = document.createElement('div');
//         card.className = 'location-card';
//         card.innerHTML = `
//             <img src="${cafe.photo}" alt="${cafe.name}" />
//             <h3>${cafe.name}</h3>
//             <p>⭐️ Rating: ${cafe.rating}</p>
//         `;
//         container.appendChild(card);
//     });
// }