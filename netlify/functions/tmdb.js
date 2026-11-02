exports.handler = async (event) => {
  const API_KEY = process.env.TMDB_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "TMDB API key is not configured." })
    };
  }

  const path = event.queryStringParameters?.path;

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid TMDB path." })
    };
  }

  try {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    url.searchParams.set("api_key", API_KEY);

    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Unable to reach TMDB." })
    };
  }
};