function createMap(elementId, lat, long, address, eventName) {
    var map = L.map(elementId).setView([lat, long], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var marker = L.marker([lat, long]).addTo(map);
    var popupText = `<b>${eventName}</b><br>Address: ${address}`;
    marker.bindPopup(popupText).openPopup();
}
