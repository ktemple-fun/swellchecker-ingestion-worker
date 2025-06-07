import parseNdbcText from "./parseNdbcText.ts";

export default async function fetchNdbcData(buoy: string) {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${buoy}.txt`;

  console.log("Fetching NDBC data for buoy:", buoy);
  console.log("URL:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Failed to fetch NDBC data: HTTP ${response.status}`);
      return [];
    }

    const textData = await response.text();
    const parsedData = parseNdbcText(textData);
    const cleanData = parsedData.filter(item => item.timestamp);
    return cleanData;
  } catch (err) {
    console.error("❌ Error fetching NDBC data:", err);
    return [];
  }
}
