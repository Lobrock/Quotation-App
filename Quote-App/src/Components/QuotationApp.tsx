import React, { useState } from "react";
import axios from "axios";
import { Depots } from "./Depots";

const QuotationApp: React.FC = () => {
  const [zipCode, setZipCode] = useState<string>("");
  const [addressDetails, setAddressDetails] = useState<{
    lat: number;
    lng: number;
    city: string;
    state: string;
  } | null>(null);
  const [quotes, setQuotes] = useState<
    {
      depot: string;
      distance: number;
      containerCost: number;
      deliveryCost: number;
      totalCost: number;
    }[]
  >([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZipCode(event.target.value);
  };

  const getAddressDetails = async (zipCode: string) => {
    try {
      const response = await axios.get(
        `https://geocode.maps.co/search?q=${zipCode}&api_key=662984c2f2fc1156188210mipc43552`
      );

      const { data } = response;
      if (data && data.length > 0) {
        const { display_name, lat, lon } = data[0];
        const [city, state] = display_name.split(",").map((str) => str.trim());

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
    const distance = (R * c) / 1.609; // Distance in miles

    return distance;
  };

  const calculateQuote = (
    distance: number,
    containerCost: number
  ): {
    containerCost: number;
    deliveryCost: number;
    totalCost: number;
  } => {
    const costPerMile = 7;
    const deliveryCost = distance * costPerMile;
    const totalCost = containerCost + deliveryCost;

    return {
      containerCost,
      deliveryCost,
      totalCost,
    };
  };

  const handleSubmit = async () => {
    try {
      const details = await getAddressDetails(zipCode);

      const quotes = Object.entries(Depots).map(
        ([depotName, { lat, lng, containerCost }]) => {
          const distance = calculateDistance(
            details.lat,
            details.lng,
            lat,
            lng
          );
          const {
            containerCost: calculatedContainerCost,
            deliveryCost,
            totalCost,
          } = calculateQuote(distance, containerCost);

          return {
            depot: depotName,
            distance,
            containerCost: calculatedContainerCost,
            deliveryCost,
            totalCost,
          };
        }
      );

      setQuotes(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }
  };

  return (
    <div>
      <h1>Philip Containers</h1>
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
          <p>
            Shipping to: {addressDetails.city}, {addressDetails.state} {zipCode}
          </p>
        </div>
      )}
      {quotes.length > 0 && (
        <div>
          <h3>Quotes</h3>
          <ul>
            {quotes.map((quote) => (
              <li key={quote.depot}>
                {quote.depot} ~ {quote.distance.toFixed(2)} miles, Container: $
                {quote.containerCost}, Shipping: $
                {quote.deliveryCost.toFixed(2)}, Total: $
                {quote.totalCost.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuotationApp;
