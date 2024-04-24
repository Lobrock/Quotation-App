import React, { useState } from "react";
import axios from "axios";

const QuotationApp: React.FC = () => {
  const [zipCode, setZipCode] = useState<string>("");
  const [addressDetails, setAddressDetails] = useState<{
    lat: number;
    lng: number;
    city: string;
    state: string;
  } | null>(null);
  const [quotes, setQuotes] = useState<
    { depot: string; distance: number; cost: number }[]
  >([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZipCode(event.target.value);
  };

  const getAddressDetails = async (zipCode: string) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&format=json`
      );

      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const [city, state] = display_name
          .split(",")
          .slice(-3, -1)
          .map((str) => str.trim());

        setAddressDetails({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          city,
          state,
        });
        return { lat: parseFloat(lat), lng: parseFloat(lon), city, state };
      } else {
        throw new Error("No results found");
      }
    } catch (error) {
      console.error("Error fetching address details:", error);
      throw error;
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = (R * c) / 1.609; // Distance in km

    return distance;
  };

  const calculateQuote = (distance: number): number => {
    const costPerMile = 7;
    const totalCost = 2000 + distance * costPerMile;
    return totalCost;
  };

  const containerCost = 2000;

  const handleSubmit = async () => {
    try {
      const details = await getAddressDetails(zipCode);
      const depotCoords = [
        { name: "El Paso", lat: 31.7619, lng: -106.485 },
        { name: "Austin", lat: 30.2672, lng: -97.7431 },
        { name: "Dallas", lat: 32.7767, lng: -96.797 },
        { name: "Houston", lat: 29.7604, lng: -95.3698 },
      ];

      const quotes = depotCoords.map((depot) => {
        const distance = calculateDistance(
          details.lat,
          details.lng,
          depot.lat,
          depot.lng
        );
        const cost = calculateQuote(distance);
        return { depot: depot.name, distance, cost };
      });

      setQuotes(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }
  };

  return (
    <div>
      <h1>Quotation App</h1>
      <div>
        <input
          type="text"
          placeholder="Enter ZIP Code"
          value={zipCode}
          onChange={handleInputChange}
        />
        <button onClick={handleSubmit}>Get Quote</button>
      </div>
      {addressDetails && (
        <div>
          <h3>Address Details</h3>
          <p>City: {addressDetails.city}</p>
          <p>State: {addressDetails.state}</p>
        </div>
      )}
      {quotes.length > 0 && (
        <div>
          <h3>Quotes</h3>
          <ul>
            {quotes.map((quote) => (
              <li key={quote.depot}>
                Depot: {quote.depot}, Distance: {quote.distance.toFixed(2)}{" "}
                miles, Container: ${containerCost} Shipping: $
                {(quote.cost - containerCost).toFixed(2)}, Total: $
                {quote.cost.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuotationApp;
